import React from "react";
import { useUserData } from './useUserData';
import { Link } from "react-router-dom";
import Header from "./Header";

import './App.css';
import styles from "./sampleRegistration.module.css"

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "検体IDの登録", url: "/sample-registration" },
];


function SampleRegistration() {
  //const {user, setUser, userLoading} = useUserData();
  const {user} = useUserData();
  //if (!user) return <p>Please <Link to='/login' className={styles.checkboxTextLink}>log in</Link> first.</p>;

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
        <input type="text"></input>
        <span className={styles.inputHeader}>採血日<span className={styles.required}>必須</span></span>
        <input type="text"></input>

        <div className="customCheckbox" style={{margin: "4rem 0 1rem 0"}}>
          <label className="customCheckbox">
            <input type="checkbox" id="customCheckbox" onChange={undefined} name="agreement"/>
            <span className="customCheckbox">✓</span>
            <span><Link to="/research" className={styles.checkboxTextLink}>研究利用</Link>に同意する</span>
          </label>
        </div>
        <span className={styles.checkboxFooter}>研究利用への同意は任意です。</span>
        <span className={styles.checkboxFooter}>チェックを外していただいてもサービスはご利用いただけます。</span>
        <button>登録</button>

      </div>
    </>
  );
}

export default SampleRegistration;