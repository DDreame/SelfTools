#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod tools;
#[warn(unused_imports)]
use tauri::Manager;
use tools::*;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(debug_assertions)]
            {
                let window = _app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![fetch_folder_logs, fetch_logs])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
