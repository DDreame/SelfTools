import React, { createContext, useState, useEffect, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

const lightTheme = {
  background: '#ffffff',
  text: '#000000',
  primary: '#4CAF50',
  secondary: '#f0f0f0',
  secondaryHover: '#e0e0e0',
  secondaryActive: '#d0d0d0',
  border: '#ccc',
  logBackground: '#f8f8f8',
  logText: '#333333',
  scrollbarTrack: '#f1f1f1',
  scrollbarThumb: '#888',
  scrollbarThumbHover: '#555',
  jsonColor: '#267f99', // 使用一个适合浅色主题的颜色
};

const darkTheme = {
  background: '#1e1e1e',
  text: '#ffffff',
  primary: '#45a049',
  secondary: '#2c2c2c',
  secondaryHover: '#3c3c3c',
  secondaryActive: '#4c4c4c',
  border: '#444',
  logBackground: '#2a2a2a',
  logText: '#d4d4d4',
  scrollbarTrack: '#2c2c2c',
  scrollbarThumb: '#888',
  scrollbarThumbHover: '#555',
  jsonColor: '#4ec9b0', // 使用一个适合深色主题的颜色
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setTheme(mediaQuery.matches ? darkTheme : lightTheme);
    mediaQuery.addListener(handleChange);
    handleChange();
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === lightTheme ? darkTheme : lightTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};
