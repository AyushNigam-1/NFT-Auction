use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::system_program;
use anchor_spl::token_2022::spl_token_2022::instruction::initialize_non_transferable_mint;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::{
        self,
        spl_token_2022::{
            extension::{metadata_pointer::instruction as metadata_pointer, ExtensionType},
            state::Mint,
        },
    },
    token_interface::{
        token_metadata_initialize, Mint as InterfaceMint, TokenAccount as InterfaceTokenAccount,
        TokenMetadataInitialize,
    },
};

declare_id!("6u94bx6UkkxxDZucnGRzoNKP48Y8DYc3ibDCpnUHo5Yj"); // Replace with your Program ID

#[program]
pub mod identity_registry {
    use super::*;

    pub fn create_kyc_mint(
        ctx: Context<CreateKycMint>,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        let seeds = &[b"kyc_mint".as_ref(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        // 1. Calculate Space for Mint + Extensions
        // Base Mint (165) + NonTransferable (approx 0) + MetadataPointer (approx 80) + Metadata (variable)
        // We calculate precisely using the ExtensionType helpers
        let space = ExtensionType::try_calculate_account_len::<Mint>(&[
            ExtensionType::NonTransferable,
            ExtensionType::MetadataPointer,
        ])
        .unwrap();

        // Add extra space for the actual metadata string payload (URI + Name + Symbol)
        // This is a safety buffer; usually, you calculate exact length:
        // 4 + len(name) + 4 + len(symbol) + 4 + len(uri) + overhead
        let meta_data_space = 4 + name.len() + 4 + symbol.len() + 4 + uri.len() + 100;
        let lamports = (Rent::get()?).minimum_balance(space + meta_data_space);

        // 2. Create the Mint Account
        // We do this manually via CPI to System Program because we need to
        // initialize extensions BEFORE initializing the main Mint.
        system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            lamports as u64,
            (space + meta_data_space) as u64,
            &ctx.accounts.token_program.key(),
        )?;

        // 3. Initialize NonTransferable Extension
        // This makes the token "Soulbound"
        let ix = initialize_non_transferable_mint(
            &ctx.accounts.token_program.key(),
            &ctx.accounts.mint.key(),
        )?;

        invoke(
            &ix,
            &[
                ctx.accounts.token_program.to_account_info(),
                ctx.accounts.mint.to_account_info(),
            ],
        )?;
        // token_2022::initialize_non_transferable_mint(cpi_accounts)?;

        // 4. Initialize Metadata Pointer Extension
        // We point the authority and the address to the Mint itself (Self-Contained)
        let init_meta_pointer_ix = metadata_pointer::initialize(
            &ctx.accounts.token_program.key(),
            &ctx.accounts.mint.key(),
            Some(ctx.accounts.mint.key()), // Authority
            Some(ctx.accounts.mint.key()), // Metadata Address (Self)
        )?;

        // We use solana_program::program::invoke because anchor_spl doesn't have a wrapper for this specific instruction yet
        anchor_lang::solana_program::program::invoke(
            &init_meta_pointer_ix,
            &[
                ctx.accounts.mint.to_account_info(),
                ctx.accounts.token_program.to_account_info(),
            ],
        )?;

        // 5. Initialize the Mint (Standard Token-2022)
        // 0 decimals is standard for badges/NFTs
        let cpi_accounts = anchor_lang::context::CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::InitializeMint {
                mint: ctx.accounts.mint.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
        );
        token_2022::initialize_mint(
            cpi_accounts,
            0,                              // Decimals
            &ctx.accounts.mint.key(),       // Mint Authority
            Some(&ctx.accounts.mint.key()), // Freeze Authority
        )?;

        // 6. Initialize the Metadata (Write Name/Symbol/URI)
        // Since MetadataPointer points to Self, this writes data into the Mint account
        // 6. Initialize the Metadata (Write Name/Symbol/URI)
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                // CHANGE THIS LINE: token_program_id -> program_id
                program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                metadata: ctx.accounts.mint.to_account_info(), // Self
                mint_authority: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.mint.to_account_info(),
            },
            &signer,
        );

        token_metadata_initialize(cpi_ctx, name, symbol, uri)?;

        Ok(())
    }

    pub fn issue_badge(ctx: Context<IssueBadge>) -> Result<()> {
        let seeds = &[b"kyc_mint".as_ref(), &[ctx.bumps.mint]];
        let signer = [&seeds[..]];

        // Mint exactly 1 token to the user
        // The Mint PDA signs this instruction
        token_2022::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.recipient_token_account.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                &signer,
            ),
            1, // Amount
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateKycMint<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: We are initializing this manually via CPI to handle extensions correctly.
    /// We use seeds to ensure it is the correct PDA, but we do NOT use #[account(init)]
    #[account(
        mut,
        seeds = [b"kyc_mint"],
        bump
    )]
    pub mint: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    // Constraint: Must be Token-2022
    #[account(address = token_2022::ID)]
    pub token_program: Program<'info, token_2022::Token2022>,
}

#[derive(Accounts)]
pub struct IssueBadge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // Backend Admin

    /// CHECK: The user receiving the badge
    pub recipient: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"kyc_mint"],
        bump
    )]
    pub mint: InterfaceAccount<'info, InterfaceMint>,

    // Use Associated Token Account to create/validate the user's wallet
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_token_account: InterfaceAccount<'info, InterfaceTokenAccount>,

    pub system_program: Program<'info, System>,

    // Constraint: Must be Token-2022
    #[account(address = token_2022::ID)]
    pub token_program: Program<'info, token_2022::Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}
