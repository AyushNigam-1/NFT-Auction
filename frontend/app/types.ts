import { PublicKey } from "@solana/web3.js";
import { Dispatch, SetStateAction } from "react";
import { BN, IdlAccounts } from "@coral-xyz/anchor";
import { Yieldhome } from "./target/types/yieldhome";
export interface HeaderProps {
    title: string;
    refetch: () => void;
    setSearchQuery?: (query: string) => void;
    isFetching: boolean;
    setOpen?: Dispatch<SetStateAction<boolean>>
}

export type PropertyAccount = IdlAccounts<Yieldhome>["property"];

// 2. This defines the shape of the object returned by .all()
//    (which wraps the data with the PDA publicKey)
export type PropertyItem = {
    publicKey: PublicKey;
    account: PropertyAccount;
};

interface PropertyAttribute {
    trait_type: string;
    value: string;
}

export interface PropertyFormData {
    name: string;
    symbol: string;
    description: string;
    address: string;
    total_value: number;
    type: string,
    total_share: number,
    rent: number,
    images: File[];          // e.g., "1.2 crore"
    expected_yield: number;           // e.g., "6.5%"
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