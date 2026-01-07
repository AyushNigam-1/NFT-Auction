import { Dispatch, SetStateAction } from "react";

export interface HeaderProps {
    title: string;
    refetch: () => void;
    setSearchQuery?: (query: string) => void;
    isFetching: boolean;
    setOpen?: Dispatch<SetStateAction<boolean>>
}

// Define the shape of the data we need for the UI
export interface NftData {
    mint: string;
    name: string;
    uri: string;
    image?: string; // We will load this from the URI
}