import React, { useEffect, useState } from "react";
import { Appearance, StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Helmet } from 'react-helmet';

import CheckoutForm from "./CheckoutForm";

import styles from './checkout.module.css';
import NewAddress from "./NewAddress";

// This is our *publishable* test API key.
const stripePromise = loadStripe("pk_test_51OCbHTKyM0YoxbQ6sRQnZdL8bJ5MCtdXPgiCv9uBngab4fOvROINeb3EV8nqXf5pyOT9ZTF8mKTzOcCgNK2rODhI00MmDWIyQ6");

type CheckoutProps = {
  setDisplayCheckout: React.Dispatch<React.SetStateAction<boolean>>;
};

function Checkout({ setDisplayCheckout }: CheckoutProps) {
  const [selectedAddressKey, setSelectedAddressKey] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    fetch("https://cdehaan.ca/wellmill/api/createPaymentIntent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ id: "xl-tshirt" }] }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, []);

  const appearance: Appearance = {
    theme: 'stripe',
  };
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  function hideCheckout(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (event.target === event.currentTarget) {
      setDisplayCheckout(false);
    }
  }

  return (
    <>
      <Helmet>
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com;"
        />
      </Helmet>
      <div className={styles.checkoutWrapper} onClick={hideCheckout}>
        {showNewAddress && <NewAddress addressKey={selectedAddressKey} setShowNewAddress={setShowNewAddress} />}
        {clientSecret && (
          <div className={styles.checkoutModal}>
            <span className={styles.checkoutX} onClick={() => { setDisplayCheckout(false); }}>✖</span>
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm selectedAddressKey={selectedAddressKey} setSelectedAddressKey={setSelectedAddressKey} setShowNewAddress={setShowNewAddress}/>
            </Elements>
          </div>
        )}
      </div>
    </>
  );
}

export default Checkout;