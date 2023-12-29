import { createContext, useState, Dispatch, SetStateAction } from 'react';
import { Customer } from './types';

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

// Create the context with the interface
export const UserContext = createContext<UserContextValue>(defaultContextValue);

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Customer | null>(null);
  const [cartLoading, setCartLoading] = useState<boolean>(false);
  const [userLoading, setUserLoading] = useState(false);
  const [userMeaningful, setUserMeaningful] = useState(false);
  const [local, setLocal] = useState<boolean | undefined>(undefined)
  const value: UserContextValue = { user, setUser, cartLoading, setCartLoading, userLoading, setUserLoading, userMeaningful, setUserMeaningful, local, setLocal };
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
//#endregion