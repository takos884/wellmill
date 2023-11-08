import { useState } from 'react';
import { useUserData } from './useUserData';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import './App.css';
import styles from './login.module.css'
import Header from './Header';
import Footer from './Footer';

const useRealData = true;

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "ログイン", url: "/login" },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {user, setUser, saveShopifyData} = useUserData();

  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const requestBody = JSON.stringify({email: username, password: password})
      //console.log("requestBody before fetch:", requestBody);
      const response = await fetch('https://cdehaan.ca/wellmill/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      //console.log(response)
      const data = await response.json();
      //console.log(data)

      if (data && data.customerAccessToken) {
        Cookies.set('shopifyToken', data.customerAccessToken, { expires: 31, sameSite: 'Lax' });
        //console.log(data);
        saveShopifyData(data);

        setTimeout(() => {
          navigate('/mypage');
        }, 500);
      } else if (data && data.customerUserErrors && data.customerUserErrors.length) {
        alert(data.customerUserErrors[0].message);  // Displaying the first error message
      } else {
        // Other reply errors
      }
    } catch (error) {
      // Fetch or other runtime errors
      console.error(error);
    }
  };

  const handleLogout = async () => {
    Cookies.remove('shopifyToken');
    setUser(null);
  }

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">ログイン</span>
      <div className={styles.loginWrapper}>
        <span className={styles.loginSubheader}>メールアドレス</span>
        <input className="formField" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <span className={styles.loginSubheader}>パスワード</span>
        <input className="formField" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className={styles.loginButton} onClick={handleLogin}>ログイン</button>
        <div className={styles.loginLine}></div>
        <button className={styles.loginSignup} onClick={() => navigate('/signup')}>新規登録はこちら</button>
      </div>

      {user && <span>You are already signed in {user.kaiin_first_name}. Go to <Link to='/mypage'>My Page</Link> or <button onClick={handleLogout}>Logout</button>.</span>}
      <Footer />
    </>
  );
};

export default Login;
/*        <Link to='/'><span className={styles.loginRecovery}>パスワードをお忘れの方はこちら</span></Link>(Not implimented yet) */