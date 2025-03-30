import {useEffect, useState} from 'react';
import HighchartsReact from 'highcharts-react-official';


export default () => {
    const [theme, setTheme] = useState('dark')

    const toggleTheme = () => {
        if (theme === "dark"){
            setTheme("light");
            `highcharts-$light`;
        } else {
            setTheme("dark");
            `highcharts-$dark`;
        }
    }

    useEffect(()=> {
        const localTheme = localStorage.getItem('theme')
        if (localTheme){
            setTheme(localTheme)
            }
        },[]
    )

    return {
        theme,
        toggleTheme,
    }
}