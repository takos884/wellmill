import React, { useEffect, useState } from "react";
import { useUserData } from "./useUserData";

import './App.css';
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
  { text: "支払い確認", url: "/post-purchase" },
];

export default function PostPurchase() {
  const { user, userLoading, cartLoading, setUser } = useUserData();
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Get params from the current URL query string
  const parsedUrl = new URL(window.location.href);
  const params = new URLSearchParams(parsedUrl.search);

  const paymentIntentId = params.get("payment_intent");
  const paymentIntentClientSecret = params.get("payment_intent_client_secret");
  const redirectStatus = params.get("redirect_status");
  const addressKey = params.get("ak");

  const header = (redirectStatus === "succeeded") ? <span>Purchase Complete!</span> : <span>There was an error</span>

  useEffect(() => {
    fetch("https://cdehaan.ca/wellmill/api/verifyPayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressKey: addressKey, paymentIntentId: paymentIntentId, paymentIntentClientSecret: paymentIntentClientSecret }),
    })
      .then((response) => response.json())
      .then((data) => {
        setPaymentStatus(data.paymentStatus);
        setUser(data.customerData);
      })
  }, []);


  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">カートを見る</span>

      {header}
      <span>Server says: {paymentStatus}</span>
      <Footer />
    </>
  );
}