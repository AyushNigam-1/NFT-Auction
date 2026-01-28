use axum::{
    Router,
    routing::{get, patch, post},
};

use crate::handlers::requests_handler::{
    check_verification_status, create_verification_request, get_all_verification_requests,
    review_verification_request,
};

pub fn requests_routes() -> Router {
    Router::new()
        .route("/verify", post(create_verification_request))
        .route("/admin/verify", get(get_all_verification_requests))
        .route("/admin/verify/{id}", patch(review_verification_request))
        .route(
            "/verify/status/{wallet_address}",
            get(check_verification_status),
        )
}
