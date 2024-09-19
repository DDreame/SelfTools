import { Tool } from '../types';
import LogViewer from '../components/tools/logviewer/LogViewer';
import FolderLogViewer from '../components/tools/logviewer/FolderLogViewer';

export const tools: Tool[] = [
  {
    id: '1',
    name: '日志查看器',
    type: '开发测试',
    subtype: '日志工具',
    component: LogViewer,
  },
  {
    id: '2',
    name: '文件夹日志查看器',
    type: '开发测试',
    subtype: '日志工具',
    component: FolderLogViewer,
  },
  {
    id: '3',
    name: 'Json格式化',
    type: '格式转换',
    subtype: '格式转换',
    component: FolderLogViewer,
  },
];
