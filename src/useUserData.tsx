import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Customer, UserCredentials } from './types';

type APIResponse = {
  data: any | null;
  error: string | null;
};

const SHOPIFY_GRAPHQL_ENDPOINT = 'https://well-mill.myshopify.com/api/2023-01/graphql.json';
const SHOPIFY_STOREFRONT_ACCESS_TOKEN = '22e838d1749ac7fb42ebbb9a8b605663'; // ok to make public: https://community.shopify.com/c/hydrogen-headless-and-storefront/storefront-api-private-app-security-concern/td-p/1151016

const cartReturnFields = `
id
lines(first: 250) {
  edges {
    node {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          priceV2 {
            amount
            currencyCode
          }
        }
      }
      cost {
        subtotalAmount {
          amount
          currencyCode
        }
        totalAmount {
          amount
          currencyCode
        }
      }
    }
  }
}
cost {
  subtotalAmount {
    amount
    currencyCode
  }
  totalTaxAmount {
    amount
    currencyCode
  }
  totalAmount {
    amount
    currencyCode
  }
}`;

type BackupUser = {
  kaiin_code: string | undefined,
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

type UserProviderProps = {
    children: React.ReactNode;
};

const UserContext = createContext<[Customer | null, React.Dispatch<React.SetStateAction<Customer | null>>] | undefined>(undefined);

/*
async function fetchUserDataFromShopifyGraphQL(token: string): Promise<User | null> {
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
*/

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
  const [user, setUser] = useState<Customer | null>(null);
  return <UserContext.Provider value={[user, setUser]}>{children}</UserContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }

  const [user, setUser] = context;
  const [userLoading, setUserLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)




  const createUser = async (userData: Customer): Promise<APIResponse> => {
    const APIResponse = await CallAPI(userData, "createUser");
    //console.log("APIResponse after create API call:");
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.log(APIResponse.error);
      return { data: null, error: APIResponse.error };
    }

    if(!APIResponse.data.token) {
      console.log("No token returned on user create");
      return { data: null, error: "No token returned on user create" };
    }
    
    userData.token = APIResponse.data.token;
    delete userData.password;
    setUser(userData);

    return { data: APIResponse.data.token, error: null };  
  };

  const loginUser = async (credentials: UserCredentials): Promise<APIResponse> => {
    const APIResponse = await CallAPI(credentials, "login");
    //console.log(`APIResponse after login API call with credentials ${credentials}:`);
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.log(APIResponse.error);
      return { data: null, error: APIResponse.error };
    }

    //console.log("Set user after login:");
    //console.log(APIResponse.data.customerData);
    setUser(APIResponse.data.customerData);
    return{ data: APIResponse.data.customerData, error: null };

  }

  const addToCart = useCallback(async (productKey: number, customerKey: number, quantity: number) => {
    const requestBody = {productKey: productKey, customerKey: customerKey, quantity: quantity};
    console.log("Add to cart with requestBody:");
    console.log(requestBody);
    const APIResponse = await CallAPI(requestBody, "addToCart");
    console.log("APIResponse.data:");
    console.log(APIResponse.data);
    return APIResponse.data;
  }, []);

  async function CallAPI(data:object, endpoint: string) {
    const requestBody = JSON.stringify({data: data});
    try {
      const response = await fetch(`https://cdehaan.ca/wellmill/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        return { data: null, error: `HTTP error! Status: ${response.status}` };
      }

      const data = await response.json();
      return { data: data, error: null };

    } catch (error: any) {
      return { data: null, error: error.message };
    }

  }

  async function CallGraphQL(query: string, variables: any) {
    try {
      setCartLoading(() => {console.log("cartLoading is now true"); return true});
      console.log("setCartLoading to true");
      const requestBody = JSON.stringify({ query: query, variables: variables});
      //console.log({ query: query, variables: variables});
      const response = await fetch(SHOPIFY_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        },
        body: requestBody,
      });
  
      const responseBody = await response.json();
      //console.log(responseBody)
      setCartLoading(false);
      console.log("setCartLoading to false");

      if(!responseBody) {
        console.error('Unknown GraphQL error:');
        return undefined;
      }

      if (responseBody.errors) {
        console.error('GraphQL errors:', responseBody.errors);
        return undefined;
      }
  
      if (responseBody.data) {
        return responseBody.data;
      }
  
      return responseBody;
    } catch (error) {
      console.error('Network error adding item to cart:', error);
      setCartLoading(false);
      console.log("setCartLoading to false after error");
      return undefined;
    } finally {
    }
  }

  const addToShopifyCart = useCallback(async (productKey: number, customerKey: number, quantity: number) => {
    /*
    const mutation = `
      mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
        cartLinesAdd(cartId: $cartId, lines: $lines) {
          cart {
            ${cartReturnFields}
          }
        }
      }
    `;

    const variables = {
      cartId: cartId,
      lines: [
        {
          quantity: quantity,
          merchandiseId: merchandiseId,
        },
      ],
    };

    const graphQlReturnData = await CallGraphQL(mutation, variables);
    const shopifyCartData = graphQlReturnData.cartLinesAdd.cart;
    const cartData = transformShopifyCartToCart(shopifyCartData);
    UpdateCart(cartData);

    const newCartId = graphQlReturnData.cartLinesAdd.cart.id;
    return newCartId;
    */
  }, [])

  const updateShopifyCart = useCallback(async (cartId: string, lineId: string, quantity: number) => {
    const mutation = `
      mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            ${cartReturnFields}
          }
        }
      }
    `;

    const variables = {
      cartId: cartId,
      lines: [
        {
          id: lineId,
          quantity: quantity,
        },
      ],
    };

    const graphQlReturnData = await CallGraphQL(mutation, variables);
    const shopifyCartData = graphQlReturnData.cartLinesUpdate.cart;
    const cartData = transformShopifyCartToCart(shopifyCartData);
    UpdateCart(cartData);

    const newCartId = graphQlReturnData.cartLinesUpdate.cart.id;
    return newCartId;
  }, [])

  const removeFromShopifyCart = useCallback(async (cartId: string, lineId: string) => {
    const mutation = `

    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          ${cartReturnFields}
        }
        userErrors {
          field
          message
        }
      }
    }`;

    const variables = {
      cartId: cartId,
      lineIds: [lineId],
    };

    console.log(variables)

    const graphQlReturnData = await CallGraphQL(mutation, variables);
    const shopifyCartData = graphQlReturnData.cartLinesRemove.cart;
    const cartData = transformShopifyCartToCart(shopifyCartData);
    UpdateCart(cartData);

    const newCartId = graphQlReturnData.cartLinesRemove.cart.id;
    return newCartId;
  }, [])

  function UpdateCart(cartData: cartData) {
    setUser((previousUser) => {
      if (!previousUser) return null;

      const updatedUser = {
        ...previousUser,
        cart: cartData
      };
    
      return updatedUser;
    });
  }

  // This effect runs once on mount to check for existing user data
  useEffect(() => {
    const initializeUserData = async () => {

      // Pull mock data for local development
      if (process.env.NODE_ENV === 'development' && !user) {
        const devUserData = {"id":"gid://shopify/Customer/7503719465252","firstName":"クリス","lastName":"デハーン","acceptsMarketing":true,"email":"chris@nextvision.co.jp","phone":null,"customerAccessToken":"0700f9f550f63d8a62cf36ed02285eca","cart":{"id":"gid://shopify/Cart/c1-ba75df257a837cbb05ec1c3910bced36","lines":{"edges":[{"node":{"id":"gid://shopify/CartLine/f610d779-65d4-4fb9-a105-9b298372fc4d?cart=c1-ba75df257a837cbb05ec1c3910bced36","quantity":3,"merchandise":{"id":"gid://shopify/ProductVariant/44859100594468","title":"選べる３項目モニタリング検査","priceV2":{"amount":"13200.0","currencyCode":"JPY"}},"cost":{"subtotalAmount":{"amount":"39600.0","currencyCode":"JPY"},"totalAmount":{"amount":"39600.0","currencyCode":"JPY"}}}},{"node":{"id":"gid://shopify/CartLine/1d2300a3-8a3e-4810-a458-ed267dac76f0?cart=c1-ba75df257a837cbb05ec1c3910bced36","quantity":1,"merchandise":{"id":"gid://shopify/ProductVariant/44859090796836","title":"選べる１項目モニタリング検査","priceV2":{"amount":"6600.0","currencyCode":"JPY"}},"cost":{"subtotalAmount":{"amount":"6600.0","currencyCode":"JPY"},"totalAmount":{"amount":"6600.0","currencyCode":"JPY"}}}}]},"cost":{"subtotalAmount":{"amount":"46200.0","currencyCode":"JPY"},"totalTaxAmount":null,"totalAmount":{"amount":"46200.0","currencyCode":"JPY"}}}};
        console.log("Pulling mock data");
        //saveShopifyData(devUserData);
      }

      setUserLoading(true);
      try{
        if (!user) {
          const token = Cookies.get('WellMillToken');
          if (token) {
            await loginUserFromToken(token);
          }
        }  
      }
      catch(error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setUserLoading(false); // Stop loading regardless of the outcome
      }
    };

    async function loginUserFromToken(token: string): Promise<Customer | null> {
      const APIResponse = await CallAPI({token: token}, "login");
      //console.log(`APIResponse after login API call with token ${token}:`);
      //console.log(APIResponse);

      if (APIResponse.data && APIResponse.data.token) {
        Cookies.set('WellMillToken', APIResponse.data.token, { expires: 31, sameSite: 'Lax' });
      }

      setUser(APIResponse.data.customerData)
      return null;
    }  

    initializeUserData();
  }, [user, setUser]);

  return {createUser, loginUser, user, setUser, addToCart,   addToShopifyCart, updateShopifyCart, removeFromShopifyCart, userLoading, cartLoading};
};