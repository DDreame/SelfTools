import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../theme/ThemeContext';

const ThemeBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: ${props => props.theme.primary};
  color: white;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5em;
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
`;

const Icon = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 10px;
`;

const ThemeToggle = styled.button`
  background-color: transparent;
  border: 2px solid white;
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ThemeBar: React.FC = () => {
  const { toggleTheme } = useTheme();

  return (
    <ThemeBarContainer>
      <IconContainer>
        <Icon src="../assets/react.svg" alt="Project Icon" />
        <Title>DDreame's ToolBox</Title>
      </IconContainer>
      <ThemeToggle onClick={toggleTheme}>切换主题</ThemeToggle>
    </ThemeBarContainer>
  );
};

export default ThemeBar;
