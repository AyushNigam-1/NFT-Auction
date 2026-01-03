use anchor_lang::prelude::*;
pub mod errors;
use anchor_spl::token::{transfer, Transfer};
pub mod contexts;
pub mod states;
use crate::errors::ErrorCode;

declare_id!("CnbD6KWoVguf1qdQWkrsX2dhBRg4QVJQeghqEbeVxgqs");

#[program]
pub mod nft_auction {
    use super::*;

    pub fn create_auction(
        ctx: Context<CreateAuction>,
        min_bid: u64,
        reserve_price: u64,
        end_time: i64,
    ) -> Result<()> {
        require!(
            end_time > Clock::get()?.unix_timestamp,
            ErrorCode::InvalidEndTime
        );

        let auction = &mut ctx.accounts.auction;
        auction.seller = ctx.accounts.seller.key();
        auction.nft_mint = ctx.accounts.nft_mint.key();
        auction.min_bid = min_bid;
        auction.reserve_price = reserve_price;
        auction.end_time = end_time;
        auction.highest_bid = 0;
        auction.highest_bidder = Pubkey::default();
        auction.bump = ctx.bumps.auction;

        // Transfer NFT to vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_nft_account.to_account_info(),
            to: ctx.accounts.vault_nft_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        transfer(cpi_ctx, 1)?;

        Ok(())
    }

    pub fn place_bid(ctx: Context<PlaceBid>, bid_amount: u64) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp < auction.end_time,
            ErrorCode::AuctionEnded
        );
        require!(bid_amount > auction.highest_bid, ErrorCode::BidTooLow);
        require!(
            auction.highest_bid == 0 || bid_amount >= auction.min_bid,
            ErrorCode::BidTooLow
        );

        // Refund previous bidder if exists
        if auction.highest_bid > 0 {
            **ctx
                .accounts
                .highest_bidder
                .to_account_info()
                .try_borrow_mut_lamports()? -= auction.highest_bid;
            **ctx
                .accounts
                .bidder
                .to_account_info()
                .try_borrow_mut_lamports()? += auction.highest_bid;
        }

        // Take new bid
        **ctx
            .accounts
            .auction
            .to_account_info()
            .try_borrow_mut_lamports()? += bid_amount;
        **ctx
            .accounts
            .bidder
            .to_account_info()
            .try_borrow_mut_lamports()? -= bid_amount;

        // Update state
        let auction_mut = &mut ctx.accounts.auction;
        auction_mut.highest_bid = bid_amount;
        auction_mut.highest_bidder = ctx.accounts.bidder.key();

        Ok(())
    }

    pub fn settle_auction(ctx: Context<SettleAuction>) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let clock = Clock::get()?;

        require!(
            clock.unix_timestamp >= auction.end_time,
            ErrorCode::AuctionNotEnded
        );
        require!(
            auction.highest_bid >= auction.reserve_price,
            ErrorCode::ReserveNotMet
        );

        let seeds = &[b"auction".as_ref(), &[auction.bump]];
        let signer = &[&seeds[..]];

        // Transfer NFT to winner
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_nft_account.to_account_info(),
            to: ctx.accounts.winner_nft_account.to_account_info(),
            authority: ctx.accounts.auction.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        transfer(cpi_ctx, 1)?;

        // Transfer bid SOL to seller (minus any leftover if no bids, but here we have winner)
        let payout = auction.highest_bid;
        **ctx
            .accounts
            .auction
            .to_account_info()
            .try_borrow_mut_lamports()? -= payout;
        **ctx
            .accounts
            .seller
            .to_account_info()
            .try_borrow_mut_lamports()? += payout;

        Ok(())
    }
}
