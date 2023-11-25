import React, { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { StripePaymentElementOptions } from "@stripe/stripe-js";

import { useUserData } from "./useUserData";
import { useProducts } from "./ProductContext";

import styles from './checkoutForm.module.css';

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const { user, updateCartQuantity, deleteFromCart, userLoading, cartLoading } = useUserData();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();

  const cart = user ? user.cart : undefined;

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) { return; }
    const clientSecret = new URLSearchParams(window.location.search).get( "payment_intent_client_secret" );
    if (!clientSecret) { return; }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Stripe.js hasn't yet loaded. Disable form submission until Stripe.js has loaded.
    if (!stripe || !elements) { return; }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000",
      },
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

    setIsLoading(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: "tabs"
  }

  return (
    <div className={styles.checkoutFormWrapper}>
      <img src="logo.svg" alt="Logo" />
      <div className={styles.checkoutFormContent}>
        <form id="payment-form" onSubmit={handleSubmit}>
          <PaymentElement id="payment-element" options={paymentElementOptions} />
          <button disabled={isLoading || !stripe || !elements} id="submit">
            <span id="button-text">
              {isLoading ? <div className="spinner" id="spinner"></div> : "今すぐ払う"}
            </span>
          </button>
          {/* Show any error or success messages */}
          {message && <div id="payment-message">{message}</div>}
        </form>
        <div className={styles.checkoutFormProducts}>

        </div>
      </div>
    </div>
  );
}