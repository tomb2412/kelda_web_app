import { useState } from 'react';
import {useThemeContext} from './ThemeContext';
import { SignInButton, useUser } from '@clerk/clerk-react';
import signInIcon from '../assets/sign_in.svg';
import lightModeIcon from '../assets/light_mode.svg';
import darkModeIcon from '../assets/dark_mode.svg';
import restartIcon from '../assets/restart.svg';

const Header = () => {

    const {theme, toggleTheme} = useThemeContext();
    const { isSignedIn } = useUser();
    const [isRestarting, setIsRestarting] = useState(false);
    const isDark = theme === 'dark';

    const handleRestart = async () => {
        if (isRestarting) return;
        try {
            setIsRestarting(true);
            const baseUrl = import.meta.env?.VITE_KELDER_API_URL?.replace(/\/$/, '') || '';
            const url = baseUrl ? `${baseUrl}/restart` : '/restart';
            await fetch(url, {
                method: 'POST'
            });
        } catch (err) {
            console.error('Failed to restart', err);
        } finally {
            setIsRestarting(false);
        }
    }
    
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
                        className="h-7 w-7 dark:invert"
                    />
                </button>
                <SignInButton mode="modal">
                    <button
                        type="button"
                        className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm transition dark:bg-slate-700 dark:text-white ${isSignedIn ? 'opacity-40' : 'hover:bg-white hover:scale-105'}`}
                        aria-disabled={isSignedIn}
                    >
                        <img src={signInIcon} alt="" className="h-6 w-6 dark:invert" />
                        <span className="sr-only">Sign in</span>
                    </button>
                </SignInButton>
                <button
                    type="button"
                    onClick={handleRestart}
                    disabled={isRestarting}
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-slate-900 shadow-sm transition hover:scale-105 hover:bg-white dark:bg-slate-700 dark:text-white ${isRestarting ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                    aria-label="Restart service"
                >
                    <img src={restartIcon} alt="" className="h-6 w-6 dark:invert" />
                </button>
            </div>
        </header>
    )
}

export default Header
