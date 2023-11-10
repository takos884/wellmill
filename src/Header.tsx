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
    const {user, cartLoading} = useUserData();
    console.log('Header rendering, cartLoading:', cartLoading);

    const spinner = <img className={styles.spinner} src="spinner.svg"/>;
    const cartQuantity = (user?.cart?.totalQuantity) ? user?.cart?.totalQuantity : 0;
    const cartDotContent = cartLoading ? spinner : cartQuantity;
    const cartDot = (cartQuantity && cartQuantity > 0) ? <span className={styles.cartDot}>{cartDotContent}</span> : null
    const headerButtonLink = (
        user === null ? <Link to="/login">ログイン</Link> : <Link to="/mypage">マイページ</Link>
    )

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLogo}><Link to="/"><img src="logo.svg" alt="Logo" /></Link>
                </div>
                <div className={styles.navItems}>
                    <div className={styles.navItem}><Link to="/remote">モータリング検索は?</Link></div>
                    <div className={styles.navItem} style={{fontSize: "1.2rem"}}><Link to="/shop">SHOP</Link></div>
                    <div className={styles.navItem}><Link to="/contact">お問い合わせ</Link></div>
                    <div className={[styles.navItem, styles.loginButton].join(' ')}>{headerButtonLink}</div>
                    <div className={[styles.navItem, styles.cart].join(' ')}>
                        <Link to="/cart"><img src="cart.png" alt="Cart" />{cartDot}</Link>
                    </div>
                </div>
            </div>
            <div className={styles.breadcrumbs}>
                {breadcrumbs.map((breadcrumb, index) => (
                    <span key={index}>
                        <Link to={breadcrumb.url}>{breadcrumb.text}</Link>
                        {index < breadcrumbs.length - 1 && " ›› "}
                    </span>
                ))}
            </div>
        </>
    )
}

export default Header