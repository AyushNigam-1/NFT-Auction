"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "@/app/components/ui/layout/Header";
import { useQuery } from "@tanstack/react-query";
import { useProgramActions } from "@/app/hooks/useProgramActions";
import PropertyForm from "@/app/components/ui/modals/PropertyForm";
import { PropertyItem } from "@/app/types";
import { Banknote, MapPin, TrendingUp } from "lucide-react";
import PropertyDetails from "@/app/components/ui/modals/PropertyDetails";
import numeral from 'numeral';
import Loader from "@/app/components/ui/layout/Loader";
import Error from "@/app/components/ui/layout/Error";

export default function page() {

    const wallet = useWallet();
    const { getAllProperties } = useProgramActions()
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [isOpen, setOpen] = useState(false)
    const [isFormOpen, setFormOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [property, setProperty] = useState<PropertyItem>()

    const {
        data: properties,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: ["properties"],
        queryFn: async () => await getAllProperties(),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });

    // console.log("subscribers", properties)

    return (
        <div className="space-y-4">
            {/* <button className="" onClick={() => setFormOpen(true)} >
                Open
            </button> */}
            <Header isFetching={isFetching} refetch={refetch} title="Marketplace" setSearchQuery={setSearchQuery} />
            {isLoading || isFetching ? (
                <Loader />
            ) :
                isQueryError ? <Error refetch={refetch} /> :
                    properties?.length != 0 ?
                        <div className="grid grid-cols-5">
                            {
                                properties?.map((property) => {
                                    return (
                                        <div className="max-w-sm rounded-2xl space-y-3 overflow-hidden shadow-lg bg-white/5 p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => { setProperty(property); setOpen(true) }}>
                                            <img
                                                className="w-full  rounded-2xl"
                                                src={`https://gold-endless-fly-679.mypinata.cloud/ipfs/${property?.account?.thumbnailUri}`}
                                            />
                                            <h3 className="text-xl font-bold truncate">
                                                {property?.account?.name.split("-")[0]}
                                            </h3>
                                            <div className="flex gap-2 items-center">
                                                <MapPin className="w-7 text-green-400 " />
                                                <h3 className="text-sm font-semibold text-gray-300 line-clamp-1">
                                                    {property?.account?.address}
                                                </h3>
                                            </div>
                                            <div className='h-0.5 w-full bg-white/10' />
                                            <div className="flex items-center gap-3 justify-between">
                                                <div className="flex flex-col gap-2 ">
                                                    <span className="text-xs text-gray-300  tracking-wider"> Price / Share</span>
                                                    <div className="flex items-center gap-2">
                                                        <Banknote size={23} className="text-emerald-400" />
                                                        <span className="text-xl font-bold text-white">${numeral(property?.account?.pricePerShares.toString()).format('0a').toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ">
                                                    <span className="text-xs text-gray-300  tracking-wider"> Annual Yield</span>
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp size={23} className="text-emerald-400" />
                                                        <span className="text-xl font-bold text-white"> {property?.account?.yieldPercentage}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        :
                        !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl'>No properties found.</p>
            }
            {properties?.length === 0 && searchQuery && (
                <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
                    <p className="text-2xl font-medium font-mono">No Plans found matching "{searchQuery}"</p>
                </div>
            )}

            <PropertyForm isOpen={isFormOpen} setIsOpen={setFormOpen} />
            <PropertyDetails open={isOpen} property={property!} setOpen={setOpen} isShareHolder={false} />

        </div>
    );
}