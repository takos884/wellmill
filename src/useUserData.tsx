import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

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

  const saveShopifyData = useCallback((shopifyCustomerData: shopifyCustomerData) => {
    const userData = transformShopifyDataToUser(shopifyCustomerData);
    const cartData = shopifyCustomerData.cart ? transformShopifyCartToCart(shopifyCustomerData.cart) : undefined;
    userData.cart = cartData;
    setUser(userData);
  }, [setUser]);

  async function CallGraphQL(query: string, variables: any) {
    try {
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
      return undefined;
    }
  }

  const addToCart = useCallback(async (cartId: string, merchandiseId: string, quantity: number) => {
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
  }, [])

  const updateCart = useCallback(async (cartId: string, lineId: string, quantity: number) => {
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

  const removeFromCart = useCallback(async (cartId: string, lineId: string) => {
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

  useEffect(() => {
    // This effect runs once on mount to check for existing user data
    const initializeUserData = async () => {

      // Pull mock data for local development
      if (process.env.NODE_ENV === 'development' && !user) {
        const devUserData = {"id":"gid://shopify/Customer/7503719465252","firstName":"クリス","lastName":"デハーン","acceptsMarketing":true,"email":"chris@nextvision.co.jp","phone":null,"customerAccessToken":"0700f9f550f63d8a62cf36ed02285eca","cart":{"id":"gid://shopify/Cart/c1-ba75df257a837cbb05ec1c3910bced36","lines":{"edges":[{"node":{"id":"gid://shopify/CartLine/f610d779-65d4-4fb9-a105-9b298372fc4d?cart=c1-ba75df257a837cbb05ec1c3910bced36","quantity":3,"merchandise":{"id":"gid://shopify/ProductVariant/44859100594468","title":"選べる３項目モニタリング検査","priceV2":{"amount":"13200.0","currencyCode":"JPY"}},"cost":{"subtotalAmount":{"amount":"39600.0","currencyCode":"JPY"},"totalAmount":{"amount":"39600.0","currencyCode":"JPY"}}}},{"node":{"id":"gid://shopify/CartLine/1d2300a3-8a3e-4810-a458-ed267dac76f0?cart=c1-ba75df257a837cbb05ec1c3910bced36","quantity":1,"merchandise":{"id":"gid://shopify/ProductVariant/44859090796836","title":"選べる１項目モニタリング検査","priceV2":{"amount":"6600.0","currencyCode":"JPY"}},"cost":{"subtotalAmount":{"amount":"6600.0","currencyCode":"JPY"},"totalAmount":{"amount":"6600.0","currencyCode":"JPY"}}}}]},"cost":{"subtotalAmount":{"amount":"46200.0","currencyCode":"JPY"},"totalTaxAmount":null,"totalAmount":{"amount":"46200.0","currencyCode":"JPY"}}}};
        console.log("Pulling mock data");
        saveShopifyData(devUserData);
      }

      try{
        if (!user) {
          const token = Cookies.get('shopifyToken');
          if (token) {
            await loadUserDataFromShopify(token);
          }
        }  
      }
      catch(error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false); // Stop loading regardless of the outcome
      }
    };

    async function loadUserDataFromShopify(token: string): Promise<User | null> {
      const requestBody = JSON.stringify({customerAccessToken: token})
      const response = await fetch('https://cdehaan.ca/wellmill/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody
      });
    
      if (!response.ok) { return null; }
    
      const jsonResponse = await response.json();
      if (jsonResponse && jsonResponse.customerAccessToken) {
        Cookies.set('shopifyToken', jsonResponse.customerAccessToken, { expires: 31, sameSite: 'Lax' });
      }
      //console.log(JSON.stringify(jsonResponse))
      saveShopifyData(jsonResponse);
      return null;
    }  

    initializeUserData();
  }, [user, setUser, saveShopifyData]);

  return {user, setUser, saveShopifyData, addToCart, updateCart, removeFromCart, loading};
};