// types.ts
export type Product = {
    id: string;
    description: string;
    long_description: string;
    base_price: number;
    tax_rate: number;
    images: string[];
    bloodTest: boolean;
};