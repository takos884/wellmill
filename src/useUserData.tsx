import { useContext, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { UserContext } from './UserContext';
import Cookies from 'js-cookie';
import { Customer, UserCredentials, Cart, CartLine, Address, Product } from './types';
import { useProducts } from "./ProductContext";

//#region Type definitions
type APIResponse = {
  data: any | null;
  error: string | null;
};

// This is pretty big
type UseUserDataReturnType = {
  createUser: (userData: Customer) => Promise<APIResponse>;
  updateUser: (userData: Customer) => Promise<APIResponse>;
  loginUser: (credentials: UserCredentials) => Promise<APIResponse>;
  addAddress: (address: Address) => Promise<APIResponse>;
  deleteAddress: (addressKey: number) => Promise<APIResponse>;

  addToCart: (productKey: number, quantity: number) => Promise<APIResponse>;
  updateCartQuantity: (lineItemKey: number, quantity: number) => Promise<APIResponse>;
  deleteFromCart: (lineItemKey: number) => Promise<APIResponse>;
  cancelPurchase: (customerKey: number, token: string, purchaseKey: number) => Promise<APIResponse>;
};
//#endregion Type definitions


export const useUserData = (): UseUserDataReturnType => {
  const context = useContext(UserContext);
  if (!context) { throw new Error('useUserData must be used within a UserProvider'); }

  const { user, setUser, cartLoading, setCartLoading, userLoading, setUserLoading, userMeaningful, setUserMeaningful, local, setLocal } = context;
  const { products, isLoading: productsLoading, error: productsError } = useProducts();


  // This effect runs once on mount to check for existing user data, first on the server, then locally
  useEffect(() => {
    async function initializeUserData() {
      if (!user) { // First time the site is loading / after refresh
        const token = Cookies.get('WellMillToken');
        if (token) {
          try{
            await loginUserFromToken(token);
            setLocal(false);
          }
          catch(error) {
            console.error("Failed to fetch remote user data:", error);
            console.error("Falling back to local data");
            pullUserLocal();
            setLocal(true);
          }
        } else {
          pullUserLocal();
          setLocal(true);
        }
      }
    }

    async function loginUserFromToken(token: string) {
      const APIResponse = await CallAPI({token: token}, "login");
      if(APIResponse.error) {
        console.log("Error in loginUserFromToken in useUserData:");
        throw new Error(APIResponse.error);
      }

      if (APIResponse.data?.token) {
        Cookies.set('WellMillToken', APIResponse.data.token, { expires: 31, sameSite: 'Lax' });
      }

      // Returned values are all strings, so convert cart numbers to actual numbers // TODO could move to server
      if(APIResponse?.data?.customerData?.cart?.lines) {
        APIResponse.data.customerData.cart.lines = ProcessCartLines(APIResponse.data.customerData.cart.lines);
      }

      UpdateUser(APIResponse.data.customerData);
      return;
    }  

    setUserLoading(true);
    initializeUserData().then(() => {
      setUserLoading(false);
    });
  }, []);


  const createUser = async (userData: Customer): Promise<APIResponse> => {
    setUserLoading(true);
    const APIResponse = await CallAPI(userData, "createUser");
    //console.log("APIResponse after create API call:");
    //console.log(APIResponse);

    if(APIResponse.error) {
      console.log(APIResponse);
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

    setUserLoading(false);
    return { data: APIResponse.data, error: null };  
  };

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
    setUserLoading(false);
    return{ data: APIResponse.data.customerData, error: null };
  };





  //#region Add address
  // Add can also be used to update, if an addressKey is present in the address data
  async function addAddress(address: Address) {
    setUserLoading(true);
    const addAddressResults = addAddressFunction(address);
    setUserLoading(false);
    return addAddressResults;

    async function addAddressFunction(address: Address) {
      if(local) {
        return addAddressLocal(address);
      }

      if(!user)             return { data: null, error: "No user data available when adding remote address" };
      if(!user.customerKey) return { data: null, error: "No customerKey available when adding remote address" };
      if(!user.token)       return { data: null, error: "No token available when adding remote address" };

      const APIResponse = await CallAPI({...address, customerKey: user.customerKey, token: user.token}, "addAddress");

      // Error returned in response
      if(APIResponse.error) {
        console.log("APIResponse error in addAddress:")
        console.log(APIResponse.error);
        return { data: null, error: APIResponse.error };
      }

      // Got a reply, but no addresses data
      if(!APIResponse.data?.addresses) {
        console.log("No address data returned after editing customer addresses. Error message: ")
        console.log(APIResponse.error);
        return { data: null, error: APIResponse.error };
      }

      // Update the user's address data, then store the user's data
      const freshUser = { ...user, addresses: APIResponse.data.addresses }
      UpdateUser(freshUser);
      return { data: freshUser, error: null };  
    }
  }

  const addAddressLocal = useCallback((address: Address) => {
    if(!user) return { data: null, error: "No user data available when adding local address" };

    const addressesClone = [ ...user.addresses ];

    // If an address with the same key exists, update that
    // If not, make a new address
    let existingAddress = addressesClone.find(ads => {return ads.addressKey === address.addressKey});
    if(existingAddress) {
      existingAddress = { ...existingAddress, ...address };
    }
    else {
      // random (more than a million) lineItemKey while it's stored locally
      const addressKeyLocal = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER -1000002) +1000001)
      addressesClone.push({ ...address, addressKey: addressKeyLocal});
    }

    const userClone = { ...user, addresses: addressesClone};
    UpdateUser(userClone);
    localStorage.setItem('userLocal', JSON.stringify(userClone));
    return { data: userClone, error: null };
  }, [user]);
  //#endregion


  //#region Delete address
  async function deleteAddress(addressKey: number) {
    setUserLoading(true);
    const deleteAddressResults = deleteAddressFunction(addressKey);
    setUserLoading(false);
    return deleteAddressResults;

    async function deleteAddressFunction(addressKey: number) {
      if(local) {
        return deleteAddressLocal(addressKey);
      }

      if(!user)             return { data: null, error: "No user data available when deleting address" };
      if(!user.customerKey) return { data: null, error: "No customerKey available when deleting address" };
      if(!user.token)       return { data: null, error: "No token available when deleting address" };

      const APIResponse = await CallAPI({addressKey: addressKey, customerKey: user.customerKey, token: user.token}, "deleteAddress");

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
      return { data: freshUser, error: null };
    }
  }

  const deleteAddressLocal = useCallback((addressKey: number) => {
    if(!user) return { data: null, error: "No user data available when deleting local address" };

    const addressesClone = user.addresses.filter(ads => {return ads.addressKey !== addressKey});
    const userClone = { ...user, addresses: addressesClone};
    UpdateUser(userClone);
    localStorage.setItem('userLocal', JSON.stringify(userClone));
    return { data: userClone, error: null };
  }, [user]);
  //#endregion


  //#region Add to cart
  const addToCart = useCallback(async (productKey: number, quantity: number) => {
    setCartLoading(true);
    const updatedCart = addToCartFunction(productKey, quantity);
    setCartLoading(false);
    return updatedCart;

    async function addToCartFunction(productKey: number, quantity: number) {
      const product = products?.find(product => {return product.productKey === productKey});
      if(!product) {
        console.log(`Error in addToCart in useUserData - product not found. productKey: ${productKey}, products:`);
        console.log(products);
        return { data: null, error: "Product not found" };
      }
  
      if(local) {
        return addToCartLocal(product, quantity);
      }
  
      if(!user)              return { data: null, error: "No customer key available when adding to remote cart" };
      if(!user?.customerKey) return { data: null, error: "No customer key available when adding to remote cart" };
      if(!user?.token)       return { data: null, error: "No token available when adding to remote cart" };
      const requestBody = {productKey: productKey, customerKey: user.customerKey, token: user.token, unitPrice: product.price, taxRate: product.taxRate, quantity: quantity};
      const APIResponse = await CallAPI(requestBody, "addToCart");
  
      if(APIResponse.error) {
        console.log("Error in addToCart in useUserData:");
        console.log(APIResponse);
        return { data: null, error: APIResponse.error };
      }
  
      UpdateUser(undefined, APIResponse.data);
      return { data: APIResponse.data, error: null };
    }
  }, [products, local, user]);

  const addToCartLocal = useCallback((product: Product, quantity: number) => {
    // No cart or no lines is ok for add to cart
    if(!user) return { data: null, error: "No user data available when adding to local cart" };

    const cartClone = user.cart ? { ...user.cart } : {quantity: 0, cost: 0, includedTax: 0, lines: []};
    const linesClone = cartClone.lines;

    // If an identical item is already in the cart, add to its quantity
    // If no identical item is found, make a new line item
    const existingLineItem = linesClone.find(line => {
      return (
        line.productKey === product.productKey &&
        line.unitPrice === product.price &&
        line.taxRate === product.taxRate
      )
    });
    if(existingLineItem) {
      existingLineItem.quantity += quantity;
    }
    else {
      // random (more than a million) lineItemKey while it's stored locally
      const lineItemKeyLocal = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER -1000002) +1000001)
      linesClone.push({lineItemKey: lineItemKeyLocal, productKey: product.productKey, unitPrice: product.price, taxRate: product.taxRate, quantity})
    }

    // Update cart meta-data
    const updatedCart = UpdateCartMetadata(cartClone)

    const userClone = { ...user, cart: updatedCart};
    UpdateUser(userClone);
    localStorage.setItem('userLocal', JSON.stringify(userClone));
    return { data: updatedCart, error: null };
  }, [user]);
  //#endregion





  //#region Update cart quantity
  const updateCartQuantity = useCallback(async (lineItemKey: number, quantity: number) => {
    setCartLoading(true);
    const updatedCart = await updateCartQuantityFunction(lineItemKey, quantity);
    setCartLoading(false);
    return updatedCart;

    async function updateCartQuantityFunction(lineItemKey: number, quantity: number) {
      if(local) {
        return updateCartQuantityLocal(lineItemKey, quantity); // { data: xxx, error: yyy }
      }
  
      if(!user)              return { data: null, error: "No user data available when updating remote cart quantity" };
      if(!user?.customerKey) return { data: null, error: "No customer key available when updating remote cart quantity" };
      if(!user?.token)       return { data: null, error: "No token available when updating remote cart quantity" };
      const requestBody = {customerKey: user.customerKey, token: user.token, lineItemKey: lineItemKey, quantity: quantity};
      const APIResponse = await CallAPI(requestBody, "updateCartQuantity");

      if(APIResponse.error) {
        console.log("Error in updateCartQuantity in useUserData:");
        console.log(APIResponse);
        return { data: null, error: APIResponse.error };
      }

      UpdateUser(undefined, APIResponse.data);
      return {data: APIResponse.data, error: null };
    }
  }, [local, user])

  const updateCartQuantityLocal = useCallback((lineItemKey: number, quantity: number) => {
    if(!user)            return { data: null, error: "No user data available when updating local cart quantity" };
    if(!user.cart)       return { data: null, error: "No cart data available when updating local cart quantity" };
    if(!user.cart.lines) return { data: null, error: "No cart lineitem data available when updating local cart quantity" };

    const cartClone = { ...user.cart };
    const linesClone = cartClone.lines;

    const existingLineItem = linesClone.find(line => {return line.lineItemKey === lineItemKey});
    if(!existingLineItem) return { data: null, error: "Item not found when updating local cart quantity" };
    existingLineItem.quantity = quantity;

    // Update cart meta-data
    const updatedCart = UpdateCartMetadata(cartClone);

    const userClone = { ...user, cart: updatedCart};
    UpdateUser(userClone);
    localStorage.setItem('userLocal', JSON.stringify(userClone));
    return {data: updatedCart, error: null };
  }, [user]);
  //#endregion


  //#region Delete from cart
  const deleteFromCart = useCallback(async (lineItemKey: number) => {
    setCartLoading(true);
    const updatedCart = await deleteFromCartFunction(lineItemKey);
    setCartLoading(false);
    return updatedCart;

    async function deleteFromCartFunction(lineItemKey: number) {
      if(local) {
        return deleteFromCartLocal(lineItemKey); // { data: xxx, error: yyy }
      }
  
      if(!user)              return { data: null, error: "No user data available when deleting from remote cart" };
      if(!user?.customerKey) return { data: null, error: "No customer key available when deleting from remote cart" };
      if(!user?.token)       return { data: null, error: "No token available when deleting from remote cart" };
      const requestBody = {customerKey: user.customerKey, token: user.token, lineItemKey: lineItemKey};
      const APIResponse = await CallAPI(requestBody, "deleteFromCart");

      if(APIResponse.error) {
        console.log("Error in deleteFromCart in useUserData:");
        console.log(APIResponse);
        return { data: null, error: APIResponse.error };
      }
  
      UpdateUser(undefined, APIResponse.data);
      return { data: APIResponse.data, error: null };
    }
  }, [local, user])

  const deleteFromCartLocal = useCallback((lineItemKey: number) => {
    if(!user)            return { data: null, error: "No user data available when deleting from local cart" };
    if(!user.cart)       return { data: null, error: "No cart data available when deleting from local cart" };
    if(!user.cart.lines) return { data: null, error: "No cart lineitem data available when deleting from local cart" };

    const cartClone = { ...user.cart };
    cartClone.lines = cartClone.lines.filter(line => {return line.lineItemKey !== lineItemKey});

    // Update cart meta-data
    const updatedCart = UpdateCartMetadata(cartClone)

    const userClone = { ...user, cart: updatedCart};
    UpdateUser(userClone);
    localStorage.setItem('userLocal', JSON.stringify(userClone));
    return {data: updatedCart, error: null};
  }, [user]);
  //#endregion


  function UpdateCartMetadata(cart: Cart) {
    const newCart = {...cart};
    const lines = newCart.lines;
    if(!lines) return cart;

    const cartQuantity = lines.reduce((sum, lineItem) => sum + lineItem.quantity, 0);
    const cartCost = lines.reduce((sum, lineItem) => sum + (lineItem.unitPrice * (1+lineItem.taxRate) * lineItem.quantity), 0);
    const cartTax = lines.reduce((sum, lineItem) => sum + (lineItem.unitPrice * (lineItem.taxRate) * lineItem.quantity), 0);
    newCart.quantity = cartQuantity;
    newCart.cost = cartCost;
    newCart.includedTax = cartTax;

    return newCart;
  }


  const cancelPurchase = useCallback(async (customerKey: number, token: string, purchaseKey: number) => {
    setUserLoading(true);
    const requestBody = {customerKey: customerKey, token: token, purchaseKey: purchaseKey};
    //console.log(requestBody); // Object { customerKey: 1, token: "e66...44c6", purchaseKey: 193 }
    const APIResponse = await CallAPI(requestBody, "cancelPurchase");
    if(APIResponse.error) {
      console.log("Error in cancelPurchase in useUserData:");
      console.log(APIResponse);
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
            console.log(errorDataJson);
            return { data: null, error: errorDataJson.error || `HTTP error. Status: ${response.status}` };
        } catch (jsonParseError) {
          try{
            // If didn't find Json error data, look for a text error message
            const errorDataText = await response.text();
            console.log(errorDataText);
            return { data: null, error: errorDataText };
          } catch (textParseError){
            // If parsing json AND text fails, return a generic error message
            console.log(response);
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

  useEffect(() => {
    setUserMeaningful(isMeaningfulData(user));
  }, [user]);

  function isMeaningfulData(obj: any): boolean {
    if (obj === null) return false;

    for (const key in obj) {
        const value = obj[key];

        if (Array.isArray(value)) {
            if (value.length > 0) { return true; }
        } else if (typeof value === 'object') {
            if (isMeaningfulData(value)) { return true; }
        } else if (typeof value === 'string' && value.trim() !== '') {
            return true;
        } else if (typeof value === 'number' && value !== null && value !== 0) {
            return true;
        }
    }
    return false;
  }

  const emptyCustomer = {
    customerKey: null,
    cart: {
      quantity: 0,
      cost: 0,
      includedTax: 0,
      lines: [],  
    },
    addresses: [],
    purchases: [],
  }

  function pullUserLocal() {
    const localStorageUser = localStorage.getItem('userLocal')
    let userLocal = (localStorageUser ? JSON.parse(localStorageUser) : emptyCustomer) as Customer;
    setUser(userLocal);
  }


  return {
    createUser, loginUser, updateUser, // Not available for non-registered customers
    addToCart, updateCartQuantity, deleteFromCart,
    cancelPurchase,
    addAddress, deleteAddress
  };

};