import { useUserData } from './useUserData';
import Header from './Header';
import './App.css';
import styles from './mypage.module.css'
import Footer from './Footer';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const breadcrumbs = [
  { text: "ホーム", url: "/" },
  { text: "マイページ", url: "/mypage" },
];

const MyPage = () => {
  const {user, setUser, userLoading} = useUserData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUser(null);
    Cookies.remove('shopifyToken');
    navigate('/login');
  }

  if(userLoading) return <span>Loading...</span>

  if (!user) return <p>Please <Link to='/login'>log in</Link> first.</p>;

  return (
    <>
      <div className="topDots" />
      <Header breadcrumbs={breadcrumbs} />
      <span className="topHeader">マイページ</span>
      <div className={styles.content}>
        <span className={styles.header}>{user.kaiin_last_name} {user.kaiin_first_name}様のマイページ</span>
        <div className={styles.linksGrid}>
          <span className={styles.link}>検体IDの登録 / 問診</span>
          <span className={styles.link}>検査結果の一覧</span>
          <span className={styles.link}>採血の方法</span>
          <span className={styles.link}>購入履歴</span>
          <span className={styles.link}>お届け先住所</span>
          <span className={styles.link}>アカウント情報</span>
        </div>
        <button className={styles.logout} onClick={handleLogout}>ログアウト</button>
      </div>
      <Footer />
    </>
  )
};

export default MyPage;





