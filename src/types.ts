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
    email: string,
    lastName: string,
    firstName: string,
    lastNameKana?: string,
    firstNameKana?: string,
    gender?: string,
    birthday?: string 
    password?: string,
    token?: string,
    cart?: Cart,
}

type Cart = {
    id: string,
    totalQuantity: number,
    lines: CartLine[],
    totalCost: number,    
}

type CartLine = {
    id: string,
    merchandise: string,
    cost: number,
    quantity: number,  
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