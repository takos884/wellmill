import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from "../Contexts/UserContext";
import { Link } from "react-router-dom";
import Header from "./Header";

import '../App.css';
import styles from "./sampleRegistration.module.css"
import { useBackupDB } from "../Hooks/useBackupDB";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "検体IDの登録", url: "/sample-registration" },
];



function SampleRegistration() {
  const { user, userLoading } = useContext(UserContext);
  const [researchAgreement, setResearchAgreement] = useState(true);
  const [kentaiId, setKentaiId] = useState(''); //W2023022001000
  const [kentaiIdLock, setKentaiIdLock] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();


  const now = new Date();
  now.setTime(now.getTime() + 9*60*60*1000); // Japan timezone = +9h
  const [kentaiSaishubi, setKentaiSaishubi] = useState(now.toISOString().split('T')[0]);

  // sad to use 'any', but I don't know what the server will return
  const { backupSampleData, data: sampleBackupData, error: sampleBackupError } = useBackupDB<any>();

  console.log("User");
  console.log(user);



  useEffect(() => {
    const localSampleId = localStorage.getItem('sampleID');

    if(localSampleId) {
      console.log(`Sample ID from local storage: ${localSampleId}`);
      setKentaiId(localSampleId);
      setKentaiIdLock(true);
    }
  }, []);



  useEffect(() => {
    const sampleId = searchParams.get('sample') || searchParams.get('sampleId');

    if (sampleId) {
      console.log(`Sample ID from query: ${sampleId}`);
      localStorage.setItem('sampleID', sampleId);
      setKentaiId(sampleId);
      setKentaiIdLock(true);
    }
  }, [searchParams]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    switch (name) {
      case 'kentaiId':       setKentaiId(value);       break;
      case 'kentaiSaishubi': setKentaiSaishubi(value); break;

      default:
        console.log("Unknown handleInputChange name");
        break;
    }
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if(!user || !user?.customerKey) { console.log(`Unknown user: ${user} or user code: ${user?.customerKey}, can't submit.`); return; }
    await backupSampleData(kentaiId, "NV" + user.customerKey, kentaiSaishubi);
    console.log(sampleBackupData);
  }

  function ToggleResearchAgreement() { setResearchAgreement(prev => { return !prev;}) }

  function getFormattedDate() {
    const today = new Date();
    const year = today.getFullYear();
    // Add 1 because getMonth() returns month from 0-11
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Pad the month and day with a leading zero if they are less than 10
    const formattedMonth = month < 10 ? `0${month}` : month;
    const formattedDay = day < 10 ? `0${day}` : day;

    // Format the date in YYYY年MM月DD日 format
    return `${year}年${formattedMonth}月${formattedDay}日`;
  }

  const registrationMessage = <span className={sampleBackupData?.Status === 200 ? styles.goodReply : styles.badReply}>{
    (!sampleBackupData) ? null : // No reply, don't display anything
    (sampleBackupData.Status === 200) ? "登録が完了しました。" : // All good
    (sampleBackupData.Status === 204 && sampleBackupData?.Messages?.[0] === "1行:kentai_idは14文字数以外を指定されていません。") ? null : // This message displayed elsewhere
    (sampleBackupData.Messages && sampleBackupData.Messages.length > 0) ? sampleBackupData.Messages[0] : // Error with message
    (sampleBackupData.Status) ? `${sampleBackupData?.Status} Error` : // Error with no message, only status (e.g. 404, 500)
    "不明なエラー" // Unknown error
  }</span>

  const unknownId = (sampleBackupData?.Status === 204 && sampleBackupData?.Messages?.[0] === "1行:kentai_idは14文字数以外を指定されていません。") ? (
  <div className={styles.unknownId}>
    <span className={styles.unknownId}>検体IDが見つかりません</span>
    <span className={styles.unknownIdSmallPrint}>数回登録を試みても登録がうまくいかない場合は<Link to="/contact" style={{textDecoration: "underline"}}>お問い合わせ</Link>ください</span>
  </div>) : null;

  //console.dir(sampleBackupData);

  const forceSignin = (!userLoading && !user?.customerKey && kentaiIdLock);
  //const forceSignin = (!userLoading && !user?.customerKey && kentaiIdLock);
  const forceSigninMessage = (
    <>
      テストを登録するには<br/>
      サインインする必要があります
    </>);

  const forceAddress = (!userLoading && user?.addresses.length === 0 && kentaiIdLock && false);
  const forceAddressMessage = (
    <>
      テストを登録するには<br/>
      住所を登録する必要があります
    </>);

  const forceModal = (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <img className={styles.modalImg} src="Pencil.png" alt="Pencil" />
        <span className={styles.modalSpan}>{forceSignin ? forceSigninMessage : forceAddress ? forceAddressMessage : null}</span>
        <div className={styles.modalLinks}>
          <Link to="/sample-registration" onClick={() => {localStorage.removeItem('sampleID'); setKentaiId(""); setKentaiIdLock(false);}}><span className={styles.modalLinkSecondary}>キャンセル</span></Link>
          {
            forceSignin ? <Link to="/login"><span className={styles.modalLinkPrimary}>サインイン</span></Link> :
            forceAddress ? <Link to="/address"><span className={styles.modalLinkPrimary}>住所を登録</span></Link> : null
          }
        </div>
      </div>
    </div>
  );

  const clearButton = (<span className={styles.inputX} onClick={() => {localStorage.removeItem('sampleID'); setKentaiId(""); setKentaiIdLock(false); navigate("/sample-registration")}}>✖</span>);

  return(
    <>
      {(forceSignin || forceAddress) && forceModal}
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">検体IDの登録</span>
      <div className={styles.contentWrapper}>
        <span className={styles.subHeader1}>検査情報の識別のため、同梱されている依頼書の検体IDを登録してください。</span>
        <span className={styles.subHeader1}>QRコードからアクセスした場合は、IDが自動入力されます。</span>
        <span className={styles.subHeader2}>（IDが一致しているか念の為ご確認ください）</span>
        <img src="registerQR.jpg" alt="Sample QR code"/>
        <span className={styles.inputHeader}>検体ID<span className={styles.required}>必須</span></span>
        <div className={styles.inputWrapper}><input type="text" style={{width: "100%", marginLeft: 0, marginRight: 0}} value={kentaiId} name="kentaiId" onChange={handleInputChange} disabled={kentaiIdLock ? true : false} />{kentaiIdLock ? clearButton : null}</div>
        {unknownId}
        <span className={styles.inputHeader}>採血日<span className={styles.required}>必須</span></span>
        <input type="date" value={kentaiSaishubi} name="kentaiSaishubi" onChange={handleInputChange}></input>

        <div className="customCheckbox" style={{margin: "4rem 0 1rem 0"}}>
          <label className="customCheckbox">
            <input type="checkbox" id="customCheckbox" checked={researchAgreement} onChange={ToggleResearchAgreement} name="agreement"/>
            <span className="customCheckbox">✓</span>
            <span><Link to="/research" className={styles.checkboxTextLink}>研究利用</Link>に同意する</span>
          </label>
        </div>
        <span className={styles.checkboxFooter}>研究利用への同意は任意です。</span>
        <span className={styles.checkboxFooter}>チェックを外していただいてもサービスはご利用いただけます。</span>
        <button onClick={handleSubmit}>登録</button>
        <span>{registrationMessage}</span>
        {sampleBackupError && (<span>Server error: {sampleBackupError}</span>)}
      </div>
    </>
  );
}

export default SampleRegistration;