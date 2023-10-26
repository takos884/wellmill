import React, { ChangeEvent, useState } from "react";
import { useUserData } from './useUserData';
import Header from "./Header";

import styles from './signup.module.css'
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "新規会員登録", url: "/signup" },
];


// Define a type/interface for your input fields
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

// Define a type/interface for your input errors
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
  const [, setUser] = useUserData();
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

  function HandleRegistrationClick() {
    const requiredFields = ['lastName', 'firstName', 'lastNameKana', 'firstNameKana', 'gender', 'birthday', 'email'];
    let hasError = false;

    // Check if any required fields are empty
    for (const field of requiredFields) {
      if (inputs[field as keyof InputFields] === '') {
        setInputErrors(prevErrors => ({ ...prevErrors, [field]: true }));
        hasError = true;
      }
    }

    if(inputs.password.length <= 8) {
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
      alert('Registration successful!');
      const newUser = {
        kaiin_code: inputs.email,
        kaiin_last_name: inputs.lastName,
        kaiin_first_name: inputs.firstName,
        kaiin_last_name_kana: inputs.lastNameKana,
        kaiin_first_name_kana: inputs.firstNameKana,
        kaiin_gender: inputs.gender,
        kaiin_birthday: inputs.birthday,
        kaiin_email: inputs.email,
        // For security reasons, avoid storing the password in the front-end context.
        // Instead, a backend service should handle authentication and provide a session/token.
      };
      setUser(newUser);
      setTimeout(() => {
        navigate('/mypage');
      }, 500);
    }
  }

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
    <div className={styles.customCheckbox}>
      <label className={styles.customCheckbox}>
        <input type="checkbox" id="customCheckbox" onChange={HandleInputChange} name="agreement" checked={inputs.agreement}/>
        <span className={`${styles.customCheckbox} ${inputErrors.agreement ? styles.inputError : ''}`}>✓</span>
        利用規約とプライバシーポリシーに同意する
      </label>
    </div>
  )

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">新規会員登録</span>
      <div className={styles.wrapper}>
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
        <input type="text" placeholder="name@example.com" onChange={HandleInputChange} name="email" value={inputs.email} className={`${styles.signup} ${inputErrors.email ? styles.inputError : ''}`}></input>
        <span className={styles.subheader}>パスワード<span className={styles.red}>必須</span></span>
        <input type="password" onChange={HandleInputChange} name="password" value={inputs.password} className={`${styles.signup} ${inputErrors.password ? styles.inputError : ''}`}></input>
        <span className={styles.passwordInfo}>※8文字以上、半角英数字で入力してください</span>
        {agreeCheckbox}
        <button className={styles.register} onClick={HandleRegistrationClick}>登録</button>
      </div>
      <Footer />
      <div className={styles.success}>Registration Successful - Loading MyPage</div>
    </>
  )
}

export default Signup