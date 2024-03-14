import React, { useState } from "react";

import '../App.css';
import styles from "./passwordRecover.module.css"
import Header from "./Header";
import Footer from "./Footer";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "パスワードの再発行", url: "/password-recover" },
];

export default function PasswordRecover() {
  const [email, setEmail] = useState("");
  const [requested, setRequested] = useState(false);

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { value } = e.target;
    setEmail(value);
  };

  async function handleRequestPassword() {
    setRequested(true);
    await sendPasswordEmail(email);
  }

  async function sendPasswordEmail(recipient: string) {
    try {
        const response = await fetch('https://shop.well-mill.com/api/sendPassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({recipient: recipient}),
        });

        if (response.ok) {
            console.log("Password email sent successfully to " + recipient);
        } else {
          console.log('Failed to send password email to ' + recipient);
        }
    } catch (error) {
      console.log('An error occurred sending password email to ' + recipient);
    }
  };

  return(
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">パスワードの再発行</span>
      <div className={styles.contentWrapper}>
        <span>登録されたメールアドレス宛にパスワード再発行のURLをお送りします。</span>
        <div className={styles.passwordForm}>
          <span>メールアドレス</span>
          <input type="email" value={email} onChange={handleEmailChange} />
          {!requested && <button className={styles.requestPassword} onClick={handleRequestPassword}>送信</button>}
          {requested && <span className={styles.requested}>パスワード再発行メールを送信しました。</span>}
          {requested && <span className={styles.requested}>メールアドレスをご確認ください。</span>}
        </div>
      </div>
      <Footer />
    </>
  )

}