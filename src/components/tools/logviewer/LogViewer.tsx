import React from 'react';
import { open, save } from '@tauri-apps/api/dialog';
import { writeTextFile } from '@tauri-apps/api/fs';
import { useLogViewer, FilterModes } from '../../../hooks/useLogViewer';
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
  formatDateTime,
  LogLine,
  BookmarkButton,
  BookmarkList,
  BookmarkItem,
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
      bookmarks,
      toggleBookmark,
      clearBookmarks,
      jumpToBookmark,
      logDisplayRef,
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
    const exportLogs = async () => {
      const filePath = await save({
        filters: [{ name: '文本文件', extensions: ['txt'] }]
      });
      if (filePath) {
        const content = filteredLogs.join('\n');
        await writeTextFile(filePath, content);
        alert('日志导出成功！');
      }
    };




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
        <StyledButton onClick={exportLogs}>导出日志</StyledButton>
        <StyledButton onClick={clearBookmarks}>清除所有书签</StyledButton>
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
            <BookmarkList>
              {bookmarks.map((bookmarkIndex) => (
                <BookmarkItem key={bookmarkIndex} onClick={() => jumpToBookmark(bookmarkIndex)}>
                  跳转到书签 {bookmarkIndex + 1}
                </BookmarkItem>
              ))}
            </BookmarkList>
          </LogInfo>
        )}
        {error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
        <LogDisplay ref={logDisplayRef}>
          {filteredLogs.map((log, index) => (
            <LogLine key={index}>
              <BookmarkButton
                onClick={() => toggleBookmark(index)}
                $isBookmarked={bookmarks.includes(index)}
              >
                {bookmarks.includes(index) ? '★' : '☆'}
              </BookmarkButton>
              {renderLogLine(log)}
            </LogLine>
          ))}
        </LogDisplay>
      </LogContent>
    </LogViewerContainer>
  );
};

export default LogViewer;
