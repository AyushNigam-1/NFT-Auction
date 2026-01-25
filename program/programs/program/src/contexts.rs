use crate::{IdentityRegistry, constants::*, states::*};
use crate::errors::ErrorCode;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct InitializeDealer<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    // CHANGE 1: Use InterfaceAccount for mints to match TokenInterface
    pub property_mint: InterfaceAccount<'info, Mint>,
    
    pub payment_mint: InterfaceAccount<'info, Mint>, // USDC

    #[account(
        init,
        payer = admin,
        space = 8 + DealerState::INIT_SPACE,
        seeds = [b"dealer", property_mint.key().as_ref()],
        bump
    )]
    pub dealer_state: Account<'info, DealerState>,

    // Holds the Inventory (House Shares)
    #[account(
        init,
        payer = admin,
        token::mint = property_mint,
        token::authority = dealer_state,
        seeds = [b"dealer_share_vault", property_mint.key().as_ref()],
        bump
    )]
    pub dealer_share_vault: InterfaceAccount<'info, TokenAccount>,

    // Holds the Cash (USDC)
    #[account(
        init,
        payer = admin,
        token::mint = payment_mint,
        token::authority = dealer_state,
        seeds = [b"dealer_payment_vault", property_mint.key().as_ref()],
        bump
    )]
    pub dealer_payment_vault: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    
    // This interface requires the mints to be InterfaceAccount
    pub token_program: Interface<'info, TokenInterface>, 
    
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TradeDealer<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dealer", dealer_state.property_mint.as_ref()],
        bump = dealer_state.bump,
        has_one = property_mint,
        has_one = payment_mint
    )]
    pub dealer_state: Account<'info, DealerState>,

    // 2. CHANGE: 'Box<Account<...>>' -> 'InterfaceAccount<...>'
    // This allows the Mint to be EITHER Legacy or Token-2022
    #[account(mut, address = dealer_state.property_mint)]
    pub property_mint: InterfaceAccount<'info, Mint>,

    #[account(mut, address = dealer_state.payment_mint)]
    pub payment_mint: InterfaceAccount<'info, Mint>,

    // 3. CHANGE: Use InterfaceAccount for Vaults
    #[account(
        mut, 
        seeds = [b"dealer_share_vault", property_mint.key().as_ref()], 
        bump,
        token::mint = property_mint,
        token::authority = dealer_state,
    )]
    pub dealer_share_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut, 
        seeds = [b"dealer_payment_vault", property_mint.key().as_ref()], 
        bump,
        token::mint = payment_mint,
        token::authority = dealer_state,
    )]
    pub dealer_payment_vault: InterfaceAccount<'info, TokenAccount>,

    // User Accounts
    #[account(
        mut,
        token::mint = property_mint
    )] 
    pub user_share_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = payment_mint
    )] 
    pub user_payment_account: InterfaceAccount<'info, TokenAccount>,

    // 4. CHANGE: Use 'TokenInterface' to allow EITHER program
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

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

    #[account(
        mut,
        seeds = [b"vault", property.key().as_ref()],
        bump,
    )]
    pub property_vault: SystemAccount<'info>,
    
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
// 🔐 IDENTITY CHECK
    #[account(
        seeds = [b"identity", owner.key().as_ref()],
        bump,
        owner = identity_registry.key(),
        constraint = identity.verified @ ErrorCode::IdentityNotVerified,
        constraint = !identity.revoked @ ErrorCode::IdentityRevoked
    )]
    pub identity: Account<'info, Identity>,

    pub identity_registry: Program<'info, IdentityRegistry>,
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
    // 🔐 IDENTITY CHECK
    #[account(
        seeds = [b"identity", buyer.key().as_ref()],
        bump,
        owner = identity_registry.key(),
        constraint = identity.verified @ ErrorCode::IdentityNotVerified,
        constraint = !identity.revoked @ ErrorCode::IdentityRevoked
    )]
    pub identity: Account<'info, Identity>,

    pub identity_registry: Program<'info, IdentityRegistry>,
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

    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"vault", property.key().as_ref()],
        bump
    )]
    pub property_vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimYield<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    pub property: Account<'info, Property>,

    #[account(
        mut,
        seeds = [b"vault", property.key().as_ref()],
        bump
    )]
    pub property_vault: SystemAccount<'info>,

    #[account(
        seeds = [SHAREHOLDER_SEED, owner.key().as_ref(), property.key().as_ref()],
        bump,
        has_one = owner,
        has_one = property,
    )]
    pub share_holder: Account<'info, ShareHolder>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        associated_token::mint = mint,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

