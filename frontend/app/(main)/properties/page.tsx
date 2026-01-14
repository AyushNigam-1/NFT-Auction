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
import { Banknote, TrendingUp, Wallet } from "lucide-react";


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
            {/* <button className="" onClick={() => refetch()} >
                Open
            </button> */}
            <Header isFetching={isFetching} refetch={refetch} title="Properties" setSearchQuery={setSearchQuery} />
            <div className="grid grid-cols-5">
                {
                    properties?.map((property) => {
                        return (

                            <div className="max-w-sm rounded-2xl space-y-3 overflow-hidden shadow-lg bg-white/5 p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => { setProperty(property); setOpen(true) }}>

                                <img
                                    className="w-full  rounded-2xl"
                                    src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                //   alt={name} 
                                />

                                {/* 2. Name of the Property */}
                                <h3 className="text-xl font-bold text-gray-200 truncate">
                                    {property.account.name.split("-")[0]}
                                </h3>
                                {/* <h6 className=" text-gray-400 text-sm line-clamp-1">
                                    Lorem ipsum dolor sit amet Lorem ipsum dolor, sit amet consectetur adipisicing elit. Officiis voluptates minus id.
                                </h6> */}


                                <div className='h-0.5 w-full bg-white/10' />

                                {/* 3 & 4. Cost and Yield (Layout: Flex Row) */}
                                <div className="flex items-center gap-3 justify-between">
                                    <div className="flex flex-col gap-2 ">
                                        <span className="text-xs text-gray-300 uppercase tracking-wider"> Price / Share</span>
                                        <div className="flex items-center gap-2">
                                            <Banknote size={23} className="text-green-300" />
                                            <span className="text-xl font-bold text-white">$1K</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ">
                                        <span className="text-xs text-gray-300 uppercase tracking-wider"> Annual Yield</span>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={23} className="text-green-300" />
                                            <span className="text-xl font-bold text-white"> {property.account.yieldPercentage}%</span>
                                        </div>
                                    </div>
                                </div>
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