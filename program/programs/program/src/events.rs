// src/events.rs
use anchor_lang::prelude::*;

#[event]
pub struct PropertyCreated {
    pub property: Pubkey,
    pub mint: Pubkey,
    pub total_shares: u64,
    pub metadata_uri: String,
}

#[event]
pub struct SharesBought {
    pub buyer: Pubkey,
    pub property: Pubkey,
    pub shares: u64,
    pub paid_sol: u64,
}

#[event]
pub struct YieldDistributed {
    pub property: Pubkey,
    pub total_sol: u64,
}
