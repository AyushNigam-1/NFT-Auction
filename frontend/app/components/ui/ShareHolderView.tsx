import { Banknote, Calendar, Layers, Pointer } from 'lucide-react'
import React from 'react'

const ShareHolderView = (sharesDetails: any) => {
    return (
        <div>
            <div className="space-y-5">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 w-full items-center">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <p className="text-gray-100 text-lg font-semibold">Your Shares</p>
                    </div>
                    {/* <p className="text-sm text-gray-200 text-nowrap">Total:  Share</p> */}
                </div>
                <div className="grid grid-cols-2 gap-y-6">
                    {
                        sharesDetails.map((detail: any) => {
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
                <table className="w-full table-fixed text-sm text-left rtl:text-right text-body">
                    <thead className="text-sm text-body">
                        {/* 1. Added <tr> wrapper - This is the "Horizontal" container */}
                        <tr>
                            {/* 2. Removed flex from <th> to allow table-fixed to work */}
                            <th className="px-6 py-4.5 font-bold text-lg bg-white/5 rounded-tl-2xl">
                                {/* 3. Wrap content in a flex div for alignment */}
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-5" />
                                    <span>Date</span>
                                </div>
                            </th>

                            <th className="px-6 py-4.5 font-bold text-lg bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Banknote className="w-5" />
                                    <span>Rent</span>
                                </div>
                            </th>

                            <th className="px-6 py-4.5 font-bold text-lg bg-white/5 rounded-tr-2xl">
                                <div className="flex items-center gap-2">
                                    <Pointer className="w-5" />
                                    <span>Action</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
    )
}

export default ShareHolderView