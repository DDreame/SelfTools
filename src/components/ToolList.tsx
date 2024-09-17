import React, { useState } from 'react';
import styled from 'styled-components';
import { Tool } from '../types';
import { tools } from '../data/tools';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme/ThemeContext';

interface ToolListProps {
  onSelectTool: (tool: Tool) => void;
}

const ToolListContainer = styled.div`
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  height: 100%;
  overflow-y: auto;
  padding: 20px;
`;

const CategoryHeader = styled(motion.div)`
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background-color: ${props => props.theme.secondary};
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.secondaryHover};
  }
`;

const ToolItem = styled(motion.div)`
  padding: 10px;
  margin: 5px 0;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.secondaryHover};
  }
`;

const Icon = styled.span`
  margin-right: 10px;
`;

const ToolList: React.FC<ToolListProps> = ({ onSelectTool }) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { theme } = useTheme();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = Array.from(new Set(tools.map(tool => tool.type)));

  return (
    <ToolListContainer>
      {categories.map(category => (
        <div key={category}>
          <CategoryHeader
            onClick={() => toggleCategory(category)}
            initial={false}
            animate={{ backgroundColor: expandedCategories.includes(category) ? theme.secondaryActive : theme.secondary }}
          >
            {category}
            <Icon>{expandedCategories.includes(category) ? '▼' : '▶'}</Icon>
          </CategoryHeader>
          <AnimatePresence>
            {expandedCategories.includes(category) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {tools
                  .filter(tool => tool.type === category)
                  .map(tool => (
                    <ToolItem
                      key={tool.id}
                      onClick={() => onSelectTool(tool)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {tool.name}
                    </ToolItem>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </ToolListContainer>
  );
};

export default ToolList;
