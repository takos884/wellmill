import React from "react";
import '../App.css';
import styles from './infoPage.module.css'

import Header from "./Header";
import Footer from "./Footer";

function Payment() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "お支払いについて", url: "/payment" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span className="topHeader">お支払いについて</span>
      <div className={styles.content}>
        <span className={styles.content}>
          ■お支払い方法について<br/>
          弊社のECサイトは、以下の支払いに対応しています。
          <ul>
            <li>クレジットカード（VISA/Mastercard/AMERICAN EXPRESS）</li>
            <li>Shop Pay</li>
            <li>Apple Pay</li>
            <li>Google Pay</li>
          </ul>
          <br/>
          弊社のECサイトをご利用になる際は、AMERICAN EXPRESS、VISA、MASTERのマークがプリントされているカードをご使用ください。<br/>
          お支払いは一括払いのみとさせていただいております。<br/>
          ※消費税の端数は切り捨てで計算しております。<br/>
          ※カード発行会社の承認が確認でき次第、商品を発送させて頂きます。ご利用の承認が下りず、決済不可となった場合には、クレジットカード会社へ直接お問い合わせをお願いたします。<br/>
          その他ご不明点がございましたら、お問い合わせフォームからご相談お願いいたします。<br/>
        </span>
      </div>
      <Footer />
    </>
  )
}

export default Payment