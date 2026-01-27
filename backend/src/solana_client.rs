use anchor_lang::prelude::system_program;
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    hash::hash,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer, read_keypair_file},
    transaction::Transaction,
};
use std::str::FromStr;

// Assuming the Global Stats PDA seed for the client to find the key

// --- 1. SolanaClient Definition ---
pub struct SolanaClient {
    pub rpc: RpcClient,
    pub payer: Keypair,
    pub program_id: Pubkey, // The Anchor Program ID
}

impl SolanaClient {
    // Constructor
    pub async fn new(rpc_url: &str, keypair_path: &str, program_id: &str) -> Self {
        // NOTE: The `read_keypair_file` takes care of the "~" expansion for the path
        let payer =
            read_keypair_file(keypair_path).expect("❌ Failed to read keypair file for Payer");
        let program_id = Pubkey::from_str(program_id).expect("❌ Invalid program ID");
        let rpc = RpcClient::new(rpc_url.to_string());

        Self {
            rpc,
            payer,
            program_id,
        }
    }

    pub async fn issue_identity_on_chain(
        &self,
        user_wallet: Pubkey,
    ) -> Result<String, anyhow::Error> {
        // 1. Calculate Discriminator
        let discriminator_slice = &hash(b"global:issue_identity").to_bytes()[..8];
        let instruction_data = discriminator_slice.to_vec();

        // 2. Derive PDAs

        // A. Registry PDA (Derived from static seed b"registry")
        let (registry_pda, _) = Pubkey::find_program_address(&[b"registry"], &self.program_id);

        // B. Identity PDA (Derived from [b"identity", user_key])
        let (identity_pda, _bump) =
            Pubkey::find_program_address(&[b"identity", user_wallet.as_ref()], &self.program_id);

        // C. Issuer Account PDA (Derived from [b"issuer", registry_key, issuer_key])
        let (issuer_account_pda, _) = Pubkey::find_program_address(
            &[
                b"issuer",
                registry_pda.as_ref(), // Now using the correctly derived registry
                self.payer.pubkey().as_ref(),
            ],
            &self.program_id,
        );

        // 3. Define Accounts (Strict Order)
        let accounts = vec![
            AccountMeta::new_readonly(registry_pda, false),
            AccountMeta::new_readonly(issuer_account_pda, false),
            AccountMeta::new(identity_pda, false),
            AccountMeta::new_readonly(user_wallet, false),
            AccountMeta::new(self.payer.pubkey(), true),
            AccountMeta::new_readonly(system_program::id(), false),
        ];

        // 4. Build Instruction
        let instruction = Instruction {
            program_id: self.program_id,
            accounts,
            data: instruction_data,
        };

        // 5. Send Transaction
        let recent_blockhash = self.rpc.get_latest_blockhash().await?;

        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            recent_blockhash,
        );

        let signature = self.rpc.send_and_confirm_transaction(&transaction).await?;

        Ok(signature.to_string())
    }

    pub async fn revoke_identity_on_chain(
        &self,
        user_wallet: Pubkey,
    ) -> Result<String, anyhow::Error> {
        // 1. Calculate Discriminator
        // "global:revoke_identity" -> first 8 bytes of sha256
        let discriminator_slice = &hash(b"global:revoke_identity").to_bytes()[..8];
        let instruction_data = discriminator_slice.to_vec();

        let (identity_pda, _bump) =
            Pubkey::find_program_address(&[b"identity", user_wallet.as_ref()], &self.program_id);

        let accounts = vec![
            // 1. pub issuer: Signer<'info>
            AccountMeta::new(self.payer.pubkey(), true),
            // 2. pub identity: Account<'info, Identity>
            AccountMeta::new(identity_pda, false),
        ];

        // 4. Build Instruction
        let instruction = Instruction {
            program_id: self.program_id,
            accounts,
            data: instruction_data,
        };

        // 5. Send Transaction
        let recent_blockhash = self.rpc.get_latest_blockhash().await?;

        let transaction = Transaction::new_signed_with_payer(
            &[instruction],
            Some(&self.payer.pubkey()),
            &[&self.payer],
            recent_blockhash,
        );

        let signature = self.rpc.send_and_confirm_transaction(&transaction).await?;

        Ok(signature.to_string())
    }
}
