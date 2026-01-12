"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/app/components/ui/Header";
import { useQuery } from "@tanstack/react-query";
import { useProgramActions } from "@/app/hooks/useProgramActions";
import PropertyForm from "@/app/components/ui/PropertyForm";
import { useMutations } from "@/app/hooks/useMutations";
import PropertyDetails from "@/app/components/ui/PropertyDetails";
import { PropertyItem } from "@/app/types";
import { Banknote, Wallet } from "lucide-react";


export default function page() {

    const wallet = useWallet();
    const { getAllProperties } = useProgramActions()
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [isOpen, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [property, setProperty] = useState<PropertyItem>()

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
        <div className="space-y-4">
            {/* <button className="" onClick={() => setOpen(true)} >
                Open
            </button> */}
            <button className="" onClick={() => refetch()} >
                Open
            </button>
            <Header isFetching={isFetching} refetch={refetch} title="Properties" setSearchQuery={setSearchQuery} />
            <div className="grid grid-cols-5">
                {
                    properties?.map((property) => {
                        return (
                            <div key={property.publicKey.toBase58()} className="p-3 rounded-xl bg-white/5 space-y-4 transition-all delay-50 cursor-pointer" onClick={() => { setProperty(property); setOpen(true) }} >
                                <img
                                    //  src={property.account.thumbnailUri}
                                    src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                    alt="" className="w-md rounded-xl" />
                                <h5 className="font-bold text-xl">
                                    {property.account.name.split("-")[0]}
                                </h5>
                                {/* <span className="p-2 bg-green-800 text-green-200 " > */}
                                {/* <p className="text-sm font-semibold">Starting from</p> */}
                                {/* <p className="bg-green-900 text-green-200 p-2 rounded-xl flex gap-1 w-min">
                                    <Banknote />   {property.account.pricePerShares.toNumber()}
                                </p> */}
                                {/* </span> */}
                            </div>
                        )
                    })
                }
            </div>

            {/* <PropertyForm isOpen={isOpen} setIsOpen={setOpen} /> */}
            <PropertyDetails open={isOpen} property={property!} setOpen={setOpen} />

        </div>
    );
}