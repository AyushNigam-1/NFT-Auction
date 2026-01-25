use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::types::Json as DbJson;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VerificationStatus {
    Pending,
    Approved,
    Rejected,
    Revoked,
}

impl VerificationStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            VerificationStatus::Pending => "pending",
            VerificationStatus::Approved => "approved",
            VerificationStatus::Rejected => "rejected",
            VerificationStatus::Revoked => "revoked",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerificationRequest {
    pub id: Uuid,
    pub wallet_address: String,
    pub document_uris: DbJson<Vec<String>>, // JSONB
    pub status: VerificationStatus,
    pub requested_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub reviewer_wallet: Option<String>,
    pub review_reason: Option<String>,
    pub identity_pda: Option<String>,
    pub issue_tx_signature: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateVerificationRequest {
    pub wallet_address: String,
    pub document_uris: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewVerificationPayload {
    pub approve: bool,
    pub review_reason: Option<String>,
}
