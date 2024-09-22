import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import debounce from 'lodash/debounce';
import moment from 'moment-timezone';
import { parseTimestamp } from '../components/tools/logviewer/logUtil';

export const FilterModes = {
  TEXT: '严格匹配',
  LOWTEXT: '宽松匹配',
  REGEX: '正则匹配',
  RANGE: '范围匹配'
};


export const useLogViewer = (fetchFunction: string) => {
  const [logs, setLogs] = useState<string[]>(() => {
    const savedLogs = localStorage.getItem(`${fetchFunction}Logs`);
    return savedLogs ? JSON.parse(savedLogs) : [];
  });
  const [filterMode, setFilterMode] = useState(() => localStorage.getItem(`${fetchFunction}FilterMode`) || FilterModes.TEXT);
  const [filter, setFilter] = useState(() => localStorage.getItem(`${fetchFunction}Filter`) || '');
  const [level, setLevel] = useState(() => localStorage.getItem(`${fetchFunction}Level`) || 'All');
  const [startDateTime, setStartDateTime] = useState(() => localStorage.getItem(`${fetchFunction}StartDateTime`) || '');
  const [endDateTime, setEndDateTime] = useState(() => localStorage.getItem(`${fetchFunction}EndDateTime`) || '');
  const [path, setPath] = useState(() => localStorage.getItem(`${fetchFunction}Path`) || '');
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const savedBookmarks = localStorage.getItem(`${fetchFunction}Bookmarks`);
    return savedBookmarks ? JSON.parse(savedBookmarks) : [];
  });
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem(`${fetchFunction}AutoScroll`) === 'true');
  const logDisplayRef = useRef<HTMLDivElement>(null);


  const fetchLogs = useCallback(async () => {
    if (!path) return;
    try {
      setError(null);
      const result = await invoke(fetchFunction, {
        path,
        filter,
        level,
        startDateTime: startDateTime ? moment.tz(startDateTime, 'Asia/Shanghai').toISOString(true) : '',
        endDateTime: endDateTime ? moment.tz(endDateTime, 'Asia/Shanghai').toISOString(true) : ''
      });
      const fetchedLogs = result as string[];
      setLogs(fetchedLogs);

      if (fetchedLogs.length > 0) {
        const firstLog = fetchedLogs[0];
        const lastLog = fetchedLogs[fetchedLogs.length - 1];

        const firstTimestamp = parseTimestamp(firstLog.split(' ').slice(0, 2).join(' '));
        const lastTimestamp = parseTimestamp(lastLog.split(' ').slice(0, 2).join(' '));

        if (firstTimestamp && (isInitialLoad || firstTimestamp < startDateTime)) {
          setStartDateTime(firstTimestamp);
        }
        if (lastTimestamp && (isInitialLoad || lastTimestamp > endDateTime)) {
          setEndDateTime(lastTimestamp);
        }
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('获取日志时出错:', error);
      setError(`获取日志时出错: ${error}`);
    }
  }, [path, filter, level, startDateTime, endDateTime, isInitialLoad, fetchFunction]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (filter) {
      switch (filterMode) {
        case FilterModes.TEXT:
          result = result.filter(log => log.includes(filter));
          break;
        case FilterModes.LOWTEXT:
            result = result.filter(log => log.toLowerCase().includes(filter.toLowerCase()));
            break;
        case FilterModes.REGEX:
          try {
            const regex = new RegExp(filter, 'i');
            result = result.filter(log => regex.test(log));
          } catch (e) {
            console.error('无效的正则表达式:', e);
          }
          break;
        case FilterModes.RANGE:
          const firstIndex = result.findIndex(log => log.includes(filter));
          const lastIndex = result.reduceRight((acc, log, idx) => {
            if (acc === -1 && log.includes(filter)) {
              return idx;
            }
            return acc;
          }, -1);
          if (firstIndex !== -1 && lastIndex !== -1) {
            result = result.slice(firstIndex, lastIndex + 1);
          }
          break;
      }
    }

    if (level !== 'All') {
      result = result.filter(log => log.includes(`[${level}]`));
    }

    return result;
  }, [logs, filter, filterMode, level]);

  const debouncedFetchLogs = useCallback(
    debounce(() => {
      fetchLogs();
    }, 300),
    [fetchLogs]
  );

  useEffect(() => {
    if (path) {
      debouncedFetchLogs();
      const interval = setInterval(debouncedFetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [path, filter, level, startDateTime, endDateTime, debouncedFetchLogs]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}Logs`, JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}Filter`, filter);
  }, [filter]);

  useEffect(() => {
    localStorage.setItem('logViewerFilterMode', filterMode);
  }, [filterMode]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}Level`, level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}StartDateTime`, startDateTime);
  }, [startDateTime]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}EndDateTime`, endDateTime);
  }, [endDateTime]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}LogPath`, path);
  }, [path]);

  useEffect(() => {
    localStorage.setItem(`${fetchFunction}AutoScroll`, autoScroll.toString());
  }, [autoScroll, fetchFunction]);

  useEffect(() => {
    if (autoScroll || (!filter && level === 'All' && !startDateTime && !endDateTime)) {
      if (logDisplayRef.current) {
        logDisplayRef.current.scrollTop = logDisplayRef.current.scrollHeight;
      }
    }
  }, [filteredLogs, autoScroll, filter, level, startDateTime, endDateTime]);

  const resetToDefault = useCallback(() => {
    setFilter('');
    setLevel('All');
    setStartDateTime('');
    setEndDateTime('');
    setIsInitialLoad(true);
    fetchLogs();
  }, [fetchLogs]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(`${fetchFunction}Logs`);
    localStorage.removeItem(`${fetchFunction}Filter`);
    localStorage.removeItem(`${fetchFunction}Level`);
    localStorage.removeItem(`${fetchFunction}StartDateTime`);
    localStorage.removeItem(`${fetchFunction}EndDateTime`);
    localStorage.removeItem(`${fetchFunction}Path`);
    setLogs([]);
    setFilter('');
    setLevel('All');
    setStartDateTime('');
    setEndDateTime('');
    setPath('');
    setIsInitialLoad(true);
  }, [fetchFunction]);

  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .map(bookmarkedLog => filteredLogs.findIndex(log => log === bookmarkedLog))
      .filter(index => index !== -1);
  }, [filteredLogs, bookmarks]);

  const toggleBookmark = useCallback((filteredIndex: number) => {
    const logToToggle = filteredLogs[filteredIndex];
    setBookmarks(prevBookmarks => {
      const newBookmarks = prevBookmarks.includes(logToToggle)
        ? prevBookmarks.filter(log => log !== logToToggle)
        : [...prevBookmarks, logToToggle];
      localStorage.setItem(`${fetchFunction}Bookmarks`, JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  }, [filteredLogs, fetchFunction]);

  const jumpToBookmark = useCallback((filteredIndex: number) => {
    if (logDisplayRef.current) {
      const logLines = logDisplayRef.current.children;
      if (logLines[filteredIndex]) {
        logLines[filteredIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
    localStorage.removeItem(`${fetchFunction}Bookmarks`);
  }, [fetchFunction]);

  return {
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
    path,
    setPath,
    error,
    resetToDefault,
    clearCache,
    fetchLogs,
    filteredLogs,
    bookmarks,
    filteredBookmarks,
    toggleBookmark,
    clearBookmarks,
    jumpToBookmark,
    autoScroll,
    setAutoScroll,
    logDisplayRef,
  };
};
