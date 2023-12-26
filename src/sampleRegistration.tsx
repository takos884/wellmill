import React, { useState } from "react";
import { useUserData } from './useUserData';
import { Link } from "react-router-dom";
import Header from "./Header";

import './App.css';
import styles from "./sampleRegistration.module.css"
import { useBackupDB } from "./useBackupDB";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "検体IDの登録", url: "/sample-registration" },
];



function SampleRegistration() {
  //const {user, setUser, userLoading} = useUserData();
  const {user} = useUserData();
  const [researchAgreement, setResearchAgreement] = useState(true);
  const [kentaiId, setKentaiId] = useState(''); //W2023022001000
  const [kentaiSaishubi, setKentaiSaishubi] = useState(getFormattedDate());

  // sad to use 'any', but I don't know what the server will return
  const { backupSampleData, data: sampleBackupData, error: sampleBackupError } = useBackupDB<any>();

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

  console.dir(sampleBackupData);
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">検体IDの登録</span>
      <div className={styles.contentWrapper}>
        <span className={styles.subHeader1}>検査情報の識別のため、同梱されている依頼書の検体IDを登録してください。</span>
        <span className={styles.subHeader1}>QRコードからアクセスした場合は、IDが自動入力されます。</span>
        <span className={styles.subHeader2}>（IDが一致しているか念の為ご確認ください）</span>
        <img src="registerQR.jpg" alt="Sample QR code"/>
        <span className={styles.inputHeader}>検体ID<span className={styles.required}>必須</span></span>
        <input type="text" value={kentaiId} name="kentaiId" onChange={handleInputChange} />
        {unknownId}
        <span className={styles.inputHeader}>採血日<span className={styles.required}>必須</span></span>
        <input type="text" value={kentaiSaishubi} name="kentaiSaishubi" onChange={handleInputChange} placeholder={getFormattedDate()}></input>

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