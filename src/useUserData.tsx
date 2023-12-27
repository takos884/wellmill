import { createContext, useContext, useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import Cookies from 'js-cookie';
import { Customer, UserCredentials, Cart, CartLine, Address } from './types';

type APIResponse = {
  data: any | null;
  error: string | null;
};

type UserProviderProps = {
    children: React.ReactNode;
};

interface UserContextValue {
  user: Customer | null;
  setUser: Dispatch<SetStateAction<Customer | null>>;
  cartLoading: boolean;
  setCartLoading: Dispatch<SetStateAction<boolean>>;
  local: boolean | undefined;
  setLocal: Dispatch<SetStateAction<boolean | undefined>>;
}

// Initialize the context with default values
const defaultContextValue: UserContextValue = {
  user: null,
  setUser: () => {},
  cartLoading: false,
  setCartLoading: () => {},
  local: undefined,
  setLocal: () => {},
};

// Create the context with the interface
const UserContext = createContext<UserContextValue>(defaultContextValue);


export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [local, setLocal] = useState<boolean | undefined>(undefined)
  const value = { user, setUser, cartLoading, setCartLoading, local, setLocal };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserProvider');
  }

  const { user, setUser, cartLoading, setCartLoading, local, setLocal } = context;
  const [userLoading, setUserLoading] = useState(false);




  const createUser = async (userData: Customer): Promise<APIResponse> => {
    setUserLoading(true);
    const APIResponse = await CallAPI(userData, "createUser");
    //console.log("APIResponse after create API call:");
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.dir(APIResponse, { depth: null, colors: true });
      //console.log(APIResponse.error);
      return { data: null, error: APIResponse.error };
    }

    if(!APIResponse.data.token) {
      console.log("No token returned on user create");
      return { data: null, error: "No token returned on user create" };
    }

    if(!APIResponse.data.code) {
      console.log("No code returned on user create");
      return { data: null, error: "No code returned on user create" };
    }

    userData.token = APIResponse.data.token;
    userData.code = APIResponse.data.code;
    delete userData.password;
    setUser(userData);
    setUserLoading(false);
    return { data: APIResponse.data, error: null };  
  };

  const updateUser = async (userData: Customer): Promise<APIResponse> => {
    setUserLoading(true);
    const APIResponse = await CallAPI({...userData, customerKey: user?.customerKey, token: user?.token}, "updateUser");
    //console.log("APIResponse after create API call:");
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.log(APIResponse.error);
      return { data: null, error: APIResponse.error };
    }

    if(!APIResponse.data.code) {
      console.log("No code returned on user create");
      return { data: null, error: "No code returned on user create" };
    }

    delete userData.password;

    // If the update is partial, keep existing data that isn't overwritten
    setUser(prev => {
      const newUserData = {...prev, ...userData}
      return newUserData
    });

    //setUser(userData);
    setUserLoading(false);
    return { data: APIResponse.data, error: null };  
  };

  // Add can also be used to update, if an addressKey is present in the address data
  async function addAddress(address: Address) {
    setUserLoading(true);
    const APIResponse = await CallAPI({...address, customerKey: user?.customerKey, token: user?.token}, "addAddress");

    // Error returned in response
    if(APIResponse.error) {
      const errorMessage = "APIResponse error: " + APIResponse.error
      console.log(errorMessage);
      return { data: null, error: errorMessage };
    }

    // Got a reply, but no addresses data
    if(!APIResponse.data?.addresses) {
      const errorMessage = "No address data returned after editing customer addresses. Error message: " + APIResponse.error;
      console.log(errorMessage);
      return { data: null, error: errorMessage };
    }

    // Update the user's address data, then store the user's data
    const freshUser = { ...user, addresses: APIResponse.data.addresses }
    UpdateUser(freshUser);
  }

  async function deleteAddress(addressKey: number) {
    setUserLoading(true);
    const APIResponse = await CallAPI({addressKey: addressKey, customerKey: user?.customerKey, token: user?.token}, "deleteAddress");

    // Error returned in response
    if(APIResponse.error) {
      const errorMessage = "APIResponse error: " + APIResponse.error
      console.log(errorMessage);
      return { data: null, error: errorMessage };
    }

    // Got a reply, but no addresses data
    if(!APIResponse.data?.addresses) {
      const errorMessage = "No address data returned after deleting customer addresses. Error message: " + APIResponse.error;
      console.log(errorMessage);
      return { data: null, error: errorMessage };
    }

    // Update the user's address data, then store the user's data
    const freshUser = { ...user, addresses: APIResponse.data.addresses }
    UpdateUser(freshUser);    
  }

  const loginUser = async (credentials: UserCredentials): Promise<APIResponse> => {
    setUserLoading(true);
    const APIResponse = await CallAPI(credentials, "login");
    //console.log(`APIResponse after login API call with credentials ${credentials}:`);
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.log("Login error:");
      console.log(APIResponse.error);
      return { data: null, error: APIResponse.error };
    }

    //console.log("Set user after login:");
    //console.log(APIResponse.data.customerData);

    // Returned values are all strings, so convert numbers to actual numbers
    APIResponse.data.customerData.cart.lines = ProcessCartLines(APIResponse.data.customerData.cart.lines);

    UpdateUser(APIResponse.data.customerData)
    //setUser(APIResponse.data.customerData);
    setUserLoading(false);
    return{ data: APIResponse.data.customerData, error: null };
  }

  const addToCart = useCallback(async (productKey: number, customerKey: number, unitPrice: number, taxRate: number, quantity: number) => {
    setCartLoading(true);
    const requestBody = {productKey: productKey, customerKey: customerKey, token: user?.token, unitPrice: unitPrice, taxRate: taxRate, quantity: quantity};
    //console.log("Add to cart with requestBody:");
    //console.log(requestBody);
    const APIResponse = await CallAPI(requestBody, "addToCart");

    if(APIResponse.error) {
      console.log("Error in addToCart in useUserData:");
      console.dir(APIResponse, { depth: null, colors: true });
      return { data: null, error: APIResponse.error };
    }

    //console.log("APIResponse.data:");
    //console.log(APIResponse.data);
    UpdateUser(undefined, APIResponse.data);
    setCartLoading(false);
    return APIResponse.data;
  }, []);

  const updateCartQuantity = useCallback(async (customerKey: number, token: string, lineItemKey: number, quantity: number) => {
    setCartLoading(true);
    const requestBody = {customerKey: customerKey, token: token, lineItemKey: lineItemKey, quantity: quantity};
    const APIResponse = await CallAPI(requestBody, "updateCartQuantity");
    if(APIResponse.error) {
      console.log("Error in updateCartQuantity in useUserData:");
      console.dir(APIResponse, { depth: null, colors: true });
      return { data: null, error: APIResponse.error };
    }
    UpdateUser(undefined, APIResponse.data);
    setCartLoading(false);
    return APIResponse.data;
  }, [])

  const deleteFromCart = useCallback(async (customerKey: number, token: string, lineItemKey: number) => {
    setCartLoading(true);
    const requestBody = {customerKey: customerKey, token: token, lineItemKey: lineItemKey};
    //console.log(requestBody); // Object { customerKey: 1, token: "e66...44c6", lineItemKey: 1 }
    const APIResponse = await CallAPI(requestBody, "deleteFromCart");
    if(APIResponse.error) {
      console.log("Error in deleteFromCart in useUserData:");
      console.dir(APIResponse, { depth: null, colors: true });
      return { data: null, error: APIResponse.error };
    }

    UpdateUser(undefined, APIResponse.data);
    setCartLoading(false);
    return APIResponse.data;
  }, [])

  const cancelPurchase = useCallback(async (customerKey: number, token: string, purchaseKey: number) => {
    setUserLoading(true);
    const requestBody = {customerKey: customerKey, token: token, purchaseKey: purchaseKey};
    //console.log(requestBody); // Object { customerKey: 1, token: "e66...44c6", purchaseKey: 193 }
    const APIResponse = await CallAPI(requestBody, "cancelPurchase");
    if(APIResponse.error) {
      console.log("Error in cancelPurchase in useUserData:");
      console.dir(APIResponse, { depth: null, colors: true });
      return { data: null, error: APIResponse.error };
    }

    UpdateUser(APIResponse.data);
    setUserLoading(false);
    return { data: APIResponse.data, error: null };
  }, [])

  async function CallAPI(data:object, endpoint: string) {
    const requestBody = JSON.stringify({data: data});
    try {
      const response = await fetch(`https://cdehaan.ca/wellmill/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: requestBody,
      });

      if (!response.ok) {
        // Attempt to parse the error message from the response
        try {
            const errorDataJson = await response.json();
            console.dir(errorDataJson, { depth: null, colors: true });
            return { data: null, error: errorDataJson.error || `HTTP error. Status: ${response.status}` };
        } catch (jsonParseError) {
          try{
            // If didn't find Json error data, look for a text error message
            const errorDataText = await response.text();
            console.dir(errorDataText, { depth: null, colors: true });
            return { data: null, error: errorDataText };
          } catch (textParseError){
            // If parsing json AND text fails, return a generic error message
            console.dir(response, { depth: null, colors: true });
            return { data: null, error: `HTTP error! Status: ${response.status}` };
          }
        }
      }

      const data = await response.json();
      return { data: data, error: null };

    } catch (error: any) {
      return { data: null, error: error.message };
    }
  }

  // TODO this can be broken up into UpdateUser and UpdateCart
  function UpdateUser(newUser?:Customer, cartLines?: CartLine[]) {

    // If nothing is passed to the function, leave
    if(!newUser && !cartLines) return;

    setUser((previousUser: Customer | null) => {

      // If there's no existing user and no new user, we need to quit (cart data needs a user)
      if(!previousUser && !newUser) return null;

      // User data is what was passed in, or what existed already as a fallback
      const currentUser = newUser || previousUser;
      if(!currentUser) return null;

      // If new cart lines aren't passed in (e.g. during login), use existing cart lines if they exist
      if (!cartLines) { cartLines = currentUser.cart?.lines || []; }

      // Cart needs strings converted to numbers, and calculate some metadata
      const updatedCartLines = ProcessCartLines(cartLines);
      const cartQuantity = updatedCartLines.reduce((total, lineItem) => { return total + lineItem.quantity; }, 0);
      const cartCost = updatedCartLines.reduce((total, lineItem) => { return total + lineItem.unitPrice * (1+lineItem.taxRate) * lineItem.quantity; }, 0);
      const includedTax = updatedCartLines.reduce((total, lineItem) => { return total + lineItem.unitPrice * lineItem.taxRate * lineItem.quantity; }, 0);

      // Make the object that will be the new user
      const updatedUser = {
        ...currentUser,
        cart: {
          quantity: cartQuantity,
          cost: cartCost,
          includedTax: includedTax,
          lines: updatedCartLines,
        }
      };

      return updatedUser;
    });
  }

  function ProcessCartLines(cartLines: CartLine[]) {
    const updatedCartLines = cartLines.map(line => {
      // Cast then validate relevant values to numbers
      const quantity = parseInt(line.quantity.toString());
      const unitPrice = parseFloat(line.unitPrice.toString());
      const taxRate = parseFloat(line.taxRate.toString());

      if (isNaN(quantity) || isNaN(unitPrice) || isNaN(taxRate)) {
        throw new Error(`Invalid quantity (${quantity}), unit price (${unitPrice}), or tax rate (${taxRate})`);
      }

      return {
        ...line,
        quantity: quantity,
        unitPrice: unitPrice,
        taxRate: taxRate,
      };
    });

    return updatedCartLines;
  }


  // This effect runs once on mount to check for existing user data
  // Also sets if the customer is using local data, or has registered
  useEffect(() => {
    async function initializeUserData() {
      setUserLoading(true);
      try{
        if (!user) {
          const token = Cookies.get('WellMillToken');
          if (token) {
            setLocal(false);
            await loginUserFromToken(token);
          } else {
            setLocal(true);
          }
        } else {
          if(user.customerKey) {
            setLocal(false);
          } else {
            setLocal(true);
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
      if(APIResponse.error) {
        console.log("Error in loginUserFromToken in useUserData:");
        console.dir(APIResponse, { depth: null, colors: true });
        return null;
      }
  
      if (APIResponse.data?.token) {
        Cookies.set('WellMillToken', APIResponse.data.token, { expires: 31, sameSite: 'Lax' });
      }

      // Returned values are all strings, so convert cart numbers to actual numbers // TODO could move to server
      if(APIResponse?.data?.customerData?.cart?.lines) {
        APIResponse.data.customerData.cart.lines = ProcessCartLines(APIResponse.data.customerData.cart.lines);
      }

      UpdateUser(APIResponse.data.customerData);
      return null;
    }  

    initializeUserData();
  }, [user, setUser]);

  return {
    user, userLoading, cartLoading, local,
    createUser, loginUser, updateUser, setUser, // Not available for non-registered customers
    addToCart, updateCartQuantity, deleteFromCart, cancelPurchase,
    addAddress, deleteAddress
  };

};