import { useContext, useState } from 'react';
import { UserContext } from "../Contexts/UserContext";
import { useUserData } from '../Hooks/useUserData';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import '../App.css';
import styles from './login.module.css'
import Header from './Header';
import Footer from './Footer';
import { emptyCustomer } from '../types';

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "ログイン", url: "/login" },
];

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, setUser, guest, setGuest, userMeaningful } = useContext(UserContext);
  const { loginUser} = useUserData();

  const navigate = useNavigate();

  const handleLogin = async () => {
    const response = await loginUser({email: username, password: password});

    if(response.error) {
      console.log(`Login error: ${response.error}`);
      setErrorMessage(response.error);
      return;
    }

    const data = response.data;

    if (data && data.token) {
      Cookies.set('WellMillToken', data.token, { expires: 31, sameSite: 'Lax' });
      setGuest(false);
      localStorage.removeItem('userLocal');

      setTimeout(() => {
        if(localStorage.getItem('sampleID')) {
          navigate('/sample-registration');
          return
        }
        navigate('/account');        
      }, 500);
    }
  };

  const handleLogout = async () => {
    Cookies.remove('WellMillToken');
    setUser(null);
    setGuest(true);
  }

  function handleNewGuest() {
    if(user) {
      setUser(prev => {
        let newCustomer
        if(!prev) { newCustomer = { ...emptyCustomer, guest: true}; }
        else      { newCustomer = { ...prev,          guest: true}; }
        localStorage.setItem('userLocal', JSON.stringify(newCustomer));
        return newCustomer;
      });
    }
    navigate('/shop');
  }

  function handleWipeGuest() {
    localStorage.removeItem('userLocal');
    Cookies.remove('WellMillToken');
    setUser(emptyCustomer); setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">ログイン</span>
      <div className={styles.loginWrapper}>
        <span className={styles.loginSubheader}>メールアドレス</span>
        <input className="formField" type="email" placeholder="wellmill@example.com" value={username} onChange={(e) => {setUsername(e.target.value); setErrorMessage(null);}} />
        <span className={styles.loginSubheader}>パスワード</span>
        <input className="formField" type="password" placeholder="8文字以上、半角英数字で入力してください" value={password} onChange={(e) => {setPassword(e.target.value); setErrorMessage(null);}} />
        <span className={styles.forgotPassword}><Link to="/password-recover">パスワードをお忘れの方はこちら</Link></span>
        <button onClick={handleLogin}>ログイン</button>
        {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
        <div className={styles.loginLine}></div>
        <button className={styles.loginSignup} onClick={handleNewGuest}>ゲストとして続ける</button>
        <div className={styles.loginLine}></div>
        <button className={styles.loginSignup} onClick={() => {navigate('/sign-up')}}>新規登録はこちら</button>
        {((guest && userMeaningful) || user?.customerKey) && (<>
          <div className={styles.loginLine}></div>
          <button className={styles.loginSignup} onClick={handleWipeGuest}>ゲストデータを削除する</button>
        </>)}
      </div>

      {!guest && false && <span>You are already signed in {user?.firstName}. Go to <Link to='/account'>My Page</Link> or <span onClick={handleLogout}>Logout</span>.</span>}
      <Footer />
    </>
  );
};

export default Login;
