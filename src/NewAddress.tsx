import React, { useRef, useState } from "react";
import { useUserData } from "./useUserData";

import { Address } from "./types";

import styles from "./newAddress.module.css"
import './App.css';

const prefectures = [
  { code: "1",  name: "北海道" },
  { code: "2",  name: "青森県" },
  { code: "3",  name: "岩手県" },
  { code: "4",  name: "宮城県" },
  { code: "5",  name: "秋田県" },
  { code: "6",  name: "山形県" },
  { code: "7",  name: "福島県" },
  { code: "8",  name: "茨城県" },
  { code: "9",  name: "栃木県" },
  { code: "10", name: "群馬県" },
  { code: "11", name: "埼玉県" },
  { code: "12", name: "千葉県" },
  { code: "13", name: "東京都" },
  { code: "14", name: "神奈川県" },
  { code: "15", name: "新潟県" },
  { code: "16", name: "富山県" },
  { code: "17", name: "石川県" },
  { code: "18", name: "福井県" },
  { code: "19", name: "山梨県" },
  { code: "20", name: "長野県" },
  { code: "21", name: "岐阜県" },
  { code: "22", name: "静岡県" },
  { code: "23", name: "愛知県" },
  { code: "24", name: "三重県" },
  { code: "25", name: "滋賀県" },
  { code: "26", name: "京都府" },
  { code: "27", name: "大阪府" },
  { code: "28", name: "兵庫県" },
  { code: "29", name: "奈良県" },
  { code: "30", name: "和歌山県" },
  { code: "31", name: "鳥取県" },
  { code: "32", name: "島根県" },
  { code: "33", name: "岡山県" },
  { code: "34", name: "広島県" },
  { code: "35", name: "山口県" },
  { code: "36", name: "徳島県" },
  { code: "37", name: "香川県" },
  { code: "38", name: "愛媛県" },
  { code: "39", name: "高知県" },
  { code: "40", name: "福岡県" },
  { code: "41", name: "佐賀県" },
  { code: "42", name: "長崎県" },
  { code: "43", name: "熊本県" },
  { code: "44", name: "大分県" },
  { code: "45", name: "宮崎県" },
  { code: "46", name: "鹿児島県" },
  { code: "47", name: "沖縄県" },
];


export default function NewAddress() {
  const { user, addAddress } = useUserData();
  const [postalCode, setPostalCode] = useState<string>("");
  const [displayedPostalCode, setDisplayedPostalCode] = useState<string>("");
  const postalCodeRef = useRef(null);
  const [address, setAddress] = useState<Address>({});
  const [fetchingAddress, setFetchingAddress] = useState<Boolean>(false);

  // Fetch address data from postal code
  async function fetchAddressData(fetchPostalCode: string) {
    try {
      // Make the API request
      setFetchingAddress(true);
      const fetchUrl = `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${fetchPostalCode}`;
      const response = await fetch(fetchUrl);
      const data = await response.json();

      // Check if the response is successful
      if (data.status === 200) {

        // Successful fetch of data, but no results found. Empty the address fields. TODO should not do this if user has edited the fields.
        if(data.results === null || data.results.length === 0) {
          setAddress( (previousAddress: Address) => ({ ...previousAddress, pref: "", city: "", ward: "" }) );
          return;
        }

        const result = data.results[0];
        //console.log(result);

        if (result.prefcode) { setAddress( (previousAddress: Address) => ({ ...previousAddress, pref: result.prefcode }) ); }
        if (result.address2) { setAddress( (previousAddress: Address) => ({ ...previousAddress, city: result.address2 }) ); }
        if (result.address3) { setAddress( (previousAddress: Address) => ({ ...previousAddress, ward: result.address3 }) ); }

      } else {
        // Handle invalid response or no results
        console.error(`Error ${data.status} returned fetching address data`);
      }
    } catch (error) {
      console.error("Error fetching address data:", error);
    } finally {
      setFetchingAddress(false);
    }
  }

  // Event handler for postal code input change
  function handlePostalCodeChange(e: React.ChangeEvent<HTMLInputElement>) {

    // Get the values currently in the input
    const currentValue = e.target.value;
    const currentDigits = currentValue.replace(/\D/g, '');

    // If longer than 9 characters (7 digits), set back to what we just had and get out
    if(currentValue.length > 9) { setDisplayedPostalCode(displayedPostalCode); return; }

    // We want to check if the user deleted just the dash. This happens if all the following are true:
    // 1) The input currently has 4 or more characters
    // 2) There is no dash
    // 3) The length of what's currently in the input is exactly one shorter than "displayedPostalCode"
    // In this case, delete the 4rd character from displayedPostalCode
    let dashDeleted = false;
    if(
      (currentValue.length >= 4) &&  // At least "〒123"
      (currentValue.indexOf("-") === -1) && // No "-" found
      (currentValue.length === displayedPostalCode.length -1) // The text is one character shorter than before
    ) {
      dashDeleted = true;
    }

    const newPostalCode = dashDeleted ? currentDigits.slice(0, 2) + currentDigits.slice(3, 7) : currentDigits.slice(0, 7);
    //console.log(`currentValue: ${currentValue}, currentValue.length: ${currentValue.length}, currentValue.indexOf("-"): ${currentValue.indexOf("-")}, displayedPostalCode.length: ${displayedPostalCode.length}, postalCode.length: ${postalCode.length}, dashDeleted: ${dashDeleted}, currentDigits: ${currentDigits}, newPostalCode: ${newPostalCode}`)

    setPostalCode(() => {
      PostalCodeFormatter(newPostalCode);
      return newPostalCode;
    });

    // Check if the postal code is complete (7 digits) and fetch address data
    if (newPostalCode.length === 7 && /^\d+$/.test(newPostalCode)) {
      fetchAddressData(newPostalCode);
    }
  };

  function handleAddressChange(field: string, newValue: string) {
    setAddress( (previousAddress: Address) => ({ ...previousAddress, [field]: newValue }) );
  }

  // Adds 〒 and - as needed to format postal code correctly
  function PostalCodeFormatter(newPostalCode?:string) {

    // If no new postal code is specified, format the existing one
    if(newPostalCode === undefined) { newPostalCode = postalCode; }

    // Format for an empty string depends on focus or not.
    // When focused, start with the "〒"
    // When not focused, set as empty to display placeholder text
    if(newPostalCode.length === 0) {
      if(postalCodeRef.current === document.activeElement) setDisplayedPostalCode("〒");
      else setDisplayedPostalCode("");
      return;
    }

    if(newPostalCode.length  <  3) {
      setDisplayedPostalCode(`〒${newPostalCode}`);
      return;
    }
    
    const postalCodeStart = newPostalCode.slice(0, 3);
    const postalCodeEnd   = newPostalCode.slice(3, 7);
    setDisplayedPostalCode(`〒${postalCodeStart}-${postalCodeEnd}`);
  }

  return (
    <>
      <div className={styles.newAddressContent}>
        <span className="topHeader">新しい住所を追加</span>
        <form>
          <div>
            <span className={styles.subheader}>名前を入力してください<span className={styles.red}>必須</span></span>
            <div className={styles.inputsRow}>
              <input type="text" value={address?.lastName  || ""} placeholder="姓" onChange={(e) => handleAddressChange("lastName", e.target.value)} />
              <input type="text" value={address?.firstName || ""} placeholder="名" onChange={(e) => handleAddressChange("firstName", e.target.value)} />
            </div>
          </div>

          <span className={styles.subheader}>住所<span className={styles.red}>必須</span></span>
          <div className={styles.labeledInput}>
            <input type="text" value={displayedPostalCode} placeholder="〒100-8111" ref={postalCodeRef} onChange={handlePostalCodeChange} onFocus={() => PostalCodeFormatter()} onBlur={() => PostalCodeFormatter()} />
            <span className={styles.inputLabel}>郵便番号</span>
          </div>
          <div className={styles.labeledInput}>
            <select className={fetchingAddress ? styles.shimmering : ""} value={address?.pref || ""} onChange={(e) => handleAddressChange("pref", e.target.value)}>
              <option value="" disabled selected></option>
              {prefectures.map((prefecture) => (
                <option key={prefecture.code} value={prefecture.code}>
                  {prefecture.name}
                </option>
              ))}
            </select>
            <span className={styles.inputLabel}>都道府県</span>
          </div>
          <div className={styles.labeledInput}>
            <input type="text" className={fetchingAddress ? styles.shimmering : ""} placeholder="横浜市" value={address?.city || ""} onChange={(e) => handleAddressChange("city", e.target.value)} />
            <span className={styles.inputLabel}>市区町村</span>
          </div>
          <div>
            <input type="text" className={fetchingAddress ? styles.shimmering : ""} placeholder="港北区新横浜3-8-11" value={address?.ward || ""} onChange={(e) => handleAddressChange("ward", e.target.value)} />
          </div>
          <div>
            <input type="text" className={fetchingAddress ? styles.shimmering : ""} placeholder="メットライフ新横浜ビル" value={address?.address2 || ""} onChange={(e) => handleAddressChange("address2", e.target.value)} />
          </div>
          <div className={styles.inputRow}>
            <span>電話番号</span>
            <input type="text" className={fetchingAddress ? styles.shimmering : ""} placeholder="080-1234-5678" value={address?.phoneNumber || ""} onChange={(e) => handleAddressChange("phoneNumber", e.target.value)} />
          </div>
        </form>
      </div>
    </>
  );
  }
