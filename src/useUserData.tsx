import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { type } from 'os';

const SHOPIFY_GRAPHQL_ENDPOINT = 'https://well-mill.myshopify.com/api/2023-01/graphql.json';
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = '22e838d1749ac7fb42ebbb9a8b605663'; // ok to make public: https://community.shopify.com/c/hydrogen-headless-and-storefront/storefront-api-private-app-security-concern/td-p/1151016

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
    cart?: cartData,
  };

type shopifyCustomerData = {
  customerAccessToken: string,
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  phone: string | null,
  acceptsMarketing: boolean,
  cart: ShopifyResponseCartData,
}

type cartData = {
  id: string,
  totalQuantity: number,
  lines: cartLine[],
  totalCost: number,
}

type cartLine = {
  id: string,
  merchandise: string,
  cost: number,
  quantity: number,
}

type ShopifyResponseCartData = {
  id: string,
  lines: {
    edges: Array<{
      node: {
        id: string,
        quantity: number,
        merchandise: {
          __typename: string,
          id: string,
          priceV2: {
            amount: string,
            currencyCode: string,
          }
        },
        cost: {
          subtotalAmount: {
            amount: string,
            currencyCode: string,
          }
        }
      }
    }>
  },
  cost: {
    subtotalAmount: {
      amount: string,
      currencyCode: string,
    }
  }
}

/*
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
*/

/*
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
*/

type UserProviderProps = {
    children: React.ReactNode;
};

const UserContext = createContext<[User | null, React.Dispatch<React.SetStateAction<User | null>>] | undefined>(undefined);

async function fetchUserDataFromShopify(token: string): Promise<User | null> {
  const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({
      query: `query {
        customer(customerAccessToken: "${token}") {
          acceptsMarketing
          email
          firstName
          id
          lastName
          phone
        }
      }`
    }),
  });

  if (response.ok) {
    const jsonResponse = await response.json();
    return transformShopifyDataToUser(jsonResponse.data.customer);
  }

  return null;
}

function transformShopifyDataToUser(shopifyCustomerData: shopifyCustomerData):User {

  // start with: 'gid://shopify/Customer/7503719465252'
  const id = shopifyCustomerData.id.split("/")[shopifyCustomerData.id.split("/").length - 1]

  return {
    kaiin_code: id,
    kaiin_last_name: shopifyCustomerData.lastName,
    kaiin_first_name: shopifyCustomerData.firstName,
    mail_address: shopifyCustomerData.email,
  };
}

const transformShopifyCartToCart = (shopifyCart: ShopifyResponseCartData): cartData => {
  const transformedCartLines: cartLine[] = shopifyCart.lines.edges.map(edge => ({
    id: edge.node.id,
    merchandise: edge.node.merchandise.id,
    cost: parseFloat(edge.node.cost.subtotalAmount.amount),
    quantity: edge.node.quantity,
  }));

  const totalCost = parseFloat(shopifyCart.cost.subtotalAmount.amount);
  const totalQuantity = transformedCartLines.reduce((sum, item) => sum + item.quantity, 0);

  return {
    id: shopifyCart.id,
    totalQuantity,
    lines: transformedCartLines,
    totalCost,
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This effect runs once on mount to check for existing user data
    const initializeUserData = async () => {
      try{
        if (!user) {
          const token = Cookies.get('shopifyToken');
          if (token) {
            const userData = await fetchUserDataFromShopify(token);
            if (userData) {
              setUser(userData);
            }
          }
        }  
      }
      catch(error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false); // Stop loading regardless of the outcome
      }
    };

    initializeUserData();
  }, [user, setUser]);

  function saveShopifyData(shopifyCustomerData: shopifyCustomerData) {
    const userData = transformShopifyDataToUser(shopifyCustomerData);
    const cartData = shopifyCustomerData.cart ? transformShopifyCartToCart(shopifyCustomerData.cart) : undefined;
    console.log("cartData:")
    console.log(cartData);
    userData.cart = cartData;
    setUser(userData);
  }

  return {user, setUser, saveShopifyData, loading};
};