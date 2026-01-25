mod contexts;
mod errors;
mod states;
use anchor_lang::prelude::*;

use crate::contexts::*;
declare_id!("6u94bx6UkkxxDZucnGRzoNKP48Y8DYc3ibDCpnUHo5Yj"); // Replace with your Program ID
#[program]
pub mod identity_registry {
    use super::*;
    pub fn initialize_registry(ctx: Context<InitRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn add_issuer(ctx: Context<AddIssuer>) -> Result<()> {
        let issuer_account = &mut ctx.accounts.issuer_account;

        issuer_account.registry = ctx.accounts.registry.key();
        issuer_account.issuer = ctx.accounts.issuer.key();

        Ok(())
    }

    pub fn issue_identity(ctx: Context<IssueIdentity>) -> Result<()> {
        let identity = &mut ctx.accounts.identity;

        identity.owner = ctx.accounts.user.key();
        identity.issuer = ctx.accounts.issuer.key();
        identity.verified = true;
        identity.revoked = false;
        identity.created_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn revoke_identity(ctx: Context<RevokeIdentity>) -> Result<()> {
        ctx.accounts.identity.revoked = true;
        Ok(())
    }
}
