"use client"

import Error from '@/app/components/ui/layout/Error';
import Header from '@/app/components/ui/layout/Header';
import Loader from '@/app/components/ui/layout/Loader';
import PropertyDetails from '@/app/components/ui/modals/PropertyDetails';
import { useProgramActions } from '@/app/hooks/useProgramActions';
import { PropertyItem } from '@/app/types';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, MapPin, Users } from 'lucide-react';
import numeral from 'numeral';
import { useState } from 'react'

const page = () => {
    const { getMyListings } = useProgramActions()
    const DECIMALS = 1_000_000_000; // Standard Solana Decimals (9)
    const {
        data: properties,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: ["my-listings"],
        queryFn: async () => await getMyListings(),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });

    const [isOpen, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [property, setProperty] = useState<PropertyItem>()

    console.log(properties)
    return (
        <div className="space-y-4">
            {/* <button className="" onClick={() => setFormOpen(true)} >
                        Open
                    </button> */}
            <Header isFetching={isFetching} refetch={refetch} title="My Listings" setSearchQuery={setSearchQuery} />
            {isLoading || isFetching ? (
                <Loader />
            ) :
                isQueryError ? <Error refetch={refetch} /> :
                    properties?.length != 0 ?
                        <div className="grid grid-cols-5">
                            {
                                properties?.map((property) => {
                                    const rawPrice = parseInt(property.account.pricePerShares, 16);
                                    const normalizedSold = property.stats.sharesSold / DECIMALS;
                                    const totalRaised = normalizedSold * rawPrice;
                                    return (
                                        <div className="max-w-sm rounded-2xl space-y-3 overflow-hidden shadow-lg bg-white/5 p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                            onClick={() => { setProperty(property); setOpen(true) }}
                                        >
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
                                                    <span className="text-xs text-gray-300  tracking-wider"> Total Raised</span>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign size={23} className="text-emerald-400" />
                                                        <span className="text-xl font-bold text-white">{numeral(totalRaised).format('0.0a').toUpperCase()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ">
                                                    <span className="text-xs text-gray-300  tracking-wider"> Shares Sold</span>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={23} className="text-emerald-400" />
                                                        <span className="text-xl font-bold text-white"> {numeral(normalizedSold).format('0,0')}%</span>
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

            {/* <PropertyForm isOpen={isFormOpen} setIsOpen={setFormOpen} /> */}
            <PropertyDetails open={isOpen} property={property!} setOpen={setOpen} isShareHolder={false} isOwner={true} />

        </div>
    )
}

export default page