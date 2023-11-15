import React from "react";

import './App.css';
import styles from "./address.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "お届け先住所", url: "/address" },
];

function Address() {
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">お届け先住所</span>
      <div className={styles.contentWrapper}>
        <span className={styles.header}>デフォルトの住所</span>
        <span className={styles.listMessage}>登録されている住所はありません</span>
      </div>
      <Footer />
    </>
  )
}

export default Address;