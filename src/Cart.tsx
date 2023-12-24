import React, { useEffect, useState } from "react";

import { useUserData } from "./useUserData";
import { useProducts } from "./ProductContext";
import { Link } from "react-router-dom";

import './App.css';
import styles from './cart.module.css'
import Header from "./Header";
import Footer from "./Footer";
import Checkout from "./Checkout";
import { AddressStateArray } from "./types";
import NewAddress from "./NewAddress";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "カートを見る", url: "/cart" },
];

function Cart() {
  const { user, updateCartQuantity, deleteFromCart, userLoading, cartLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const cart = user ? user.cart : undefined;
  const addresses = (user?.addresses || []).sort((a, b) => {
    if (a.defaultAddress) return -1;
    if (b.defaultAddress) return 1;
    return 0;
  });

  const [displayCheckout, setDisplayCheckout] = useState(false);
  const [addressesState, setAddressesState] = useState<AddressStateArray>([]);
  const [lastUpdatedLineItemKey, setLastUpdatedLineItemKey] = useState<number | null>(null);
  const [selectedAddressKey, setSelectedAddressKey] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);


  // Set multiple addresses state to all-default to start
  // If the cart isn't ready, or there is already addresses state data, exit
  useEffect(() => {
    if(!cart) return;
    if(addressesState.length !== 0) return;
    setAddressesState(cart.lines.map((line) => ({
      lineItemKey: line.lineItemKey,
      quantity: line.quantity,
      addresses: null
    })));
  }, [cart, addressesState.length]);


  // Prevents scrolling while the Checkout modal is open
  useEffect(() => {
    function disableBodyScroll() { document.body.classList.add('no-scroll');    };
    function enableBodyScroll()  { document.body.classList.remove('no-scroll'); };

    if (displayCheckout) { disableBodyScroll(); }
    else                 { enableBodyScroll(); }

    // Allow scrolling when the component is unmounted
    return () => { enableBodyScroll(); };
  }, [displayCheckout]);


  // Sends updates to the server when address-specific quantities are updated
  useEffect(() => {
    if (lastUpdatedLineItemKey === null) return;
    if(!user?.customerKey) return;
    if(!user?.token) return;

    const lineItemAddress = addressesState.find(li => li.lineItemKey === lastUpdatedLineItemKey);
    const newLineItemQuantity = lineItemAddress?.addresses?.reduce((acc, address) => acc + address.quantity, 0) || 0;

    if (newLineItemQuantity > 0) {
        updateCartQuantity(user.customerKey, user.token, lastUpdatedLineItemKey, newLineItemQuantity);
    }

    setLastUpdatedLineItemKey(null); // Reset the tracker
  }, [lastUpdatedLineItemKey, addressesState, user?.customerKey, user?.token]);


  if(userLoading) { return(<span className={styles.loading}>Loading profile...</span>) }
  if(productsLoading) { return(<span className={styles.loading}>Loading products...</span>) }
  if(productsError) { return(<span className={styles.loading}>Loading products error</span>) }

  const cartQuantity = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.quantity; }, 0) : 0;
  const cartCost = cart?.lines ? cart.lines.reduce((total, lineItem) => { return total + lineItem.unitPrice * (1+lineItem.taxRate) * lineItem.quantity; }, 0) : 0;


  async function HandleQuantityClick(lineItemKey: number, quantity: number) {
    if(!user?.customerKey) return;
    if(!user?.token) return;
    if(quantity < 1 || quantity > 10) return;

    // If the quantity of a lineItem is changed while it isn't split into addresses, remove all split addresses info
    setAddressesState(prev => {
      return prev.map(li => {
        if (li.lineItemKey === lineItemKey) {
          return {
            ...li,
            quantity: quantity,
            addresses: null
          };
        }
        return li;
      });
    });


    // eslint-disable-next-line
    const returnedCart = await updateCartQuantity(user.customerKey, user.token, lineItemKey, quantity);
    //console.log(returnedCart);
  }

  function HandleAddressQuantityClick(lineItemKey: number, addressIndex: number, quantity:number) {
    if(quantity < 1 || quantity > 10) { return; }
    if(!user?.customerKey) return;
    if(!user?.token) return;

    setAddressesState((prev) => {
      const lineItem = prev.find(li => li.lineItemKey === lineItemKey);

      // If line item not found, return the original state
      if (!lineItem) { return prev; }

      // Calculate the total quantity including the new change
      const totalQuantity = lineItem.addresses?.reduce((acc, ad, index) => {
          return acc + (ad.addressIndex === addressIndex ? quantity : ad.quantity);
      }, 0);

      // Check if the new total quantity larger than 10
      if (totalQuantity === undefined || totalQuantity > 10) {
          return prev; // Exit without making changes
      }

      // Proceed with updating the state
      const newAddressesState = prev.map(li => {
          if (li.lineItemKey === lineItemKey) {
              return {
                  ...li,
                  addresses: li.addresses?.map(ad => {
                      if (ad.addressIndex === addressIndex) {
                          return { ...ad, quantity: quantity };
                      }
                      return ad;
                  }) || null
              };
          }
          return li;
      });

      setLastUpdatedLineItemKey(lineItemKey);
      return newAddressesState;
  });
  }
 

  function HandleAddressSelectChange(lineItemKey: number, addressIndex: number | null, event: React.ChangeEvent<HTMLSelectElement>) {
    if(!user?.customerKey) return;
    if(!user?.token) return;

    if(parseInt(event.target.value) === 0) {
      setShowNewAddress(true);
      return;
    }

    setAddressesState((prev) => {
      const newAddressesState = prev.map(li => {
        if (li.lineItemKey === lineItemKey) {
          return {
            ...li,
            addresses: li.addresses?.map(ad => {
              if (ad.addressIndex === addressIndex) {
                return { ...ad, addressKey: parseInt(event.target.value) };
              }
              return ad;
            }) || null
          };
        }
        return li;
      });
      return newAddressesState;
    })
  }

  function HandleRemoveAddressClick(lineItemKey: number, addressIndex: number) {
    setAddressesState(prev => {
      return prev.map(li => {
        if (li.lineItemKey === lineItemKey) {
          const removedQuantity = li.addresses?.find(ad => ad.addressIndex === addressIndex)?.quantity || 0;
          const updatedAddresses = li.addresses?.filter(ad => ad.addressIndex !== addressIndex) || [];
          if(updatedAddresses.length > 0) { updatedAddresses[0].quantity += removedQuantity }
          return {
            ...li,
            quantity: updatedAddresses.length > 0 ? undefined : removedQuantity,
            addresses: updatedAddresses.length > 0 ? updatedAddresses : null
          };
        }
        return li;
      });
    });
  }

  function HandleAddAddressClick(lineItemKey: number) {
    setAddressesState(prev => {
      return prev.map(li => {
        // Not the line item we modified, so just return it as-is
        if (li.lineItemKey !== lineItemKey) { return li; }

        // Clone the addresses array
        const newAddresses = li.addresses ? [...li.addresses] : [];
  
        // Find the index of the address to steal from
        const indexToStealFrom = newAddresses.findIndex(ad => ad.quantity > 1);
  
        // No address to steal from, return li as-is
        // No extra address for you!
        if (indexToStealFrom === -1) { return li; }

        // Update the quantity of the address to steal from
        newAddresses[indexToStealFrom] = {
          ...newAddresses[indexToStealFrom],
          quantity: newAddresses[indexToStealFrom].quantity - 1
        };

        const nextAddressIndex = newAddresses.reduce((max, ad) => Math.max(max, ad.addressIndex || 0), 0) + 1;

        // Add a new address
        newAddresses.push({
          addressKey: addresses[0]?.addressKey || null,
          quantity: 1,
          addressIndex: nextAddressIndex
        });
  
        // Return a new line item object with updated addresses
        return {
          ...li,
          addresses: newAddresses
        };
      });
    });
    
  }


  async function HandleRemoveClick(lineItemKey: number) {
    if(!user?.customerKey) { return null; }
    if(!user?.token) { return null; }

    // eslint-disable-next-line
    const returnedCart = await deleteFromCart(user.customerKey, user.token, lineItemKey);
    //console.log("Cart returned after deleting from cart:");
    //console.log(returnedCart);
  }

  function HandleSplitToggleClick(lineItemKey: number) {
    console.log(addressesState);
    setAddressesState((prevState) => {
      return prevState.map(lineItem => {
          if (lineItem.lineItemKey !== lineItemKey) {
              // If it's not the line item we're looking for, return it as is
              return lineItem;
          }

          if (lineItem.addresses) {
              // Sum up quantities in addresses array and set addresses to null
              const totalQuantity = lineItem.addresses.reduce((acc, address) => acc + address.quantity, 0);
              return { ...lineItem, quantity: totalQuantity, addresses: null };
          } else {
              // Handle the case when addresses is null
              if (lineItem.quantity === 1) {
                  // If quantity is 1, create a single address object
                  return {
                      ...lineItem,
                      quantity: undefined,
                      addresses: [{ addressKey: addresses[0]?.addressKey || null, quantity: 1, addressIndex: 1 }]
                  };
              } else if (lineItem.quantity && lineItem.quantity > 1) {
                  // If quantity is 2 or more, create two address objects
                  return {
                      ...lineItem,
                      quantity: undefined,
                      addresses: [
                          { addressKey: addresses[0]?.addressKey || null, quantity: lineItem.quantity - 1, addressIndex: 1 },
                          { addressKey: addresses[1]?.addressKey || addresses[0]?.addressKey || null, quantity: 1, addressIndex: 2 }
                      ]
                  };
              }
          }

          return lineItem;
      });
  })
  }

  const headings = (cart && cartQuantity > 0) ? (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span style={{textAlign: "center"}}>合計</span>
    </div>
  ) : null;

  const cartLineElements = cart?.lines ? cart.lines.map((line, lineIndex) => {
    if(!user) { return null; }
    if(!user.customerKey) { return null; }
    if(!products) { return null; }
    const product = products.find(product => {return product.productKey === line.productKey});
    if(!product) { return null; }
    const lineUpdating = cartLoading && (line.lineItemKey === lastUpdatedLineItemKey);

    const unitCost = Math.round(line.unitPrice * (1 + line.taxRate));
    //console.log(`unitPrice: ${line.unitPrice}, taxRate: ${line.taxRate}, calc taxrate: ${1 + line.taxRate}, unitCost: ${unitCost}`)
    const lineCost = Math.round(unitCost * line.quantity);
    const topImage = product.images.sort((a, b) => a.displayOrder - b.displayOrder)[0];
    const addressState = addressesState.find((as) => {return as.lineItemKey === line.lineItemKey});
    console.log(addressState);
    const addressSplit = (addressState && !(addressState.addresses === null));
    const totalQuantity = addressSplit ? addressState?.addresses?.reduce((acc, address) => acc + address.quantity, 0) || 0 : line.quantity;

    const addressesLines = addressSplit ? addressState?.addresses?.map(oneAddress => {
      const address = addresses.find(ad => { return ad.addressKey === oneAddress.addressKey; });
      const addressOptions = addresses.map(addressOption => {
        /* 〒${addressOption.postalCode} -  */
        const addressLabel = `${addressOption.pref} ${addressOption.city} ${addressOption.ward} ${addressOption.address2} / ${addressOption.lastName} ${addressOption.firstName}`;
        return (<option key={addressOption.addressKey} value={addressOption.addressKey || undefined}>{addressLabel}</option>)
      });

      return (
        <div className={styles.addressLine}>
          <select value={address?.addressKey || undefined} onChange={(event) => {HandleAddressSelectChange(line.lineItemKey, oneAddress.addressIndex, event)}}>
            {addressOptions}
            <option key={0} value={0}>新しいアドレス</option>
          </select>
          <div className={styles.quantityWrapper}>
            <div className={styles.quantityChanger}>
              <span className={`${styles.quantityButton} ${(oneAddress.quantity <= 1  || cartLoading) ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="minus.svg" alt="minus" onClick={() => { if(!oneAddress.addressIndex) {return;} HandleAddressQuantityClick(line.lineItemKey, oneAddress.addressIndex, oneAddress.quantity-1)}} /></span>
              <span className={styles.quantityValue} style={{color: (lineUpdating ? "#888" : "#000")}}>{oneAddress.quantity}<img className={styles.quantitySpinner} style={{display: (lineUpdating ? "unset" : "none")}} src="spinner.svg" alt="Spinner"/></span>
              <span className={`${styles.quantityButton} ${(oneAddress.quantity >= 10 || cartLoading) ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="plus.svg" alt="plus"   onClick={() => { if(!oneAddress.addressIndex) {return;} HandleAddressQuantityClick(line.lineItemKey, oneAddress.addressIndex, oneAddress.quantity+1)}} /></span>
            </div>
            <span className={styles.quantityTrash} onClick={() => {if(!oneAddress.addressIndex) { return; } HandleRemoveAddressClick(line.lineItemKey, oneAddress.addressIndex)}}>🗑</span>
          </div>
        </div>
      )
    }) : null;

    const addRemoveAddresses = addressSplit ? (
      <div>
        <span className={styles.addAddress} onClick={() => {HandleAddAddressClick(line.lineItemKey)}}>+</span>
      </div>
    ) : null;

    // If product is found, return the div with image and title, otherwise null
    return (
      <>
        <div key={line.lineItemKey} className={styles.lineItem}>
          <div className={styles.lineItemLeft}>
            <img src={topImage.url} className={styles.lineItem} alt={product.title}/>
            <div className={styles.description}>
              <span className={styles.title}>{product.title}</span>
              <span className={styles.descriptionPrice}>{unitCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}（税込）</span>
            </div>
          </div>
          <div className={styles.quantityWrapper}>
            <div className={styles.quantityChanger}>
              <span className={`${styles.quantityButton} ${(line.quantity <= 1  || addressSplit || cartLoading) ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="minus.svg" alt="minus" onClick={() => {if(addressSplit) {return;} HandleQuantityClick(line.lineItemKey, line.quantity-1)}} /></span>
              <span className={styles.quantityValue} style={{color: (lineUpdating ? "#888" : "#000")}}>{totalQuantity}<img className={styles.quantitySpinner} style={{display: (lineUpdating ? "unset" : "none")}} src="spinner.svg" alt="Spinner"/></span>
              <span className={`${styles.quantityButton} ${(line.quantity >= 10 || addressSplit || cartLoading) ? styles.quantityButtonDisabled : ""} `}><img className={styles.quantityImg} src="plus.svg" alt="plus"   onClick={() => {if(addressSplit) {return;} HandleQuantityClick(line.lineItemKey, line.quantity+1)}} /></span>
            </div>
            <span className={styles.quantityTrash} onClick={() => {HandleRemoveClick(line.lineItemKey)}}>🗑</span>
          </div>
          <span className={styles.lineCost}>{lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
          <span className={styles.splitToggle} onClick={() => HandleSplitToggleClick(line.lineItemKey)}>{addressSplit ? "配送先を削除" : "複数の配送先を指定する" }</span>
          <div className={styles.addressLines}>
            {addressesLines}
            {addRemoveAddresses}
          </div>
        </div>
      </>
    );
  }) : null;

  const spinner = <img className={styles.spinner} src="spinner.svg" alt="Spinner"/>;
  const checkoutButtonContent = cartLoading ? spinner : "ご購入手続きへ";
  const subTotal = (cart && cartQuantity > 0) ? (
    <>
      <span className={styles.subTotal}>小計<span className={styles.subTotalValue}>{cartCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>（税込）</span>
      <button className={styles.checkout} onClick={() => {setDisplayCheckout(true);}}>{checkoutButtonContent}</button>
    </>
  ) : null;

  const loggedOutMessage = (
    <div className={styles.requestMessage}>
      <span className={styles.requestMessage}>カートを表示するには、ログインしてください。</span>
      <Link to="/login"><button className={styles.requestMessage}>ログイン</button></Link>
    </div>
  );

  const emptyCartMessage = (
    <div className={styles.requestMessage}>
      <span className={styles.requestMessage}>カートは空です</span>
      <Link to="/shop"><button className={styles.requestMessage}>Shop</button></Link>
    </div>
  );

  const requestMessage = (!user) ? loggedOutMessage : (cartQuantity === 0) ? emptyCartMessage : null;

  return(
    <>
      {showNewAddress && <NewAddress addressKey={null} setShowNewAddress={setShowNewAddress} />}
      {displayCheckout && <Checkout setDisplayCheckout={setDisplayCheckout} addressesState={addressesState}/>}
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">カートを見る</span>
      <div className={styles.cartWrapper}>
        {headings}
        {cartLineElements}
        {subTotal}
        {requestMessage}
      </div>
      <Footer />
    </>
  )
}

export default Cart

