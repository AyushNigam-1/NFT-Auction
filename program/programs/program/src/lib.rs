// src/lib.rs
mod constants;
mod contexts;
mod events;
mod states;
use crate::{contexts::*, events::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{mint_to, MintTo};

declare_id!("Dh43TjNE2obrC8ZZXgvjitekaDiLmnnTCLTqLwziWnwU"); // Replace after deploy

#[program]
pub mod yieldhome {
    use super::*;

    pub fn create_property(ctx: Context<CreateProperty>, total_shares: u64) -> Result<()> {
        let property = &mut ctx.accounts.property;
        property.owner = ctx.accounts.owner.key();
        property.mint = ctx.accounts.mint.key();
        property.total_shares = total_shares;
        property.bump = ctx.bumps.property;

        // Mint all shares to owner initially
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(), // Assume owner ATA
            authority: ctx.accounts.owner.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        mint_to(cpi_ctx, total_shares)?;

        emit!(PropertyCreated {
            property: property.key(),
            mint: ctx.accounts.mint.key(),
            total_shares,
        });

        Ok(())
    }

    pub fn buy_shares(ctx: Context<BuyShares>, shares: u64, paid_sol: u64) -> Result<()> {
        // Transfer SOL to vault (simple price = paid_sol for shares)
        **ctx.accounts.vault.try_borrow_mut_lamports()? += paid_sol;
        **ctx.accounts.buyer.try_borrow_mut_lamports()? -= paid_sol;

        // Transfer shares from owner to buyer (simplified — owner must approve)
        // In real: CPI from owner ATA to buyer ATA

        let holder = &mut ctx.accounts.holder;
        holder.owner = ctx.accounts.buyer.key();
        holder.property = ctx.accounts.property.key();
        holder.shares += shares;
        holder.bump = ctx.bumps.holder;

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
