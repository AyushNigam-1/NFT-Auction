// "use client"

// import { useCallback, useState } from 'react'
// import { usePathname, useRouter } from 'next/navigation';
// import { Bell, Building, ChartNoAxesGanttIcon, History, Layers, PieChart, Ticket } from 'lucide-react';

// const Sidebar = () => {
//     const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
//     const router = useRouter();
//     const currentPage = usePathname();

//     const handleNavigate = useCallback((route: string) => {
//         router.push(route);
//         console.log("Navigating to:", route);
//         if (isSidebarOpen) {
//             setIsSidebarOpen(false);
//         }
//     }, [isSidebarOpen]);

//     const navOptions = [
//         {
//             icon: (<Building />),
//             text: "Properties", route: "/properties"
//         },
//         {
//             icon: (<Layers />
//             ), text: "Shares", route: "/shares"
//         },
//         // {
//         //     icon: (<Bell />),
//         //     text: "Notifications", route: "/user/notifications"
//         // },
//         // {
//         //     icon: (<History />),
//         //     text: "History", route: "/user/history"
//         // }
//     ];
//     return (
//         <aside
//             id="default-sidebar"
//             className={` z-40 w-64 h-screen transition-transform transform font-mono ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
//                 } sm:translate-x-0`}
//             aria-label="Sidebar"
//         >
//             <div className="h-full  overflow-y-auto bg-white/5">
//                 <div className="text-3xl font-extrabold  text-gray-900 dark:text-white p-4.5 border-b-2 border-b-white/5">
//                     YieldHome
//                 </div>
//                 <ul className="space-y-2 font-medium p-3">
//                     {navOptions.map((option, index) => (
//                         <li key={index}>
//                             <button className={`cursor-pointer font-semibold flex items-center gap-4 text-lg w-full  p-2   group ${currentPage === option.route ? " text-emerald-400" : "text-white "}`} onClick={() => handleNavigate(option.route)} >
//                                 {option.icon}
//                                 <span className=" whitespace-nowrap">{option.text}</span>
//                             </button>
//                         </li>
//                     ))}
//                 </ul>
//             </div>
//         </aside>
//     )
// }

// export default Sidebar

"use client"

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation';
import {
    Building,
    Layers,
    Store, // Icon for selling/listings
    LayoutDashboard
} from 'lucide-react';

const Sidebar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
    const router = useRouter();
    const currentPage = usePathname();

    const handleNavigate = useCallback((route: string) => {
        router.push(route);
        if (isSidebarOpen) {
            setIsSidebarOpen(false);
        }
    }, [isSidebarOpen, router]);

    const navOptions = [
        // --- BUYER / INVESTOR ACTIONS ---
        {
            icon: (<Building size={20} />),
            text: "Marketplace", // Renamed from 'Properties' to be clearer
            route: "/marketplace"
        },
        {
            icon: (<Layers size={20} />),
            text: "Portfolio", // Renamed from 'Shares' to sound more like a dashboard
            route: "/portfolio"
        },

        // --- SELLER / CREATOR ACTIONS ---
        // This is the new item for the seller's properties
        {
            icon: (<Store size={20} />),
            text: "My Listings",
            route: "/my-listings",
            divider: true // Optional flag if you want a visual gap
        },
    ];

    return (
        <aside
            id="default-sidebar"
            className={`z-40 w-64 h-screen transition-transform transform font-mono  bg-white/5 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } sm:translate-x-0`}
            aria-label="Sidebar"
        >
            <div className="h-full overflow-y-auto">
                {/* Brand Header */}
                <div className="flex items-center gap-3 p-5 border-b border-white/5">
                    {/* <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"> */}
                    {/* Logo Icon Placeholder */}
                    <LayoutDashboard size={24} />
                    {/* </div> */}
                    <span className="text-2xl font-extrabold text-white tracking-tight">
                        YieldHome
                    </span>
                </div>

                {/* Navigation Items */}
                <ul className="space-y-2 p-4">
                    {navOptions.map((option, index) => (
                        <li key={index}>
                            {/* Optional: Add a label or divider before the Seller section */}
                            {/* {option.divider && (
                                <div className='h-0.5 w-full bg-white/5 space-y-2' /> */}

                            {/* // <div className="text-[10px] uppercase font-bold text-gray-500 mt-6 mb-2 px-2">
                                //     Management
                                // </div> */}
                            {/* )} */}

                            <button
                                className={`
                                    cursor-pointer font-medium flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-200
                                    ${currentPage === option.route
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                        : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                                    }
                                `}
                                onClick={() => handleNavigate(option.route)}
                            >
                                {option.icon}
                                <span className="whitespace-nowrap">{option.text}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    )
}

export default Sidebar