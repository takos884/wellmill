import React from "react";
import './App.css';
import styles from './header.module.css'


// Define a TypeScript interface for the breadcrumb object
interface Breadcrumb {
    text: string;
    url: string;
}

// Specify the prop type for the Header component
interface HeaderProps {
    breadcrumbs: Breadcrumb[];
}

function Header({ breadcrumbs }: HeaderProps) {
    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLogo}>
                    <a href="/"><img src="/logo.png" alt="Logo" /></a>
                </div>
                <div className={styles.navItems}>
                    <div className={styles.navItem}><a href="/remote">モータリング検索は?</a></div>
                    <div className={styles.navItem} style={{fontSize: "1.2rem"}}><a href="/shop">SHOP</a></div>
                    <div className={styles.navItem}>お問い合わせ</div>
                    <div className={[styles.navItem, styles.loginButton].join(' ')}>ログイン</div>
                    <div className={[styles.navItem, styles.cart].join(' ')}>
                        <img src="/cart.png" alt="Cart" />
                    </div>
                </div>
            </div>
            <div className={styles.breadcrumbs}>
                {breadcrumbs.map((breadcrumb, index) => (
                    <span key={index}>
                        <a href={breadcrumb.url}>{breadcrumb.text}</a>
                        {index < breadcrumbs.length - 1 && " ›› "}
                    </span>
                ))}
            </div>
        </>
    )
}

export default Header