import { Tool } from '../types';
import Hammer from '../components/tools/Hammer';
import LogViewer from '../components/tools/LogViewer';
// import Screwdriver from '../components/tools/Screwdriver';
// import ElectricDrill from '../components/tools/ElectricDrill';
// import Sandpaper from '../components/tools/Sandpaper';

export const tools: Tool[] = [
  {
    id: '1',
    name: '锤子',
    type: '手动工具',
    subtype: '敲击工具',
    component: Hammer,
  },
  {
    id: '2',
    name: '日志查看器',
    type: '开发工具',
    subtype: '日志工具',
    component: LogViewer,
  },
];
