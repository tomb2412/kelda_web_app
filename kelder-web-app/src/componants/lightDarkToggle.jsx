import {useEffect, useState} from 'react';
import HighchartsReact from 'highcharts-react-official';


const useTheme = () => {
    const [theme, setTheme] = useState('dark')

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

    return {
        theme,
        toggleTheme,
    };
};

export default useTheme;