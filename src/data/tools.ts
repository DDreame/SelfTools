import { Tool } from '../types';
import LogViewer from '../components/tools/LogViewer';
import FolderLogViewer from '../components/tools/FolderLogViewer';

export const tools: Tool[] = [
  {
    id: '1',
    name: '日志查看器',
    type: '开发工具',
    subtype: '日志工具',
    component: LogViewer,
  },
  {
    id: '1',
    name: '文件夹日志查看器',
    type: '开发工具',
    subtype: '日志工具',
    component: FolderLogViewer,
  },
];
