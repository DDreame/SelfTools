import { useState } from 'react';
import styled from 'styled-components';
import ToolList from './components/ToolList';
import ToolDetail from './components/ToolDetail';
import ThemeBar from './components/ThemeBar';
import { Tool } from './types';
import { ThemeProvider } from './theme/ThemeContext';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ToolListContainer = styled.div`
  width: 250px;
  overflow-y: auto;
  border-right: 1px solid ${props => props.theme.border};
`;

const ToolDetailContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

function App() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  return (
    <ThemeProvider>
      <AppContainer>
        <ThemeBar />
        <ContentContainer>
          <ToolListContainer>
            <ToolList onSelectTool={setSelectedTool} />
          </ToolListContainer>
          <ToolDetailContainer>
            <ToolDetail tool={selectedTool} />
          </ToolDetailContainer>
        </ContentContainer>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
