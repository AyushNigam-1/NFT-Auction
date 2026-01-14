import { PropertyItem } from "@/app/types";
import { fetchPropertyMetadata } from "@/app/utils/pinata";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query";
import { Banknote, Coins, CoinsIcon, Currency, File, Home, PieChart, TableProperties, TrendingUp, TrendingUpIcon, User, WalletIcon, WalletMinimal } from "lucide-react";
import React, { useState } from "react"
import BuySharesCalculator from "./BuySharesCalculator";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "./Loader";

const PropertyDetails = ({ open, setOpen, property }: { open: boolean, setOpen: (open: boolean) => void, property: PropertyItem }) => {
    const { deleteProperty, buyShares } = useMutations()
    const [percentage, setPercentage] = useState<number>(1);
    const [totalSol, setTotalSol] = useState<number>(0);

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
    const details = [
        { title: "User", value: `${property?.account.owner.toBase58().slice(0, 8)}...`, icon: (<User className="w-6 h-6 text-green-300" />) },
        { title: "Yield", value: metadata?.expected_yield, icon: (<TrendingUp className="w-6 h-6 text-green-300" />) },
        { title: "Token", value: metadata?.symbol, icon: (<Coins className="w-6 h-6 text-green-300" />) },
        { title: "Shares", value: "120", icon: (<PieChart className="w-6 h-6 text-green-300" />) },
        { title: "Worth", value: "1.2M", icon: (<Banknote className="w-6 h-6 text-green-300" />) },
        { title: "Rent", value: "120k", icon: (<WalletMinimal className="w-6 h-6 text-green-300" />) }
    ]
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
                            <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white/5 text-left align-middle shadow-2xl  transition-all font-inter text-white relative p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                {/* <div className="p-3 rounded-xl  space-y-4  transition-all delay-50 cursor-pointer"  > */}
                                <img
                                    //  src={property.account.thumbnailUri}
                                    src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                    alt="" className="w-full rounded-xl" />
                                <h5 className="font-bold text-2xl">
                                    {property?.account.name}
                                </h5>
                                <p className="text-gray-200 font-semibold">
                                    - {metadata?.address}
                                </p>
                                <p className="text-gray-300 ">
                                    {metadata?.description}
                                    {/* Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsum aliquam architecto, quia dolore libero perspiciatis, aperiam ut nobis temporibus natus fuga sit? Non maxime neque reprehenderit. Deserunt, quas dolorum quisquam tempore repellendus exercitationem quod tempora assumenda officia magnam nostrum? Tempora consequuntur molestiae placeat eligendi eos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Ducimus ad nisi sit. */}
                                </p>
                                <div className='h-0.5 w-full bg-white/5' />
                                <div className="grid grid-cols-2 gap-y-6 ">
                                    {
                                        details.map((detail) => {
                                            return (
                                                // <div className="flex gap-4  w-full items-center">
                                                //     <span className="p-4 bg-green-300/5 rounded-full text-green-300">
                                                //         {detail.icon}
                                                //     </span>
                                                //     <div className="space-y-1">
                                                //         <p className="text-gray-300 text-sm" >{detail.title} </p>
                                                //         <h6 className="font-semibold text-lg">{detail.value}</h6>
                                                //     </div>
                                                // </div>
                                                <div className="flex flex-col gap-2 ">
                                                    <span className="text-xs text-gray-300 uppercase tracking-wider">{detail.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        {/* <TrendingUpIcon className="w-6 h-6 text-green-300" /> */}
                                                        {detail.icon}
                                                        <span className="text-xl font-bold text-white">{detail.value}</span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                {/* Replace your current grid of 6 boxes with this */}

                                {/* </div> */}
                                <div className='h-0.5 w-full bg-white/5' />
                                {/* <div className="flex gap-2 w-full">
                                    <span className="p-2 bg-green-300/5 rounded-full text-green-300">
                                        <File size={15} />
                                    </span>
                                    <p className="text-gray-100 text-lg font-semibold" >Documents </p>
                                </div> */}
                                <div className="flex gap-2 w-full items-center">
                                    {/* <span className="p-2 bg-green-300/5 rounded-full text-green-300"> */}
                                    <TableProperties className="w-4 h-4 text-green-300" />
                                    {/* </span> */}
                                    <p className="text-gray-100 text-lg font-semibold" >Traits </p>
                                </div>
                                {/* <div className="rounded-xl overflow-hidden border-2 border-white/5 divide-y-2 divide-white/5"> */}
                                {/* {metadata?.attributes.map((att, index) => {
                                        return (
                                            <div key={index} className="flex divide-x-2 divide-white/5">
                                                <span className="w-1/2 p-3 text-gray-300 ">
                                                    {att.trait_type}
                                                </span>

                                                <span className="w-1/2 p-3 font-semibold text-lg">
                                                    {att.value}
                                                </span>
                                            </div>
                                        );
                                    })} */}
                                <div className="flex gap-6 mt-4 mb-6">
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Bedrooms:</span>
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Area:</span>
                                        <span className="text-white font-bold">950 sqft</span>
                                    </div>
                                </div>
                                {/* </div> */}
                                <div className='h-0.5 w-full bg-white/5' />

                                <BuySharesCalculator percentage={percentage} setPercentage={setPercentage} totalValueInr={metadata?.total_value_inr.toString()!} totalShares={100000} setTotalSol={setTotalSol} totalSol={totalSol} />
                                <button onClick={() => {
                                    buyShares.mutate({ mintAddress: property.account.mint, owner: property.account.owner, propertyPubkey: property.publicKey, shares: percentage, paidSol: totalSol })
                                }} className="w-full  py-4 bg-green-300/50 text-white font-bold text-lg rounded-xl shadow-lg">
                                    {buyShares.isPending ? <Loader /> : ""}

                                    Buy Now
                                </button>
                                {/* <div onClick={() => deleteProperty.mutate(property.account.mint)} >
                                    Delete
                                </div> */}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition >

    )
}

export default PropertyDetails