import moment from 'moment-timezone';
import styled from 'styled-components';


export const ControlPanel = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background-color: ${props => props.theme.secondary};
  border-bottom: 1px solid ${props => props.theme.border};
`;

export const LogContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const LogInfo = styled.div`
  flex-shrink: 0;
  padding: 10px;
  background-color: ${props => props.theme.secondary};
  border-bottom: 1px solid ${props => props.theme.border};
`;

export const LogDisplay = styled.div`
  flex: 1;
  overflow-y: auto;
  background-color: ${props => props.theme.logBackground};
  color: ${props => props.theme.logText};
  padding: 10px;
  font-family: monospace;
  font-size: 0.9em;
  margin: 0;

  &::-webkit-scrollbar {
    width: 16px;  // 增加滚动条宽度
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbarTrack};
    border-radius: 8px;  // 添加圆角
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.scrollbarThumb};
    border-radius: 8px;  // 增加圆角
    border: 4px solid ${props => props.theme.scrollbarTrack};  // 增加边框宽度
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: ${props => props.theme.scrollbarThumbHover};
  }
`;

export const StyledInput = styled.input`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

export const StyledSelect = styled.select`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

export const StyledButton = styled.button`
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

export const StyledDateTimeInput = styled.input`
  padding: 5px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

export const LogLine = styled.div`
  margin-bottom: 5px;
`;

export const TimeStamp = styled.span`
  color: ${props => props.theme.primary};
`;

export const LogLevel = styled.span<{ level: string }>`
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

export const LogViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

export const parseTimestamp = (timestamp: string): string | null => {
  const date = moment.tz(timestamp, 'YYYY-MM-DD HH:mm:ss SSS', 'Asia/Shanghai');
  if (!date.isValid()) {
    console.error(`无效的时间戳: ${timestamp}`);
    return null;
  }
  return date.format('YYYY-MM-DDTHH:mm:ss.SSS');
};

export const formatDateTime = (dateTime: string): string => {
  return moment(dateTime).format('YYYY-MM-DD HH:mm:ss.SSS');
};

export const highlightJson = (content: string) => {
  const parts = content.split(/(\{.*?\})/g);
  return parts.map((part, index) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      return <JsonContent key={index}>{part}</JsonContent>;
    }
    return <span key={index}>{part}</span>;
  });
};


export const JsonContent = styled.span`
  color: ${props => props.theme.jsonColor};
`;

export const renderLogLine = (line: string) => {
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \d{3}):(\[(Debug|Info|Warning|Error)\]:)(.*)$/);
  if (match) {
    const [, timestamp, level, , content] = match;
    return (
      <LogLine>
        <TimeStamp>{timestamp}</TimeStamp>{' '}
        <LogLevel level={level}>{level}</LogLevel>{' '}
        {highlightJson(content)}
      </LogLine>
    );
  }
  return <LogLine>{line}</LogLine>;
};
