use super::log_viewer::{filter_log, parse_date_time, MAX_LOGS};
use chrono::{DateTime, FixedOffset, Utc};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use std::path::Path;
use tauri::command;

const MAX_READ_SIZE: u64 = 1024 * 1024; // 1MB

#[command]
pub fn fetch_folder_logs(
    folder_path: String,
    filter: String,
    level: String,
    start_date_time: String,
    end_date_time: String,
) -> Result<Vec<String>, String> {
    let latest_log_file = get_latest_log_file(&folder_path)?;
    let file = File::open(&latest_log_file).map_err(|e| format!("无法打开日志文件: {}", e))?;
    let file_size = file
        .metadata()
        .map_err(|e| format!("无法获取文件元数据: {}", e))?
        .len();
    let start_pos = file_size.saturating_sub(MAX_READ_SIZE);

    let mut reader = BufReader::new(file);
    reader
        .seek(SeekFrom::Start(start_pos))
        .map_err(|e| format!("无法定位文件位置: {}", e))?;

    let start_date_time = parse_date_time(&start_date_time)?;
    let end_date_time = parse_date_time(&end_date_time)?;

    let logs: Vec<String> = reader
        .lines()
        .map_while(Result::ok)
        .filter(|line| filter_log(line, &filter, &level, start_date_time, end_date_time))
        .take(MAX_LOGS)
        .collect();

    Ok(logs)
}

fn get_latest_log_file(folder_path: &str) -> Result<String, String> {
    let path = Path::new(folder_path);
    let mut latest_file: Option<(String, DateTime<FixedOffset>)> = None;

    for entry in fs::read_dir(path).map_err(|e| format!("无法读取文件夹: {}", e))? {
        let entry = entry.map_err(|e| format!("无法读取文件夹条目: {}", e))?;
        let file_path = entry.path();

        if file_path.is_file()
            && file_path
                .extension()
                .map_or(false, |ext| ext == "log" || ext == "txt")
        {
            if let Ok(metadata) = entry.metadata() {
                if let Ok(modified) = metadata.modified() {
                    let modified: DateTime<Utc> = modified.into();
                    let modified = modified.with_timezone(&FixedOffset::east_opt(0).unwrap());
                    if let Some((_, latest_modified)) = latest_file {
                        if modified > latest_modified {
                            latest_file =
                                Some((file_path.to_string_lossy().into_owned(), modified));
                        }
                    } else {
                        latest_file = Some((file_path.to_string_lossy().into_owned(), modified));
                    }
                }
            }
        }
    }

    latest_file
        .map(|(file, _)| file)
        .ok_or_else(|| "未找到日志文件".to_string())
}
