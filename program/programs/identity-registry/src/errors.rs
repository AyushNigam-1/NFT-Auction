use anchor_lang::prelude::*;

#[error_code]
pub enum IdentityRegistryError {
    #[msg("Unauthorized access attempt")]
    Unauthorized,
    #[msg("Badge already issued to this recipient")]
    BadgeAlreadyIssued,
    #[msg("Invalid metadata parameters")]
    InvalidMetadata,
}
