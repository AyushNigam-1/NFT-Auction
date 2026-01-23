use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(uri: String, name: String, symbol: String)]
pub struct CreateKycMint<'info> {
    #[account(
        init,
        payer = payer,
        seeds = [b"kyc_mint"],
        bump,
        mint::decimals = 0,
        mint::authority = mint,
        mint::freeze_authority = mint,
        mint::token_program = token_program,
        extensions::non_transferable::non_transferable,
        extensions::metadata_pointer::authority = mint,
        extensions::metadata_pointer::metadata_address = mint,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct IssueBadge<'info> {
    /// The admin who pays for the badge issuance
    #[account(mut)]
    pub authority: Signer<'info>,

    /// The recipient who will receive the badge
    /// CHECK: This account is validated by the associated token account derivation
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"kyc_mint"],
        bump,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program,
    )]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
