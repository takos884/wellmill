import React, { useEffect } from "react";

import { useParams } from "react-router-dom";
import { useProducts } from "./ProductContext";
import Header from "./Header";

import './App.css';

function Product() {
    const { productId } = useParams<{ productId: string }>();
    const { products } = useProducts();
    console.log("Products in Product component:", products);

    // eslint-disable-next-line
    const product = products?.find(p => p.id == productId); // Allow ids, which are numbers now, to be strings in the future

    const breadcrumbs = [
      { text: "ホーム", url: "/" },
      { text: "SHOP", url: "/shop" },
      { text: product ? product.description : "", url: `/shop/${product?.id}` },
    ];

    return (
      <>
        <Header breadcrumbs={breadcrumbs} />
        <span>Product name: {product?.description}</span>
      </>
    );
}

export default Product