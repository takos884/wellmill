import React, { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import { useProducts } from "./ProductContext";
import Header from "./Header";

import './App.css';
import styles from './product.module.css'
import Footer from "./Footer";
import ProductTile from "./ProductTile";
import { useUserData } from "./useUserData";

function Product() {
    const navigate = useNavigate();
    const { productId } = useParams<{ productId: string }>();
    const productIdNum = productId ? parseInt(productId) : undefined;
    //const { products, setProducts } = useProducts();
    const { products, isLoading: productsLoading, error: productsError } = useProducts();

    const { user, addToCart } = useUserData();
    //const [loading, setLoading] = useState<boolean>(true);
    //const [error, setError] = useState<Error | string | ReactNode | null>(null);

    const [productQuantity, setProductQuantity] = useState(1);

    const currentProduct = products?.find(p => p.productKey === productIdNum);
    const otherProducts = products?.filter(p => p.productKey !== productIdNum);

    //const cartId = "gid://shopify/Cart/c1-ba75df257a837cbb05ec1c3910bced36";
    //const cartId = user?.cart?.id;

    //const variantId = "gid://shopify/ProductVariant/44859100594468";
    //const variantId = currentProduct?.variants[0].admin_graphql_api_id;

    async function handleAddToCart() {
      if(!currentProduct || !user || !user.customerKey) {
        console.log(`addToCart called without either currentProduct (${currentProduct}), user (${user}), or customerKey (see user).`);
        return;
      }

      console.log("Adding Product to cart:");
      const returnedCart = await addToCart(currentProduct.productKey, user.customerKey, productQuantity);
      console.log("Cart returned after adding to cart:");
      console.log(returnedCart);
    };

    const breadcrumbs = [
      { text: "ホーム", url: "/" },
      { text: "SHOP", url: "/shop" },
      { text: currentProduct ? currentProduct.title : "", url: `/shop/${currentProduct?.productKey}` },
    ];

    const taxIncludedPrice = currentProduct ? Math.round(currentProduct.price * (1+currentProduct.taxRate)) : 0;

    // Sort images, then make image elements
    if(currentProduct) {
      console.log(currentProduct.images);
      currentProduct.images = currentProduct.images.sort((a, b) => a.displayOrder - b.displayOrder);
      console.log(currentProduct.images);
    }
    const productImages = currentProduct?.images.map((image, index) => (
      <img
        key={image.imageKey}
        src={image.url.replace(/\\/g, "")}
        className={styles.productImage}
        alt={`Product ${index}`}
        style={index === 0 ? { gridColumn: 'span 2' } : {}}
      />
    ));

    const quantityNode = (
      <>
        <div className={styles.quantityComponent}>
          <button className={styles.quantityButton} onClick={() => { if (productQuantity > 1) { setProductQuantity(prevQuantity => prevQuantity - 1); } }}>–</button>
          <input  className={styles.quantityInput} type="text" value={productQuantity} readOnly style={{ width: '50px', textAlign: 'center' }}/>
          <button className={styles.quantityButton} onClick={() => { if (productQuantity < 10) { setProductQuantity(prevQuantity => prevQuantity + 1); } }}>+</button>
        </div>
        <span className={styles.quantityInfo}>※検査キット到着後、専用アプリにて検査項目を自由に選べます。ご購入の際は、検査する項目数だけ選んでください。</span>
      </>
    )

    const questionsNode = (
      <div className={styles.productFaq}>
        <details>
          <summary>医療機関と同等の精度</summary>
          <p>血液を採取する採血キットは、管理医療機器として、国から承認を得たものをお送りします。そちらの採血キットを用いて、指先から少量の血液を採取します。通常の採血と異なり、採血量が少なく身体への負担が最小限に抑えることが可能です。検査は、大規模な病院や検査センターに設置されるものと同じ機器と、体外診断薬の承認を得た試薬を用いて行うため、高い精度での検査が可能です。</p>
        </details>

        <details>
          <summary>採血の方法</summary>
          <p>本検査の採血は、病院に行かず、ご自宅等ご都合のよい場所で行っていただくことが可能です。採血の時間については、お選びいただく検査項目によって異なるため、ご確認の上行ってください。採血キットには、指先から少量の血液を採取するために使用する、使い捨ての穿刺器具や、血液を集める採血管が含まれます。詳しい採血方法は、検査キットに同封されている「採血手順書」に記載されています。</p>
        </details>

        <details>
          <summary>検査結果について</summary>
          <p>本検査は、当社の検査センターに血液が届いてから7営業日以内に結果が出ます。検査結果は、お客様のマイページに反映されます。検査結果が反映されたタイミングで、メール通知もありますので、すぐに結果を確認いただくことが可能です。</p>
        </details>

        <details>
          <summary>選べる検査項目一覧</summary>
          <p>※検査項目の選択は、検査キットが届いてから行っていただきます。<br/>
            商品購入の際に検査項目を選ぶことはできません。</p>
            <ul>
            <li>コルチゾール</li>
            <li>エストラジオール(女性限定)</li>
            <li>FSH(女性限定)</li>
            <li>テストステロン</li>
            <li>TSH</li>
            <li>FT4</li>
            <li>フェリチン</li>
            <li>総IgE</li>
            </ul>
        </details>
      </div>
    )

    const otherProductsList = (
      <div className={styles.otherProductsGrid}>
        {otherProducts?.map(product => (
          <div key={product.id}>
            <ProductTile Product={product} />
          </div>
        ))}
      </div>
    )

    return (
      <>
      <div className={styles.productRoot}>
        <div className={styles.topDots} />
        <Header breadcrumbs={breadcrumbs} />
        {productsLoading && (<span>Loading Product...</span>)}
        {productsError && (<span>Loading Product Error</span>)}
        <div className={styles.productGrid}>
          <div className={styles.imageGrid}>{productImages}</div>
          <div className={styles.productContent}>
            <span className={styles.productDescription}>{currentProduct?.title}</span>
            <span className={styles.productPrice}>¥{taxIncludedPrice.toLocaleString('en-US')}（税込）</span>
            数量{quantityNode}
            <button className={styles.addToCart} onClick={handleAddToCart}>カートに入れる</button>
            <span className={styles.productLongDescription} dangerouslySetInnerHTML={{ __html: currentProduct?.description || '' }} />
            {questionsNode}
          </div>
        </div>
        <div className={styles.infoLinks}>
          <button className={styles.infoLink} onClick={() => navigate('/payment')}>お支払いについて</button>
          <button className={styles.infoLink} onClick={() => navigate('/delivery')}>配送について</button>
          <button className={styles.infoLink} onClick={() => navigate('/return-policy')}>返品について</button>
        </div>
        <span className={styles.otherHeader}>その他のおすすめキット</span>
        <div>
          {otherProductsList}
        </div>
      </div>
      <Footer />
      </>
    );
}

export default Product