import React, { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "../Hooks/UserContext";

import './App.css';
import Header from "./Header";
import Footer from "./Footer";

import styles from "./postpurchase.module.css"

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
  { text: "支払い確認", url: "/post-purchase" },
];

export default function PostPurchase() {
  const { user, setUser } = useContext(UserContext);
  const prevCustomerKey = useRef<number | undefined>();

  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  // Get params from the current URL query string
  const parsedUrl = new URL(window.location.href);
  const params = new URLSearchParams(parsedUrl.search);

  const paymentIntentId = params.get("payment_intent");
  const paymentIntentClientSecret = params.get("payment_intent_client_secret");
  const redirectStatus = params.get("redirect_status");
  const addressKey = params.get("ak");
  const email = decodeURIComponent(params.get("email") || '');

  const header = (redirectStatus === "succeeded") ? <span className={styles.received}>ご注文を承りました</span> : <span>There was an error</span>
  const paymentInProgress = <span className={styles.wait}>お支払い処理中です、少々お待ちください</span>
  const PaymentSuccess = <span className={styles.success}>ご注文が完了しました</span>
  const serverReply = <span className={styles.message}>サーバーからのメッセージ: {paymentStatus}</span>

  useEffect(() => {
    if(!user?.customerKey) { console.log("No Customer Key"); return; }
    if(user.customerKey === prevCustomerKey.current) { console.log("Don't verify on re-render"); return; }
    prevCustomerKey.current = user.customerKey;

    fetch("https://cdehaan.ca/wellmill/api/verifyPayment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({data: { customerKey: user.customerKey, token: user.token, addressKey: addressKey, email: email, paymentIntentId: paymentIntentId, paymentIntentClientSecret: paymentIntentClientSecret }}),
    })
      .then((response) => response.json())
      .then((data) => {
        setPaymentStatus(data.paymentStatus);
        setUser(data.customerData);
      })
  }, [user, addressKey, email, paymentIntentId, paymentIntentClientSecret]);


  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">カートを見る</span>

      {header}
      {(paymentStatus === null) && paymentInProgress}
      {paymentStatus === "succeeded" && PaymentSuccess}
      {paymentStatus !== null && paymentStatus !== "succeeded" && serverReply}
      <span></span>
      <Footer />
    </>
  );
}