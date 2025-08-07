use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use governor::{Quota, RateLimiter};
use std::{
    collections::HashMap,
    net::IpAddr,
    num::NonZeroU32,
    sync::Arc,
    time::Duration,
};
use tokio::sync::RwLock;

pub struct RateLimitState {
    limiters: Arc<RwLock<HashMap<IpAddr, Arc<RateLimiter<governor::state::NotKeyed, governor::state::InMemoryState, governor::clock::DefaultClock>>>>>,
}

impl RateLimitState {
    pub fn new() -> Self {
        Self {
            limiters: Arc::new(RwLock::new(HashMap::new())),
        }
    }
}

pub async fn vote_rate_limit_middleware(
    State(rate_limit_state): State<Arc<RateLimitState>>,
    request: Request,
    next: Next,
) -> Response {
    let forwarded_for = request
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .and_then(|s| s.trim().parse::<IpAddr>().ok());
    
    let real_ip = request
        .headers()
        .get("x-real-ip")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<IpAddr>().ok());
    
    let remote_addr = request
        .extensions()
        .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
        .map(|ci| ci.0.ip());
    
    let ip = forwarded_for
        .or(real_ip)
        .or(remote_addr)
        .unwrap_or_else(|| "127.0.0.1".parse().unwrap());
    
    let mut limiters = rate_limit_state.limiters.write().await;
    
    let limiter = limiters.entry(ip).or_insert_with(|| {
        let quota = Quota::with_period(Duration::from_secs(600))
            .unwrap()
            .allow_burst(NonZeroU32::new(25).unwrap());
        Arc::new(RateLimiter::direct(quota))
    });
    
    let limiter = Arc::clone(limiter);
    drop(limiters);
    
    match limiter.check() {
        Ok(_) => next.run(request).await,
        Err(_) => {
            tracing::warn!("Rate limit exceeded for IP: {}", ip);
            (
                StatusCode::TOO_MANY_REQUESTS,
                Json(serde_json::json!({
                    "error": "Rate limit exceeded. Maximum 25 votes allowed per 10 minutes."
                }))
            ).into_response()
        }
    }
}

pub async fn cleanup_old_limiters(rate_limit_state: Arc<RateLimitState>) {
    loop {
        tokio::time::sleep(Duration::from_secs(3600)).await;
        
        let mut limiters = rate_limit_state.limiters.write().await;
        limiters.clear();
        tracing::debug!("Cleared rate limiter cache");
    }
}