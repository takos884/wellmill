import React from "react";
import '../App.css';
import styles from './remote.module.css'

import Header from "./Header";
import Footer from "./Footer";

function Remote() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "モニタリング検査とは？", url: "/remote-examination" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span className="topHeader" style={{whiteSpace: "nowrap"}}>モニタリング検査<span className={styles.blackHeader}>とは？</span></span>
      <div className={styles.content}>
        <div className={styles.colorImgGrid}>
          <img className={styles.colorImgMobile} src="remote-01-mobile.png"/>
          <img className={styles.colorImgMobile} src="remote-02-mobile.png"/>
        </div>
          <span className={styles.subHeader}>ウェルミルを使うと何が分かる？どんな検査？</span>
          <div className={styles.colorBox} style={{backgroundColor: "#f9f0f7"}}>
            <div className={styles.colorContent}>
                <div>
                    <span className={styles.orange}>ウェルミルは、様々な検査項目を好きな時にいつでも検査できるサービスです。ご自身のアレルギーや貧血に指標、各種ホルモンといった「カラダ数値」を定期的にモニタリングすることで、日々のセルフケアに役立てていただくことが可能です。</span>
                    <span className={styles.colorContent}>
                        お好きな検査項目数を選んでキットを購入すると、自宅のポストに検査キットが届きます。(複数個ご購入の場合は、通常宅配便で届きます)<br/>
                        ご都合のよいタイミングで検体を採取して、返送用封筒で送ります。<br/>
                        調べたい検査項目は、検査キットに同封されている依頼書のQRコードを読み込んで、マイページで登録します。<br/>
                        当社に検体が到着後、数日以内に検査結果をマイページに反映いたしますので、ご確認ください。</span>
                </div>
                <img className={styles.colorImgDesktop} src="remote-1.png" alt="People collecting online results" />
            </div>
          </div>

          <div className={styles.colorImgGrid}>
            <img className={styles.colorImgMobile} src="remote-03-mobile.png"/>
            <img className={styles.colorImgMobile} src="remote-04-mobile.png"/>
          </div>
          <span className={styles.subHeader}>検体採取って？</span>
          <div className={styles.colorBox} style={{backgroundColor: "#fdf2d8"}}>
            <div className={styles.colorContent}>
                <div>
                    <span className={styles.orange}>管理医療機器に登録された採血キットを使用しますので、<br/>安全で簡単な操作が可能です。</span>
                    <span className={styles.colorContent}>
                    ウェルミルのモニタリング検査は、ご自身で血液を採取していただきます。<br/>
                    自己採血専用の、使い捨ての小さな針を使って、指から採血します。<br/>
                    少量の血液のみでOKなので、身体への負担も最小限に抑えられます。</span>
                </div>
                <img className={styles.colorImgDesktop} src="remote-2.png" alt="A woman at home checking lab results on her phone" />
            </div>
          </div>


          <div className={styles.colorImgGrid}>
            <img className={styles.colorImgMobile} src="remote-05-mobile.png"/>
            <img className={styles.colorImgMobile} src="remote-06-mobile.png"/>
          </div>
          <span className={styles.subHeader}>モニタリング検査のメリット</span>
          <div className={styles.colorBox} style={{backgroundColor: "#f9f0f7"}}>
            <div className={styles.colorContent}>
                <div>
                    <span className={styles.orange}>自身のカラダ数値を、自分のタイミングで知る。</span>
                    <span className={styles.colorContent}>
                    病院での検査は、医師指導のもと、病気かどうかを診断してもらうためにおこないます。<br/>
                    たくさんの血液を採取し、心身共に負担が大きくなってしまいます。<br/>
                    また、月経周期や健康状態によって採血可能な時期が制限されたり、<br/>
                    病院に行くために仕事を休んだり、検査を受けるためのハードルがとても高くなってしまいます。<br/>
                    病院での検査は、あくまで症状があり、病気を特定するための手段として利用されます。<br/>
                    一方でモニタリング検査は、検査を受ける場所とタイミングが自由に決められ、<br/>
                    自身のカラダ数値をコンスタントに追うことで、<br/>
                    健康な状態をキープするために利用していただけます。</span>
                </div>
                <img className={styles.colorImgDesktop} src="remote-3.png" alt="A man considering a doctor's appointment" />
            </div>
          </div>


          <span className={styles.subHeader}>検査の流れ</span>
          <div className={styles.colorBox} style={{backgroundColor: "#fcc24c"}}>
            <div className={styles.bubbleWrapper}>

              <div className={styles.bubble}>
                <span className={styles.bubbleNumber}>1</span>
                <div className={styles.bubbleContent}>
                  <span className={styles.bubbleHeader}>キットを購入</span>
                  <span className={styles.bubbleText}>SHOPでお好きなキットを選んで購入します。</span>
                </div>
                <img className={styles.bubbleImg} src="remote-foot-1.png" alt="A shopping cart"/>
              </div>

              <div className={styles.bubble} style={{alignSelf: "flex-end"}}>
                <span className={styles.bubbleNumber}>2</span>
                <div className={styles.bubbleContent}>
                  <span className={styles.bubbleHeader}>郵便受けにキットが届く</span>
                  <span className={styles.bubbleText}>※1個の注文時のみ<br/>
                    複数個注文された場合は、通常の宅配便となります。</span>
                </div>
                <img className={styles.bubbleImg} src="remote-foot-2.png" alt="Blood collection steps"/>
              </div>

              <div className={styles.bubble}>
                <span className={styles.bubbleNumber}>3</span>
                <div className={styles.bubbleContent}>
                  <span className={styles.bubbleHeader}>検体の採取・マイページでID登録</span>
                  <span className={styles.bubbleText}>手順に沿って検体を採取します。マイページでID登録と検査する項目選びます。</span>
                </div>
                <img className={styles.bubbleImg} src="remote-foot-3.png" alt="Collecting blood from a finger"/>
              </div>

              <div className={styles.bubble} style={{alignSelf: "flex-end"}}>
                <span className={styles.bubbleNumber}>4</span>
                <div className={styles.bubbleContent}>
                  <span className={styles.bubbleHeader}>検体を郵便で返送</span>
                  <span className={styles.bubbleText}>採取した検体は、ポスト投函またはお近くの郵便局に提出して返送できます。</span>
                </div>
                <img className={styles.bubbleImg} src="remote-foot-4.png" alt="A postbox"/>
              </div>

              <div className={styles.bubble}>
                <span className={styles.bubbleNumber}>5</span>
                <div className={styles.bubbleContent}>
                  <span className={styles.bubbleHeader}>マイページで結果確認</span>
                  <span className={styles.bubbleText}>検査結果が反映されましたらメールが届きます。WEB上のマイページで結果を確認することができます。</span>
                </div>
                <img className={styles.bubbleImg} src="remote-foot-5.png" alt="Generic test results"/>
              </div>

            </div>
          </div>
      </div>
      <Footer />
    </>
  )
}

export default Remote