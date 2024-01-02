import React from "react";

import '../App.css';
import Header from "./Header";
import styles from "./resultList.module.css"
import { Link } from "react-router-dom";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "検査結果の一覧", url: "/result-list" },
];


function ResultList() {
  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">検査一覧</span>
      <span className={styles.noData}>該当する検査一覧はありません</span>
      <Link to="/account"><button style={{marginBottom: "5rem"}}>マイページTOPへ</button></Link>
      <Footer />
    </>
  )
}

export default ResultList;