import { type } from "os";

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
    renrakusaki: string, //"Building 1",   (連絡先): This term translates to "contact information"
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

export type Customer = {
    customerKey?: number,
    email?: string,
    lastName?: string,
    firstName?: string,
    lastNameKana?: string,
    firstNameKana?: string,
    gender?: string,
    birthday?: string 
    password?: string,
    token?: string,
    cart?: Cart,
    addresses: Address[],
}

export type Cart = {
    quantity: number,
    cost: number,
    includedTax: number,
    lines: CartLine[],
}

export type CartLine = {
    lineItemKey: number,
    productKey: number,
    unitPrice: number,
    taxRate: number,
    quantity: number,  
}

// All are optional, if any one of them is missing, it's still a reasonable address (inside the system)
export type Address = {
    addressKey?: number | null, // Given by MySQL - null just means we're sure this address doesn't have a key yet
    lastName?: string, //"デハーン",
    firstName?: string, //"クリス",
    registrationType?: number, //0,   (登録区分): This term likely represents a registration category or type.
    postalCode?: number, //"1234567",
    prefCode?: string, //"JPHYG",
    pref?: string, //"Hyogo",
    city?: string, //"Kobe",
    ward?: string, //"Chuoku",
    address2?: string, //"Building 1",
    phoneNumber?: string, // 080-1234-5678
    defaultAddress?: boolean, // true
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

// Define a TypeScript interface for the breadcrumb object
export interface Breadcrumb {
    text: string;
    url: string;
}
