use chrono::{DateTime, FixedOffset, NaiveDateTime, Utc};
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use tauri::command;

const MAX_READ_SIZE: u64 = 1024 * 1024; // 1MB

#[command]
pub fn fetch_logs(
    log_path: String,
    filter: String,
    level: String,
    start_date_time: String,
    end_date_time: String,
) -> Result<Vec<String>, String> {
    let file = File::open(&log_path).map_err(|e| format!("无法打开日志文件: {}", e))?;
    let file_size = file
        .metadata()
        .map_err(|e| format!("无法获取文件元数据: {}", e))?
        .len();
    let start_pos = if file_size > MAX_READ_SIZE {
        file_size - MAX_READ_SIZE
    } else {
        0
    };

    let mut reader = BufReader::new(file);
    reader
        .seek(SeekFrom::Start(start_pos))
        .map_err(|e| format!("无法定位文件位置: {}", e))?;

    let timestamp_regex = Regex::new(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}").unwrap();
    let level_regex = Regex::new(r"\[(Debug|Info|Warning|Error)\]").unwrap();

    let china_offset = FixedOffset::east_opt(8 * 3600).unwrap(); // UTC+8

    let start_date_time = if !start_date_time.is_empty() {
        Some(
            DateTime::parse_from_rfc3339(&start_date_time)
                .map_err(|e| format!("无效的开始时间: {}", e))?,
        )
    } else {
        None
    };

    let end_date_time = if !end_date_time.is_empty() {
        Some(
            DateTime::parse_from_rfc3339(&end_date_time)
                .map_err(|e| format!("无效的结束时间: {}", e))?,
        )
    } else {
        None
    };

    Ok(reader
        .lines()
        .map_while(|line| line.ok())
        .filter(|line| {
            if !filter.is_empty() && !line.contains(&filter) {
                return false;
            }

            if level != "All" {
                if let Some(captures) = level_regex.captures(line) {
                    if captures[1] != level {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            if let (Some(start), Some(end)) = (start_date_time, end_date_time) {
                if let Some(timestamp_str) = timestamp_regex.find(line) {
                    let log_date =
                        NaiveDateTime::parse_from_str(timestamp_str.as_str(), "%Y-%m-%d %H:%M:%S")
                            .map(|dt| {
                                DateTime::<FixedOffset>::from_naive_utc_and_offset(dt, china_offset)
                            })
                            .unwrap_or_else(|_| Utc::now().with_timezone(&china_offset));
                    return log_date >= start && log_date <= end;
                }
                return false;
            }

            true
        })
        .collect())
}
