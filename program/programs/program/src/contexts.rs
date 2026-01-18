use crate::{constants::*, states::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
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
pub struct DeleteProperty<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PROPERTY_SEED, owner.key().as_ref()],
        bump = property.bump,
        constraint = property.owner == owner.key(),
        close = owner, // Closes the Property PDA automatically
    )]
    pub property: Account<'info, Property>,

    // 👇 ADDED: Needed for transfer_checked
    #[account(
        address = property.mint 
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = property.mint,
        associated_token::authority = property,
        associated_token::token_program = token_program,
        // ❌ REMOVED: close = owner (We do manual close)
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    // 👇 ADDED: Destination for the tokens
    #[account(
        mut,
        associated_token::mint = property.mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    /// The buyer of the shares (pays SOL and receives shares)
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// The property being bought into
    #[account(mut)]
    pub property: Account<'info, Property>,

    /// The mint of the shared token
    pub mint: InterfaceAccount<'info, Mint>,

    /// Vault token account (holds the available shares for this property)
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = property,
        associated_token::token_program = token_program,
    )]
    pub vault_token_account: InterfaceAccount<'info, TokenAccount>,

    /// Buyer's token account (receives the purchased shares)
    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = mint,
        associated_token::authority = buyer,
        associated_token::token_program = token_program,
    )]
    pub buyer_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: This is the original property owner, used only for PDA seed derivation.
    #[account(mut)]  // ← Mut for receiving SOL
    pub owner: SystemAccount<'info>,

    /// ShareHolder record (tracks buyer's shares in this property)
    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + ShareHolder::INIT_SPACE,
        seeds = [SHAREHOLDER_SEED, buyer.key().as_ref(), property.key().as_ref()],
        bump,
    )]
    pub share_holder: Account<'info, ShareHolder>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}


#[derive(Accounts)]
pub struct CloseShareholderAccount<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>, // Recipient of rent

    #[account(
        mut,
        constraint = share_holder.owner == buyer.key(), 
        close = buyer
    )]
    pub share_holder: Account<'info, ShareHolder>,
}

#[derive(Accounts)]
pub struct DepositRent<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PROPERTY_SEED, owner.key().as_ref()],
        bump = property.bump,
        has_one = owner, // Security check: Only the owner of this property can deposit rent
    )]
    pub property: Account<'info, Property>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [PROPERTY_SEED, property.owner.as_ref()],
        bump = property.bump,
    )]
    pub property: Account<'info, Property>,

    #[account(
        seeds = [SHAREHOLDER_SEED, owner.key().as_ref(), property.key().as_ref()],
        bump,
        has_one = owner,
        has_one = property,
    )]
    pub share_holder: Account<'info, ShareHolder>,

    #[account(
        associated_token::mint = mint,
        associated_token::authority = owner,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
}
