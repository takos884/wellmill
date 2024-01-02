import React, { useContext, useState } from "react";
import '../App.css';
import styles from './header.module.css'
import { Link } from "react-router-dom";
import { UserContext } from "../Contexts/UserContext";
import { Breadcrumb } from "../types";

// Specify the prop type for the Header component
interface HeaderProps {
    breadcrumbs: Breadcrumb[];
    onHomeClick?: () => void;
}

function Header({ breadcrumbs, onHomeClick }: HeaderProps) {
    const [showMenu, setShowMenu] = useState(false);

    const { user, cartLoading, userMeaningful, local } = useContext(UserContext);
    const cart = user ? user.cart : undefined;

    const spinner = <img className={styles.cartDotSpinnerSpinner} src="spinner.svg" alt="Spinner"/>;
    const cartDotContent = cartLoading ? spinner : cart?.quantity;
    const cartDot = (cart && cart.quantity > 0) ? <span className={styles.cartDot}>{cartDotContent}</span> : null
    const headerButton = (
        userMeaningful ? 
            <Link to="/account"><div className={`${styles.navItem} ${styles.loginButton} ${local && styles.loginButtonGlow}`}>マイページ</div></Link> :
            <Link to="/login"><div className={`${styles.navItem} ${styles.loginButton} ${local && styles.loginButtonGlow}`}>ログイン</div></Link>
        )

    const handleHomeClick = () => {
        if (onHomeClick) { onHomeClick(); }
    };

    const hamburgerIcon = (
        <div className={styles.hamburger} onClick={() => {setShowMenu(prev => {return !prev;});}}>
            <svg className={styles.hamburger} viewBox="0 40 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path className={styles.topLine}    d={showMenu ? "M50 150L150 50" : "M20 50L180 50"}   stroke="#000" stroke-width="18" stroke-linecap="round"/>
                <path className={styles.middleLine} d={showMenu ? "M99 100H101"    : "M20 100H180"}     stroke="#000" stroke-width="18" stroke-linecap="round"/>
                <path className={styles.bottomLine} d={showMenu ? "M50 50L150 150" : "M20 150L180 150"} stroke="#000" stroke-width="18" stroke-linecap="round"/>
            </svg>
            <span className={styles.hamburger}>{showMenu ? "close" : "menu"}</span>
        </div>
    )

    const mainMenu = (
        <div className={styles.mainMenu} style={{transform: showMenu ? "translateX(0)" : "translateX(100vw)"}}>
            <span className={styles.mainMenu}><Link to="/">ホーム</Link></span>
            <span className={styles.mainMenu}><Link to="/remote-examination">リモート検査とは？</Link></span>
            <span className={styles.mainMenu}><Link to="/shop">SHOP</Link></span>
            <span className={styles.mainMenu}><Link to="/contact">お問い合わせ</Link></span>
            {userMeaningful ?
                <span className={styles.mainMenu}><Link to="/account">マイページ</Link></span> :
                <span className={styles.mainMenu}><Link to="/login">ログイン</Link></span>
            }
        </div>          
    )

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLogo}><Link to="/" onClick={handleHomeClick}><img src="logo.svg" alt="Logo" /></Link></div>
                <span>{user?.customerKey ? user.customerKey : "-"}</span>
                <div className={styles.navItems}>
                    <div className={styles.navItem}><Link to="/remote-examination">モータリング検索は?</Link></div>
                    <div className={styles.navItem} style={{fontSize: "1.2rem"}}><Link to="/shop">SHOP</Link></div>
                    <div className={styles.navItem}><Link to="/contact">お問い合わせ</Link></div>
                    {headerButton}
                    <div className={`${styles.navItem} ${styles.cart}`}>
                        <Link to="/cart"><img className={styles.cart} src="cart.png" alt="Cart" />{cartDot}</Link>
                    </div>
                    {hamburgerIcon}
                </div>
            </div>
            <div className={styles.breadcrumbs}>
                {breadcrumbs.map((breadcrumb, index) => (
                    <span key={index}>
                        {breadcrumb.url ? <Link to={breadcrumb.url}>{breadcrumb.text}</Link> : breadcrumb.text}
                        {index < breadcrumbs.length - 1 && " ›› "}
                    </span>
                ))}
            </div>
            {mainMenu}
        </>
    )
}

export default Header