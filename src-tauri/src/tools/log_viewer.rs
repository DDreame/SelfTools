use chrono::{DateTime, FixedOffset, NaiveDateTime, TimeZone, Utc};
use lazy_static::lazy_static;
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use tauri::command;

const MAX_READ_SIZE: u64 = 2 * 1024 * 1024; // 1MB

lazy_static! {
    static ref TIMESTAMP_REGEX: Regex = Regex::new(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \d{3}").unwrap();
    static ref LEVEL_REGEX: Regex = Regex::new(r"\[(Debug|Info|Warning|Error)\]:").unwrap();
    static ref CHINA_OFFSET: FixedOffset = FixedOffset::east_opt(8 * 3600).unwrap(); // UTC+8
}

#[command]
pub fn fetch_logs(
    path: String,
    filter: String,
    level: String,
    start_date_time: String,
    end_date_time: String,
) -> Result<Vec<String>, String> {
    let file = File::open(&path).map_err(|e| format!("无法打开日志文件: {}", e))?;
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
        .collect();

    Ok(logs)
}

pub fn parse_date_time(date_time: &str) -> Result<Option<DateTime<FixedOffset>>, String> {
    if date_time.is_empty() {
        Ok(None)
    } else {
        DateTime::parse_from_rfc3339(date_time)
            .map(|dt| Some(dt.with_timezone(&*CHINA_OFFSET)))
            .map_err(|e| format!("无效的时间: {}", e))
    }
}

pub fn filter_log(
    line: &str,
    filter: &str,
    level: &str,
    start_date_time: Option<DateTime<FixedOffset>>,
    end_date_time: Option<DateTime<FixedOffset>>,
) -> bool {
    if !filter.is_empty() && !line.contains(filter) {
        return false;
    }

    if level != "All" {
        if let Some(captures) = LEVEL_REGEX.captures(line) {
            if &captures[1] != level {
                return false;
            }
        } else {
            return false;
        }
    }

    if let (Some(start), Some(end)) = (start_date_time, end_date_time) {
        if let Some(timestamp_str) = TIMESTAMP_REGEX.find(line) {
            let log_date =
                NaiveDateTime::parse_from_str(timestamp_str.as_str(), "%Y-%m-%d %H:%M:%S %3f")
                    .map(|dt| CHINA_OFFSET.from_local_datetime(&dt).unwrap())
                    .unwrap_or_else(|_| CHINA_OFFSET.from_utc_datetime(&Utc::now().naive_utc()));
            return log_date >= start && log_date < end;
        }
        return false;
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn test_parse_date_time() {
        let valid_time = "2024-09-14T13:41:52+08:00";
        let result = parse_date_time(valid_time).unwrap().unwrap();
        assert_eq!(
            result,
            CHINA_OFFSET
                .with_ymd_and_hms(2024, 9, 14, 13, 41, 52)
                .single()
                .unwrap()
        );

        let empty_time = "";
        assert!(parse_date_time(empty_time).unwrap().is_none());

        let invalid_time = "invalid_time";
        assert!(parse_date_time(invalid_time).is_err());
    }

    #[test]
    fn test_filter_log() {
        let log_line = "2024-09-14 13:41:52 674:[Debug]: Get Device UUID End";

        // 测试过滤器
        assert!(filter_log(log_line, "Device", "All", None, None));
        assert!(!filter_log(log_line, "NotExist", "All", None, None));

        // 测试日志级别
        assert!(filter_log(log_line, "", "Debug", None, None));
        assert!(!filter_log(log_line, "", "Error", None, None));

        // 测试时间范围
        let start = CHINA_OFFSET
            .with_ymd_and_hms(2024, 9, 14, 13, 0, 0)
            .single()
            .unwrap();
        let end = CHINA_OFFSET
            .with_ymd_and_hms(2024, 9, 14, 14, 0, 0)
            .single()
            .unwrap();
        assert!(filter_log(log_line, "", "All", Some(start), Some(end)));

        let start = CHINA_OFFSET
            .with_ymd_and_hms(2024, 9, 14, 14, 0, 0)
            .single()
            .unwrap();
        let end = CHINA_OFFSET
            .with_ymd_and_hms(2024, 9, 14, 15, 0, 0)
            .single()
            .unwrap();
        assert!(!filter_log(log_line, "", "All", Some(start), Some(end)));
    }

    #[test]
    fn test_regex_patterns() {
        let log_line = "2024-09-14 13:41:52 674:[Debug]: Get Device UUID End";

        assert!(TIMESTAMP_REGEX.is_match(log_line));
        assert!(LEVEL_REGEX.is_match(log_line));

        let captures = LEVEL_REGEX.captures(log_line).unwrap();
        assert_eq!(&captures[1], "Debug");
    }
}
