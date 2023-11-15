import React from "react";

import './App.css';
import styles from "./orderList.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "購入履歴", url: "/order-list" },
];

function OrderList() {
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">購入履歴</span>
      <div className={styles.contentWrapper}>
        <span className={styles.header}>履歴の一覧</span>
        <span className={styles.listMessage}>購入履歴はありません</span>
      </div>
      <Footer />
    </>
  )
}

export default OrderList;