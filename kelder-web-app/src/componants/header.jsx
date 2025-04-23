import Toggle from 'react-toggle';
import useTheme from './lightDarkToggle';
import "react-toggle/style.css"; // for ES6 modules

const Header = () => {

    const {theme, toggleTheme} = useTheme();
    const isNightMode = theme === "dark";

    return(
        <header className="flex flex-row bg-slate-800/90 items-center justify-between h-15" >
            <div >
                <div className="text-white flex-row flex px-4 text-2xl">
                    <p className="font-bold">Connection Status: </p>
                    <p className="px-4">Kelder Online</p>
                    <p>Full strength</p>
                </div>
            </div>
            <div>
            <span className="text-white mx-5 inline-flex items-center">
                <span className='text-2xl'>Dark Mode: </span>
                <Toggle
                    defaultChecked={true}
                    className='mr-10 ml-3'
                    onChange={toggleTheme} />
                </span>
                <span>{theme}</span>
            </div>
        </header>
    )
}

export default Header