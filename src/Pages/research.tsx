import React from "react";

import './App.css';
import styles from "./research.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "研究利用", url: "/research" },
];


function Research() {
  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">研究利用</span>
      <div className={styles.contentWrapper}>
        <span className={styles.content}>■ウェルミルの提供する検査サービスを用いた研究へのご協力について<br/>
          当社は、お客様の同意が得られた場合、お預かりした検体・情報を研究に使用させていただくことにしております。本研究では、例えば、ウェルミルの提供する検査サービスの検査結果と、アンケートなどを通じて取得した生活習慣などの情報を解析することで、ホルモン値等と生活習慣等の関係を明らかにしていきます。その関係が明らかになることで、多くの方のセルフケアや未病解決の一助となるようなサービスを生み出し、全ての方がよりよい生活を送れるような社会へ貢献いたします。よろしければ、下記の研究利用に関するご説明をご覧ください。<br/>
          なお、研究利用にご同意いただかなくても、全てのサービスは利用することができ、お客様に不利益が生じることはありません。
        </span>
        <span className={styles.content}>■検体・研究情報等の取り扱い<br/>
          検体・研究情報等は、いずれも作業者が、各々の個人情報が分からないような加工を行った後に、利用・管理されます。検体を保管する際は、当社または当社の管理する委託先の施設において凍結保存いたします。また、研究利用を行った後、検体が残っている場合破棄いたします。<br/>
          ご提供いただく検体・研究情報等の対価はお支払いいたしません。無償でご提供いただきます。
        </span>
        <span className={styles.content}>
          ■同意の撤回<br/>
          お客様は、いつでも研究目的利用に関する同意を撤回できます。同意しない場合及び同意を撤回した場合においてもお客様に不利益が生じることはございません。<br/>
          ＜研究目的利用に関する同意の撤回依頼先＞<br/>
          神奈川県横浜市港北区新横浜3-8-11<br/>
          株式会社リプロセル<br/>
          電話：045-475-3887　(代表電話　平日9：00～17：00　土日祝、年末年始は除く)<br/>
          メール：wellmill@reprocell.com
        </span>
      </div>
      <Footer />
    </>
  )
}

export default Research;