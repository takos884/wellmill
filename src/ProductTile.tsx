import React from "react";
import styles from './productTile.module.css'
import { Link } from "react-router-dom";
import { Product } from "./types";

interface ProductTileProps { Product: Product; }

function ProductTile({ Product }: ProductTileProps) {
    const taxIncludedPrice = Math.round(Product.variants[0].full_price)
    return(
        <Link to={`/shop/${Product.id}`}>
            <div className={styles.product}>
                <img className={styles.productImage} src={Product.images[0].src} alt={`Product #${Product.id}`} />
                <span className={styles.productDescription}>{Product.body_html}</span>
                <span className={styles.productPrice}>¥{taxIncludedPrice} (税込)</span>
            </div>
        </Link>
    )
}

export default ProductTile