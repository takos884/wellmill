import React from "react";
import './App.css';

import Header from "./Header";

function Payment() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
    { text: "お支払いについて", url: "/payment" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span>Normal content</span>
    </>
  )
}

export default Payment