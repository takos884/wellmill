import { UserContext } from "../Contexts/UserContext";
import Header from './Header';
import '../App.css';
import styles from './mypage.module.css'
import Footer from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useContext } from "react";
import { emptyCustomer } from "../types";

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
];

const MyPage = () => {
  const { user, setUser, userLoading, guest, setGuest } = useContext(UserContext);
  const navigate = useNavigate();

  function handleLogout() {
    if(!guest) {
      Cookies.remove('WellMillToken');
      setGuest(true);
      setUser(emptyCustomer);
      setTimeout(() => {
        window.location.reload();
      }, 500);  
      navigate('/login');
    }

    if(guest) {
      const confirmationMessage = "アカウントデータの削除を確認しますか？カート内の商品、保存された住所、ローカルに保存されたテスト結果が削除されます。これはローカルデータのみに影響します。";
      if(window.confirm(confirmationMessage)) {
        localStorage.removeItem('userLocal');
        setUser(null);
        navigate('/login');
      }
    }
  }

  if(userLoading) return <span>Loading...</span>

  if (!user || guest) return <p>Please <Link to='/login'><span style={{textDecoration: "underline", color: "#369"}}>log in</span></Link> first.</p>;

  const makeAccountAdvice = (
    <>
      <div className={styles.advice}>
        <span>ゲストとしてご利用中です。</span>
        <span>アカウントに登録して、データを安全に保管し、複数のデバイスでアクセスしましょう。</span>
      </div>
      <button onClick={() => navigate('/sign-up')}>新規登録はこちら</button>
    </>
  );

  const logoutText = guest ? "買い物データ削除" : "ログアウト"

  const suggestRegister = (localStorage.getItem('sampleID'));
  const suggestRegisterMessage = (<span className={styles.suggestSpan}>サンプルを登録できます</span>);

  const suggestAddress = (localStorage.getItem('sampleID') && user && user.addresses.length === 0 && false);
  const suggestAddressMessage = (<span className={styles.suggestSpan}>サンプルの登録に必要です</span>);

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">マイページ</span>
      <div className={styles.content}>
        <span className={styles.header}>{user.lastName} {user.firstName}様のマイページ</span>
        <div className={styles.linksGrid}>
          <Link to="/sample-registration"><span className={styles.link}>検体IDの登録 / 問診</span>{suggestRegister ? suggestRegisterMessage : null}</Link>
          <Link to="/result-list"><span className={styles.link}>検査結果の一覧</span></Link>
          <Link to="/how_to"><span className={styles.link}>採血の方法</span></Link>
          <Link to="/order-list"><span className={styles.link}>購入履歴</span></Link>
          <Link to="/address"><span className={styles.link}>お届け先住所</span>{suggestAddress ? suggestAddressMessage : null }</Link>
          <Link to="/profile"><span className={styles.link}>アカウント情報</span></Link>
        </div>
        {guest && makeAccountAdvice}
        <button onClick={handleLogout}>{logoutText}</button>
      </div>
      <Footer />
    </>
  )
};

export default MyPage;





