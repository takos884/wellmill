import React from "react";
import styles from './productTile.module.css'

interface productData {
    id: number,
    description: string,
    base_price: number,
    tax_rate: number,
    images: string[],
}

interface ProductProps {
    productData: productData;
}

function Product({productData}: ProductProps) {
    const taxIncludedPrice = Math.round(productData.base_price * (1+ productData.tax_rate))
    return(
        <div className={styles.product}>
            <img className={styles.productImage} src={productData.images[0]} alt={`Product #${productData.id}`} />
            <span className={styles.productDescription}>{productData.description}</span>
            <span className={styles.productPrice}>¥{taxIncludedPrice} (税込)</span>
        </div>
    )
}

export default Product