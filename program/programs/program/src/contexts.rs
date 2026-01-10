use crate::{constants::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    // 👇 FIX 1: Import TokenInterface, remove Token
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct CreateProperty<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Property::INIT_SPACE,
        seeds = [PROPERTY_SEED, owner.key().as_ref()],
        bump,
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = property,
        associated_token::token_program = token_program
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,

    // 👇 FIX 2: This is now correctly imported
    pub token_program: Interface<'info, TokenInterface>,

    pub associated_token_program: Program<'info, AssociatedToken>,
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
    // 👇 FIX 3: Must be InterfaceAccount if using token_interface::TokenAccount
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(mut)]
    /// CHECK: Vault holds SOL for yields later
    pub vault: UncheckedAccount<'info>,

    // 👇 FIX 4: Update this to support Token-2022 mints too
    pub token_program: Interface<'info, TokenInterface>,

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
