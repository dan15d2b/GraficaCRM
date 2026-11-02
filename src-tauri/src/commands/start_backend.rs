// Este módulo fornece o ponto de entrada para inicialização do backend
// O Tauri usa IPC direto para SQLite, eliminando a necessidade de servidor HTTP

use crate::commands::{sqlite_init, sqlite_query};
use rusqlite::Connection;
use serde_json::json;
use std::path::PathBuf;

/// Estado compartilhado para o backend
pub struct BackendState {
    pub db_path: PathBuf,
    pub initialized: bool,
}

/// Inicializa o backend Tauri Desktop
/// - Inicializa SQLite local via rusqlite
/// - Verifica se setup está completo
/// - Retorna status da inicialização
#[tauri::command]
pub async fn init_tauri_backend() -> Result<String, String> {
    // O SQLite já é inicializado pelo Tauri via sqlite_init
    // Este comando é um placeholder para sinalizar que o backend está pronto

    Ok(json!({
        "success": true,
        "mode": "tauri-ipc",
        "database": "sqlite-wal"
    }).to_string())
}

/// Verifica se o setup foi completado (usado pelo frontend)
#[tauri::command]
pub async fn check_setup_status() -> Result<bool, String> {
    // Esta função usa o schema.sql que já existe
    // O frontend pode chamar sqlite_query diretamente

    // Para verificar setup:
    // Retorna true se a tabela setup_status tem valor 'true'
    Ok(true) // Placeholder - será atualizado
}