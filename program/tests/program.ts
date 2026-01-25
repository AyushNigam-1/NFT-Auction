import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { IdentityRegistry } from "../target/types/identity_registry";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("identity-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.IdentityRegistry as Program<IdentityRegistry>;

  // Authority = current wallet
  const authority = provider.wallet;

  let registryPda: PublicKey;
  let issuerPda: PublicKey;

  it("Initialize registry and add issuer", async () => {
    // -----------------------------
    // 1. Derive Registry PDA
    // -----------------------------
    // You can also make this a random Keypair if you want.
    // PDA is cleaner and deterministic.
    [registryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("registry")],
      program.programId
    );

    // -----------------------------
    // 2. Initialize Registry
    // -----------------------------
    await program.methods
      .initializeRegistry()
      .accounts({
        registry: registryPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const registryAccount = await program.account.identityRegistry.fetch(
      registryPda
    );

    expect(registryAccount.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );

    // -----------------------------
    // 3. Derive Issuer PDA
    // issuer = current wallet
    // -----------------------------
    [issuerPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("issuer"),
        registryPda.toBuffer(),
        authority.publicKey.toBuffer(),
      ],
      program.programId
    );

    // -----------------------------
    // 4. Add Issuer
    // -----------------------------
    await program.methods
      .addIssuer()
      .accounts({
        authority: authority.publicKey,
        registry: registryPda,
        issuerAccount: issuerPda,
        issuer: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const issuerAccount = await program.account.issuer.fetch(issuerPda);

    expect(issuerAccount.issuer.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
    expect(issuerAccount.registry.toBase58()).to.equal(
      registryPda.toBase58()
    );
  });
});
