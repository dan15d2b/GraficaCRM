use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::path::PathBuf;

use super::paths::{get_config_dir, get_data_dir};
use super::sqlite::{sqlite_execute, sqlite_init, sqlite_query};

#[derive(Serialize)]
pub struct SetupStatus {
    pub configured: bool,
    pub data_dir: String,
    pub config_dir: String,
}

fn config_file() -> Result<PathBuf, String> {
    let dir = get_config_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(PathBuf::from(dir).join("config.json"))
}

fn hash_password(password: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(b":");
    hasher.update(password.as_bytes());
    hex::encode(hasher.finalize())
}

fn random_token() -> String {
    use rand::RngCore;
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}

#[tauri::command]
pub fn setup_status() -> Result<SetupStatus, String> {
    let data_dir = get_data_dir()?;
    let config_dir = get_config_dir()?;
    let configured = config_file()?.exists();
    Ok(SetupStatus {
        configured,
        data_dir,
        config_dir,
    })
}

#[derive(Deserialize)]
pub struct SetupInput {
    pub company_name: String,
    pub cnpj: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub admin_name: String,
    pub admin_email: String,
    pub admin_password: String,
    pub openrouter_key: Option<String>,
    pub waha_base_url: Option<String>,
    pub waha_api_key: Option<String>,
}

#[tauri::command]
pub fn setup_complete(input: SetupInput) -> Result<Value, String> {
    if input.admin_password.len() < 8 {
        return Err("Senha do administrador precisa ter pelo menos 8 caracteres.".into());
    }
    if input.company_name.trim().is_empty() || input.admin_name.trim().is_empty() {
        return Err("Nome da empresa e do administrador são obrigatórios.".into());
    }
    let data_dir = get_data_dir()?;
    sqlite_init(data_dir.clone())?;

    let org_id = uuid::Uuid::new_v4().to_string();
    let user_id = uuid::Uuid::new_v4().to_string();
    let salt = random_token();
    let password_hash = hash_password(&input.admin_password, &salt);
    let api_token = random_token();

    sqlite_execute(
        "INSERT INTO organizations (id, name, cnpj, phone, address) VALUES (?1, ?2, ?3, ?4, ?5)"
            .into(),
        Some(vec![
            Value::String(org_id.clone()),
            Value::String(input.company_name.trim().to_string()),
            opt_str(input.cnpj),
            opt_str(input.phone),
            opt_str(input.address),
        ]),
    )?;
    sqlite_execute(
        "INSERT INTO users (id, organization_id, name, email, password_hash, salt, role) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'dono')"
            .into(),
        Some(vec![
            Value::String(user_id.clone()),
            Value::String(org_id.clone()),
            Value::String(input.admin_name.trim().to_string()),
            Value::String(input.admin_email.trim().to_lowercase()),
            Value::String(password_hash),
            Value::String(salt),
        ]),
    )?;

    let config = serde_json::json!({
        "organization_id": org_id,
        "api_token": api_token,
        "bind": "127.0.0.1",
        "openrouter_key": input.openrouter_key.filter(|s| !s.trim().is_empty()),
        "waha_base_url": input.waha_base_url.filter(|s| !s.trim().is_empty()),
        "waha_api_key": input.waha_api_key.filter(|s| !s.trim().is_empty()),
        "quote_module_enabled": true,
        "version": "0.1.0"
    });
    let path = config_file()?;
    std::fs::write(&path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| format!("gravar config: {e}"))?;

    let discovery = PathBuf::from(&data_dir).join("discovery.json");
    std::fs::write(
        &discovery,
        serde_json::to_string_pretty(&serde_json::json!({
            "version": "1.0.0",
            "token": api_token,
            "deepLinkProtocol": "crmgrafica"
        }))
        .map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("gravar discovery: {e}"))?;

    Ok(serde_json::json!({
        "organization_id": org_id,
        "user_id": user_id,
        "data_dir": data_dir
    }))
}

fn opt_str(v: Option<String>) -> Value {
    match v.map(|s| s.trim().to_string()).filter(|s| !s.is_empty()) {
        Some(s) => Value::String(s),
        None => Value::Null,
    }
}

#[derive(Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[tauri::command]
pub fn login_local(input: LoginInput) -> Result<Value, String> {
    let rows = sqlite_query(
        "SELECT id, organization_id, name, email, password_hash, salt, role FROM users WHERE email = ?1"
            .into(),
        Some(vec![Value::String(input.email.trim().to_lowercase())]),
    )?;
    let arr = rows.as_array().ok_or("resposta inválida")?;
    let row = arr.first().ok_or("E-mail ou senha incorretos.")?;
    let salt = row["salt"].as_str().unwrap_or("");
    let expected = row["password_hash"].as_str().unwrap_or("");
    let got = hash_password(&input.password, salt);
    if got.len() != expected.len() || !constant_eq(got.as_bytes(), expected.as_bytes()) {
        return Err("E-mail ou senha incorretos.".into());
    }
    Ok(serde_json::json!({
        "id": row["id"],
        "organization_id": row["organization_id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"]
    }))
}

fn constant_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}
