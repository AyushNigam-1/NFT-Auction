use anchor_lang::prelude::*;

#[error_code]
pub enum IdentityError {
    #[msg("Unauthorized access attempt")]
    UnauthorizedIssuer,
    #[msg("Unauthorized access attempt")]
    Unauthorized,
    #[msg("Badge already issued to this recipient")]
    BadgeAlreadyIssued,
    #[msg("Invalid metadata parameters")]
    InvalidMetadata,
}
