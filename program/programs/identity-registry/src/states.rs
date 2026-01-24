use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct IdentityRegistry {
    pub authority: Pubkey, // governance
}

#[account]
#[derive(InitSpace)]

pub struct Issuer {
    pub registry: Pubkey,
    pub issuer: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Identity {
    pub owner: Pubkey,  // wallet
    pub issuer: Pubkey, // who verified it
    pub verified: bool,
    pub revoked: bool,
    pub created_at: i64,
}
