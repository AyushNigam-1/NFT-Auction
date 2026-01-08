// src/states.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Property {
    pub owner: Pubkey,     // Property owner
    pub mint: Pubkey,      // SPL mint for shares
    pub total_shares: u64, // Total tokens minted (supply)
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ShareHolder {
    pub owner: Pubkey,
    pub property: Pubkey,
    pub shares: u64,     // Amount held
    pub last_claim: i64, // Timestamp for yield calc (future extension)
    pub bump: u8,
}
