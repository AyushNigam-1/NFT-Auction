pub mod requests_routes;
use axum::Router;

pub fn create_routes() -> Router {
    Router::new().merge(requests_routes::requests_routes())
}
