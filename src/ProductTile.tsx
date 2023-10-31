import React from "react";
import styles from './productTile.module.css'
import { Link } from "react-router-dom";
import { Product } from "./types";

interface ProductTileProps { Product: Product; }

function ProductTile({ Product: product }: ProductTileProps) {
    if(!product) { return null; }
    const taxIncludedPrice = product.variants ? Math.round(product.variants[0].price) : 0
    return(
        <Link to={`/shop/${product.id}`}>
            <div className={styles.product}>
                <img className={styles.productImage} src={product.images[0].src} alt={`Product #${product.id}`} />
                <span className={styles.productDescription}>{product.title}</span>
                <span className={styles.productPrice}>¥{taxIncludedPrice} (税込)</span>
            </div>
        </Link>
    )
}

export default ProductTile