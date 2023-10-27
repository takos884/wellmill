import React from "react";
import Header from "./Header";

function Home() {
  const breadcrumbs = [
    { text: "ホーム", url: "/" },
  ];

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs}/>
      <span style={{display: "flex", width: "80%", maxWidth: "80rem", marginTop: "3rem", fontSize: "1.5rem"}}>Place holder for the home page. The home page will be controled by WordPress. Click the header links to explore.</span>
    </>
  )
}

export default Home