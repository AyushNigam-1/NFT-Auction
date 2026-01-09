"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/app/components/ui/Header";
import { useQuery } from "@tanstack/react-query";
import { useProgramActions } from "@/app/hooks/useProgramActions";
import PropertyForm from "@/app/components/ui/PropertyForm";


export default function MyNFTsPage() {

    const wallet = useWallet();
    const { getAllProperties } = useProgramActions()
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [isOpen, setOpen] = useState(false)

    const {
        data: properties,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: [""],
        queryFn: async () => await getAllProperties(),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });

    console.log("subscribers", properties)

    return (
        <>
            <button className="" onClick={() => setOpen(true)} >
                Open
            </button>
            <PropertyForm isOpen={isOpen} setIsOpen={setOpen} />
        </>
    );
}