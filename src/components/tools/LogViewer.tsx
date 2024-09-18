import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import styled from 'styled-components';
import debounce from 'lodash/debounce';
import moment from 'moment-timezone';

const LogViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const ControlPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px;
  background-color: ${props => props.theme.secondary};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const LogDisplay = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme.logBackground};
  color: ${props => props.theme.logText};
  padding: 10px;
  font-family: monospace;
  font-size: 0.9em;
  margin: 0;

  &::-webkit-scrollbar {
    width: 12px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbarTrack};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.scrollbarThumb};
    border-radius: 6px;
    border: 3px solid ${props => props.theme.scrollbarTrack};
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${props => props.theme.scrollbarThumbHover};
  }
`;

const StyledInput = styled.input`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const StyledSelect = styled.select`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const StyledButton = styled.button`
  padding: 5px 10px;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: ${props => props.theme.primary}dd;
  }
`;

const StyledDateTimeInput = styled.input`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const LogInfo = styled.div`
  padding: 10px;
  background-color: ${props => props.theme.secondary};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const LogLine = styled.div`
  margin-bottom: 5px;
`;

const TimeStamp = styled.span`
  color: ${props => props.theme.primary};
`;

const LogLevel = styled.span<{ level: string }>`
  font-weight: bold;
  color: ${props => {
    switch (props.level) {
      case 'Debug': return '#808080';
      case 'Info': return '#0000FF';
      case 'Warning': return '#FFA500';
      case 'Error': return '#FF0000';
      default: return props.theme.text;
    }
  }};
`;

const JsonContent = styled.span`
  color: ${props => props.theme.jsonColor};
`;

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [level, setLevel] = useState('All');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [logPath, setLogPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const debouncedFetchLogs = useCallback(
    debounce(() => {
      fetchLogs();
    }, 300),
    [logPath, filter, level, startDateTime, endDateTime]
  );

  useEffect(() => {
    if (logPath) {
      debouncedFetchLogs();
      const interval = setInterval(debouncedFetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [logPath, filter, level, startDateTime, endDateTime, debouncedFetchLogs]);

  const parseTimestamp = (timestamp: string): string | null => {
    const date = moment.tz(timestamp, 'YYYY-MM-DD HH:mm:ss', 'Asia/Shanghai');
    if (!date.isValid()) {
      console.error(`Invalid timestamp: ${timestamp}`);
      return null;
    }
    return date.format('YYYY-MM-DDTHH:mm:ss');
  };

  const fetchLogs = async () => {
    if (!logPath) return;
    try {
      setError(null);
      const result = await invoke('fetch_logs', {
        logPath,
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
        console.log('First log:', firstLog);
        console.log('Last log:', lastLog);

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
      console.error('Error fetching logs:', error);
      setError(`Error fetching logs: ${error}`);
    }
  };

  const selectLogFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Log Files', extensions: ['log', 'txt'] }]
    });
    if (selected && typeof selected === 'string') {
      setLogPath(selected);
      setStartDateTime('');
      setEndDateTime('');
      setIsInitialLoad(true);
    }
  };

  const resetToDefault = () => {
    setFilter('');
    setLevel('All');
    setStartDateTime('');
    setEndDateTime('');
    setIsInitialLoad(true);
    fetchLogs();
  };

  const formatDateTime = (dateTime: string): string => {
    return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
  };

  const highlightJson = (content: string) => {
    const parts = content.split(/(\{.*?\})/g);
    return parts.map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return <JsonContent key={index}>{part}</JsonContent>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderLogLine = (line: string) => {
    const [timestamp, level, ...rest] = line.split(' ');
    const content = rest.join(' ');
    return (
      <LogLine>
        <TimeStamp>{timestamp}</TimeStamp>{' '}
        <LogLevel level={level}>{level}</LogLevel>:{' '}
        {highlightJson(content)}
      </LogLine>
    );
  };

  return (
    <LogViewerContainer>
      <ControlPanel>
        <StyledButton onClick={selectLogFile}>选择日志文件</StyledButton>
        <StyledInput
          type="text"
          placeholder="Filter logs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <StyledSelect value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="All">All Levels</option>
          <option value="Debug">Debug</option>
          <option value="Info">Info</option>
          <option value="Warning">Warning</option>
          <option value="Error">Error</option>
        </StyledSelect>
        <StyledDateTimeInput
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(moment.tz(e.target.value, 'Asia/Shanghai').format('YYYY-MM-DDTHH:mm:ss'))}
          step="1"
        />
        <StyledDateTimeInput
          type="datetime-local"
          value={endDateTime}
          onChange={(e) => setEndDateTime(moment.tz(e.target.value, 'Asia/Shanghai').format('YYYY-MM-DDTHH:mm:ss'))}
          step="1"
        />
        <StyledButton onClick={fetchLogs}>刷新</StyledButton>
        <StyledButton onClick={resetToDefault}>重置</StyledButton>
      </ControlPanel>
      {logPath && (
        <LogInfo>
          <div>当前日志文件：{logPath}</div>
          {startDateTime && endDateTime && (
            <div>
              日志时间范围：{formatDateTime(startDateTime)} - {formatDateTime(endDateTime)}
            </div>
          )}
        </LogInfo>
      )}
      {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
      <LogDisplay>
        {logs.map((log, index) => (
          <React.Fragment key={index}>
            {renderLogLine(log)}
          </React.Fragment>
        ))}
      </LogDisplay>
    </LogViewerContainer>
  );
};

export default LogViewer;
