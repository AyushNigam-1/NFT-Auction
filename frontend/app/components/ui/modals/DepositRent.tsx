"use client"

import { Fragment, useState, useEffect } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import { X, AlertCircle, CheckCircle, Wallet, Layers, Percent, Coins } from 'lucide-react'
import numeral from 'numeral'
import InputGroup from '../Input' // Assuming this is your existing component
import { useQuery } from '@tanstack/react-query'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMutations } from '@/app/hooks/useMutations'
import Loader from '../layout/Loader'

interface DepositRentModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    fixedRent: number;
    totalShares: number;
    onConfirm: (amount: number, memo: string, period: string) => void;
}

export default function DepositRentModal({
    open,
    setOpen,
    fixedRent,
    totalShares,
    onConfirm
}: DepositRentModalProps) {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    // 1. State for Amount, Memo, and Period
    const [walletBalance, setWalletBalance] = useState<number>(0)
    const [amount, setAmount] = useState<number>(Number(fixedRent?.toString()));
    const [memo, setMemo] = useState<string>("");

    // Default to current month, e.g., "2026-02"
    const currentMonth = new Date().toISOString().slice(0, 7);
    const [period, setPeriod] = useState<string>(currentMonth);
    const { depositRent } = useMutations()
    // 2. Calculations
    const numericAmount = amount || 0;
    const perShare = totalShares > 0 ? numericAmount / totalShares : 0;
    const isBalanceLow = numericAmount > walletBalance;
    const isUnderpayment = numericAmount < fixedRent;
    // Reset when opening
    useEffect(() => {
        if (open) {
            setAmount(Number(fixedRent?.toString()));
            setMemo("");
        }
    }, [open, fixedRent])

    const {
        data: balance,
        // isLoading,
        // isFetching,
        // isError: isQueryError,
        // refetch,
    } = useQuery({
        queryKey: ['sol-balance', publicKey?.toBase58()],
        queryFn: async () => {
            if (!publicKey) return 0;
            try {
                const balance = await connection.getBalance(publicKey);
                setWalletBalance(balance / LAMPORTS_PER_SOL)
                return balance / LAMPORTS_PER_SOL;
            } catch (error) {
                console.error("Failed to fetch balance:", error);
                return 0;
            }
        },
        enabled: !!publicKey,
        refetchInterval: 10000
    });
    return (
        <Transition show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={setOpen}>
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-xl transform overflow-hidden rounded-xl bg-white/5 text-left align-middle shadow-2xl transition-all font-mono text-white relative p-6  space-y-6">

                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 font-bold text-xl">
                                        Distribute Rent
                                    </div>
                                    <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className='h-0.5 w-full bg-white/5' />

                                <div className="space-y-2">
                                    <div className="flex justify-between items-end px-1 text-sm">
                                        <label className=" font-semibold text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </label>
                                        <div className={`flex items-center font-semibold gap-2 ${isBalanceLow ? "text-red-400" : "text-emerald-400"}`}>
                                            Bal:    {numeral(walletBalance).format('0,0.00')} SOL
                                        </div>
                                    </div>
                                    {/* Using your custom InputGroup logic, or standard input for control */}
                                    <InputGroup
                                        label=""
                                        name="name"
                                        type='number'
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        placeholder="0.00"
                                    />

                                    {isUnderpayment && (
                                        <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>Note: Amount is lower than fixed rent (${fixedRent}).</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center ">
                                        <span className="text-gray-300 flex items-center gap-2">
                                            <Layers size={16} className='text-emerald-300' /> Total Eligible Shares
                                        </span>
                                        <span className="text-white font-bold">{numeral(totalShares).format('0,0')}</span>
                                    </div>

                                    <div className="h-px w-full bg-white/10" />

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Percent size={16} className="text-emerald-300" />
                                            <div className='flex flex-col'>
                                                <span className="text-gray-300 font-medium">
                                                    Investor Dividend
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className=" font-bold text-emerald-400 tracking-tight">
                                                $ {numeral(perShare).format('0,0.00')}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => depositRent.mutate(amount)}
                                    disabled={numericAmount <= 0 || isBalanceLow}
                                    className="w-full group relative flex items-center justify-center gap-2 p-4 rounded-xl font-bold text-lg transition-all bg-emerald-500 text-gray-900 cursor-pointer hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {depositRent.isPending ? <Loader /> : <CheckCircle size={20} />}
                                        {isBalanceLow ? "Insufficient Balance" : "Confirm"}
                                    </span>
                                </button>


                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}