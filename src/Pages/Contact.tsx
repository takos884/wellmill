import React, { useState } from "react";
import Header from "./Header";

import '../App.css';
import styles from './contact.module.css'
import Footer from "./Footer";
import { Link } from "react-router-dom";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "お問い合わせ", url: "/contact" },
];

type FormData = {
  name: string;
  email: string;
  phone: string;
  inquiry: string;
  message: string;
};

function Contact() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    inquiry: '',
    message: ''
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
        const response = await fetch('https://shop.well-mill.com/api/sendEmail', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            alert("Email sent successfully");
            setFormData({  // Reset form
                name: '',
                email: '',
                phone: '',
                inquiry: '',
                message: ''
            });
        } else {
            alert('Failed to send email');
        }
    } catch (error) {
        alert('An error occurred');
    }
  };

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">お問い合わせ</span>
      <div className={styles.content}>
        <span className={styles.notice}>よくあるご質問はこちらに記載しておりますので、<br/>
        お問い合わせ前にまずはこちらをご確認ください。</span>
        <Link to="/qa" style={{textDecoration: "underline", cursor: "pointer"}}><button>よくある質問</button></Link>
        <span className={styles.finePrint}>営業のお問い合わせはお控えください。</span>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <span className={styles.fieldHeader}>お名前<span className={styles.red}>必須</span></span>
            <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="山田 花子"></input>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldHeader}>メールアドレス<span className={styles.red}>必須</span></span>
            <input type="text" name="email" value={formData.email} onChange={handleFormChange} placeholder="name@example.com"></input>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldHeader}>電話番号<span className={styles.red}>必須</span></span>
            <input type="text" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="090-1234-5678"></input>
            <span className={styles.fieldInfo}>日中繋がりやすい電話番号をご入力ください。</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldHeader}>お問い合わせ項目<span className={styles.red}>必須</span></span>
            <div className={styles.selectWrapper}>
              <select name="inquiry" value={formData.inquiry} onChange={handleFormChange}>
                <option value="" defaultValue="true">ご選択ください</option>
                <option value="商品について">商品について</option>
                <option value="返品について">返品について</option>
                <option value="検査結果について">検査結果について</option>
                <option value="その他">その他</option>
              </select>
              <span className={styles.selectChevron}>▼</span>
            </div>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldHeader}>お問い合わせ内容<span className={styles.red}>必須</span></span>
            <textarea name="message" value={formData.message} onChange={handleFormChange} placeholder="詳細をご記入ください"></textarea>
          </div>
        </div>

        <div className="customCheckbox">
          <label className="customCheckbox">
            <input type="checkbox" id="customCheckbox" onChange={undefined} name="agreement"/>
            <span className="customCheckbox">✓</span>
            <span className={styles.smallPrint}><Link to="/privacy-policy" style={{textDecoration: "underline", cursor: "pointer"}}>プライバシーポリシー</Link>に同意する</span>
          </label>
        </div>

        <button onClick={handleSubmit}>送信</button>
      </div>
      <Footer />
    </>
  )
}

export default Contact