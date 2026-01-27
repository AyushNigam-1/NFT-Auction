use crate::errors::IdentityError;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitRegistry<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8+IdentityRegistry::INIT_SPACE,
        seeds = [b"registry"],
        bump
    )]
    pub registry: Account<'info, IdentityRegistry>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddIssuer<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub registry: Account<'info, IdentityRegistry>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + Issuer::INIT_SPACE,
        seeds = [b"issuer", registry.key().as_ref(), issuer.key().as_ref()],
        bump
    )]
    pub issuer_account: Account<'info, Issuer>,

    pub issuer: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct IssueIdentity<'info> {
    #[account()]
    pub registry: Account<'info, IdentityRegistry>,

    #[account(
        seeds = [b"issuer", registry.key().as_ref(), issuer.key().as_ref()],
        bump
    )]
    pub issuer_account: Account<'info, Issuer>,

    #[account(
        init,
        payer = issuer,
        space = 8 + Identity::INIT_SPACE,
        seeds = [b"identity", user.key().as_ref()],
        bump
    )]
    pub identity: Account<'info, Identity>,

    pub user: SystemAccount<'info>,
    #[account(mut)]
    pub issuer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeIdentity<'info> {
    /// The issuer who originally verified this identity
    #[account(mut)]
    pub issuer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"identity", identity.owner.as_ref()],
        bump,
        constraint = identity.issuer == issuer.key() @ IdentityError::UnauthorizedIssuer,
        close = issuer
    )]
    pub identity: Account<'info, Identity>,
}
