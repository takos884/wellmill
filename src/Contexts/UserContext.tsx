import { createContext, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { Customer } from '../types';
import CallAPI from '../Utilities/CallAPI';
import ProcessCustomer from '../Utilities/ProcessCustomer';
import Cookies from 'js-cookie';

//#region Type definitions
type UserProviderProps = {
    children: React.ReactNode;
};

type UserContextValue = {
  user: Customer | null;
  setUser: Dispatch<SetStateAction<Customer | null>>;
  cartLoading: boolean;
  setCartLoading: Dispatch<SetStateAction<boolean>>;
  userLoading: boolean;
  setUserLoading: Dispatch<SetStateAction<boolean>>;

  /**
   * `userMeaningful` indicates whether there is any meaningful data stored in the user object.
   * For example, an address, a first name, a cart object, or a purchase.
   * This variable is part of the context provided by [useUserData].
   */
  userMeaningful: boolean;
  setUserMeaningful: Dispatch<SetStateAction<boolean>>;
  local: boolean | undefined;
  setLocal: Dispatch<SetStateAction<boolean | undefined>>;
}
//#endregion Type definitions


//#region create the context
// Initialize the context with default values
const defaultContextValue: UserContextValue = {
  user: null,
  setUser: () => {},
  cartLoading: false,
  setCartLoading: () => {},
  userLoading: true,
  setUserLoading: () => {},
  userMeaningful: false,
  setUserMeaningful: () => {},
  local: undefined,
  setLocal: () => {},
};

const emptyCustomer:Customer = {
  type: 'customer',
  customerKey: null,
  cart: {
    type: 'cart',
    quantity: 0,
    cost: 0,
    includedTax: 0,
    lines: [],  
  },
  addresses: [],
  purchases: [],
}

// Create the context with the interface
export const UserContext = createContext<UserContextValue>(defaultContextValue);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userMeaningful, setUserMeaningful] = useState(false);
  const [local, setLocal] = useState<boolean | undefined>(undefined)

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

      console.log(APIResponse.data.customerData);

      setUser(ProcessCustomer(APIResponse.data.customerData))
      return;
    }

    function pullUserLocal() {
      const localStorageUser = localStorage.getItem('userLocal')
      let userLocal = (localStorageUser ? JSON.parse(localStorageUser) : emptyCustomer) as Customer;
      setUser(userLocal);
    }

    setUserLoading(true);
    initializeUserData().then(() => {
      setUserLoading(false);
    });
  }, []);

  const value: UserContextValue = { user, setUser, cartLoading, setCartLoading, userLoading, setUserLoading, userMeaningful, setUserMeaningful, local, setLocal };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
//#endregion