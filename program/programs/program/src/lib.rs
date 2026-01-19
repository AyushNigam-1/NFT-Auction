mod constants;
mod contexts;
mod errors;
mod events;
mod states;
use crate::{constants::*, contexts::*, errors::ErrorCode, events::*};
use anchor_lang::prelude::*;
// use anchor_lang::system_program::{self, Transfer};
use anchor_spl::token_interface::{close_account, transfer_checked, CloseAccount, TransferChecked};

declare_id!("Dh43TjNE2obrC8ZZXgvjitekaDiLmnnTCLTqLwziWnwU");

#[program]
pub mod yieldhome {

    use super::*;

    pub fn create_property(
        ctx: Context<CreateProperty>,
        total_shares: u64,
        price_per_shares: u64,
        name: String,
        address: String,
        thumbnail_uri: String,
        yield_percentage: u16,
        metadata_uri: String,
    ) -> Result<()> {
        let property = &mut ctx.accounts.property;
        property.owner = ctx.accounts.owner.key();
        property.mint = ctx.accounts.mint.key();
        property.price_per_shares = price_per_shares;
        property.name = name;
        property.address = address;
        property.total_shares = total_shares;
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
        // let transfer_accounts = Transfer {
        //     from: ctx.accounts.buyer.to_account_info(),
        //     to: ctx.accounts.owner.to_account_info(),
        // };

        // let cpi_ctx = CpiContext::new(
        //     ctx.accounts.system_program.to_account_info(),
        //     transfer_accounts,
        // );

        // // This checks if buyer has enough SOL and performs the transfer
        // system_program::transfer(cpi_ctx, paid_sol)?;

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
        share_holder.property = ctx.accounts.property.key();

        emit!(SharesBought {
            buyer: ctx.accounts.buyer.key(),
            property: ctx.accounts.property.key(),
            shares,
            paid_sol,
        });

        Ok(())
    }

    pub fn close_shareholder_account(_ctx: Context<CloseShareholderAccount>) -> Result<()> {
        // No logic needed.
        // The #[account(close = buyer)] constraint below handles everything automatically.
        msg!("ShareHolder account closed. Rent refunded to buyer.");
        Ok(())
    }

    pub fn deposit_rent(ctx: Context<DepositRent>, amount: u64) -> Result<()> {
        // 1. Prepare the transfer from the owner to the Property PDA
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.property.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);

        // 2. Perform the transfer via the System Program
        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        msg!("Rent of {} lamports deposited into property vault", amount);

        // You could also emit an event here if you have a RentDeposited event defined
        Ok(())
    }
    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        let property = &ctx.accounts.property;
        let user_shares = ctx.accounts.user_token_account.amount; //
        let total_shares = property.total_shares;

        // 1. Get total SOL in the Property PDA
        let total_vault_sol = ctx.accounts.property.to_account_info().lamports();

        // 2. Proportional Math
        let amount_to_claim = (user_shares as u128)
            .checked_mul(total_vault_sol as u128)
            .ok_or(error!(ErrorCode::MathOverflow))?
            .checked_div(total_shares as u128)
            .ok_or(error!(ErrorCode::MathOverflow))? as u64;

        require!(amount_to_claim > 0, ErrorCode::NoYieldToClaim);

        // 3. Prepare CPI to System Program
        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.property.to_account_info(),
            to: ctx.accounts.owner.to_account_info(), // Assuming 'user' is the claimer
        };

        // 4. Use the Seeds for the Signature
        let owner_key = property.owner.key();
        let seeds = &[PROPERTY_SEED, owner_key.as_ref(), &[property.bump]];
        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            cpi_accounts,
            signer_seeds, // <--- Seeds are used here!
        );

        // 5. Execute the transfer through the System Program
        anchor_lang::system_program::transfer(cpi_ctx, amount_to_claim)?;

        msg!("User claimed {} lamports in rent yield", amount_to_claim);

        Ok(())
    }
}
