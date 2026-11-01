use rusqlite::{types::ValueRef, Connection};
use serde_json::{Map, Number, Value};
use std::path::Path;
use std::sync::Mutex;

static DB: Mutex<Option<Connection>> = Mutex::new(None);

fn ensure_open() -> Result<(), String> {
    {
        let guard = DB.lock().map_err(|e| e.to_string())?;
        if guard.is_some() {
            return Ok(());
        }
    }
    let data_dir = super::paths::get_data_dir()?;
    sqlite_init(data_dir)?;
    Ok(())
}

fn with_conn<T>(f: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
    ensure_open()?;
    let guard = DB.lock().map_err(|e| e.to_string())?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| "Banco não iniciado.".to_string())?;
    f(conn)
}

fn json_from_value(v: ValueRef<'_>) -> Value {
    match v {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(i) => Value::Number(i.into()),
        ValueRef::Real(f) => Number::from_f64(f).map(Value::Number).unwrap_or(Value::Null),
        ValueRef::Text(t) => Value::String(String::from_utf8_lossy(t).into_owned()),
        ValueRef::Blob(b) => Value::String(format!("blob:{}b", b.len())),
    }
}

fn bind_params(stmt: &mut rusqlite::Statement, params: &[Value]) -> Result<(), String> {
    for (i, v) in params.iter().enumerate() {
        let idx: usize = i + 1;
        match v {
            Value::Null => stmt.raw_bind_parameter(idx, &rusqlite::types::Null),
            Value::Bool(b) => stmt.raw_bind_parameter(idx, &(*b as i64)),
            Value::Number(n) => {
                if let Some(i64v) = n.as_i64() {
                    stmt.raw_bind_parameter(idx, &i64v)
                } else if let Some(f) = n.as_f64() {
                    stmt.raw_bind_parameter(idx, &f)
                } else {
                    stmt.raw_bind_parameter(idx, n.to_string().as_str())
                }
            }
            Value::String(s) => stmt.raw_bind_parameter(idx, s.as_str()),
            Value::Array(_) | Value::Object(_) => {
                stmt.raw_bind_parameter(idx, v.to_string().as_str())
            }
        }
        .map_err(|e| format!("parâmetro {}: {e}", i + 1))?;
    }
    Ok(())
}

#[tauri::command]
pub fn sqlite_init(data_dir: String) -> Result<Value, String> {
    let dir = Path::new(&data_dir);
    std::fs::create_dir_all(dir).map_err(|e| format!("criar pasta de dados: {e}"))?;
    let db_path = dir.join("crmgrafica.db");
    let conn = Connection::open(&db_path).map_err(|e| format!("abrir banco: {e}"))?;
    conn.pragma_update(None, "journal_mode", "WAL")
        .map_err(|e| format!("WAL: {e}"))?;
    conn.pragma_update(None, "foreign_keys", "ON")
        .map_err(|e| format!("FK: {e}"))?;
    conn.pragma_update(None, "busy_timeout", 5000i64)
        .map_err(|e| format!("timeout: {e}"))?;
    apply_schema(&conn)?;
    let path_str = db_path.to_string_lossy().to_string();
    *DB.lock().map_err(|e| e.to_string())? = Some(conn);
    Ok(serde_json::json!({ "success": true, "path": path_str }))
}

#[tauri::command]
pub fn sqlite_query(sql: String, params: Option<Vec<Value>>) -> Result<Value, String> {
    let params = params.unwrap_or_default();
    with_conn(|conn| {
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("preparar consulta: {e}"))?;
        bind_params(&mut stmt, &params)?;
        let mut rows = stmt.raw_query();
        let mut out = Vec::new();
        while let Some(row) = rows.next().map_err(|e| format!("ler linha: {e}"))? {
            let mut map = Map::new();
            let count = row.as_ref().column_count();
            for i in 0..count {
                let name = row.as_ref().column_name(i).unwrap_or("col").to_string();
                let value = json_from_value(row.get_ref(i).map_err(|e| format!("coluna {i}: {e}"))?);
                map.insert(name, value);
            }
            out.push(Value::Object(map));
        }
        Ok(Value::Array(out))
    })
}

#[tauri::command]
pub fn sqlite_execute(sql: String, params: Option<Vec<Value>>) -> Result<Value, String> {
    let params = params.unwrap_or_default();
    with_conn(|conn| {
        let mut stmt = conn.prepare(&sql).map_err(|e| format!("preparar comando: {e}"))?;
        bind_params(&mut stmt, &params)?;
        let n = stmt.raw_execute().map_err(|e| format!("executar: {e}"))?;
        let id = conn.last_insert_rowid();
        Ok(serde_json::json!({ "changes": n, "lastInsertRowid": id }))
    })
}

fn apply_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(include_str!("schema.sql"))
        .map_err(|e| format!("aplicar schema: {e}"))
}
