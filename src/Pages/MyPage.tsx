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

    if(!user?.customerKey) {
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

  const logoutText = user.guest ? "買い物データ削除" : "ログアウト";
  const registerText = "登録する";

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
        <span className={styles.header}>{user?.guest === false ? `${user.lastName} ${user.firstName} 様のマイページ` : "購入履歴確認"} </span>
        <div className={styles.linksGrid}>
          {user?.guest === false ? <Link to="/sample-registration"><span className={styles.link}>検体IDの登録 / 問診</span>{suggestRegister ? suggestRegisterMessage : null}</Link> : null}
          {false && (<Link to="/result-list"><span className={styles.link}>検査結果の一覧</span></Link>)}
          {user?.guest === false ? <Link to="/how_to"><span className={styles.link}>採血の方法</span></Link> : null}
          <Link to="/order-list"><span className={styles.link}>購入履歴</span></Link>
          {user?.guest === false ? <Link to="/address"><span className={styles.link}>お届け先住所</span>{suggestAddress ? suggestAddressMessage : null }</Link> : null}
          {user?.guest === false ? <Link to="/profile"><span className={styles.link}>アカウント情報</span></Link> : null}
        </div>
        {guest && makeAccountAdvice}
        {user?.guest === false ? <button onClick={handleLogout}>{logoutText}</button> : null}
        {user?.guest === true ? <Link to="/sign-up"><button>{registerText}</button></Link> : null}
      </div>
      <Footer />
    </>
  )
};

export default MyPage;





