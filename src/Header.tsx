import React from "react";
import './App.css';
import styles from './header.module.css'
import { Link } from "react-router-dom";
import { useUserData } from "./useUserData";


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
    const [user] = useUserData();

    const headerButtonLink = (
        user === null ? <Link to="/login">ログイン</Link> : <Link to="/mypage">マイページ</Link>
    )

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLogo}><Link to="/"><img src="/logo.png" alt="Logo" /></Link>
                </div>
                <div className={styles.navItems}>
                    <div className={styles.navItem}><Link to="/remote">モータリング検索は?</Link></div>
                    <div className={styles.navItem} style={{fontSize: "1.2rem"}}><Link to="/shop">SHOP</Link></div>
                    <div className={styles.navItem}>お問い合わせ</div>
                    <div className={[styles.navItem, styles.loginButton].join(' ')}>{headerButtonLink}</div>
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