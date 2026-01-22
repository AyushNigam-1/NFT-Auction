"use client"

import Error from '@/app/components/ui/layout/Error';
import Header from '@/app/components/ui/layout/Header';
import Loader from '@/app/components/ui/layout/Loader';
import PropertyDetails from '@/app/components/ui/modals/PropertyDetails';
import { useMutations } from '@/app/hooks/useMutations';
import { useProgramActions } from '@/app/hooks/useProgramActions';
import { ShareDetails } from '@/app/types';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Layers, MapPin } from 'lucide-react';
import { useState } from 'react';

const page = () => {

    const { getAllShares } = useProgramActions()
    const { cancelShares } = useMutations()
    const [searchQuery, setSearchQuery] = useState<string | null>("")
    const [open, setOpen] = useState<boolean>(false)
    const [data, setData] = useState<ShareDetails>()
    const [share, setShare] = useState<any>()

    const {
        data: shares,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: ["shares"],
        queryFn: async () => await getAllShares(),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
    });
    console.log("shares", shares)

    return (
        <div className='space-y-4'>
            <Header isFetching={isFetching} refetch={refetch} title="Portfolio" setSearchQuery={setSearchQuery} />

            {isLoading || isFetching ? (
                <Loader />
            ) :
                isQueryError ? <Error refetch={refetch} /> :
                    shares?.length != 0 ?
                        <div className="grid grid-cols-5"> {
                            shares?.map((share: any) => {
                                return (
                                    <div className="max-w-sm rounded-2xl space-y-3 overflow-hidden shadow-lg bg-white/5 p-3 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                        onClick={() => { setShare(share); setOpen(true) }}
                                    >
                                        <img
                                            className="w-full  rounded-2xl"
                                            src={`https://gold-endless-fly-679.mypinata.cloud/ipfs/${share.property?.account.thumbnailUri}`}
                                        />
                                        <h3 className="text-xl font-bold truncate">
                                            {share.property?.account.name.split("-")[0]}
                                        </h3>
                                        <div className="flex gap-2 items-center">
                                            <MapPin className="w-7 text-green-400 " />
                                            <h3 className="text-sm font-semibold text-gray-300 line-clamp-1">
                                                {share.property?.account.address}
                                            </h3>
                                        </div>
                                        {/* <button
                                            onClick={() => cancelShares.mutate(
                                                share.shares.publicKey)}
                                            disabled={cancelShares.isPending}
                                        >
                                            {cancelShares.isPending ? "Cancelling..." : "Cancel Shares"}
                                        </button> */}
                                        <div className='h-0.5 w-full bg-white/10' />
                                        <div className="flex items-center gap-3 justify-between">
                                            <div className="flex flex-col gap-2 ">
                                                <span className="text-xs text-gray-300  tracking-wider"> Your Shares</span>
                                                <div className="flex items-center gap-2">
                                                    <Layers className="text-emerald-400 w-6" />
                                                    <span className="text-xl font-bold text-white">{share?.shares.account.sharesPercentage?.toString()}%</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 ">
                                                <span className="text-xs text-gray-300  tracking-wider"> Monthly Rent</span>
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="text-emerald-400 w-6" />
                                                    <span className="text-xl font-bold text-white">${share?.shares.account.monthlyRent.toString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        :
                        !searchQuery && <p className='text-center col-span-4 text-gray-400 text-2xl'>No shares found.</p>
            }
            {shares?.length === 0 && searchQuery && (
                <div className="lg:col-span-4 p-8 rounded-xl text-center text-gray-400">
                    <p className="text-2xl font-medium font-mono">No Plans found matching "{searchQuery}"</p>
                </div>
            )}
            <PropertyDetails open={open} property={share?.property!} setOpen={setOpen} isShareHolder={true} shareHolder={share?.shares} />
        </div >
    )
}

export default page