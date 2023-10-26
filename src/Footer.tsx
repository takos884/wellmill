import React from "react";
import styles from './footer.module.css'

function Footer() {
    return (
        <>
            <div className={styles.footerGrid}>
                <div className={styles.imgWrapper}>
                    <img className={styles.footerImg} src="logo.png" alt="Logo" />
                    <span>ウェルミルは、いつでもどこでも簡単に、体内のホルモンやタンパク質の量を測定できる検査サービスです。</span>
                </div>
                <span className={styles.footerLink}>モニタリング検査とは？</span>
                <span className={styles.footerLink}>SHOP</span>
                <span className={styles.footerLink}>お問い合わせ</span>
                <span className={styles.footerLink}>ログイン</span>
            </div>
            <div className={styles.smallPrint}>
                <span className={styles.smallPrint}>利用規約</span>|
                <span className={styles.smallPrint}>プライバシーポリシー</span>|
                <span className={styles.smallPrint}>研究利用</span>|
                <span className={styles.smallPrint}>特定商取引に基く表示</span>|
                <span className={styles.smallPrint}>重要事項説明について</span>|
                <span className={styles.smallPrint}>運営会社</span>
            </div>
            <div className={styles.footerBlock}>Copyright © WELLMILL. All Rights Reserved.</div>
        </>
    )
}

export default Footer