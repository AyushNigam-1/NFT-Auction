use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Identity is not verified")]
    IdentityNotVerified,

    #[msg("Identity has been revoked")]
    IdentityRevoked,

    #[msg("Vault does not exist")]
    InvalidVault,

    #[msg("Amount can not be zero")]
    InvalidAmount,

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

    #[msg("Trading is currently frozen by the admin.")]
    TradingFrozen,

    #[msg("Transaction exceeds the maximum allowed shares.")]
    LimitExceeded,

    #[msg("The Dealer vault does not have enough cash to buy your shares.")]
    InsufficientDealerLiquidity,

    #[msg("Slippage tolerance exceeded.")]
    SlippageExceeded,

    #[msg("Account data is invalid or cannot be deserialized.")]
    InvalidAccountData,

    #[msg("Identity account does not belong to the signer.")]
    IdentityOwnerMismatch,
}
