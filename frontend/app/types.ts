import { PublicKey } from "@solana/web3.js";
import { Dispatch, SetStateAction } from "react";

export interface HeaderProps {
    title: string;
    refetch: () => void;
    setSearchQuery?: (query: string) => void;
    isFetching: boolean;
    setOpen?: Dispatch<SetStateAction<boolean>>
}

interface PropertyAttribute {
    trait_type: string;
    value: string;
}

export interface PropertyFormData {
    name: string;
    symbol: string;
    description: string;
    image: string;                    // URL to the uploaded image
    address: string;
    total_value_inr: string;          // e.g., "1.2 crore"
    expected_yield: string;           // e.g., "6.5%"
    documents: File[];              // Array of document URLs
    attributes: PropertyAttribute[];   // Array of key-value attributes
}
export interface PropertyData {
    publicKey: PublicKey;
    owner: PublicKey;
    mint: PublicKey;
    totalShares: bigint;
    bump: number;
}