use sqlx::PgPool;
use sqlx::postgres::PgPoolOptions;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub issuer_wallet: String,
}

impl AppState {
    pub async fn new(database_url: &str) -> Self {
        let db = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
            .expect("❌ Failed to connect to DB");
        let issuer_wallet = "FUk2WGh5Kcxk8sRm6V9jRYgWiQML7X8DPTKaK9Eqc1ry".to_string();
        Self { db, issuer_wallet }
    }
}
