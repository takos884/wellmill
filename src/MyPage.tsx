import { useUserData } from './useUserData';

const MyPage = () => {
  const [user] = useUserData();

  if (!user) return <p>Please <a href='/login'>log in</a> first.</p>;

  return <div>Hello {user.kaiin_first_name}!</div>;
};

export default MyPage;