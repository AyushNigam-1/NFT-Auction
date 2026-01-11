import { PropertyItem } from "@/app/types";
import { fetchPropertyMetadata } from "@/app/utils/pinata";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query";
import { Banknote, Coins, CoinsIcon, Currency, File, Home, PieChart, TrendingUp, User } from "lucide-react";
import React from "react"
import BuySharesCalculator from "./BuySharesCalculator";
import { useMutations } from "@/app/hooks/useMutations";

const PropertyDetails = ({ open, setOpen, property }: { open: boolean, setOpen: (open: boolean) => void, property: PropertyItem }) => {
    const { deleteProperty } = useMutations()

    const {
        data: metadata,
        isLoading,
        isFetching,
        isError: isQueryError,
        refetch,
    } = useQuery({
        queryKey: ["property", property?.account?.metadataUri],
        queryFn: async () => await fetchPropertyMetadata(property.account.metadataUri),
        staleTime: 1000 * 60, // 1 min cache (tweak if needed)
        enabled: !!property
    });

    console.log("metadata property", metadata)

    // if (!property) return null
    return (

        <Transition show={open} appear={true} as={React.Fragment}>
            <Dialog as="div" className="relative z-50 font-mono" onClose={() => setOpen(false)}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-90 -translate-y-12"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-90 translate-y-12"
                        >
                            <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white/5 text-left align-middle shadow-2xl  transition-all font-inter text-white relative p-6 space-y-6 max-h-[90vh] overflow-y-auto">
                                {/* <div className="p-3 rounded-xl  space-y-4  transition-all delay-50 cursor-pointer"  > */}
                                <img
                                    //  src={property.account.thumbnailUri}
                                    src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                    alt="" className="w-full rounded-xl" />
                                <h5 className="font-bold text-2xl">
                                    {property?.account.name}
                                </h5>
                                <p className="text-gray-300">
                                    {property?.account.shortDescription} Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum aliquam architecto, quia dolore libero perspiciatis, aperiam ut nobis temporibus natus fuga sit? Non maxime neque reprehenderit. Deserunt, quas dolorum quisquam tempore repellendus exercitationem quod tempora assumenda officia magnam nostrum? Tempora consequuntur molestiae placeat eligendi eos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus ad nisi sit.
                                </p>
                                <div className='h-0.5 w-full bg-white/5' />
                                <div className="grid grid-cols-2 gap-6">

                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <User size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >User </p>
                                            <h6 className="font-semibold text-lg">{property?.account.owner.toBase58().slice(0, 8)}...</h6>
                                        </div>
                                    </div>

                                    {/* <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <Home size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Address</p>
                                            <h6 className="font-semibold text-lg">{metadata?.address}</h6>
                                        </div>
                                    </div> */}
                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <Banknote size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Worth </p>
                                            <h6 className="font-semibold text-lg">{metadata?.total_value_inr}</h6>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <TrendingUp size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Yield </p>
                                            <h6 className="font-semibold text-lg">{metadata?.expected_yield}</h6>
                                        </div>
                                    </div>


                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <CoinsIcon size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Token </p>
                                            <h6 className="font-semibold text-lg">{metadata?.symbol}</h6>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <File size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Documents </p>
                                            <h6 className="font-semibold text-lg">{metadata?.legal_documents.length}</h6>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                            <PieChart size={25} />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-gray-300" >Shares </p>
                                            <h6 className="font-semibold text-lg">{metadata?.legal_documents.length}</h6>
                                        </div>
                                    </div>


                                </div>
                                <div>
                                    {metadata?.attributes.map((att) => {
                                        return (
                                            <div className="flex">
                                                <span className="border border-white/5 w-full p-3 text-gray-300">
                                                    {att.trait_type}
                                                </span>
                                                <span className="border border-white/5 w-full p-3 font-semibold text-lg">
                                                    {att.value}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className='h-0.5 w-full bg-white/5' />

                                <BuySharesCalculator totalValueInr={metadata?.total_value_inr} totalShares={100000} />
                                <div onClick={() => deleteProperty.mutate(property.account.mint)} >
                                    Delete
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>

    )
}

export default PropertyDetails