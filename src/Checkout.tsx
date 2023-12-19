import React, { useEffect, useState } from "react";
import { Helmet } from 'react-helmet';
import CheckoutForm from "./CheckoutForm";
import styles from './checkout.module.css';
import { Elements } from "@stripe/react-stripe-js";
import { Appearance, StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { useUserData } from "./useUserData";


type CheckoutProps = {
  setDisplayCheckout: React.Dispatch<React.SetStateAction<boolean>>;
};

// This is our *publishable* test API key.
const stripePromise = loadStripe("pk_test_51OCbHTKyM0YoxbQ6sRQnZdL8bJ5MCtdXPgiCv9uBngab4fOvROINeb3EV8nqXf5pyOT9ZTF8mKTzOcCgNK2rODhI00MmDWIyQ6");

function Checkout({ setDisplayCheckout }: CheckoutProps) {
  const { user, userLoading, cartLoading } = useUserData();
  const [clientSecret, setClientSecret] = useState("");

  function hideCheckout(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (event.target === event.currentTarget) {
      setDisplayCheckout(false);
    }
  }

  const appearance: Appearance = {
    theme: 'stripe',

    variables: {
      spacingUnit: '2px',
    },
  };
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  useEffect(() => {
    const cartLines = user?.cart?.lines
    if(cartLines === undefined) return;

    fetch("https://cdehaan.ca/wellmill/api/createPaymentIntent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({data: { customerKey: user?.customerKey, token: user?.token, cartLines: cartLines }}),
    })
      .then((response) => response.json())
      .then((data) => setClientSecret(data.clientSecret));  
  }, [user]);

  const StripeElements = clientSecret ? (
    <Elements options={options} stripe={stripePromise}>
      <div className={styles.checkoutWrapper} onClick={hideCheckout}>
        <CheckoutForm setDisplayCheckout={setDisplayCheckout}/>
      </div>
    </Elements>) : null;

  return (
    <>
      <Helmet>
        <meta
          http-equiv="Content-Security-Policy"
          content="
            default-src 'self' https://zipcloud.ibsnet.co.jp; 
            script-src 'self' 'unsafe-inline' https://js.stripe.com; 
            style-src 'self' 'unsafe-inline'; 
            frame-src https://js.stripe.com;
            connect-src 'self' https://zipcloud.ibsnet.co.jp;
          "
        />
      </Helmet>
      {StripeElements}
    </>
  );
}

export default Checkout;