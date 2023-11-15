import React from "react";
import './App.css';
import styles from './header.module.css'
import { Link } from "react-router-dom";
import { useUserData } from "./useUserData";
import { Breadcrumb } from "./types";

// Specify the prop type for the Header component
interface HeaderProps {
    breadcrumbs: Breadcrumb[];
    onHomeClick?: () => void;
}

function Header({ breadcrumbs, onHomeClick }: HeaderProps) {
    const {user, cartLoading} = useUserData();
    const cart = user ? user.cart : undefined;
    const cartQuantity = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.quantity; }, 0) : 0;
    //const cartCost = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.unitPrice * (1+lineItem.taxRate) * lineItem.quantity; }, 0) : 0;

    const spinner = <img className={styles.cartDotSpinnerSpinner} src="spinner.svg" alt="Spinner"/>;
    const cartDotContent = cartLoading ? spinner : cartQuantity;
    const cartDot = (cartQuantity && cartQuantity > 0) ? <span className={styles.cartDot}>{cartDotContent}</span> : null
    const headerButtonLink = (
        user === null ? <Link to="/login">ログイン</Link> : <Link to="/account">マイページ</Link>
    )

    const handleHomeClick = () => {
        if (onHomeClick) { onHomeClick(); }
    };

    return (
        <>
            <div className={styles.header}>
                <div className={styles.headerLogo}><Link to="/" onClick={handleHomeClick}><img src="logo.svg" alt="Logo" /></Link>
                </div>
                <div className={styles.navItems}>
                    <div className={styles.navItem}><Link to="/remote-examination">モータリング検索は?</Link></div>
                    <div className={styles.navItem} style={{fontSize: "1.2rem"}}><Link to="/shop">SHOP</Link></div>
                    <div className={styles.navItem}><Link to="/contact">お問い合わせ</Link></div>
                    <div className={[styles.navItem, styles.loginButton].join(' ')}>{headerButtonLink}</div>
                    <div className={[styles.navItem, styles.cart].join(' ')}>
                        <Link to="/cart"><img className={styles.cart} src="cart.png" alt="Cart" />{cartDot}</Link>
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