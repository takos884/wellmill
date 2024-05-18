import { useState } from "react";
import { AdminDataType } from "../../types";
import CallAPI from "../../Utilities/CallAPI";

type CouponsProps = {
  adminData: AdminDataType | null;
  loadAdminData: () => void;
};

type CouponFields = {
  couponKey?: number;
  productKey: number | null;
  code?: string; // this is a secret, never sent to the customer
  hash: string;
  type: number;
  target: number;
  reward: number;
};

const emptyCoupon: CouponFields = {
  productKey: null,
  hash: "",
  code: "",
  type: 1,
  target: 0,
  reward: 0,
};

type CouponFieldKey = keyof CouponFields;

const token = window.location.search ? new URLSearchParams(window.location.search).get('token') || "" : "";

export default function Coupons({ adminData, loadAdminData }: CouponsProps) {
  const [showAddCoupon, setShowAddCoupon] = useState<boolean>(false);
  const [newCoupon, setNewCoupon] = useState<CouponFields>(emptyCoupon);

  const coupons = adminData?.coupons;
  const products = adminData?.products;
  if (!coupons || !products) return <span>Loading coupons and products...</span>;

  const couponExplanation = (
    <div style={{display: "inline-flex", flexDirection:"column", border:"1px solid #888", borderRadius: "0.5rem", padding: "0.5rem", margin: "0.5rem"}}>
      <span style={{fontSize:"1.5rem"}}>クーポンタイプの説明:</span>
      <div><span> - クーポンタイプ 1: </span><span> 顧客が X 円以上お買い上げの場合、 Y 円割引となります。</span></div>
      <div><span> - クーポンタイプ 2: </span><span> 顧客が X 円以上お買い上げの場合、 Y %割引となります。</span></div>
      <div><span> - クーポンタイプ 3: </span><span> 顧客が製品 A を B 個以上購入すると、C 円の割引となります</span></div>
    </div>
  );

  //#region Add coupon
  const addCouponButton = (
    <button onClick={() => {setNewCoupon(emptyCoupon); setShowAddCoupon(true)}}>Add Coupon</button>
  )

  const numberInputStyle = {
    width: "10rem",
    margin: "1rem 0.5rem",
    fontSize: "1.25rem",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "0.5rem",
    border: "1px solid #888",
  }

  const addCouponModal = (
    <div style={{position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100}}>
      <div style={{display:"flex", flexDirection:"column", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "#fff", padding: "1rem", borderRadius: "0.5rem"}}>
        <h3>Add Coupon</h3>
        <label>Code</label>
        <input type="text" placeholder="abc123Code" onChange={handleNewCouponChange} value={newCoupon?.code || ""} name="code" />
        <label>Product</label>
        <select onChange={handleNewCouponChange} value={newCoupon?.productKey || ""} name="productKey">
          {products.map((product) => <option key={product.productKey} value={product.productKey}>{product.title}</option>)}
        </select>
        <label>Type</label>
        <select onChange={handleNewCouponChange} value={newCoupon?.type || 1} name="type">
          <option value={1}>¥ 割引</option>
          <option value={2}>% 割引</option>
          <option value={3}>製品 割引</option>
        </select>
        <label>Target</label>
        <input type="number" style={numberInputStyle} onChange={handleNewCouponChange} value={newCoupon?.target || 0} name="target" />
        <label>Reward</label>
        <input type="number" style={numberInputStyle} onChange={handleNewCouponChange} value={newCoupon?.reward || 0} name="reward"/>
        <button onClick={() => {handleCouponSave()}}>Add Coupon</button>
        <button onClick={() => {setShowAddCoupon(false)}}>Close</button>
      </div>
    </div>
  );

  function handleNewCouponChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const key = event.target.name as CouponFieldKey;
    const value = event.target.value;
    console.log(`Setting ${key} to ${value}`);
    if (newCoupon) {
      setNewCoupon({...newCoupon, [key]: value});
    }
  }

  async function handleCouponSave() {
    if (!newCoupon) return;
    const requestBody = {
      token: token,
      coupon: newCoupon,
    };

    const responseData = await CallAPI(requestBody, "adminCouponCreate");
    console.log(responseData);
    setTimeout(() => {
      setShowAddCoupon(false);
      loadAdminData();
    }, 500);
  }

  async function handleCouponDelete(couponKey: number) {
    const requestBody = {
      token: token,
      couponKey: couponKey,
    };

    const responseData = await CallAPI(requestBody, "adminCouponDelete");
    console.log(responseData);
    setTimeout(() => {
      loadAdminData();
    }, 500);
  }

    

  //#endregion Add coupon

  const couponListHeader = (
    <div style={{display: "flex", flexDirection:"row", backgroundColor:"#9cf", padding:"0.5rem"}}>
      <span style={{display:"flex", fontSize:"1.5rem", width:"30rem"}}>コード</span>
      <span style={{display:"flex", fontSize:"1.5rem", width:"8rem"}}>タイプ</span>
      <span style={{display:"flex", fontSize:"1.5rem", width:"12rem"}}>ターゲット</span>
      <span style={{display:"flex", fontSize:"1.5rem", width:"6rem"}}>製品</span>
      <span style={{display:"flex", fontSize:"1.5rem", width:"12rem"}}>報酬</span>
    </div>
  );

  const couponList = coupons?.map((coupon: CouponFields, index) => {
    const backgroundColor = index % 2 === 0 ? "#bdf" : "#fff";
    return (
      <div key={coupon.couponKey} style={{backgroundColor: backgroundColor, padding:"0.5rem"}}>
        <div style={{display: "flex", flexDirection:"row"}}>
          <span style={{display:"flex", fontSize:"1.5rem", width:"30rem"}}>{coupon.code}</span>
          <span style={{display:"flex", fontSize:"1.5rem", width:"8rem"}}>{coupon.type}</span>
          <span style={{display:"flex", fontSize:"1.5rem", width:"12rem"}}>{coupon.target}</span>
          <span style={{display:"flex", fontSize:"1.5rem", width:"6rem"}}>{coupon.productKey || "なし"}</span>
          <span style={{display:"flex", fontSize:"1.5rem", width:"12rem", flexGrow: 1}}>{coupon.reward}</span>
          <span style={{display:"flex", justifyContent:"center", alignItems:"center", color: "#800", backgroundColor:"#fbb", width:"2rem", height:"2rem", border:"1px solid #800", borderRadius:"0.5rem"}} onClick={() => {if(coupon.couponKey) handleCouponDelete(coupon.couponKey)}}>X</span>
        </div>
        <div>クーポンの意味を文で: <br/>{couponDataToExplanation(coupon)}</div>
      </div>
    )
  });

  function couponDataToExplanation(coupon: CouponFields) {
    switch(coupon.type) {
      case 1:
        return `顧客が ${coupon.target} 円以上お買い上げの場合、 ${coupon.reward} 円割引となります。`;
      case 2:
        return `顧客が ${coupon.target} 円以上お買い上げの場合、 ${coupon.reward} %割引となります。`;
      case 3:
        const product = products?.find((product) => product.productKey === coupon.productKey) || {title: "Unknown product"};
        return `顧客が製品 ${coupon.productKey} を ${coupon.target} 個以上購入すると、 ${coupon.reward} 円の割引となります。製品 ${coupon.productKey} は: ${product.title} です。`;
      default:
        return "Unknown coupon type";
    }
  
  }

  return (
    <div>
      {showAddCoupon && addCouponModal}
      <h1>Coupons</h1>
      {couponExplanation}
      <br />
      {addCouponButton}
      {couponListHeader}
      {couponList}
    </div>
  )
}