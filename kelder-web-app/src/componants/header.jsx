import Toggle from 'react-toggle';
import {useThemeContext} from './ThemeContext';
import "react-toggle/style.css"; // for ES6 modules

const Header = () => {

    const {theme, toggleTheme} = useThemeContext();

    return(
        <header className="flex flex-row items-center justify-between h-15 bg-[#024887]/50 dark:bg-slate-800/90" >
            <div >
                <div className="text-slate-900 dark:text-white flex-row flex px-4 text-2xl">
                    <p className="font-bold">Connection Status: </p>
                    <p className="px-4">Kelder Online</p>
                </div>
            </div>
            <div>
            <span className="dark:text-white text-slate-900 mx-5 inline-flex items-center">
                <span className='text-2xl'>Dark Mode: </span>
                <Toggle
                    defaultChecked={true}
                    className='mr-10 ml-3'
                    onChange={toggleTheme} />
                </span>
            </div>
        </header>
    )
}

export default Header