import React, { useCallback } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { useLogViewer, FilterModes } from '../../../hooks/useLogViewer';
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
  renderLogLine,
} from './logUtil';


const LogViewer: React.FC = () => {
    const {
      filterMode,
      setFilterMode,
      filter,
      setFilter,
      level,
      setLevel,
      startDateTime,
      setStartDateTime,
      endDateTime,
      setEndDateTime,
      path: logPath,
      setPath: setLogPath,
      error,
      resetToDefault,
      clearCache,
      filteredLogs,
    } = useLogViewer('fetch_logs');

    const selectLogFile = async () => {
      const selected = await open({
        multiple: false,
        filters: [{ name: '日志文件', extensions: ['log', 'txt'] }]
      });
      if (selected && typeof selected === 'string') {
        setLogPath(selected);
        setStartDateTime('');
        setEndDateTime('');
      }
    };

  const formatDateTime = useCallback((dateTime: string): string => {
    return moment(dateTime).format('YYYY-MM-DD HH:mm:ss');
  }, []);



  return (
    <LogViewerContainer>
      <ControlPanel>
        <StyledButton onClick={selectLogFile}>选择日志文件</StyledButton>
        <StyledSelect value={filterMode} onChange={(e) => setFilterMode(e.target.value)}>
          {Object.values(FilterModes).map(mode => (
            <option key={mode} value={mode}>{mode}</option>
          ))}
        </StyledSelect>
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
        <StyledButton onClick={resetToDefault}>重置过滤器</StyledButton>
        <StyledButton onClick={clearCache}>清除缓存</StyledButton>
      </ControlPanel>
      <LogContent>
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

export default LogViewer;
