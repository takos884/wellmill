import { createContext, useContext, useState } from 'react';

type User = {
    kaiin_code: string,
    kaiin_last_name: string,
    kaiin_first_name: string,
    kaiin_last_name_kana?: string,
    kaiin_first_name_kana?: string,
    post_code?: string,
    pref_code?: string,
    pref?: string,
    city?: string,
    address1?: string,
    address2?: string,
    renrakusaki?: string,
    mail_address?: string,
    seibetsu?: number,
    seinengappi?: string,
};

type UserProviderProps = {
    children: React.ReactNode;
};

const UserContext = createContext<[User | null, React.Dispatch<React.SetStateAction<User | null>>] | undefined>(undefined);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  return <UserContext.Provider value={[user, setUser]}>{children}</UserContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }
  return context;
};