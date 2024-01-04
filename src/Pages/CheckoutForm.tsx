import React, { useContext, useEffect, useState } from "react";

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
//import { StripePaymentElementOptions } from "@stripe/stripe-js";

import { UserContext } from "../Contexts/UserContext";
import { useProducts } from "../Contexts/ProductContext";

import { prefectures } from "../Utilities/addressData"
import styles from './checkoutForm.module.css';
import NewAddress from "./NewAddress";
import { LineItemAddressesArray } from "../types";

type CheckoutFormProps = {
  setDisplayCheckout: React.Dispatch<React.SetStateAction<boolean>>;
  addressesState: LineItemAddressesArray
};


export default function CheckoutForm({ setDisplayCheckout, addressesState }: CheckoutFormProps) {
  console.log("Rendering CheckoutForm")
  const stripe = useStripe();
  const elements = useElements();

  const { user, setCartLoading } = useContext(UserContext);
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  //#region Addresses
  const addresses = (user?.addresses || []).sort((a, b) => {
    if (a.defaultAddress) return -1;
    if (b.defaultAddress) return 1;
    return 0;
  });

  const defaultAddressKey = addresses.find(address => {return address.defaultAddress === true})?.addressKey || null;
  //#endregion

  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(user?.email || "");
  const [emailError, setEmailError] = useState<boolean>(false); // undefined means user tried to submit as empty
  const [isSendingPayment, setIsSendingPayment] = useState(false);
  const [selectedAddressKey, setSelectedAddressKey] = useState<number | null>(defaultAddressKey);
  const [showNewAddress, setShowNewAddress] = useState(false);


  // The current address is the default one unless another address key has been set
  const address = addresses.find(address => {
    return (selectedAddressKey === null) ?
    address.defaultAddress === true : 
    address.addressKey === selectedAddressKey;
  });


  // Changes the cursor to wait for the whole page while sending payment
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'loading-cursor-style';
    style.textContent = 'body { cursor: wait; }';
    if (isSendingPayment) {
      document.head.appendChild(style);
    } else {
      const existingStyleTag = document.getElementById('loading-cursor-style');
      if (existingStyleTag) { existingStyleTag.remove(); }
    }
  }, [isSendingPayment]);


  // Set payment message pulled from Stripe
  useEffect(() => {
    if (!stripe) { setMessage("Loading Stripe."); return; }

    const clientSecret = new URLSearchParams(window.location.search).get( "payment_intent_client_secret" );
    if (!clientSecret) { setMessage(null); return; }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":               setMessage("Payment succeeded!"); break;
        case "processing":              setMessage("Your payment is processing."); break;
        case "requires_payment_method": setMessage("Your payment was not successful, please try again."); break;
        default:                        setMessage("Something went wrong."); break;
      }
    });
  }, [stripe]);


  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    // Stripe.js hasn't yet loaded. Disable form submission until Stripe.js has loaded.
    if (!stripe || !elements) { return; }

    // Already doing a purchase
    if(isSendingPayment) { return; }

    // If the email is not valid, set it as an error and return
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!regex.test(email)) {
      setEmailError(true);
      setMessage("正しいメールアドレスを入力してください。");
      return;
    }
    const encodedEmail = encodeURIComponent(email);

    if(!address) {
      setMessage("住所を入力してください。");
      return;
    }

    setIsSendingPayment(true);
    setMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `https://cdehaan.ca/wellmill/post-purchase?ak=${selectedAddressKey}&email=${encodedEmail}` },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error?.type === "card_error" || error?.type === "validation_error") {
      setMessage(error.message ? error.message : "Unknown error returned from confirmPayment");
    } else {
      setMessage("An unexpected error occurred during confirmPayment.");
    }

    setIsSendingPayment(false);
  };


  function ToYen(value: number | undefined) {
    if(value === undefined) return null;
    return value.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
  }


  // When typing in the email field, remove error status from the field
  function HandleEmailChange(event: React.ChangeEvent<HTMLInputElement>) {
    setEmailError(false);
    setEmail(event.target.value);
  };


  if(!user) { return <span>Loading User...</span> }
  const cart = user.cart;

  const headings = (
    <div className={styles.headings}>
      <span>商品</span>
      <span>数量</span>
      <span style={{textAlign: "center"}}>合計</span>
    </div>
  );


  const checkoutLines = cart ? (
    <div className={styles.checkoutLines}>
      {cart.lines.map(line => {
        const product = products?.find(product => {return (product.productKey === line.productKey)});
        if (!product) return null;
        const lineUnitCost = line.unitPrice * (1+line.taxRate);
        const lineCost = lineUnitCost * line.quantity;
        return(
          <div className={styles.checkoutLine}>
            <img className={styles.checkoutLine} src={product.images[0].url} />
            <div className={styles.lineText}>
              <span className={styles.lineDescription}>{product.title}</span>
              <span className={styles.lineUnitCost}>{lineUnitCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
            </div>
            <span className={styles.lineQuantity}>✖ {line.quantity}</span>
            <span className={styles.lineCost}>{lineCost.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })}</span>
          </div>
        )
      })}
    </div>
  ) : null;

  const checkoutTotals = cart ? (
    <div className={styles.checkoutTotals}>
      <div className={styles.checkoutTotal}><span>Subtotal:</span><span>{ToYen(cart.cost)}</span></div>
      <div className={styles.checkoutTotal}><span>Tax (included):</span><span>{ToYen(cart.includedTax)}</span></div>
      <div className={styles.checkoutTotal}><span>Shipping:</span><span>{ToYen(0)}</span></div>
      <div className={styles.checkoutTotal} style={{fontWeight: "bold"}}><span>Total:</span><span>{ToYen(cart.cost)}</span></div>
    </div>
  ) : null;



  const addressKey = (address?.addressKey !== undefined) ? address.addressKey : null;
  const createButton = <span className={styles.addressAction} onClick={() => { setShowNewAddress(true); }}>住所を作成する</span>;
  const editButton = addressKey ? <span className={styles.addressAction} onClick={() => { setShowNewAddress(true); setSelectedAddressKey(addressKey); }}>この住所を編集する</span> : null;
  const changeButton = (addresses.length >= 2) ? <span className={styles.addressAction} onClick={() => { setSelectedAddressKey(null); }}>別の住所を選択する</span> : null;
  const prefectureName = prefectures.find(prefecture => prefecture.code.toString() === address?.pref)?.name;

  function generateAddressCard(addressKey: number) {
    if(!addressKey) return null;
    const currentAddress = addresses.find(address => {return address.addressKey === addressKey})
    if(!currentAddress) return null;

    return (
      <div className={styles.addressCard}>
        <span>{currentAddress.lastName} {currentAddress.firstName}</span>
        <span>〒{currentAddress.postalCode?.toString().slice(0,3)}-{currentAddress.postalCode?.toString().slice(3,7)}</span>
        <span>{prefectureName} {currentAddress.city}</span>
        <span>{currentAddress.ward} {currentAddress.address2}</span>
      </div>
    )
  }

//  const lineItemKeysInCart = cart.lines.map(line => line.lineItemKey);
//  for (const lineItemKey of lineItemKeysInCart) {
//    const lineItemAddresses = addressesState.find(addr => addr.lineItemKey === lineItemKey);
//    if (!lineItemAddresses || !lineItemAddresses.addresses || lineItemAddresses.addresses.length === 0) {
//      return false;
//    }
//    if(lineItemAddresses.addresses.some(addr => {return addr.addressKey === null})) {
//      return false;
//    }
//  }

  // If every item has an address set, we don't need to force one on the checkout screen
  const allAddressesSet = cart.lines.every(line => {
    const lineItemAddresses = addressesState.find(addr => addr.lineItemKey === line.lineItemKey);
  
    return (
      lineItemAddresses?.addresses &&
      lineItemAddresses.addresses.length > 0 &&
      !lineItemAddresses.addresses.some(addr => addr.addressKey === null)
    );
  });


  const addressCard = (selectedAddressKey) ? (
    <>
      <span className={styles.billingAddress}>請求先およびデフォルト配送先</span>
      {generateAddressCard(selectedAddressKey)}
      <div className={styles.addressActions}>
        {editButton}
        {changeButton}
      </div>
    </>
  ) :
//  (allAddressesSet) ?
//    <div className={styles.addressCard} style={{alignItems: "center"}}>
//      <span>すべてのアイテムには住所があります。</span>
//      <span>必要に応じて請求先住所を指定します。</span>
//      {createButton}
//    </div>
//  :
  (
    <>
      <span className={styles.billingAddress}>請求先およびデフォルト配送先</span>
      <div className={styles.addressCard} style={{alignItems: "center"}}>
        <span>住所が見つかりません。</span>
        <span>住所を入力してください。</span>
        {createButton}
      </div>
    </>
  );

  const addressCards = addresses.map((address, index) => {
    if(!address?.addressKey) return null;
    if(address.defaultAddress) {
      return (<div key={index} onClick={() => {setSelectedAddressKey(address.addressKey || null)}}><span className={styles.defaultAddressHeader}>デフォルトの住所</span><div className={styles.clickableAddress}>{generateAddressCard(address.addressKey)}</div></div>)
    }
    return (<div key={index} onClick={() => {setSelectedAddressKey(address.addressKey || null)}}><div className={styles.clickableAddress}>{generateAddressCard(address.addressKey)}</div></div>)
  });

  const selectAddressModal = (
    <div className={styles.selectAddressModal}>
      <div className={styles.selectAddressContent}>
        <span className={styles.selectAddressHeader}>住所を選択してください</span>
        {addressCards}
      </div>
    </div>
  );

  // const paymentElementOptions: StripePaymentElementOptions = { layout: "tabs" }

  return (
    <>
      {showNewAddress && <NewAddress addressKey={selectedAddressKey} setShowNewAddress={setShowNewAddress} />}
      {selectedAddressKey === null && addressCards.length > 0 && selectAddressModal}
      <div className={styles.checkoutModal}>
        <span className={styles.checkoutX} onClick={() => { console.log("setDisplayCheckout(false) 2"); setCartLoading(false); setDisplayCheckout(false); }}>✖</span>
          <div className={styles.checkoutFormWrapper}>
            <img src="logo.svg" alt="Logo" />
            <span className={styles.checkoutHeader}>Checkout</span>
            <div className={styles.checkoutFormContent}>
              <form className={styles.paymentForm} id="payment-form" onSubmit={handleSubmit}>
                <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
                <div className={styles.email}>
                  <span className={styles.email}>E-mail</span>
                  <input type="email" className={`${styles.email} ${(emailError && styles.emailError)}`} value={email} onChange={HandleEmailChange} />
                </div>
                <button disabled={isSendingPayment || !stripe || !elements} id="submit">
                  <span id="button-text">
                    {isSendingPayment ? <img className={styles.spinner} src="spinner.svg" alt="Spinner"/> : "今すぐ払う"}
                  </span>
                </button>
                {message && <div id="payment-message" className={styles.paymentMessage}>{message}</div>}
              </form>
              <div className={styles.checkoutFormProducts}>
                {checkoutLines}
                <div className={styles.checkoutSummary}>
                  {checkoutTotals}
                  {addressCard}
                </div>
              </div>
            </div>
          </div>
      </div>
    </>
  );
}