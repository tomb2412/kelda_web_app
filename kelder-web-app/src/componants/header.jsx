import { useEffect, useState } from 'react';
import {useThemeContext} from './ThemeContext';
import { SignInButton, useUser } from '@clerk/clerk-react';
import signInIcon from '../assets/sign_in.svg';
import lightModeIcon from '../assets/light_mode.svg';
import darkModeIcon from '../assets/dark_mode.svg';
import restartIcon from '../assets/restart.svg';
import sailingIcon from '../assets/sailing.svg';
import anchorIcon from '../assets/anchor.svg';

const getBaseUrl = () => import.meta.env?.VITE_KELDER_API_URL?.replace(/\/$/, '') || '';
const formatStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const Header = () => {

    const {theme, toggleTheme} = useThemeContext();
    const { isSignedIn } = useUser();
    const [isRestarting, setIsRestarting] = useState(false);
    const [vesselStatus, setVesselStatus] = useState('Loading...');
    const isDark = theme === 'dark';
    const normalizedStatus = (vesselStatus || '').trim().toLowerCase();
    const displayStatus = formatStatus((vesselStatus || '').trim());
    const statusIcon = normalizedStatus === 'underway'
        ? sailingIcon
        : normalizedStatus === 'stationary'
            ? anchorIcon
            : null;

    useEffect(() => {
        let isMounted = true;

        const fetchVesselStatus = async () => {
            try {
                const baseUrl = getBaseUrl();
                const url = baseUrl ? `${baseUrl}/vessel_state` : '/vessel_state';
                const response = await fetch(url, {
                    headers: { accept: 'application/json' }
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const data = await response.json();
                const statusText = typeof data === 'string'
                    ? data
                    : data?.vessel_state || data?.status || data?.state || '';

                if (isMounted) {
                    setVesselStatus(statusText || 'Status: Unknown');
                }
            } catch (err) {
                console.error('Failed to fetch vessel state', err);
                if (isMounted) {
                    setVesselStatus('Status: Unavailable');
                }
            }
        };

        fetchVesselStatus();
        const intervalId = setInterval(fetchVesselStatus, 2000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    const handleRestart = async () => {
        if (isRestarting) return;
        try {
            setIsRestarting(true);
            const baseUrl = getBaseUrl();
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
        <header className="flex flex-row items-center justify-between h-20 bg-[#024887]/50 px-6 dark:bg-slate-900" >
            <div >
                <div className="text-slate-900 dark:text-white flex-row flex px-4 text-2xl items-center">
                    <p className=""></p>
                    <div className="font-bold px-4 flex items-center gap-3">
                        {statusIcon ? (
                            <img
                                src={statusIcon}
                                alt={normalizedStatus === 'underway' ? 'Underway' : 'Stationary'}
                                className="h-8 w-8 dark:invert"
                            />
                        ) : null}
                        <span className="sm:hidden">Kelder</span>
                        <span className="hidden sm:inline">Kelder {displayStatus}</span>
                    </div>
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
