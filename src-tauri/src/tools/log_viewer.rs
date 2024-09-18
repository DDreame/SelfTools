use chrono::{DateTime, FixedOffset, NaiveDateTime, TimeZone, Utc};
use lazy_static::lazy_static;
use regex::Regex;
use std::fs::File;
use std::io::{BufRead, BufReader, Seek, SeekFrom};
use tauri::command;

const MAX_READ_SIZE: u64 = 1024 * 1024; // 1MB
pub const MAX_LOGS: usize = 10000; // 最大返回日志行数

lazy_static! {
    static ref TIMESTAMP_REGEX: Regex = Regex::new(r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}").unwrap();
    static ref LEVEL_REGEX: Regex = Regex::new(r"\[(Debug|Info|Warning|Error)\]").unwrap();
    static ref CHINA_OFFSET: FixedOffset = FixedOffset::east_opt(8 * 3600).unwrap(); // UTC+8
}

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
                NaiveDateTime::parse_from_str(timestamp_str.as_str(), "%Y-%m-%d %H:%M:%S")
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
    use chrono::NaiveDate;
    use std::io::Write;
    use tempfile::NamedTempFile;

    #[test]
    fn test_parse_date_time() {
        let valid_date = "2023-05-01T12:00:00+08:00";
        let result = parse_date_time(valid_date).unwrap().unwrap();
        assert_eq!(
            result.naive_local(),
            NaiveDate::from_ymd_opt(2023, 5, 1)
                .unwrap()
                .and_hms_opt(12, 0, 0)
                .unwrap()
        );

        let empty_date = "";
        assert!(parse_date_time(empty_date).unwrap().is_none());

        let invalid_date = "not a date";
        assert!(parse_date_time(invalid_date).is_err());
    }

    #[test]
    fn test_filter_log() {
        let log_line = "2023-05-01 12:00:00 [Info] Test log message";

        // 测试过滤器
        assert!(filter_log(log_line, "Test", "All", None, None));
        assert!(!filter_log(log_line, "NonExistent", "All", None, None));

        // 测试日志级别
        assert!(filter_log(log_line, "", "Info", None, None));
        assert!(!filter_log(log_line, "", "Debug", None, None));

        // 测试日期范围
        let start = parse_date_time("2023-05-01T00:00:00+08:00")
            .unwrap()
            .unwrap();
        let end = parse_date_time("2023-05-02T00:00:00+08:00")
            .unwrap()
            .unwrap();
        assert!(filter_log(log_line, "", "All", Some(start), Some(end)));

        let start = parse_date_time("2023-05-02T00:00:00+08:00")
            .unwrap()
            .unwrap();
        let end = parse_date_time("2023-05-03T00:00:00+08:00")
            .unwrap()
            .unwrap();
        assert!(!filter_log(log_line, "", "All", Some(start), Some(end)));
    }

    #[test]
    fn test_fetch_logs() -> Result<(), Box<dyn std::error::Error>> {
        // 创建一个临时日志文件
        let mut temp_file = NamedTempFile::new()?;
        writeln!(temp_file, "2023-05-01 12:00:00 [Info] Test log message 1")?;
        writeln!(temp_file, "2023-05-01 12:01:00 [Debug] Test log message 2")?;
        writeln!(
            temp_file,
            "2023-05-01 12:02:00 [Warning] Test log message 3"
        )?;

        let log_path = temp_file.path().to_str().unwrap().to_string();

        // 测试基本功能
        let logs = fetch_logs(
            log_path.clone(),
            "".to_string(),
            "All".to_string(),
            "".to_string(),
            "".to_string(),
        )?;
        assert_eq!(logs.len(), 3);

        // 测试过滤器
        let logs = fetch_logs(
            log_path.clone(),
            "message 2".to_string(),
            "All".to_string(),
            "".to_string(),
            "".to_string(),
        )?;
        assert_eq!(logs.len(), 1);
        assert!(logs[0].contains("message 2"));

        // 测试日志级别
        let logs = fetch_logs(
            log_path.clone(),
            "".to_string(),
            "Warning".to_string(),
            "".to_string(),
            "".to_string(),
        )?;
        assert_eq!(logs.len(), 1);
        assert!(logs[0].contains("[Warning]"));

        // 测试日期范围
        let start = "2023-05-01T12:00:30+08:00".to_string();
        let end = "2023-05-01T12:01:30+08:00".to_string();
        let logs = fetch_logs(log_path, "".to_string(), "All".to_string(), start, end)?;
        assert_eq!(logs.len(), 1);
        assert!(logs[0].contains("message 2"));

        Ok(())
    }
}
