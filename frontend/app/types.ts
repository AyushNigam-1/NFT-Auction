import { PublicKey } from "@solana/web3.js";
import { Dispatch, SetStateAction } from "react";
import { BN } from "@coral-xyz/anchor";
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
    image: File | null | string;          // e.g., "1.2 crore"
    expected_yield: string;           // e.g., "6.5%"
    documents: File[];              // Array of document URLs
    attributes: PropertyAttribute[];   // Array of key-value attributes
}

export interface RawPropertyAccount {
    owner: PublicKey;
    mint: PublicKey;
    totalShares: BN; // Anchor returns u64 as BN
    metadataUri: string;
    bump: number;
}

// 2. Define the shape of the clean data you want to use in your UI
export interface PropertyData extends PropertyFormData {
    publicKey: PublicKey;
    owner: PublicKey;
    mint: PublicKey;
    totalShares: bigint; // or number, depending on your preference
    metadataUri: string;
    bump: number;
}