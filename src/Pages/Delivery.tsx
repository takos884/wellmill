import React from "react";
import '../App.css';
import styles from './infoPage.module.css'

import Header from "./Header";
import Footer from "./Footer";

function Delivery() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "配送について", url: "/delivery" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span className="topHeader">配送について</span>
      <div className={styles.content}>
        <span className={styles.content}>
          ＜お届けまでの日数＞<br/>
          ご注文をお受けし、7営業日以内に発送いたします。土日祝の発送は行っておりません。<br/>
          <br/>
          ＜配送について＞<br/>
          検査キットを1つご購入された場合は、日本郵政のメール便にて配送いたします。<br/>
          この場合、検査キットはポストに投函されます。<br/>
          検査キットを複数ご購入された場合は、ヤマト運輸の一般宅配物として配送いたします。<br/>
          この場合、検査キットは対面でのお受け取りあるいは宅配ボックス等への配送となります。<br/>
          いずれの場合でも、当社から発送した際には確認メールをお送りいたします。このメールには、追跡番号を掲載しておりますので、お客様の方で配送状況をご確認いただけます。
        </span>
      </div>
      <Footer />
    </>
  )
}

export default Delivery