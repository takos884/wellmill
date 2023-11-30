import React, { useEffect, useState } from "react";

import { useUserData } from "./useUserData";

import './App.css';
import styles from "./addresses.module.css"
import Header from "./Header";
import Footer from "./Footer";
import NewAddress from "./NewAddress";

import { Address } from "./types";
import { prefectures } from "./addressData"


const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
  { text: "お届け先住所", url: "/address" },
];

function Addresses() {
  const { user, userLoading, cartLoading } = useUserData();
  const addresses = user ? user.addresses : [];

  const [showNewAddress, setShowNewAddress] = useState(false);

  // Prevents scrolling while the Checkout modal is open
  useEffect(() => {
    function disableBodyScroll() { document.body.classList.add('no-scroll');    };
    function enableBodyScroll()  { document.body.classList.remove('no-scroll'); };

    if (showNewAddress) { disableBodyScroll(); }
    else                { enableBodyScroll(); }

    // Allow scrolling when the component is unmounted
    return () => { enableBodyScroll(); };
  }, [showNewAddress]);

  

  function HideNewAddress(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (event.target === event.currentTarget) {
      setShowNewAddress(false);
    }
  }

  function GenerateAddressBox(address: Address | undefined) {
    if(address === undefined) return null;
    const prefectureName = prefectures.find(prefecture => prefecture.code.toString() === address.pref)?.name;
    return(
      <div className={styles.addressBox}>
        <span>{address.lastName} {address.firstName}</span>
        <span>〒{address.postalCode?.toString().slice(0,3)}-{address.postalCode?.toString().slice(3,7)}</span>
        <span>{prefectureName} {address.city} {address.ward} {address.address2}</span>
      </div>
    )
  }

  const noAddressesMessage = (
    <span className={styles.listMessage}>登録されている住所はありません</span>
  )

  const defaultAddress = user?.addresses.find(address => {return address.defaultAddress === true});
  console.log("defaultAddress");
  console.log(defaultAddress);
  const defaultAddressBox = GenerateAddressBox(defaultAddress);
  const defaultAddressContent = (
    <>
    <span className={styles.header}>デフォルトの住所</span>
    {defaultAddressBox}
    </>
  )

  const otherAddresses = user?.addresses.filter(address => address.defaultAddress === false) || [];
  console.log("otherAddresses");
  console.log(otherAddresses);
  const otherAddressesBoxes = otherAddresses.map(address => { return GenerateAddressBox(address); });
  const otherAddressesContent = (
    <>
      <div className={styles.otherAddresses}>他の住所</div>
      {otherAddressesBoxes}
    </>
  )

  return(
    <>
      {showNewAddress && <div className={styles.newAddressWrapper} onClick={HideNewAddress}><NewAddress /></div>}
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">お届け先住所</span>
      <button onClick={() => {setShowNewAddress(true)}}>新しい住所を追加</button>
      <div className={styles.contentWrapper}>
        {addresses.length === 0 && noAddressesMessage}
        {addresses.length  >  0 && defaultAddressContent}
        {addresses.length  >  1 && otherAddressesContent}
      </div>
      <Footer />
    </>
  )
}

export default Addresses;