import { PropertyItem } from "@/app/types";
import { fetchPropertyMetadata } from "@/app/utils/pinata";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query";
import { Banknote, Coins, CoinsIcon, Currency, Download, File, FileText, Home, PieChart, TableProperties, TrendingUp, TrendingUpIcon, User, WalletIcon, WalletMinimal } from "lucide-react";
import React, { useState } from "react"
import BuySharesCalculator from "./BuySharesCalculator";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "./Loader";
import ImageCarousel from "./ImageCarousel";
import numeral from "numeral";

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
        staleTime: 1000 * 40, // 1 min cache (tweak if needed)
        enabled: !!property
    });

    console.log("metadata property", metadata)
    const details = [
        { title: "User", value: `${property?.account.owner.toBase58().slice(0, 4)}...`, icon: (<User className="w-6 h-6 text-green-300" />) },
        { title: "Yield", value: `${property?.account.yieldPercentage}%`, icon: (<TrendingUp className="w-6 h-6 text-green-300" />) },
        { title: "Token", value: metadata?.symbol, icon: (<Coins className="w-6 h-6 text-green-300" />) },
        { title: "Shares", value: "100", icon: (<PieChart className="w-6 h-6 text-green-300" />) },
        { title: "Worth", value: numeral(metadata?.total_value).format("0a").toUpperCase(), icon: (<Banknote className="w-6 h-6 text-green-300" />) },
        { title: "Rent", value: numeral(metadata?.rent).format("0a").toUpperCase(), icon: (<WalletMinimal className="w-6 h-6 text-green-300" />) }
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
                                {/* <img
                                    src={` ${property.account.thumbnailUri}`}
                                    // src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                    alt="" className="w-full rounded-xl" /> */}
                                <ImageCarousel images={metadata?.images as unknown as string[]} />
                                <h5 className="font-bold text-2xl">
                                    {property?.account.name}
                                </h5>
                                <p className="text-gray-200 font-semibold">
                                    - {property?.account.address}
                                </p>
                                <p className="text-gray-300 ">
                                    {metadata?.description}
                                </p>
                                <div className='h-0.5 w-full bg-white/5' />
                                <div className="grid grid-cols-2 gap-y-6 ">
                                    {
                                        details.map((detail) => {
                                            return (
                                                <div className="flex flex-col gap-2 ">
                                                    <span className="text-xs text-gray-300 uppercase tracking-wider">{detail.title}</span>
                                                    <div className="flex items-center gap-2">
                                                        {detail.icon}
                                                        <span className="text-xl font-bold text-white">{detail.value}</span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>
                                {/* </div> */}
                                <div className='h-0.5 w-full bg-white/5' />
                                <div className="flex gap-2 w-full items-center">
                                    <File className="w-4 h-4 text-green-300" />
                                    <p className="text-gray-100 text-lg font-semibold" >Documents </p>
                                </div>
                                <div className="flex gap-6">
                                    {metadata?.legal_documents?.map((doc, index) => {
                                        const isPdf = doc.type.includes("pdf");
                                        return (
                                            <div
                                                onClick={() => window.open("doc.cid", "_blank")}
                                                className="group flex items-center gap-3 bg-white/5  hover:bg-white/10 hover:border-green-500/30 transition-all rounded-lg p-4 cursor-pointer w-full md:w-auto"
                                            >
                                                {/* <div className={`p-2 rounded-md bg text-green-300 group-hover:scale-110 transition-transform`}> */}
                                                <FileText className="w-6 text-green-300" />
                                                {/* </div> */}
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className=" font-semibold text-gray-200 truncate max-w-35">
                                                        {doc.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-200 font-mono uppercase tracking-wider">
                                                        {doc.name.split('.').pop()?.toUpperCase() || "FILE"}
                                                    </span>
                                                </div>
                                                {/* <Download className="w-4 h-4 text-green-300 ml-auto" /> */}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-2 w-full items-center">
                                    <TableProperties className="w-4 h-4 text-green-300" />
                                    <p className="text-gray-100 text-lg font-semibold" >Traits </p>
                                </div>
                                {/* <div className="rounded-xl overflow-hidden border-2 border-white/5 divide-y-2 divide-white/5"> */}
                                <div className="flex gap-6">
                                    {metadata?.attributes.map((att, index) => {
                                        return (
                                            <div key={index} className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                                <span className="text-gray-400 text-sm">                                                    {att.trait_type}
                                                    :</span>
                                                <span className="text-white font-bold">                                                    {att.value}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* <div className="flex gap-6 mt-4 mb-6">
                                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Bedrooms:</span>
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Area:</span>
                                        <span className="text-white font-bold">950 sqft</span>
                                    </div>
                                </div> */}
                                {/* </div> */}
                                <div className='h-0.5 w-full bg-white/5' />

                                <BuySharesCalculator percentage={percentage} setPercentage={setPercentage} totalValueInr={metadata?.total_value.toString()!} totalShares={100000} setTotalSol={setTotalSol} totalSol={totalSol} />
                                <button onClick={() => {
                                    buyShares.mutate({ mintAddress: property.account.mint, owner: property.account.owner, propertyPubkey: property.publicKey, shares: percentage, paidSol: totalSol })
                                }} className="w-full  py-4 bg-green-300/50 text-white font-bold text-lg rounded-xl shadow-lg">
                                    {buyShares.isPending ? <Loader /> : ""}

                                    Buy Now
                                </button>
                                <button onClick={() => deleteProperty.mutate(property.account.mint)} disabled={deleteProperty.isPending}  >
                                    Delete
                                </button>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition >

    )
}

export default PropertyDetails