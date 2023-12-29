import { useUserData } from './useUserData';
import Header from './Header';
import './App.css';
import styles from './mypage.module.css'
import Footer from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/account" },
];

const MyPage = () => {
  const {user, setUser, userLoading, local} = useUserData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUser(null);
    Cookies.remove('WellMillToken');
    if(local) { localStorage.removeItem('userLocal'); }
    navigate('/login');
  }

  if(userLoading) return <span>Loading...</span>

  if (!user) return <p>Please <Link to='/login'>log in</Link> first.</p>;

  const logoutText = local ? "買い物データ削除" : "ログアウト"

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">マイページ</span>
      <div className={styles.content}>
        <span className={styles.header}>{user.lastName} {user.firstName}様のマイページ</span>
        <div className={styles.linksGrid}>
          <Link to="/sample-registration"><span className={styles.link}>検体IDの登録 / 問診</span></Link>
          <Link to="/result-list"><span className={styles.link}>検査結果の一覧</span></Link>
          <Link to="/how_to"><span className={styles.link}>採血の方法</span></Link>
          <Link to="/order-list"><span className={styles.link}>購入履歴</span></Link>
          <Link to="/address"><span className={styles.link}>お届け先住所</span></Link>
          <Link to="/profile"><span className={styles.link}>アカウント情報</span></Link>
        </div>
        <button className={styles.logout} onClick={handleLogout}>{logoutText}</button>
      </div>
      <Footer />
    </>
  )
};

export default MyPage;





