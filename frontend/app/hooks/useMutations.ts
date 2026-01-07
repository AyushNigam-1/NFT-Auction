import { PublicKey } from "@solana/web3.js";
import { useMutation } from "@tanstack/react-query";
import { useProgramActions } from "./useProgramActions";

export const useMutations = () => {
    const programActions = useProgramActions()

    const createSubscription = useMutation({
        mutationFn: async ({
            tier,
            planPDA,
            planName,
            payerKey,
            periodSeconds,
            amount,
            autoRenew,
            receiver,
            mint
        }: {
            tier: string;
            planPDA: PublicKey;
            planName: string,
            payerKey: PublicKey;
            periodSeconds: number;
            amount: number;          // 🔒 locked price
            autoRenew?: boolean;
            receiver: PublicKey,
            mint: PublicKey
        }) => {
            // const subscription = await programActions.createAuctionInstruction(
            //     tier,                   // tier name
            //     planPDA,                // plan PDA
            //     payerKey,               // user wallet
            //     periodSeconds,          // billing period
            //     amount,                 // 🔒 locked amount
            //     autoRenew,
            //     receiver,
            //     mint,
            // );
            // if (!subscription) {
            //     throw new Error("Failed to create subscription");
            // }
            // return subscription;

        },

        // onSuccess: async ({ subscriptionPDA, account }, { planName }) => {
        //     // toast.success("Subscription created successfully!");
        //     console.log("New Subscription PDA:", subscriptionPDA, account);
        //     createSubscriptionDb.mutate({ account: { ...account, planName } })
        //     // Refetch your subscriptions list
        //     // queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
        //     // queryClient.invalidateQueries({ queryKey: ["userSubscriptions", payerKey.toBase58()] });
        // },

        // onError: (error: any) => {
        //     console.error("Failed to create subscription:", error);
        //     // toast.error(error.message || "Failed to create subscription");
        // },
    });
}