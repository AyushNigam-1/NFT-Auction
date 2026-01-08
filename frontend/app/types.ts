import { PublicKey } from "@solana/web3.js";
import { Dispatch, SetStateAction } from "react";

export interface HeaderProps {
    title: string;
    refetch: () => void;
    setSearchQuery?: (query: string) => void;
    isFetching: boolean;
    setOpen?: Dispatch<SetStateAction<boolean>>
}

export interface PropertyData {
    publicKey: PublicKey;
    owner: PublicKey;
    mint: PublicKey;
    totalShares: bigint;
    bump: number;
}