import React from 'react';
import styled from 'styled-components';
import { Tool } from '../types';

const ToolDetailContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

interface ToolDetailProps {
  tool: Tool | null;
}

const ToolDetail: React.FC<ToolDetailProps> = ({ tool }) => {
  if (!tool) {
    return <ToolDetailContainer>请选择一个工具</ToolDetailContainer>;
  }

  const ToolComponent = tool.component;

  return (
    <ToolDetailContainer>
      <h2>{tool.name}</h2>
      <ToolComponent />
    </ToolDetailContainer>
  );
};

export default ToolDetail;
