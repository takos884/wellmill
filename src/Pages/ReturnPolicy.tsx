import React from "react";
import '../App.css';
import styles from './infoPage.module.css'

import Header from "./Header";
import Footer from "./Footer";

function ReturnPolicy() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "返品について", url: "/return-policy" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span className="topHeader">返品について</span>
      <div className={styles.content}>
        <span className={styles.content}>
          ■返品について<br/>
          万が一お届けした商品が不良品、もしくはご注文商品とは異なる場合、ご要望に応じて、早急に返品または交換対応させて頂きます。お受取り後7日以内にお問い合わせフォームにご記入ください。<br/>
          ※事前にお問い合わせフォームでご連絡いただいていない場合、ご対応できかねますので、ご了承ください。<br/>
          <br/>
          －返品ポリシー<br/>
          ■商品に問題があった場合<br/>
          万が一お届けした商品が不良品、もしくはご注文商品とは異なる場合、ご要望に応じて、早急に返品または交換対応させて頂きます。お受取り後7日以内に返品・交換申込フォームをご記入ください。<br/>
          お手続き完了後、返送方法などをご案内させていただきます。<br/>
          返品・交換不可の条件
          <ul>
            <li>お客様のもとに商品が到着後、7日以内に返品・交換のお申込みをいただけなかった場合</li>
            <li>商品に使用感・破損・汚損が見受けられる場合</li>
            <li>商品のタグ・付属品の紛失がある場合</li>
            <li>当社が指定する方法以外での商品返送をされた場合</li>
            <li>返品不可クーポン等、特別条件で販売した商品の場合</li>
            <li>商品ページまたはキャンペーンページ等で返品不可と表記されているご注文の場合</li>
          </ul>
          <br/>
          ■返送料の負担について<br/>
          <ul>
            <li>返品時の送料はお客様負担となります。</li>
          </ul>
          <br/>
          ■返品受付期間<br/>
          商品がお手元に到着してから7日以内に、お問い合わせフォームより申請いただき、商品を返送してください。<br/>
          <br/>
          ■返品の仕方<br/>
          内容物全てを検査キットの箱の中に入れ、テープ等で外装のふたが開かないように梱包してください。宛先は以下の住所までお願いします。<br/>
          <br/>
          〒222-0033<br/>
          神奈川県横浜市港北区新横浜3-8-11<br/>
          メットライフ新横浜ビル9階<br/>
          株式会社リプロセル　ウェルミル担当者　宛
        </span>
      </div>
      <Footer />
    </>
  )
}

export default ReturnPolicy