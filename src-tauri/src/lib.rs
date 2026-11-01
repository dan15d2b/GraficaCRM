pub mod commands;
use commands::{
    get_app_dir, get_config_dir, get_data_dir, login_local, setup_complete, setup_status,
    sqlite_execute, sqlite_init, sqlite_query,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_data_dir,
            get_config_dir,
            get_app_dir,
            sqlite_init,
            sqlite_query,
            sqlite_execute,
            setup_status,
            setup_complete,
            login_local,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
