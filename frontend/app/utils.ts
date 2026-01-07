import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";

export const getMintProgramId = async (mint: PublicKey): Promise<PublicKey> => {
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");

    try {
        const mintAccountInfo = await connection.getAccountInfo(mint);

        if (!mintAccountInfo) {
            console.warn("Mint account not found. Defaulting to standard SPL Token Program ID.");
            return TOKEN_PROGRAM_ID;
        }
        if (mintAccountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            console.log(`Mint ${mint.toBase58()} is owned by Token-2022.`);
            return TOKEN_2022_PROGRAM_ID;
        }
        console.log(`Mint ${mint.toBase58()} is owned by standard SPL Token.`);
        return TOKEN_PROGRAM_ID;

    } catch (e) {
        console.error("Failed to fetch mint account info, defaulting to standard SPL Token Program ID:", e);
        return TOKEN_PROGRAM_ID;
    }
};