use tauri::command;

#[command]
pub fn get_data_dir() -> Result<String, String> {
    dirs_next::data_dir()
        .map(|d| d.join("crmgrafica").to_string_lossy().to_string())
        .ok_or_else(|| "failed to resolve data dir".to_string())
}

#[command]
pub fn get_config_dir() -> Result<String, String> {
    dirs_next::config_dir()
        .map(|d| d.join("crmgrafica").to_string_lossy().to_string())
        .ok_or_else(|| "failed to resolve config dir".to_string())
}

#[command]
pub fn get_app_dir() -> Result<String, String> {
    dirs_next::data_dir()
        .map(|d| d.join("crmgrafica").to_string_lossy().to_string())
        .ok_or_else(|| "failed to resolve app dir".to_string())
}
