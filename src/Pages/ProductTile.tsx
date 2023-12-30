import React from "react";
import styles from './productTile.module.css'
import { Link } from "react-router-dom";
import { Product } from "../types";

interface ProductTileProps { Product: Product; }

function ProductTile({ Product: product }: ProductTileProps) {
    if(!product) { return null; }

    // Full price = Base price * (1 + tax rate)
    const taxIncludedPrice = product.price ? Math.round(product.price * (1+product.taxRate)) : null;

    //Find the image with the lowest displayOrder value's URL (Works, but the next way is easier for me to understand)
    //const topImageUrl = product.images.reduce((prev, current) => { return (prev.displayOrder < current.displayOrder) ? prev : current; }).url;

    // Sort the images array on displayOrder
    const topImage = product.images.sort((a, b) => a.displayOrder - b.displayOrder)[0];

    return(
        <Link to={`/shop/${product.productKey}`}>
            <div className={styles.product}>
                <img className={styles.productImage} src={topImage.url} alt={`Product #${product.productKey}`} />
                <span className={styles.productDescription}>{product.title}</span>
                <span className={styles.productPrice}>¥{taxIncludedPrice} (税込)</span>
            </div>
        </Link>
    )
}

export default ProductTile