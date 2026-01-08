// src/contexts.rs
use crate::{constants::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

#[derive(Accounts)]
pub struct CreateProperty<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + 32 + 32 + 8 + 1,
        seeds = [PROPERTY_SEED, owner.key().as_ref()],
        bump,
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub mint: Account<'info, Mint>, // Mint must have mint authority = owner

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub owner_token_account: Account<'info, TokenAccount>, // ← Add this

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>, // ← Add this too
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [PROPERTY_SEED, property.owner.as_ref()],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + 32 + 32 + 8 + 8 + 1,
        seeds = [HOLDER_SEED, buyer.key().as_ref(), property.key().as_ref()],
        bump,
    )]
    pub holder: Account<'info, ShareHolder>,

    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Vault holds SOL for yields later
    pub vault: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DistributeYield<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        constraint = property.owner == owner.key(),
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    /// CHECK: Vault receives/distributes SOL
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
