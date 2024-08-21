import React, { useContext } from "react";
import styles from './footer.module.css'
import { Link } from "react-router-dom";
import { UserContext } from "../Contexts/UserContext";

function Footer() {
    const { user } = useContext(UserContext);

    const userLink = (
        user === null ? <Link to="/login">ログイン</Link> : <Link to="/account">マイページ</Link>
    )

    return (
        <>
            <div className={styles.footerGrid}>
                <div className={styles.imgWrapper}>
                    <img className={styles.footerImg} src="/logo.svg" alt="Logo" />
                    <span>ウェルミルは、いつでもどこでも簡単に、体内のホルモンやタンパク質の量を測定できる検査サービスです。</span>
                </div>
                <span className={styles.footerLink}><Link to="/remote-examination">リモート検査とは？</Link></span>
                <span className={styles.footerLink}><Link to="/shop">SHOP</Link></span>
                <span className={styles.footerLink}><Link to="/contact">お問い合わせ</Link></span>
                <span className={styles.footerLink}>{userLink}</span>
            </div>
            <div className={styles.smallPrint}>
                <a href="https://well-mill.com/terms-of-use/"></><span className={styles.smallPrint}>利用規約</span></a>|
                <a href="https://well-mill.com/privacy-policy-2/"><span className={styles.smallPrint}>プライバシーポリシー</span></a>|
                <a href="https://well-mill.com/research/"><span className={styles.smallPrint}>研究利用</span></a>|
                <a href="https://well-mill.com/law/"><span className={styles.smallPrint}>特定商取引に基く表示</span></a>|
                <a href="https://well-mill.com/important-matters/"><span className={styles.smallPrint}>重要事項説明について</span></a>|
                <a href="https://reprocell.co.jp/"><span className={styles.smallPrint}>運営会社</span></a>
            </div>
            <div className={styles.footerBlock}>Copyright © WELLMILL. All Rights Reserved.</div>
        </>
    )
}

export default Footer
