"use client"

import Error from '@/app/components/ui/layout/Error';
import Header from '@/app/components/ui/layout/Header';
import Loader from '@/app/components/ui/layout/Loader';
import PropertyDetails from '@/app/components/ui/modals/PropertyDetails';
import PropertyForm from '@/app/components/ui/modals/PropertyForm';
import { useProgramActions } from '@/app/hooks/useProgramActions';
import { PropertyItem } from '@/app/types';
import { useQuery } from '@tanstack/react-query';
import { Building2, DollarSign, Layers, MapPin, Plus } from 'lucide-react';
import numeral from 'numeral';
import { useState } from 'react'

const page = () => {
    const { getMyListings } = useProgramActions()
    const DECIMALS = 1_000_000_000; // Standard Solana Decimals (9)
    const {
        data: properties,
        isLoading,
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["my-listings"],
        queryFn: async () => await getMyListings(),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });

    const [isOpen, setOpen] = useState(false)
    const [isFormOpen, setFormOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [property, setProperty] = useState<PropertyItem>()

    if (isLoading || isFetching) return <div className="flex h-[96vh]  flex-col items-center justify-center text-center "><Loader /></div>

    if (isError) return <Error refetch={refetch} />

    if (properties?.length == 0) return !searchQuery && <div className="flex h-[96vh]  flex-col items-center justify-center text-center space-y-4">
        <Building2 className="w-10 h-10 text-emerald-400" />
        <h2 className="text-2xl font-bold text-white">No Listings Yet</h2>
        <p className="text-gray-400 max-w-md">
            You haven't listed any properties yet. Start your journey by tokenizing your first real estate asset.
        </p>
        <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/20"
        >
            <Plus size={20} />
            Create New Listing
        </button>
        <PropertyForm isOpen={isFormOpen} setIsOpen={setFormOpen} />
    </div>

    return (
        <div className="space-y-4">
            <div className='gap-4 flex w-full '>
                <div className='flex justify-between items-center w-full' >
                    <h2 className='text-2xl font-bold'>My Listings</h2>
                    <div className='flex gap-3'>
                        {
                            setSearchQuery && <div className="relative ">
                                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none ">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-gray-200">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                                <input type="text" id="simple-search" className="bg-white/5  text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 " placeholder={`Search`} required onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        }
                        <button
                            onClick={() => setFormOpen(true)}
                            className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold transition-all"
                        >
                            <Plus size={20} />
                            New
                        </button>

                    </div>
                </div>

            </div>
            <div className='h-0.5 w-full bg-white/5' />
            {

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
                                                <Layers size={23} className="text-emerald-400" />
                                                <span className="text-xl font-bold text-white"> {numeral(normalizedSold).format('0,0')}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>


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