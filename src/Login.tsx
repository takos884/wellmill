import { useState } from 'react';
import { useUserData } from './useUserData';
import { Link, useNavigate } from 'react-router-dom';

import './App.css';
import styles from './login.module.css'
import Header from './Header';

const useRealData = false

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "ログイン", url: "/login" },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useUserData();

  const navigate = useNavigate();

  const handleLogin = async () => {
    if(useRealData) {
        try {
            // Assume this is the endpoint and method to get user data.
            const response = await fetch('https://yourwordpresssite.com/api/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ username, password })
            });
      
            const data = await response.json();
      
            if (data && data.firstName) {
              setUser(data);
              setTimeout(() => {
                navigate('/mypage');
              }, 500);
            } else {
              // Handle login error
            }
          } catch (error) {
            // Handle fetch or other runtime errors
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
    setUser(null);
  }

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">ログイン</span>
      <div className={styles.loginWrapper}>
        <span className={styles.loginSubheader}>メールアドレス</span>
        <input className={styles.loginInput} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <span className={styles.loginSubheader}>パスワード</span>
        <input className={styles.loginInput} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Link to='/'><span className={styles.loginRecovery}>パスワードをお忘れの方はこちら</span></Link>(Not implimented yet)
        <button className={styles.loginButton} onClick={handleLogin}>ログイン</button>
        <div className={styles.loginLine}></div>
        <button className={styles.loginSignup} onClick={handleLogin}>新規登録はこちら</button>
      </div>

      {user && <span>You are already signed in {user.kaiin_first_name}. Go to <Link to='/mypage'>My Page</Link> or <button onClick={handleLogout}>Logout</button>.</span>}

    </>
  );
};

export default Login;