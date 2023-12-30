import React from "react";

import './App.css';
import styles from "./privacy.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "プライバシーポリシー", url: "/privacy-policy" },
];


function Privacy() {
  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">プライバシーポリシー</span>
      <div className={styles.contentWrapper}>
        <span className={styles.content}>
        当社は、高度情報通信社会における個人情報保護の重要性を認識し、以下の方針に基づき個人情報の保護に努めます。
        </span>
        <span className={styles.content}>
        個人情報の取得について<br/>
        当社は、適法かつ公正な手段によって、個人情報を取得致します。
        </span>
        <span className={styles.content}>
        個人情報の利用目的について<br/>
        当社は、個人情報を、サービスの提供、当社に関する情報のご案内およびご質問に対するご回答のために必要な範囲内でのみ利用します。
        </span>
        <span className={styles.content}>
        個人情報の第三者提供について<br/>
        当社は、法令に定める場合を除き、個人情報を、事前に本人の同意を得ることなく、第三者に提供しません。
        </span>
        <span className={styles.content}>
        個人情報の管理について<br/>
        当社は、個人情報の正確性を保ち、これを安全に管理致します。<br/>
        当社は、個人情報の紛失、破壊、改ざん及び漏えいなどを防止するため、不正アクセス、コンピュータウイルス等に対する適正な情報セキュリティ対策を講じます。<br/>
        当社は、個人情報を持ち出し、外部へ送信する等により漏えいさせません。
        </span>
        <span className={styles.content}>
        個人情報の開示、訂正・利用停止・消去について<br/>
        当社は、本人が自己の個人情報について、開示・訂正・利用停止・消去等を求める権利を有していることを確認し、これらの要求ある場合には、異議なく速やかに対応します。<br/>
        なお、当社の個人情報の取扱いにつきましてご意見、ご質問がございましたら、下記の窓口までご連絡下さいますようお願い申し上げます。
        </span>
        <span className={styles.content}>
        株式会社リプロセル<br/>
        代表電話045-475-3887
        </span>
        <span className={styles.content}>
        組織・体制<br/>
        当社は、個人情報保護管理者を任命し、個人情報の適正な管理を実施いたします。<br/>
        当社は、役員及び従業員に対し、個人情報の保護及び適正な管理方法についての研修を実施し、日常業務における個人情報の適正な取扱いを徹底します。
        </span>
        <span className={styles.content}>
        個人情報保護コンプライアンス・プログラムの策定・実施・維持・改善<br/>
        当社は、この方針を実行するため、個人情報保護コンプライアンス・プログラム（本方針、『個人情報保護規程』及びその他の規程、規則を含む）を策定し、これを当社従業員その他関係者に周知徹底させて実施し、維持し、継続的に改善致します。
        </span>
        <span className={styles.content}>
        2023年3月31日制定<br/>
        株式会社　リプロセル<br/>
        代表取締役社長　横山　周史
        </span>
      </div>
      <Footer />
    </>
  )
}

export default Privacy;