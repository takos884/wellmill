import React, { useState } from "react";
import Header from "./Header";
import { Breadcrumb } from "./types";

function Home() {
  const breadcrumbs: Breadcrumb[] = [
    //{ text: "ホーム", url: "/" },
  ];

  const [iframeSrc, setIframeSrc] = useState("https://well-mill.com/");
  const resetIframe = () => {
    setIframeSrc(`https://well-mill.com/?datetime=${new Date().getTime()}`);
  };

  return(
    <>
      <div style={{
        transform: "translateY(-1.2rem)",
        display: "flex",
        width: "100%",
        zIndex: "10",
        justifyContent: "center",
      }}>
        <Header breadcrumbs={breadcrumbs} onHomeClick={resetIframe} />
      </div>
      <iframe 
        src={iframeSrc}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          border: "none",
        }} 
        title="WordPress HomePage"
      />
    </>
  )
}

export default Home

//      <span style={{display: "flex", width: "80%", maxWidth: "80rem", marginTop: "3rem", fontSize: "1.5rem"}}>Place holder for the home page. The home page will be controled by WordPress. Click the header links to explore.</span>