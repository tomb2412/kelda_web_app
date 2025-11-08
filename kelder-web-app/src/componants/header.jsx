import {useThemeContext} from './ThemeContext';
import { SignInButton } from '@clerk/clerk-react';
import signInIcon from '../assets/sign_in.svg';
import lightModeIcon from '../assets/light_mode.svg';
import darkModeIcon from '../assets/dark_mode.svg';

const Header = () => {

    const {theme, toggleTheme} = useThemeContext();
    const isDark = theme === 'dark';
    
    return(
        <header className="flex flex-row items-center justify-between h-20 bg-[#024887]/50 px-6 dark:bg-slate-800/90" >
            <div >
                <div className="text-slate-900 dark:text-white flex-row flex px-4 text-2xl">
                    <p className=""></p>
                    <p className="font-bold px-4">Kelder Online</p>
                </div>
            </div>
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm transition hover:scale-105 hover:bg-white dark:bg-slate-700 dark:text-white"
                    aria-label="Toggle color theme"
                >
                    <img
                        src={isDark ? darkModeIcon : lightModeIcon}
                        alt={isDark ? 'Dark mode icon' : 'Light mode icon'}
                        className="h-7 w-7"
                    />
                </button>
                <SignInButton mode="modal">
                    <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm transition hover:scale-105 hover:bg-white dark:bg-slate-700 dark:text-white"
                    >
                        <img src={signInIcon} alt="" className="h-6 w-6" />
                        <span className="sr-only">Sign in</span>
                    </button>
                </SignInButton>
            </div>
        </header>
    )
}

export default Header
