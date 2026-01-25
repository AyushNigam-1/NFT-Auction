// src/states.rs
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Property {
    pub owner: Pubkey,         // Property owner
    pub mint: Pubkey,          // SPL mint for shares
    pub price_per_shares: u64, // Total tokens minted (supply)
    pub total_shares: u64,
    #[max_len(200)] // ← This fixes the error
    pub metadata_uri: String,
    pub bump: u8,
    #[max_len(50)]
    pub name: String, // e.g., "Sunshine Apartments - Pune" (prefix 4 + 50)
    #[max_len(100)]
    pub address: String,
    #[max_len(150)]
    pub thumbnail_uri: String, // Small preview image URL
    pub yield_percentage: u16, // 1-2 sentence teaser (max_len=200)
}

#[account]
#[derive(InitSpace)]
pub struct ShareHolder {
    pub owner: Pubkey,
    pub property: Pubkey,
    pub shares_percentage: u64, // Amount held
    pub monthly_rent: u64,
    // pub last_claim: i64, // Timestamp for yield calc (future extension)
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Identity {
    pub owner: Pubkey,
    pub issuer: Pubkey,
    pub verified: bool,
    pub revoked: bool,
    pub created_at: i64,
}

#[account]
#[derive(InitSpace)]
pub struct DealerState {
    pub admin: Pubkey,
    pub base_price: u64, // The "Real" value (e.g., 1 SOL)         // You (The Liquidity Provider)
    pub property_mint: Pubkey, // The Real Estate Token
    pub payment_mint: Pubkey, // USDC (or SOL if you wrap it)
    pub buy_price: u64,  // Price user PAYS to buy (e.g. 102)
    pub sell_price: u64, // Price user GETS to sell (e.g. 98)
    pub max_shares_per_tx: u64, // Anti-Whale Limit
    pub is_frozen: bool, // Circuit Breaker
    pub bump: u8,
}
