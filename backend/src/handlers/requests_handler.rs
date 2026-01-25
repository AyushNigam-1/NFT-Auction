use axum::Json as AxumJson;
use axum::{Extension, extract::Path, http::StatusCode};

use chrono::Utc;
use sqlx::types::Json as DbJson;
use sqlx::{PgPool, Row, postgres::PgRow};
use uuid::Uuid;

use crate::{
    models::requests::{
        CreateVerificationRequest, ReviewVerificationPayload, VerificationRequest,
        VerificationStatus,
    },
    state::AppState,
};

/// -----------------------------------------------------
/// Create verification request
/// -----------------------------------------------------
pub async fn create_verification_request(
    Extension(state): Extension<AppState>,
    AxumJson(payload): AxumJson<CreateVerificationRequest>,
) -> Result<AxumJson<VerificationRequest>, StatusCode> {
    if payload.document_uris.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    let request = VerificationRequest {
        id: Uuid::new_v4(),
        wallet_address: payload.wallet_address,
        document_uris: DbJson(payload.document_uris),
        status: VerificationStatus::Pending,
        requested_at: Utc::now(),
        reviewed_at: None,
        reviewer_wallet: None,
        review_reason: None,
        identity_pda: None,
        issue_tx_signature: None,
    };

    save_verification_request(&state.db, &request)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(AxumJson(request))
}

/// -----------------------------------------------------
/// Insert verification request
/// -----------------------------------------------------
pub async fn save_verification_request(
    db: &PgPool,
    request: &VerificationRequest,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO verification_requests (
            id,
            wallet_address,
            document_uris,
            status,
            requested_at,
            reviewed_at,
            reviewer_wallet,
            review_reason,
            identity_pda,
            issue_tx_signature
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        "#,
    )
    .bind(request.id)
    .bind(&request.wallet_address)
    .bind(&request.document_uris)
    .bind(request.status.as_str())
    .bind(request.requested_at)
    .bind(request.reviewed_at)
    .bind(&request.reviewer_wallet)
    .bind(&request.review_reason)
    .bind(&request.identity_pda)
    .bind(&request.issue_tx_signature)
    .execute(db)
    .await?;

    Ok(())
}

/// -----------------------------------------------------
/// Fetch all verification requests (RAW, NO DESERIALIZATION)
/// -----------------------------------------------------
pub async fn get_all_verification_requests(
    Extension(state): Extension<AppState>,
) -> Result<AxumJson<Vec<serde_json::Value>>, StatusCode> {
    let rows: Vec<PgRow> = sqlx::query(
        r#"
        SELECT
            id,
            wallet_address,
            document_uris,
            status,
            requested_at,
            reviewed_at,
            reviewer_wallet,
            review_reason,
            identity_pda,
            issue_tx_signature
        FROM verification_requests
        ORDER BY requested_at DESC
        "#,
    )
    .fetch_all(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result = rows
        .into_iter()
        .map(|row| {
            serde_json::json!({
                "id": row.get::<Uuid, _>("id"),
                "wallet_address": row.get::<String, _>("wallet_address"),
                "document_uris": row.get::<serde_json::Value, _>("document_uris"),
                "status": row.get::<String, _>("status"),
                "requested_at": row.get::<chrono::DateTime<Utc>, _>("requested_at"),
                "reviewed_at": row.get::<Option<chrono::DateTime<Utc>>, _>("reviewed_at"),
                "reviewer_wallet": row.get::<Option<String>, _>("reviewer_wallet"),
                "review_reason": row.get::<Option<String>, _>("review_reason"),
                "identity_pda": row.get::<Option<String>, _>("identity_pda"),
                "issue_tx_signature": row.get::<Option<String>, _>("issue_tx_signature"),
            })
        })
        .collect();

    Ok(AxumJson(result))
}

/// -----------------------------------------------------
/// Approve / Reject verification request
/// -----------------------------------------------------
pub async fn review_verification_request(
    Path(request_id): Path<Uuid>,
    Extension(state): Extension<AppState>,
    AxumJson(payload): AxumJson<ReviewVerificationPayload>,
) -> Result<StatusCode, StatusCode> {
    let new_status = if payload.approve {
        VerificationStatus::Approved
    } else {
        VerificationStatus::Rejected
    };

    let result = sqlx::query(
        r#"
        UPDATE verification_requests
        SET
            status = $1,
            reviewed_at = $2,
            reviewer_wallet = $3,
            review_reason = $4
        WHERE id = $5
          AND status = 'pending'
        "#,
    )
    .bind(new_status.as_str())
    .bind(Utc::now())
    .bind(&state.issuer_wallet)
    .bind(&payload.review_reason)
    .bind(request_id)
    .execute(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.rows_affected() == 0 {
        return Err(StatusCode::CONFLICT);
    }

    Ok(StatusCode::NO_CONTENT)
}
