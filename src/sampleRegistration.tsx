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
  const [kentaiId, setKentaiId] = useState('W2023022001000');
  const [kaiinCode, setKaiinCode] = useState('77777');
  const [kentaiSaishubi, setKentaiSaishubi] = useState(getFormattedDate());

  // sad to use 'any', but I don't really know what the server will return
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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    backupSampleData(kentaiId, kaiinCode, kentaiSaishubi);
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
        {(sampleBackupData?.Status) && (<span>Server reply: {sampleBackupData.Status === 200 ? "Ok" : "Error"}</span>)}
        {sampleBackupError && (<span>Server error: {sampleBackupError}</span>)}
      </div>
    </>
  );
}

export default SampleRegistration;