import React from 'react';
import { Tool } from '../types';

interface ToolDetailProps {
  tool: Tool | null;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool }) => {
  if (!tool) {
    return <div className="tool-detail">请选择一个工具</div>;
  }

  const ToolComponent = tool.component;

  return (
    <div className="tool-detail">
      <h2>{tool.name}</h2>
      <ToolComponent />
    </div>
  );
};

export default ToolDetail;
