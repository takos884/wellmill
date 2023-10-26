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
      <span style={{display: "flex", width: "80%", maxWidth: "80rem", marginTop: "3rem", fontSize: "1.5rem"}}>This is just a place holder for the home page. The home page won't be made in React, it'll be controled by WordPress, so that the company staff can make changes by themselves. While I do development, though, it's nice to have a place holder to make sure all the links are working correctly.</span>
    </>
  )
}

export default Home