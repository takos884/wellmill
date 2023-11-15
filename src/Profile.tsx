import React from "react";

import './App.css';
import styles from "./profile.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "アカウント情報", url: "/profile" },
];

function Profile() {
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">アカウント情報</span>
      <div className={styles.contentWrapper}>
        <span className={styles.listMessage}>プロファイル編集はまだ実装されていません。</span>
      </div>
      <Footer />
    </>
  )
}

export default Profile;