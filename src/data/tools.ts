import { Tool } from '../types';
import LogViewer from '../components/tools/LogViewer';

export const tools: Tool[] = [
  {
    id: '1',
    name: '日志查看器',
    type: '开发工具',
    subtype: '日志工具',
    component: LogViewer,
  },
];
