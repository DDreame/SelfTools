use tauri::command;

#[command]
pub fn hammer_hit(count: i32) -> i32 {
    println!("锤子被敲打了 {} 次", count);
    count
}
