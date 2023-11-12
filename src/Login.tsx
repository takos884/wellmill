import { useState } from 'react';
import { useUserData } from './useUserData';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import './App.css';
import styles from './login.module.css'
import Header from './Header';
import Footer from './Footer';

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "ログイン", url: "/login" },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {user, setUser, loginUser} = useUserData();

  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await loginUser({email: username, password: password});

    if(response.error) { console.log(`Login error: ${response.error}`); }

    const data = response.data;

    if (data && data.token) {
      Cookies.set('WellMillToken', data.token, { expires: 31, sameSite: 'Lax' });

      setTimeout(() => {
        navigate('/mypage');
      }, 500);
    }
  };

  const handleLogout = async () => {
    Cookies.remove('WellMillToken');
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

      {user && <span>You are already signed in {user.firstName}. Go to <Link to='/mypage'>My Page</Link> or <button onClick={handleLogout}>Logout</button>.</span>}
      <Footer />
    </>
  );
};

export default Login;
/*        <Link to='/'><span className={styles.loginRecovery}>パスワードをお忘れの方はこちら</span></Link>(Not implimented yet) */