import React from "react"

import './App.css';
import styles from "./howTo.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "採血の方法", url: "/how_to" },
];

function HowTo() {
  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">採血の方法</span>
      <div className={styles.contentWrapper}>
        <span className={styles.content}>内容物</span>
        <img className={`${styles.main} ${styles.desktop524Only}`} src="howto/howto_kit.svg"/>
        <img className={`${styles.main} ${styles.mobile524Only}`} src="howto/howto_kit_mobile.svg"/>
        <span className={styles.content}>内容書類</span><br/>
        <span className={styles.content}>採血手順書  ◦依頼書  ◦レターパック用宛名シール</span>
        <span className={styles.header}>採血前の準備</span>
        <span className={styles.content}>❶上記内容物および書類の内容をご確認ください。</span><br/>
        <span className={styles.content}>❷採血をスムーズに行うため、血行を良くすることをお勧めしています。</span><br/>
        <span className={styles.content}>　無理ない範囲で、次の動作を行ってください。</span><br/>
        <span className={styles.content}>※寒いと血液が出にくくなります。室温を20度以上に保ち、手先が冷えないようにしてください。</span><br/>
        <span className={styles.content}>❸温かい飲み物やカイロなどを握り、手を温める。</span><br/>
        <img className={styles.main} src="howto/howto_prepare.svg"/>
        <span>※十分な血液量が取れない場合は、検査ができないことがあります。採血に失敗した場合は、再採血用キット（有料）を購入いただく必要がございます。</span>
        <span className={styles.header}>採血手順</span>
        <span className={`${styles.content} ${styles.red}`}>※採取した血液は、その日のうちにポストへ投函または郵便局へ提出してください。</span>
        <div className={styles.step}>
          <span className={styles.stepNumber}>1</span>
          <img className={styles.step} src="howto/howto_1.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>採血する指の根本に(C)圧迫テープをきつめに巻き付ける。</span>
            <span className={styles.stepSmall}>※採血する場所は赤丸部分です。人差し指または中指の親指側の指の横腹です。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>2</span>
          <img className={styles.step} src="howto/howto_2.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>(A)採血キットを開封し、ランセットを取り出してキャップをねじって開ける。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>3</span>
          <img className={styles.step} src="howto/howto_3.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>気泡緩衝材から(B)採血管を取り出し、キャップを引っ張って開ける。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>4</span>
          <img className={styles.step} src="howto/howto_4.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>(A)採血キットの消毒綿で、採血部分を消毒し、完全に乾かす。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>5</span>
          <img className={styles.step} src="howto/howto_5.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>ランセットをカチッと音が鳴るまで押し付けて指に傷をつける。</span>
            <span className={styles.stepSmall}>※指を机など、平坦で硬いところに押し付けるのがスムーズです。<br/>※乳幼児には使用しないでください。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>6</span>
          <img className={styles.step} src="howto/howto_6.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>ぷっくりと血液が盛り上がってくるのを待つ。血液の出が悪ければ、指や手のひらを傷口に向かってしごく。</span>
            <span className={styles.stepSmall}>※傷口を心臓より低くすると、血液が出やすくなります。<br/>※室温が低かったり、血行が悪かったりすると上手く出血しないことがあります。温かい部屋で血行をよくしてください。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>7</span>
          <img className={styles.step} src="howto/howto_7.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>盛り上がった血液を採血管のへりに付けるようにして、血液を採血管の中に集める。</span>
            <span className={styles.stepSmall}>※洗濯バサミを使用すると採血管が安定します。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>8</span>
          <div className={styles.imgWrapper}>
            <img className={styles.step} src="howto/howto_8.svg" />
          </div>
          <div className={styles.stepText}>
            <span className={styles.stepMain}>採血管の2本の線の間まで血液を垂らして入れる。</span>
            <span className={styles.stepSmall}>※溢れない程度であれば、量が多くなっても構いません。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>9</span>
          <img className={styles.step} src="howto/howto_9.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>採血管に十分量の血液が集まったら、パチンと音がするまで蓋を閉め、やさしく上下に5回振る。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>10</span>
          <img className={styles.step} src="howto/howto_10.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>指の圧迫テープを取り、傷口に絆創膏を貼って止血する。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>11</span>
          <img className={styles.step} src="howto/howto_11.svg" />
          <div className={styles.stepText}>
            <span className={styles.stepMain}>気泡緩衝材に名前と採血日を記入し、採血管を包むように梱包する。</span>
            <div className={styles.stepTable}>
              <span className={styles.table}>採血日</span><span className={styles.table}></span>
              <span className={styles.table}>氏名<br/>（かな）</span><span className={styles.table}></span>
            </div>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>12</span>
          <div className={styles.imgWrapper}>
            <img className={styles.step} src="howto/howto_12.svg" />
          </div>
          <div className={styles.stepText}>
            <span className={styles.stepMain}>B採血管以外のごみ・未使用品は、全てA採血キット袋に入れ、ジップを閉める。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>13</span>
          <div className={styles.imgWrapper}>
            <img className={styles.step} src="howto/howto_13.svg" />
          </div>
          <div className={styles.stepText}>
            <span className={styles.stepMain}>11の気泡緩衝材で包んだ採血管とごみを入れた12の採血キット袋を、返送用ジップ付き袋に入れ、きちんと閉める。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>14</span>
          <div className={styles.imgWrapper}>
            <img className={styles.step} src="howto/howto_14.svg" />
          </div>
          <div className={styles.stepText}>
            <span className={styles.stepMain}>依頼書に必要事項を記入し、切り取り線で切り取る。</span>
            <span className={`${styles.stepMain} ${styles.red}`}>切り取った下部分は結果の確認に必要ですので、大切に保管してください。</span>
          </div>
        </div>
        <div className={styles.step}>
          <span className={styles.stepNumber}>15</span>
          <img className={styles.step} src="howto/howto_15.svg" />
        </div>
        <span className={styles.content}>返送用レターパックに宛名シールを貼り、住所、宛名を記入する。返送用の袋が閉じていることを確認して、依頼書と一緒にレターパックに入れる。入れ忘れたものがないか確認し、レターパックの封を閉じ、採血したその日中に投函する。</span>
      </div>
      <Footer />
    </>
  )
}

export default HowTo