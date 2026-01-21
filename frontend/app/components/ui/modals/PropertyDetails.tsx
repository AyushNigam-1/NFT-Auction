import { PropertyItem } from "@/app/types";
import { fetchPropertyMetadata } from "@/app/utils/pinata";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react"
import { useQuery } from "@tanstack/react-query";
import { Banknote, Coins, Currency, File, FileText, Home, Layers, MapPin, PieChart, Pointer, ShoppingCart, TableProperties, TrendingUp, User, WalletMinimal } from "lucide-react";
import React, { useState } from "react"
import BuySharesCalculator from "../BuySharesCalculator";
import { useMutations } from "@/app/hooks/useMutations";
import Loader from "../layout/Loader";
import ImageCarousel from "../ImageCarousel";
import numeral from "numeral";
import ShareHolderView from "../ShareHolderView";
import DepositRentModal from "./DepositRent";

const PropertyDetails = ({ open, setOpen, property, isShareHolder, shareHolder, isOwner }: { open: boolean, setOpen: (open: boolean) => void, property: PropertyItem, isShareHolder: boolean, shareHolder?: any, isOwner?: boolean }) => {

    const { deleteProperty, buyShares } = useMutations()
    const [percentage, setPercentage] = useState<number>(1);
    const [totalSol, setTotalSol] = useState<number>(0);
    const [sharesAmount, setSharesAmount] = useState<number>(0)
    const [monthlyRent, setMonthlyRent] = useState<number>(0)
    const [isDepositModalOpen, setDepositModalOpen] = useState(false);

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

    // console.log("metadata property", metadata)
    const propertyDetails = [
        { title: "User", value: `${property?.account.owner.toBase58().slice(0, 4)}...`, icon: (<User className="w-6 h-6 text-emerald-400" />) },
        { title: "Yield", value: `${property?.account.yieldPercentage}%`, icon: (<TrendingUp className="w-6 h-6 text-emerald-400" />) },
        { title: "Token", value: metadata?.symbol, icon: (<Coins className="w-6 h-6 text-emerald-400" />) },
        { title: "Shares", value: `${numeral(metadata?.total_share).format("0a").toUpperCase()}`, icon: (<Layers className="w-6 h-6 text-emerald-400" />) },
        { title: "Worth", value: `$${numeral(metadata?.total_value).format("0a").toUpperCase()}`, icon: (<Banknote className="w-6 h-6 text-emerald-400" />) },
        { title: "Rent", value: `$${numeral(metadata?.rent).format("0a").toUpperCase()}/M`, icon: (<WalletMinimal className="w-6 h-6 text-emerald-400" />) }
    ]
    const sharesDetails = [
        { title: "Shares", value: `${shareHolder?.account.sharesPercentage?.toString()}%`, icon: (<Layers className="w-6 h-6 text-emerald-400" />) },
        { title: " Rent", value: `$${shareHolder?.account.monthlyRent.toString()}/M`, icon: (<Banknote className="w-6 h-6 text-emerald-400" />) },
        // { title: "Token", value: metadata?.symbol, icon: (<Coins className="w-6 h-6 text-emerald-400" />) },
        // { title: "Shares", value: "100", icon: (<Layers className="w-6 h-6 text-emerald-400" />) },
        // { title: "Worth", value: `$${numeral(metadata?.total_value).format("0a").toUpperCase()}`, icon: (<Banknote className="w-6 h-6 text-emerald-400" />) },
        // { title: "Rent", value: `$${numeral(metadata?.rent).format("0a").toUpperCase()}`, icon: (<WalletMinimal className="w-6 h-6 text-emerald-400" />) }
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
                            <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-white/5 text-left align-middle shadow-2xl  transition-all font-inter text-white relative p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                                {/* <div className="p-3 rounded-xl  space-y-4  transition-all delay-50 cursor-pointer"  > */}
                                {/* <img
                                    src={` ${property.account.thumbnailUri}`}
                                    // src="https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?cs=srgb&dl=pexels-marketingtuig-87223.jpg&fm=jpg"
                                    alt="" className="w-full rounded-xl" /> */}
                                <ImageCarousel images={metadata?.images as unknown as string[]} />
                                <h5 className="font-bold text-2xl">
                                    {property?.account.name}
                                </h5>
                                <div className="flex items-center gap-2 text-gray-300 ">
                                    <MapPin className="w-4.5 text-emerald-400" />
                                    <span className="text-gray-200 font-semibold">  {property?.account.address}
                                    </span>
                                </div>
                                <p className="text-gray-300 ">
                                    {metadata?.description}
                                </p>
                                <div className='h-0.5 w-full bg-white/5' />
                                <div className="grid grid-cols-2 gap-y-6">
                                    {
                                        propertyDetails.map((detail) => {
                                            return (
                                                <div className="flex flex-col gap-3 ">
                                                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold ">{detail.title}</span>
                                                    <div className="flex items-center gap-3">
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
                                    <File className="w-4 text-emerald-400" />
                                    <p className="text-gray-100 text-lg font-semibold" >Documents </p>
                                </div>
                                <div className="flex gap-6">
                                    {metadata?.legal_documents?.map((doc, index) => {
                                        // const isPdf = doc.type.includes("pdf");
                                        return (
                                            <div
                                                onClick={() => window.open("doc.cid", "_blank")}
                                                className="group flex items-center gap-3 bg-white/5  hover:bg-white/10 hover:border-green-500/30 transition-all rounded-lg p-4 cursor-pointer w-full md:w-auto"
                                            >
                                                {/* <div className={`p-2 rounded-md bg text-emerald-400 group-hover:scale-110 transition-transform`}> */}
                                                <FileText className="w-6 text-emerald-400" />
                                                {/* </div> */}
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className=" font-semibold text-gray-200 truncate max-w-35">
                                                        {doc.name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-200 font-mono uppercase tracking-wider">
                                                        {doc.name.split('.').pop()?.toUpperCase() || "FILE"}
                                                    </span>
                                                </div>
                                                {/* <Download className="w-4 h-4 text-emerald-400 ml-auto" /> */}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex gap-2 w-full items-center">
                                    <TableProperties className="w-4 h-4 text-emerald-400" />
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
                                    <div className="flex items-center gap-2 bg-white/5 pinrx-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Bedrooms:</span>
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-lg">
                                        <span className="text-gray-400 text-sm">Area:</span>
                                        <span className="text-white font-bold">950 sqft</span>
                                    </div>
                                </div> */}
                                {/* </div> */}
                                {(isShareHolder && shareHolder) ?
                                    <ShareHolderView ShareDetails={sharesDetails} />
                                    : isOwner ? <>
                                        <button onClick={() => setDepositModalOpen(true)
                                            // buyShares.mutate({ mintAddress: property.account.mint, monthlyRent, owner: property.account.owner, propertyPubkey: property.publicKey, shares: percentage, paidSol: totalSol })
                                        } className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-lg transition-all bg-emerald-500 text-gray-900 cursor-pointer hover:bg-emerald-600">
                                            {buyShares.isPending ? <Loader /> : <Coins size={20} />}
                                            Distribute Rent
                                        </button>
                                    </> :
                                        <div className="space-y-5">
                                            <BuySharesCalculator setSharesAmount={setSharesAmount} percentage={percentage} setPercentage={setPercentage} totalValueUsd={metadata?.total_value.toString()!} totalShares={metadata?.total_share!} setTotalSol={setTotalSol} totalRentUsd={metadata?.rent!} setMonthlyRent={setMonthlyRent} />
                                            <div className='h-0.5 w-full bg-white/5' />

                                            <button onClick={() => {
                                                buyShares.mutate({ mintAddress: property.account.mint, monthlyRent, owner: property.account.owner, propertyPubkey: property.publicKey, shares: percentage, paidSol: totalSol })
                                            }} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-lg transition-all bg-emerald-500 text-gray-900 cursor-pointer hover:bg-emerald-600">
                                                {buyShares.isPending ? <Loader /> : <ShoppingCart />}
                                                Buy Now
                                            </button>
                                        </div>}
                                {/* <button onClick={() => deleteProperty.mutate(property.account.mint)} disabled={deleteProperty.isPending}  >
                                    Delete
                                </button> */}
                            </DialogPanel>
                        </TransitionChild>
                        <DepositRentModal
                            open={isDepositModalOpen}
                            setOpen={setDepositModalOpen}
                            fixedRent={shareHolder?.account.monthlyRent.toString()} // Pass the fixed amount from property data
                            totalShares={metadata?.total_share!} // Pass the sold shares count
                            onConfirm={(amount) => {
                                console.log("Distributing:", amount);
                                // Call your Solana program instructions here
                                setDepositModalOpen(false);
                            }}
                        />
                    </div>
                </div>
            </Dialog>
        </Transition >

    )
}

export default PropertyDetails