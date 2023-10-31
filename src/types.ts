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



export type Variants = {
    product_id: string,
    id: string,
    title: string,
    full_price: number,
    requires_shipping: boolean,
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

export type Product = {
    id: string;
    title: string;
    body_html: string;
    vendor: string;
    status: number;
    images: ShopifyImage[];
    variants: Variants[];
};