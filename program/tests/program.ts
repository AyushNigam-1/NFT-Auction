import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IdentityRegistry } from "../target/types/identity_registry";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

describe("identity-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.IdentityRegistry as Program<IdentityRegistry>;

  it("Initializes the Soulbound KYC Mint", async () => {
    // PDA MUST MATCH RUST
    const [mintPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("kyc_mint")],
      program.programId
    );

    console.log("Derived Mint PDA:", mintPda.toBase58());

    const metadata = anchor.web3.Keypair.generate();

    const uri = "bafkreieex5inz2igabv5mowwuoiuurmewdxumcots2whny2hl4obmoeqza";
    const name = "Verified User";
    const symbol = "VERIFIED";

    const tx = await program.methods
      .createKycMint(uri, name, symbol)
      .accounts({
        payer: provider.wallet.publicKey,
        mint: mintPda,
        metadata: metadata.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([metadata]) // metadata is a normal account
      .rpc();

    console.log("✅ Transaction signature:", tx);
  });
});
