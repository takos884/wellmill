import React, { ChangeEvent, useState } from "react";
import { useUserData } from '../Hooks/useUserData';
import Header from "./Header";
import { Customer } from "../types";

import styles from './signup.module.css'
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { useBackupDB } from "../Hooks/useBackupDB";
import Cookies from "js-cookie";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "新規会員登録", url: "/sign-up" },
];

type CreateUserResponse = {
  data: any | null;
  error: string | null;
};

// Define a type/interface for input fields
interface InputFields {
  lastName: string;
  firstName: string;
  lastNameKana: string;
  firstNameKana: string;
  gender: string;
  birthday: string;
  email: string;
  password: string;
  agreement: boolean;
}

// Define a type/interface for input errors
interface InputErrors {
  lastName: boolean;
  firstName: boolean;
  lastNameKana: boolean;
  firstNameKana: boolean;
  gender: boolean;
  birthday: boolean;
  email: boolean;
  password: boolean;
  agreement: boolean;
}


function Signup() {
  const navigate = useNavigate();
  const { createUser, loginUser } = useUserData();
  const { backupCustomerData, data: customerBackupData, error: customerBackupError } = useBackupDB<any>();

  const [createUserResponse, setCreateUserResponse] = useState<CreateUserResponse | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [processingRegistration, setProcessingRegistration] = useState(false);

  const [inputs, setInputs] = useState<InputFields>({
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    gender: '',
    birthday: '',
    email: '',
    password: '',
    agreement: false,
  });

  const [inputErrors, setInputErrors] = useState<InputErrors>({
    lastName: false,
    firstName: false,
    lastNameKana: false,
    firstNameKana: false,
    gender: false,
    birthday: false,
    email: false,
    password: false,
    agreement: false,
  });

  function HandleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setInputs({
      ...inputs,
      [name]: newValue,
    });

    setInputErrors({
      ...inputErrors,
      [name]: false, // Reset error state when the user starts typing
    });
  }

  function HandleDateClick(event: React.PointerEvent<HTMLInputElement>) {
    if (event.target instanceof HTMLInputElement && typeof event.target.showPicker === 'function') {
      event.target.showPicker();
    }
  }

  async function HandleRegistrationClick() {
    if(processingRegistration) return;

    const requiredFields = ['lastName', 'firstName', 'lastNameKana', 'firstNameKana', 'gender', 'birthday', 'email'];
    let hasError = false;

    // Check if any required fields are empty
    for (const field of requiredFields) {
      if (inputs[field as keyof InputFields] === '') {
        setInputErrors(prevErrors => ({ ...prevErrors, [field]: true }));
        hasError = true;
      }
    }

    const validNameRegex = /[^\p{L}\p{Z}]/gu;
    if(inputs.lastName.replace(validNameRegex, '').length === 0) {
      setInputErrors(prevErrors => ({ ...prevErrors, lastName: true }));
      hasError = true;
    }
    if(inputs.firstName.replace(validNameRegex, '').length === 0) {
      setInputErrors(prevErrors => ({ ...prevErrors, firstName: true }));
      hasError = true;
    }
    if(inputs.lastNameKana.replace(validNameRegex, '').length === 0) {
      setInputErrors(prevErrors => ({ ...prevErrors, lastNameKana: true }));
      hasError = true;
    }
    if(inputs.firstNameKana.replace(validNameRegex, '').length === 0) {
      setInputErrors(prevErrors => ({ ...prevErrors, firstNameKana: true }));
      hasError = true;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if(!emailRegex.test(inputs.email)) {
      setInputErrors(prevErrors => ({ ...prevErrors, email: true }));
      hasError = true;
    }

    if(inputs.password.length < 8) {
      setInputErrors(prevErrors => ({ ...prevErrors, password: true }));
      hasError = true;
    }

    if(inputs.agreement === false) {
      setInputErrors(prevErrors => ({ ...prevErrors, agreement: true }));
      hasError = true;
    }

    if (hasError) {
      alert('Please fill in all required fields.');
    } else {
      const userData: Customer = {
        type: 'customer',
        email: inputs.email,
        lastName: inputs.lastName.replace(validNameRegex, ''),
        firstName: inputs.firstName.replace(validNameRegex, ''),
        lastNameKana: inputs.lastNameKana.replace(validNameRegex, ''),
        firstNameKana: inputs.firstNameKana.replace(validNameRegex, ''),
        gender: inputs.gender,
        birthday: inputs.birthday, 
        password: inputs.password,
        cart: {type: 'cart', quantity: 0, cost: 0, includedTax: 0, lines: []},
        addresses: [],
        purchases: [],
      };

      setProcessingRegistration(true);
      // This is my database update
      const response = await createUser(userData);
      //console.log(response);  // {data: {customerKey: 24, token: 06...19, code: NV14 }}

      if(response.error) {
        console.dir(response, { depth: null, colors: true });
        console.log(`Create User Error: ${response.error}`);

        if(response.error === "すでに登録されたメール") {
          setDuplicateEmail(true);
          setInputErrors(prevErrors => ({ ...prevErrors, email: true }));
          alert(`このアドレスは既に使われています。${inputs.email}`);
        } else {
          setCreateUserResponse({data: null, error: response.error});
        }

        setProcessingRegistration(false);
        return;
      }

      userData.customerKey = parseInt(response.data.customerKey);
      userData.token = response.data.token;
      userData.code = response.data.code;
      userData.guest = false;

      if(userData.token) {
        //console.log(`Going to login with token: ${userData.token}`);
        loginUser({token: userData.token});
        Cookies.set('WellMillToken', userData.token, { expires: 31, sameSite: 'Lax' });
      }

      // Azure demands these values
      if(!userData.code || !userData.lastName || !userData.firstName) { return; }

      const genderNumber = (inputs.gender === "male") ? 0 : (inputs.gender === "female") ? 1 : 9;
      backupCustomerData(userData.customerKey, userData.token || "", userData.code, userData.lastName, userData.firstName, userData.lastNameKana || "", userData.firstNameKana || "", "", "", "", "", "", "", "", userData.email || "", 0, genderNumber, userData.birthday || "");

      await sendWelcomeEmail(inputs.email);

      // Ideally, I wouldn't need a reload after signing up, but it's so much simpler to just reload the page and force a new token login
      setTimeout(() => {
        navigate('/new-customer');
        // Adding an additional delay before reload
        setTimeout(() => {
           window.location.reload();
        }, 200);
      }, 500);
    }
  }

  async function sendWelcomeEmail(recipient: string) {
    try {
        const response = await fetch('https://stage.well-mill.com/api/sendWelcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({recipient: recipient}),
        });

        if (response.ok) {
            console.log("Wecome email sent successfully to " + recipient);
        } else {
          console.log('Failed to send welcome email to ' + recipient);
        }
    } catch (error) {
      console.log('An error occurred sending welcome email to ' + recipient);
    }
  };


  const genderRadio = (
    <div className={styles.genderOptions}>
      <label>
        <input type="radio" name="gender" value="female" checked={inputs.gender === "female"} onChange={HandleInputChange}/>
        <span className={`${styles.radioCircle} ${inputErrors.gender ? styles.inputError : ''}`}></span>女性
      </label>
      <label>
        <input type="radio" name="gender" value="male" checked={inputs.gender === "male"} onChange={HandleInputChange}/>
        <span className={`${styles.radioCircle} ${inputErrors.gender ? styles.inputError : ''}`}></span>男性
      </label>
    </div>
  )

  const agreeCheckbox = (
    <div className="customCheckbox">
    <label className="customCheckbox">
      <input type="checkbox" id="customCheckbox" onChange={HandleInputChange} name="agreement" checked={inputs.agreement}/>
        <span className={`customCheckbox ${inputErrors.agreement ? styles.inputError : ''}`}>✓</span>
        利用規約とプライバシーポリシーに同意する
      </label>
    </div>
  )

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">新規会員登録</span>
      <div className={styles.content}>
        <div className={styles.form}>
          <span className={styles.subheader}>名前を入力してください<span className={styles.red}>必須</span></span>
          <div className={styles.doubleInput}>
            <input type="text" placeholder="姓" onChange={HandleInputChange} name="lastName" value={inputs.lastName} className={`${styles.signup} ${inputErrors.lastName ? styles.inputError : ''}`}></input>
            <input type="text" placeholder="名" onChange={HandleInputChange} name="firstName" value={inputs.firstName} className={`${styles.signup} ${inputErrors.firstName ? styles.inputError : ''}`}></input>
          </div>
          <span className={styles.subheader}>フリガナを入力してください<span className={styles.red}>必須</span></span>
          <div className={styles.doubleInput}>
            <input type="text" placeholder="セイ" onChange={HandleInputChange} name="lastNameKana" value={inputs.lastNameKana} className={`${styles.signup} ${inputErrors.lastNameKana ? styles.inputError : ''}`}></input>
            <input type="text" placeholder="メイ" onChange={HandleInputChange} name="firstNameKana" value={inputs.firstNameKana} className={`${styles.signup} ${inputErrors.firstNameKana ? styles.inputError : ''}`}></input>
          </div>
          <span className={styles.subheader}>性別<span className={styles.red}>必須</span></span>
          {genderRadio}
          <span className={styles.subheader}>生年月日<span className={styles.red}>必須</span></span>
          <input type="date" id="datePicker" onChange={HandleInputChange} onClick={HandleDateClick} name="birthday" value={inputs.birthday} className={`${styles.signup} ${inputErrors.birthday ? styles.inputError : ''}`}/>
          <span className={styles.subheader}>メールアドレス<span className={styles.red}>必須</span></span>
          <input type="email" placeholder="name@example.com" onChange={(event) => {setDuplicateEmail(false); HandleInputChange(event);}} name="email" value={inputs.email} className={`${styles.signup} ${inputErrors.email ? styles.inputError : ''}`}></input>
          {duplicateEmail && <span className={styles.duplicateEmailError}>※すでにこのメールアドレスのユーザーが存在しています。</span>}
          <span className={styles.subheader}>パスワード<span className={styles.red}>必須</span></span>
          <input type="password" onChange={HandleInputChange} name="password" value={inputs.password} className={`${styles.signup} ${inputErrors.password ? styles.inputError : ''}`}></input>
          <span className={styles.passwordInfo}>※8文字以上、半角英数字で入力してください</span>
        </div>
        {agreeCheckbox}
        <button className={`${styles.register} ${processingRegistration && styles.processing}`} onClick={HandleRegistrationClick}>登録</button>
        {createUserResponse?.data && <p>User created: {JSON.stringify(createUserResponse.data)}</p>}
        {createUserResponse?.error && <p>Error: {createUserResponse.error}</p>}
        {customerBackupData?.Status && (<span>{(customerBackupData?.Status === 200) ? "" : "Error"}</span>)}
        {customerBackupError && (<span>{JSON.stringify(customerBackupError)}</span>)}
      </div>
      <Footer />
    </>
  )
}

// ✔
export default Signup