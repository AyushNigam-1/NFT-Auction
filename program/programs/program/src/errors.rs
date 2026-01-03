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
}
