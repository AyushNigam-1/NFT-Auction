use anchor_lang::prelude::*;

#[account]
pub struct Auction {
    pub seller: Pubkey,
    pub nft_mint: Pubkey,
    pub min_bid: u64,
    pub reserve_price: u64,
    pub end_time: i64,
    pub highest_bid: u64,
    pub highest_bidder: Pubkey,
    pub bump: u8,
}
