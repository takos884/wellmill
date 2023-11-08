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
    if(useRealData) {
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
              saveShopifyData(data);

              setTimeout(() => {
                navigate('/mypage');
              }, 500);
            } else if (data && data.customerUserErrors && data.customerUserErrors.length) {
              alert(data.customerUserErrors[0].message);  // Displaying the first error message
            } else {
              // Handle other types of errors
            }
          } catch (error) {
            // Handle fetch or other runtime errors
            console.error(error);
          }
    } else {
        const fakeUserData = {
            kaiin_code: 'NV001',
            kaiin_last_name: "デハーン",
            kaiin_first_name: "クリス",
            touroku_kbn: 0,
            kaiin_last_name_kana: "デハーン",
            kaiin_first_name_kana: "クリス",
            post_code: "1234567",
            pref_code: "JPHYG",
            pref: "Hyogo",
            city: "Kobe",
            address1: "Chuoku",
            address2: "Building 1",
            renrakusaki: "Building 1",
            mail_address: "Building 1",
            seibetsu: 1,
            seinengappi: "2023/10/24",
        }
        setUser(fakeUserData);
        setTimeout(() => {
            navigate('/mypage');
        }, 500);
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