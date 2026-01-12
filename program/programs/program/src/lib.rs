// src/lib.rs
mod constants;
mod contexts;
mod events;
mod states;
use crate::{constants::*, contexts::*, events::*};
use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use anchor_spl::token_interface::{close_account, transfer_checked, CloseAccount, TransferChecked}; // Import these

declare_id!("Dh43TjNE2obrC8ZZXgvjitekaDiLmnnTCLTqLwziWnwU"); // Replace after deploy

#[program]
pub mod yieldhome {

    use super::*;

    pub fn create_property(
        ctx: Context<CreateProperty>,
        total_shares: u64,
        price_per_shares: u64,
        name: String,
        thumbnail_uri: String,
        yield_percentage: u16,
        metadata_uri: String,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        property.owner = ctx.accounts.owner.key();
        property.mint = ctx.accounts.mint.key();
        property.price_per_shares = price_per_shares;
        property.name = name;
        property.thumbnail_uri = thumbnail_uri;
        property.yield_percentage = yield_percentage;
        property.metadata_uri = metadata_uri.clone();
        property.bump = ctx.bumps.property;
        let decimals = ctx.accounts.mint.decimals;
        // Safe CPI: Transfer initial shares from owner → vault (with decimals check)
        let cpi_accounts = TransferChecked {
            from: ctx.accounts.owner_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(), // ← Required for checked
            authority: ctx.accounts.owner.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

        // Transfer with decimals (use your mint's decimals, e.g. 6)
        transfer_checked(cpi_ctx, total_shares, decimals)?; // ← Amount, decimals

        emit!(PropertyCreated {
            property: property.key(),
            mint: ctx.accounts.mint.key(),
            total_shares,
            metadata_uri,
        });

        Ok(())
    }

    pub fn delete_property(ctx: Context<DeleteProperty>) -> Result<()> {
        // 1. Prepare PDA Signer Seeds
        let owner_key = ctx.accounts.owner.key();
        let bump = ctx.accounts.property.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[PROPERTY_SEED, owner_key.as_ref(), &[bump]]];

        // 2. Check Balance
        let amount = ctx.accounts.vault_token_account.amount;

        // 3. Transfer Tokens (Only if > 0)
        if amount > 0 {
            let transfer_accounts = TransferChecked {
                from: ctx.accounts.vault_token_account.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.owner_token_account.to_account_info(),
                authority: ctx.accounts.property.to_account_info(),
            };

            let transfer_ctx = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_accounts,
                signer_seeds,
            );

            // Transfer everything back to owner
            transfer_checked(transfer_ctx, amount, ctx.accounts.mint.decimals)?;
        }

        // 4. Close the Vault Account
        let close_accounts = CloseAccount {
            account: ctx.accounts.vault_token_account.to_account_info(),
            destination: ctx.accounts.owner.to_account_info(),
            authority: ctx.accounts.property.to_account_info(),
        };

        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            close_accounts,
            signer_seeds,
        );

        close_account(close_ctx)?;

        // 5. The 'property' PDA is closed automatically via #[account(close = owner)]

        Ok(())
    }

    pub fn buy_shares(ctx: Context<BuyShares>, shares: u64, paid_sol: u64) -> Result<()> {
        // ✅ 1. Safe CPI: Transfer SOL from Buyer → Owner via System Program
        // This replaces the manual **lamports manipulation
        let transfer_accounts = Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_accounts,
        );

        // This checks if buyer has enough SOL and performs the transfer
        system_program::transfer(cpi_ctx, paid_sol)?;

        // 2. Transfer real shares from vault → buyer (Your existing code)
        let cpi_accounts_token = TransferChecked {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.property.to_account_info(),
        };

        let owner_key = ctx.accounts.owner.key();
        let seeds = &[
            PROPERTY_SEED,
            owner_key.as_ref(),
            &[ctx.accounts.property.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts_token,
                signer_seeds,
            ),
            shares,
            ctx.accounts.mint.decimals,
        )?;

        // 3. Update holder record (Your existing code)
        let share_holder = &mut ctx.accounts.share_holder;
        share_holder.owner = ctx.accounts.buyer.key();
        share_holder.shares += shares;

        emit!(SharesBought {
            buyer: ctx.accounts.buyer.key(),
            property: ctx.accounts.property.key(),
            shares,
            paid_sol,
        });

        Ok(())
    }

    pub fn distribute_yield(ctx: Context<DistributeYield>, total_sol: u64) -> Result<()> {
        // Simplified: Owner sends SOL to vault, event logs distribution
        // Advanced: Loop over holders or use proportional claim later
        emit!(YieldDistributed {
            property: ctx.accounts.property.key(),
            total_sol,
        });

        Ok(())
    }
}
