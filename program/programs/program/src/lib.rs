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

// 👇 declare external program
#[derive(Clone)]
pub struct IdentityRegistry;

impl anchor_lang::Id for IdentityRegistry {
    fn id() -> Pubkey {
        return pubkey!("6u94bx6UkkxxDZucnGRzoNKP48Y8DYc3ibDCpnUHo5Yj");
    }
}

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

    pub fn buy_shares(
        ctx: Context<BuyShares>,
        shares: u64,
        paid_sol: u64,
        monthly_rent: u64,
    ) -> Result<()> {
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
        let decimals = ctx.accounts.mint.decimals as u32;
        let raw_token_amount = shares
            .checked_mul(10u64.pow(decimals))
            .ok_or(error!(ErrorCode::MathOverflow))?;

        // 2. Transfer the raw tokens from vault → buyer
        let cpi_accounts_token = TransferChecked {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            authority: ctx.accounts.property.to_account_info(),
        };

        let owner_key = ctx.accounts.owner.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            PROPERTY_SEED,
            owner_key.as_ref(),
            &[ctx.accounts.property.bump],
        ]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                cpi_accounts_token,
                signer_seeds,
            ),
            raw_token_amount, // Use the raw amount for the transfer
            ctx.accounts.mint.decimals,
        )?;

        // 3. Update holder record with direct percentage
        let share_holder = &mut ctx.accounts.share_holder;
        share_holder.owner = ctx.accounts.buyer.key();
        share_holder.property = ctx.accounts.property.key();
        share_holder.monthly_rent = monthly_rent;

        // Save as direct percentage (e.g., 5 is saved as 5)
        share_holder.shares_percentage += shares;

        emit!(SharesBought {
            buyer: ctx.accounts.buyer.key(),
            property: ctx.accounts.property.key(),
            shares, // Log the original whole number
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
        require!(amount > 0, ErrorCode::InvalidAmount);

        let cpi_accounts = anchor_lang::system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.property_vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);

        anchor_lang::system_program::transfer(cpi_ctx, amount)?;

        msg!("Rent of {} lamports deposited into property vault", amount);
        Ok(())
    }

    pub fn claim_yield(ctx: Context<ClaimYield>) -> Result<()> {
        let share_holder = &ctx.accounts.share_holder;
        let user_token_acc = &ctx.accounts.user_token_account;

        require!(user_token_acc.amount > 0, ErrorCode::NoSharesOwned);

        let total_vault_sol = ctx.accounts.property_vault.lamports();

        let amount_to_claim = (total_vault_sol as u128)
            .checked_mul(share_holder.shares_percentage as u128)
            .ok_or(error!(ErrorCode::MathOverflow))?
            .checked_div(100)
            .ok_or(error!(ErrorCode::MathOverflow))? as u64;

        require!(amount_to_claim > 0, ErrorCode::NoYieldToClaim);
        let property_key = &ctx.accounts.property.key();
        let (vault_pda, vault_bump) =
            Pubkey::find_program_address(&[b"vault", property_key.as_ref()], ctx.program_id);

        require!(
            vault_pda == ctx.accounts.property_vault.key(),
            ErrorCode::InvalidVault
        );

        let vault_seeds: &[&[&[u8]]] = &[&[b"vault", property_key.as_ref(), &[vault_bump]]];

        anchor_lang::system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.property_vault.to_account_info(),
                    to: ctx.accounts.owner.to_account_info(),
                },
                vault_seeds,
            ),
            amount_to_claim,
        )?;

        msg!("Claimed {} lamports from property vault", amount_to_claim);
        Ok(())
    }
    // =========================================================================
    // 🏦 DEALER MODULE (Liquidity Engine)
    // =========================================================================

    pub fn initialize_dealer(
        ctx: Context<InitializeDealer>,
        buy_price: u64,
        sell_price: u64,
        max_shares: u64,
    ) -> Result<()> {
        let dealer = &mut ctx.accounts.dealer_state;
        dealer.admin = ctx.accounts.admin.key();
        dealer.property_mint = ctx.accounts.property_mint.key();
        dealer.payment_mint = ctx.accounts.payment_mint.key();
        dealer.buy_price = buy_price;
        dealer.sell_price = sell_price;
        dealer.max_shares_per_tx = max_shares;
        dealer.is_frozen = false;
        dealer.bump = ctx.bumps.dealer_state;
        Ok(())
    }

    // USER BUYS FROM DEALER (Inventory -> User)
    // USER BUYS FROM DEALER (User pays SOL -> Gets Shares)
    pub fn buy_from_dealer(ctx: Context<TradeDealer>, quantity: u64) -> Result<()> {
        let dealer = &ctx.accounts.dealer_state;
        require!(!dealer.is_frozen, ErrorCode::TradingFrozen);
        require!(
            quantity <= dealer.max_shares_per_tx,
            ErrorCode::LimitExceeded
        );

        // 1. Calculate Base Cost
        let base_cost = quantity
            .checked_mul(dealer.base_price)
            .ok_or(ErrorCode::MathOverflow)?;

        // 2. Calculate 2% Fee (Basis Points: 2% = 200 bps, but simple math: * 102 / 100)
        // Formula: Total = Base * 1.02
        let total_cost = base_cost
            .checked_mul(102)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;

        // 3. Transfer SOL (User -> Dealer)
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.dealer_state.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, total_cost)?;

        // 4. Transfer Shares (Dealer -> User)
        let seeds = &[
            b"dealer".as_ref(),
            dealer.property_mint.as_ref(),
            &[dealer.bump],
        ];
        let signer = &[&seeds[..]];

        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.dealer_share_vault.to_account_info(),
                    to: ctx.accounts.user_share_account.to_account_info(),
                    authority: ctx.accounts.dealer_state.to_account_info(),
                },
                signer,
            ),
            quantity,
        )?;

        Ok(())
    }

    // USER SELLS TO DEALER (User -> Inventory) [THE INSTANT LIQUIDITY]
    pub fn sell_to_dealer(ctx: Context<TradeDealer>, quantity: u64) -> Result<()> {
        let dealer = &ctx.accounts.dealer_state;
        require!(!dealer.is_frozen, ErrorCode::TradingFrozen);

        // 1. Calculate Base Value
        let base_value = quantity
            .checked_mul(dealer.base_price)
            .ok_or(ErrorCode::MathOverflow)?;

        // 2. Calculate Payout with 2% Deduction
        // Formula: Payout = Base * 0.98
        let payout = base_value
            .checked_mul(98)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::MathOverflow)?;

        // 3. Check Liquidity
        let dealer_lamports = ctx.accounts.dealer_state.to_account_info().lamports();
        require!(
            dealer_lamports >= payout,
            ErrorCode::InsufficientDealerLiquidity
        );

        // 4. Transfer Shares (User -> Dealer)
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.user_share_account.to_account_info(),
                    to: ctx.accounts.dealer_share_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            quantity,
        )?;

        // 5. Transfer SOL (Dealer -> User)
        **ctx
            .accounts
            .dealer_state
            .to_account_info()
            .try_borrow_mut_lamports()? -= payout;
        **ctx
            .accounts
            .user
            .to_account_info()
            .try_borrow_mut_lamports()? += payout;

        Ok(())
    }
}
