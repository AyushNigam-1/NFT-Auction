use crate::states::Auction;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount}, // ← Use these
};
#[derive(Accounts)]
#[instruction(min_bid: u64, reserve_price: u64, end_time: i64)]
pub struct CreateAuction<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = seller,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 32 + 1,
        seeds = [b"auction", nft_mint.key().as_ref()],
        bump,
    )]
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = seller,
    )]
    pub seller_nft_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = seller,
        associated_token::mint = nft_mint,
        associated_token::authority = auction,
    )]
    pub vault_nft_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"auction", auction.nft_mint.as_ref()],
        bump = auction.bump,
    )]
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        constraint = highest_bidder.key() == auction.highest_bidder,
    )]
    /// CHECK: Only used for refund if exists
    pub highest_bidder: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleAuction<'info> {
    #[account(mut)]
    pub settler: Signer<'info>, // Anyone can settle

    #[account(
        mut,
        seeds = [b"auction", auction.nft_mint.as_ref()],
        bump = auction.bump,
        close = seller, // If no winner, lamports go to seller
    )]
    pub auction: Account<'info, Auction>,

    #[account(mut)]
    /// CHECK: Seller receives payout
    pub seller: UncheckedAccount<'info>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = auction,
    )]
    pub vault_nft_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = settler,
        associated_token::mint = nft_mint,
        associated_token::authority = highest_bidder,
    )]
    pub winner_nft_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = highest_bidder.key() == auction.highest_bidder,
    )]
    /// CHECK: Winner receives NFT
    pub highest_bidder: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
