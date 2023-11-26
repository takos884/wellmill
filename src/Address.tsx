import React, { useState } from "react";

import './App.css';
import styles from "./address.module.css"
import Header from "./Header";
import Footer from "./Footer";
import NewAddress from "./NewAddress";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "お届け先住所", url: "/address" },
];

function Address() {
  const [showNewAddress, setShowNewAddress] = useState(false);

  return(
    <>
      {showNewAddress && <NewAddress />}     
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">お届け先住所</span>
      <button onClick={() => {setShowNewAddress(true)}}>新しい住所を追加</button>
      <div className={styles.contentWrapper}>
        <span className={styles.header}>デフォルトの住所</span>
        <span className={styles.listMessage}>登録されている住所はありません</span>
      </div>
      <Footer />
    </>
  )
}

export default Address;