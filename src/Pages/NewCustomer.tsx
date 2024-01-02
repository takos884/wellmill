import React from "react";

import '../App.css';
import styles from "./newCustomer.module.css"
import Header from "./Header";
import Footer from "./Footer";
import { Link } from "react-router-dom";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "登録完了", url: "/new-customer" },
];

export default function NewCustomer() {
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">登録完了</span>
      <div className={styles.contentWrapper}>
        <span>会員登録が完了しました。</span>
        <span>登録したメールアドレスにも自動メールをお送りしています。</span>
        <Link to="/account"><button>アカウントページに進む</button></Link>
      </div>
      <Footer />
    </>
  );
}