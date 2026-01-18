use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Auction has already ended")]
    AuctionEnded,
    #[msg("Auction has not ended yet")]
    AuctionNotEnded,
    #[msg("Bid is too low")]
    BidTooLow,
    #[msg("Reserve price not met")]
    ReserveNotMet,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Calculation overflowed during yield math.")]
    MathOverflow, // Used for checked_mul/div failures

    #[msg("The user does not own any shares in this property.")]
    NoSharesOwned, // Prevents non-holders from calling claim

    #[msg("There is currently no rent yield available to claim.")]
    NoYieldToClaim, // Occurs if the property PDA is empty

    #[msg("The property vault does not have enough SOL to fulfill this claim.")]
    InsufficientVaultBalance, // Safety check before lamport transfer

    #[msg("Unauthorized: Only the property owner can perform this action.")]
    UnauthorizedOwner, // For deposit_rent has_one checks
}
