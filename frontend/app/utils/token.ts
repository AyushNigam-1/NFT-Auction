import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    ExtensionType,
    getMintLen,
    createInitializeMintInstruction,
    createInitializeNonTransferableMintInstruction,
    createInitializeMetadataPointerInstruction,
    createInitializeInstruction,
    createAssociatedTokenAccountInstruction,
    mintTo,
    createMintToInstruction
} from "@solana/spl-token";



export async function createSoulboundMintWithMetadata(
    connection: Connection,
    payer: Keypair,
    recipient: PublicKey,
    metadata: {
        name: string;
        symbol: string;
        uri: string;
    }
) {
    // 1️⃣ Generate mint keypair
    const mintKeypair = Keypair.generate();
    const mint = mintKeypair.publicKey;

    // 2️⃣ Mint account size with extensions
    const mintLen = getMintLen([
        ExtensionType.NonTransferable,
        ExtensionType.MetadataPointer,
    ]);

    const lamports =
        await connection.getMinimumBalanceForRentExemption(mintLen);

    const tx = new Transaction();

    // 3️⃣ Create mint account
    tx.add(
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports,
            programId: TOKEN_2022_PROGRAM_ID,
        })
    );

    // 4️⃣ Initialize mint (0 decimals)
    tx.add(
        createInitializeMintInstruction(
            mint,
            0,
            mint, // mint authority = mint itself
            mint, // freeze authority = mint itself
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 5️⃣ Enable NonTransferable (Soulbound)
    tx.add(
        createInitializeNonTransferableMintInstruction(
            mint,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 6️⃣ Enable MetadataPointer (metadata stored on mint)
    tx.add(
        createInitializeMetadataPointerInstruction(
            mint,
            mint, // authority
            mint, // metadata address (self)
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 7️⃣ Initialize metadata (name, symbol, uri)
    tx.add(
        createInitializeInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mint,          // metadata account = mint
            updateAuthority: mint,   // mint controls metadata
            mint,
            mintAuthority: mint,
            name: metadata.name,
            symbol: metadata.symbol,
            uri: metadata.uri,
        })
    );

    // 8️⃣ Derive recipient ATA (Token-2022)
    const ata = PublicKey.findProgramAddressSync(
        [
            recipient.toBuffer(),
            TOKEN_2022_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];

    // 9️⃣ Create ATA
    tx.add(
        createAssociatedTokenAccountInstruction(
            payer.publicKey,
            ata,
            recipient,
            mint,
            TOKEN_2022_PROGRAM_ID
        )
    );

    // 🔟 Mint exactly 1 badge
    tx.add(
        createMintToInstruction(
            mint,
            ata,
            mint, // mint authority
            1,
            [],
            TOKEN_2022_PROGRAM_ID
        )
    )

    // 11️⃣ Send transaction
    const sig = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer, mintKeypair],
        { commitment: "confirmed" }
    );

    console.log("Soulbound KYC Mint Created:", mint.toBase58());
    console.log("Recipient ATA:", ata.toBase58());
    console.log("Tx:", sig);

    return {
        mint,
        ata,
        signature: sig,
    };
}

