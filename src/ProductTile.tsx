import React from "react";
import styles from './productTile.module.css'
import { Link } from "react-router-dom";

type Product = {
    id: string;
    description: string;
    long_description: string;
    base_price: number;
    tax_rate: number;
    images: string[];
};

interface ProductProps {
    Product: Product;
}

function ProductTile({Product}: ProductProps) {
    const taxIncludedPrice = Math.round(Product.base_price * (1+ Product.tax_rate))
    return(
        <Link to={`/shop/${Product.id}`}>
            <div className={styles.product}>
                <img className={styles.productImage} src={Product.images[0]} alt={`Product #${Product.id}`} />
                <span className={styles.productDescription}>{Product.description}</span>
                <span className={styles.productPrice}>¥{taxIncludedPrice} (税込)</span>
            </div>
        </Link>
    )
}

export default ProductTile