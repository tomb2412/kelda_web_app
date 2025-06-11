import { Children, createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState('dark');

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        console.log(newTheme)
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme );
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }

    useEffect(()=> {
        const localTheme = localStorage.getItem('theme');
        if (localTheme){
            setTheme(localTheme);
            document.documentElement.classList.toggle('dark', localTheme === 'dark');
            }
        },[]
    );

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};