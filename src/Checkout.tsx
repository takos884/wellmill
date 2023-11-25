import React, { useEffect, useState } from "react";
import { Appearance, StripeElementsOptions, loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Helmet } from 'react-helmet';

import CheckoutForm from "./CheckoutForm";

import styles from './checkout.module.css';

// This is our *publishable* test API key.
const stripePromise = loadStripe("pk_test_51OCbHTKyM0YoxbQ6sRQnZdL8bJ5MCtdXPgiCv9uBngab4fOvROINeb3EV8nqXf5pyOT9ZTF8mKTzOcCgNK2rODhI00MmDWIyQ6");

function Checkout() {

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


  return (
    <div className={styles.checkoutWrapper}>
      <Helmet>
        <meta
          http-equiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; frame-src https://js.stripe.com;"
        />
      </Helmet>
      {clientSecret && (
        <div className={styles.checkoutModal}>
          <Elements options={options} stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>
      )}
    </div>
  );
}

export default Checkout;

//      <span>Client secret: {clientSecret}</span>
