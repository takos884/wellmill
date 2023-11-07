import { type } from 'os';
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

type shopifyCustomerData = {
  customerAccessToken: string,
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  phone: string | null,
  acceptsMarketing: boolean,
}

type shopifyCustomerDataFull = {
  "id": number,
  "email": string,
  "accepts_marketing": boolean,
  "created_at": string,
  "updated_at": string,
  "first_name": string,
  "last_name": string,
  "orders_count": number,
  "state": string,
  "total_spent": string,
  "last_order_id": number,
  "note": string,
  "verified_email": boolean,
  "multipass_identifier": string,
  "tax_exempt": boolean,
  "tags": string,
  "last_order_name": string,
  "currency": string,
  "phone": string,
  "addresses": address[],
  "accepts_marketing_updated_at": string,
  "marketing_opt_in_level": string,
  "tax_exemptions": [],
  "email_marketing_consent": {
    "state": string,
    "opt_in_level": string,
    "consent_updated_at": string
  },
  "sms_marketing_consent": {
    "state": string,
    "opt_in_level": string,
    "consent_updated_at": string,
    "consent_collected_from": string
  },
  "admin_graphql_api_id": string,
  "default_address": address
}

type address = {
  "id": number,
  "customer_id": number,
  "first_name": string,
  "last_name": string,
  "company": string,
  "address1": string,
  "address2": string,
  "city": string,
  "province": string,
  "country": string,
  "zip": string,
  "phone": string,
  "name": string,
  "province_code": string,
  "country_code": string,
  "country_name": string,
  "default": boolean
}

type UserProviderProps = {
    children: React.ReactNode;
};

const UserContext = createContext<[User | null, React.Dispatch<React.SetStateAction<User | null>>] | undefined>(undefined);

function transformShopifyDataToUser(shopifyCustomerData: shopifyCustomerData) {

  // start with: 'gid://shopify/Customer/7503719465252'
  const id = shopifyCustomerData.id.split("/")[shopifyCustomerData.id.split("/").length - 1]

  return {
    kaiin_code: id,
    kaiin_last_name: shopifyCustomerData.lastName,
    kaiin_first_name: shopifyCustomerData.firstName,
    mail_address: shopifyCustomerData.email,
  };
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  return <UserContext.Provider value={[user, setUser]}>{children}</UserContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }

  const [user, setUser] = context;

  function saveShopifyData(shopifyCustomerData: shopifyCustomerData) {
    const userData = transformShopifyDataToUser(shopifyCustomerData);
    setUser(userData);
  }

  return {user, setUser, saveShopifyData};
};