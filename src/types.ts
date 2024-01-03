// types.ts
export type FakeProduct = {
    id: string;
    description: string;
    long_description: string;
    base_price: number;
    tax_rate: number;
    images: string[];
    bloodTest: boolean;
};



export type Variant = {
    product_id: string,
    id: string,
    title: string,
    price: number,
    requires_shipping: boolean,
    admin_graphql_api_id: string,
}

export type ShopifyImage = {
    product_id: string,
    id: string,
    position: number,
    alt: string | null,
    width: number,
    height: number,
    src: string,
}

export type ShopifyProduct = {
    id: string;
    title: string;
    body_html: string;
    vendor: string;
    status: number;
    image: ShopifyImage,
    images: ShopifyImage[];
    variants: Variant[];
};

export type WellMillAzureAddress = {
    address_key?: number, // Given by MySQL
    default_address: boolean, // true
    kaiin_code?: string, //'NV001',
    kaiin_last_name: string, //"デハーン",
    kaiin_first_name: string, //"クリス",
    touroku_kbn: number, //0,   (登録区分): This term likely represents a registration category or type.
    kaiin_last_name_kana: string, //"デハーン",
    kaiin_first_name_kana: string, //"クリス",
    post_code: number, //"1234567",
    pref_code: string, //"JPHYG",
    pref: string, //"Hyogo",
    city: string, //"Kobe",
    ward: string, //"Chuoku",
    address2: string, //"Building 1",
    renrakusaki: string, //"08012348765",   (連絡先): This term translates to "contact information" i.e. phone number
    mail_address: string, //"Building 1",
    seibetsu: number, //1,   (性別): This term represents gender.
    seinengappi: string, //"2023/10/24",   (生年月日): This term represents the date of birth.
}






export type Product = {
    productKey: number,
    id: string,
    title: string,
    description: string,
    available: boolean,
    stock: number,
    price: number,
    taxRate: number,
    type: number,
    images: image[]
}

type image = {
    imageKey: number,
    productKey: number,
    url: string,
    displayOrder: number,
    altText: string,
}

export const emptyCustomer:Customer = {
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

export type Customer = {
    type: "customer",
    guest?: boolean,
    customerKey?: number | null, // For my MySQL database (null means its stored locally, undefined means not yet sent to server)
    code?: string,               // For the company Azure backup database
    email?: string,
    lastName?: string,
    firstName?: string,
    lastNameKana?: string,
    firstNameKana?: string,
    gender?: string,
    birthday?: string,
    phoneNumber?: string, 
    password?: string,
    newPassword1?: string, // TODO this needs to go, it's a hack for password updates
    newPassword2?: string,
    token?: string,
    cart: Cart,
    addresses: Address[],
    purchases: Purchase[],
}

export type Cart = {
    type: 'cart',
    quantity: number,
    cost: number,
    includedTax: number,
    lines: CartLine[],
}

export type CartLine = {
    type: 'cartLine',
    lineItemKey: number,
    productKey: number,
    unitPrice: number,
    taxRate: number,
    quantity: number,  
}

/**
 * Represents a line item address.
 *
 * @property {number | null} addressKey - The address key for this line item. Null means no address chosen yet.
 * @property {number} quantity - The quantity going to this address only.
 * @property {number} addressIndex - The order of the addresses in the array of addresses
 *   for split items from a lineItem that was originally a single entry. Not an address key.
 */
type LineItemAddress = {
    addressKey: number | null;
    quantity: number;
    addressIndex: number;
};
  
export type LineItemAddresses = {
    lineItemKey: number;
    quantity: number;
    addresses: LineItemAddress[] | null;
};

export type LineItemAddressesArray = LineItemAddresses[];
  
  

// All are optional, if any one of them is missing, it's still a reasonable address (inside the system)
export type Address = {
    addressKey?: number | null, // Given by MySQL - null just means we're sure this address doesn't have a key yet
    lastName?: string, //"デハーン",
    firstName?: string, //"クリス",
    registrationType?: number, //0,   (登録区分): This term likely represents a registration category or type.
    postalCode?: number, // 1234567,
    prefCode?: number, // 7,
    pref?: string, //"Hyogo",
    city?: string, //"Kobe",
    ward?: string, //"Chuoku",
    address2?: string, //"Building 1",
    phoneNumber?: string, // 080-1234-5678
    defaultAddress?: boolean, // true
}

export type LineItem = {
    lineItemKey: number,
    productKey: number,
    customerKey: number,
    purchaseKey: number,
    addressKey: number,
    quantity: number,
    addedAt: string,
    unitPrice: number,
    taxRate: number,
    firstName: string,
    lastName: string,
    postalCode: number,
    prefCode: number,
    pref: string,
    city: string,
    ward: string,
    address2: string,
    phoneNumber: string,
    shippingStatus?: string,
}

export type Purchase = {
    purchaseKey: number,
    customerKey: number,
    status: string,
    creationTime: string,
    purchaseTime: string,
    shippedTime: string,
    refundTime: string,
    paymentIntentId: string,
    note: string,
    amount: number,
    email: string,
    newPurchaseJson: string,
    lineItems: LineItem[],
}

interface CredentialsWithEmail {
    email: string;
    password: string;
    token?: string; // Optional, as having all three is allowed
}

interface CredentialsWithToken {
    token: string;
}

export type UserCredentials = CredentialsWithEmail | CredentialsWithToken;

// Define a TypeScript interface for the breadcrumb object used in the Header component
export interface Breadcrumb {
    text: string;
    url: string;
}
