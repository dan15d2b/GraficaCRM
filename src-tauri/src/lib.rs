// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::{Path, PathBuf};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};

/// Returns the path to the embedded static frontend.
fn static_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    app_handle
        .path_resolver()
        .app_data_dir()
        .expect("app data dir unavailable")
        .join("crmgrafica")
        .join("app")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            #[cfg(dev)]
            {
                let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                    .title("CRM Gráfica")
                    .inner_size(1280.0, 800.0)
                    .resizable(true)
                    .build()?;
                let _ = win;
                return Ok(());
            }

            // ── Prod: serve embedded static files ──────────────────
            let static_src = PathBuf::from("/app/static");
            let static_dest = static_dir(app.handle());

            // Copy embedded assets once to app-data dir
            if !static_dest.join("index.html").exists() {
                if static_src.join("index.html").exists() {
                    copy_dir_all(&static_src, &static_dest)?;
                }
            }

            // Point WebView at the local HTML file
            let url = format!("file:///{}/index.html", static_dest.display());
            let win = WebviewWindowBuilder::new(app, "main", WebviewUrl::App(url.parse().unwrap()))
                .title("CRM Gráfica")
                .inner_size(1280.0, 800.0)
                .resizable(true)
                .build()?;
            let _ = win;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dst)?;
    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            std::fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}
