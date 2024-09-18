import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import styled from 'styled-components';
import debounce from 'lodash/debounce';
import moment from 'moment-timezone';
import {
  LogViewerContainer,
  ControlPanel,
  LogContent,
  LogInfo,
  LogDisplay,
  StyledInput,
  StyledSelect,
  StyledButton,
  StyledDateTimeInput,
  LogLine,
  TimeStamp,
  LogLevel,
  JsonContent,
} from './LogViewer'; // 导入共享的样式组件

const MAX_STORED_LOGS = 10000;

const FolderLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>(() => {
    const savedLogs = localStorage.getItem('folderLogViewerLogs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [filter, setFilter] = useState(() => localStorage.getItem('folderLogViewerFilter') || '');
  const [level, setLevel] = useState(() => localStorage.getItem('folderLogViewerLevel') || 'All');
  const [startDateTime, setStartDateTime] = useState(() => localStorage.getItem('folderLogViewerStartDateTime') || '');
  const [endDateTime, setEndDateTime] = useState(() => localStorage.getItem('folderLogViewerEndDateTime') || '');
  const [folderPath, setFolderPath] = useState(() => localStorage.getItem('folderLogViewerFolderPath') || '');
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const debouncedFetchLogs = useCallback(
    debounce(() => {
      fetchLogs();
    }, 300),
    [folderPath, filter, level, startDateTime, endDateTime]
  );

  useEffect(() => {
    if (folderPath) {
      debouncedFetchLogs();
      const interval = setInterval(debouncedFetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [folderPath, filter, level, startDateTime, endDateTime, debouncedFetchLogs]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerLogs', JSON.stringify(logs.slice(-MAX_STORED_LOGS)));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerFilter', filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerLevel', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerStartDateTime', startDateTime);
  }, [startDateTime]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerEndDateTime', endDateTime);
  }, [endDateTime]);

  useEffect(() => {
    localStorage.setItem('folderLogViewerFolderPath', folderPath);
  }, [folderPath]);

  const parseTimestamp = useCallback((timestamp: string): string | null => {
    const date = moment.tz(timestamp, 'YYYY-MM-DD HH:mm:ss', 'Asia/Shanghai');
    if (!date.isValid()) {
      console.error(`无效的时间戳: ${timestamp}`);
      return null;
    }
    return date.format('YYYY-MM-DDTHH:mm:ss');
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!folderPath) return;
    try {
      setError(null);
      const result = await invoke('fetch_folder_logs', {
        folderPath,
        filter,
        level,
        startDateTime: startDateTime ? moment.tz(startDateTime, 'Asia/Shanghai').toISOString(true) : '',
        endDateTime: endDateTime ? moment.tz(endDateTime, 'Asia/Shanghai').toISOString(true) : ''
      });
      const fetchedLogs = result as string[];
      setLogs(fetchedLogs);

      if (fetchedLogs.length > 0 && isInitialLoad) {
        const firstLog = fetchedLogs[0];
        const lastLog = fetchedLogs[fetchedLogs.length - 1];

        const firstTimestamp = parseTimestamp(firstLog.split(' ').slice(0, 2).join(' '));
        const lastTimestamp = parseTimestamp(lastLog.split(' ').slice(0, 2).join(' '));

        if (firstTimestamp) {
          setStartDateTime(firstTimestamp);
        }
        if (lastTimestamp) {
          setEndDateTime(lastTimestamp);
        }
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('获取日志时出错:', error);
      setError(`获取日志时出错: ${error}`);
    }
  }, [folderPath, filter, level, startDateTime, endDateTime, isInitialLoad, parseTimestamp]);

  const selectLogFolder = useCallback(async () => {
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (selected && typeof selected === 'string') {
      setFolderPath(selected);
      setStartDateTime('');
      setEndDateTime('');
      setIsInitialLoad(true);
    }
  }, []);

  const resetToDefault = useCallback(() => {
    setFilter('');
    setLevel('All');
    setStartDateTime('');
    setEndDateTime('');
    setIsInitialLoad(true);
    fetchLogs();
  }, [fetchLogs]);

  const clearCache = useCallback(() => {
    localStorage.removeItem('folderLogViewerLogs');
    localStorage.removeItem('folderLogViewerFilter');
    localStorage.removeItem('folderLogViewerLevel');
    localStorage.removeItem('folderLogViewerStartDateTime');
    localStorage.removeItem('folderLogViewerEndDateTime');
    localStorage.removeItem('folderLogViewerFolderPath');
    setLogs([]);
    setFilter('');
    setLevel('All');
    setStartDateTime('');
    setEndDateTime('');
    setFolderPath('');
    setIsInitialLoad(true);
  }, []);

  const formatDateTime = useCallback((dateTime: string): string => {
    return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
  }, []);

  const highlightJson = useCallback((content: string) => {
    const parts = content.split(/(\{.*?\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return <JsonContent key={index}>{part}</JsonContent>;
      }
      return <span key={index}>{part}</span>;
    });
  }, []);

  const renderLogLine = useCallback((line: string) => {
    const [timestamp, level, ...rest] = line.split(' ');
    const content = rest.join(' ');
    return (
      <LogLine>
        <TimeStamp>{timestamp}</TimeStamp>{' '}
        <LogLevel level={level}>{level}</LogLevel>:{' '}
        {highlightJson(content)}
      </LogLine>
    );
  }, [highlightJson]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter && !log.toLowerCase().includes(filter.toLowerCase())) {
        return false;
      }
      if (level !== 'All' && !log.includes(`[${level}]`)) {
        return false;
      }
      return true;
    });
  }, [logs, filter, level]);

  return (
    <LogViewerContainer>
      <ControlPanel>
        <StyledButton onClick={selectLogFolder}>选择日志文件夹</StyledButton>
        <StyledInput
          type="text"
          placeholder="过滤日志"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <StyledSelect value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="All">所有级别</option>
          <option value="Debug">Debug</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
        </StyledSelect>
        <StyledDateTimeInput
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
          step="1"
        />
        <StyledDateTimeInput
          type="datetime-local"
          value={endDateTime}
          onChange={(e) => setEndDateTime(e.target.value)}
          step="1"
        />
        <StyledButton onClick={fetchLogs}>刷新</StyledButton>
        <StyledButton onClick={resetToDefault}>重置</StyledButton>
        <StyledButton onClick={clearCache}>清除缓存</StyledButton>
      </ControlPanel>
      <LogContent>
        {folderPath && (
          <LogInfo>
            <div>当前日志文件夹：{folderPath}</div>
            {startDateTime && endDateTime && (
              <div>
                日志时间范围：{formatDateTime(startDateTime)} - {formatDateTime(endDateTime)}
              </div>
            )}
          </LogInfo>
        )}
        {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
        <LogDisplay>
          {filteredLogs.map((log, index) => (
            <React.Fragment key={index}>
              {renderLogLine(log)}
            </React.Fragment>
          ))}
        </LogDisplay>
      </LogContent>
    </LogViewerContainer>
  );
};

export default FolderLogViewer;
