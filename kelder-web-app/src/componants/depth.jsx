import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import arrowLeftIcon from '../assets/arrow_left.svg';
import arrowRightIcon from '../assets/arrow_right.svg';

const BILGE_DEPTH_REFRESH_MS = 2000;
const LATEST_JOURNEY_URL = 'http://localhost:8000/journeys/latest';

const formatHeight = (value) => {
    if (value === null || value === undefined || value === '') {
        return '--';
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return value ?? '--';
    }

    const rounded = Math.round(numericValue * 100) / 100;
    const simplified = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');

    return simplified;
};

const describeTidalEvent = ({event, datetime_stamp, height_of_tide}) => {
    const eventLabel = event?.toUpperCase() === 'HW' ? 'High water' : 'Low water';
    const date = datetime_stamp ? new Date(datetime_stamp) : null;

    let formattedDate = datetime_stamp ?? '--';
    let tzIndicator = '';

    if (date && !Number.isNaN(date.getTime())) {
        formattedDate = date.toLocaleString([], {
            // weekday: 'short',
            // day: 'numeric',
            // month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const januaryOffset = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
        const julyOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
        const standardOffset = Math.max(januaryOffset, julyOffset);
        const isDst = date.getTimezoneOffset() < standardOffset;
        tzIndicator = isDst ? 'DST' : 'UT';
    }

    const height = formatHeight(height_of_tide);
    const timeWithZone = tzIndicator ? `${formattedDate} ${tzIndicator}` : formattedDate;

    return `${eventLabel} at ${timeWithZone}, ${height} m`;
};

const normalizeHeightResponse = (payload) => {
    if (payload === null || payload === undefined) {
        return null;
    }

    if (typeof payload === 'number') {
        return payload;
    }

    if (typeof payload === 'object') {
        if (typeof payload.height === 'number') {
            return payload.height;
        }
        if (typeof payload.height_of_tide === 'number') {
            return payload.height_of_tide;
        }
        if (typeof payload.bilge_depth === 'number') {
            return payload.bilge_depth;
        }
        if (typeof payload.value === 'number') {
            return payload.value;
        }
    }

    const parsed = Number(payload);
    return Number.isFinite(parsed) ? parsed : null;
};

const formatDdMm = (value) => {
    if (value === null || value === undefined || value === '') {
        return '--';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return '--';
    }

    const absolute = Math.abs(numericValue);
    const degrees = Math.floor(absolute / 100);
    const minutes = absolute - degrees * 100;
    const roundedMinutes = Math.round(minutes * 1000) / 1000;
    const sign = numericValue < 0 ? '-' : '';
    const trimmedMinutes = roundedMinutes.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

    return `${sign}${degrees}°${trimmedMinutes}'`;
};

const formatJourneyHistory = (value) => {
    if (!value) {
        return 'No journeys';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return "Sailed on ".concat(formatDayMonthYear(date))

}

const formatDayMonthYear = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString([],{
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

const formatTimestamp = (value) => {
    if (!value) {
        return '--';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '--';
    }
    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

const formatDistance = (value) => {
    if (value === null || value === undefined || value === '') {
        return '--';
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return '--';
    }
    const rounded = Math.round(numericValue * 100) / 100;
    return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
};

const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined || seconds === '') {
        return '--';
    }

    const numericValue = Number(seconds);
    if (!Number.isFinite(numericValue)) {
        return '--';
    }

    const totalSeconds = Math.max(0, Math.floor(numericValue));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    const parts = [];
    if (hours) parts.push(`${hours}h`);
    if (hours || minutes) parts.push(`${minutes}m`);
    parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
};

const fallbackJourney = {
    departure_time: null,
    arrival_time: null,
    departure_location: { latitude: null, longitude: null },
    arrival_location: { latitude: null, longitude: null },
    distance_travelled: null,
    duration_seconds: null,
};

const DepthGuage = function(){

    const [, setError] = useState(null);
    const [tidal_event, setTidalEvent] = useState({
        datetime_stamp: "13:22",
        height_of_tide: "5.2",
        event: "HW"
    })
    const [liveHeight, setLiveHeight] = useState(null);
    const [bilgeDepth, setBilgeDepth] = useState(null);
    const [latestJourney, setLatestJourney] = useState([]);
    const [journeyLimit, setJourneyLimit] = useState(0);
    const [journeyCounter, setjourneyCounter] = useState(0);
    const [journeyError, setJourneyError] = useState(null);

    const incremementJourneyCounter = async (direction) => {
        if (direction === "previous"){
            // Previous means we want to increase the index
            if (journeyCounter < (journeyLimit-1)){
                setjourneyCounter(journeyCounter + 1);
            }
        } else if (direction === "next"){
            // Next means more recent and therefore lower index
            if (journeyCounter > 0){
                setjourneyCounter(journeyCounter - 1);
            }
        }
        console.log('The counter: ', journeyCounter, '. The limit: ', journeyLimit)
    };

    useEffect(()=> {
        const requestTidalEvent = async () => {
            try {
                const response = await axios.get(apiUrl('/get_next_tidal_event'))
                console.log(response.data);
                setTidalEvent(response.data);

                setError(null);
            } catch (err) {
                console.log("Error fetching next tidal event: ", err);
                setError(null);
            }
        };

        requestTidalEvent(); // On startup

        const interval = setInterval(requestTidalEvent, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const requestHeightOfTide = async () => {
            try {
                const response = await axios.get(apiUrl('/get_height_of_tide'));
                setLiveHeight(normalizeHeightResponse(response.data));
            } catch (err) {
                console.log("Error fetching current height of tide: ", err);
            }
        };

        requestHeightOfTide();

        const interval = setInterval(requestHeightOfTide, 2000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const requestBilgeDepth = async () => {
            try {
                const response = await axios.get(apiUrl('/bilge_depth'));
                setBilgeDepth(normalizeHeightResponse(response.data));
            } catch (err) {
                console.log("Error fetching bilge depth: ", err);
                setBilgeDepth(null);
            }
        };

        requestBilgeDepth();

        const interval = setInterval(requestBilgeDepth, BILGE_DEPTH_REFRESH_MS);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const requestLatestJourney = async () => {
            try {
                const response = await axios.get(LATEST_JOURNEY_URL,{
                    params: {
                    limit: 10,
                },
                    headers: { accept: 'application/json' },
            });
                setLatestJourney(response.data.journeys);
                if (!journeyLimit){
                    setJourneyLimit(response.data.limit)
                }
                setJourneyError(null);
            } catch (err) {
                setJourneyLimit(0)
                setJourneyError('Unable to load previous trip right now.');
            }
        };

        requestLatestJourney();
        const interval = setInterval(requestLatestJourney, 2000);

        return () => clearInterval(interval);
    }, []);

    let unit = "m"
    const currentHeightDisplay = formatHeight(liveHeight);
    const bilgeDepthValue = Number(bilgeDepth);
    const bilgeDepthDisplay = Number.isFinite(bilgeDepthValue) ? Math.round(bilgeDepthValue * 100) : null;
    const journeyToRender = latestJourney[journeyCounter] ?? fallbackJourney;

    return(
        <div className="">
            <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-slate-800/90 dark:text-white mb-3">
                <span className="text-3xl text-center font-semibold">{describeTidalEvent(tidal_event)}</span>
                <div className='flex row-span-4 items-center justify-center'>
                    <h1 className="text-7xl font-sans font-bold">{currentHeightDisplay}</h1>
                    <p className="text-right text-7xl p-3">{unit}</p>
                </div>
                <span className="text-center text-3xl mt-2 font-semibold ml-3.5">Height of tide</span>
            </div>
            <div>
                <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-slate-800/90 dark:text-white mb-3">
                    <span className="text-left text-3xl font-semibold">Bilge Depth</span>
                    {bilgeDepthDisplay === null ? (
                        <p className="flex row-span-4 items-center justify-center text-2xl font-semibold text-red-500">
                            error reading bilge depth
                        </p>
                    ) : (
                        <div className="flex row-span-4 items-center justify-center gap-4">
                            <h1 className="text-7xl font-sans font-bold">{bilgeDepthDisplay}</h1>
                            <p className="text-right text-7xl">cm</p>
                        </div>
                    )}
                </div>
            </div>
            <div>
                <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-slate-800/90 dark:text-white">
                    <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-left text-2xl font-semibold">{formatJourneyHistory(journeyToRender.departure_time)}</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => incremementJourneyCounter('previous')}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-900 shadow-sm transition dark:border-slate-600 dark:bg-slate-700 dark:text-white ${journeyCounter === journeyLimit-1 ? 'opacity-40' : 'hover:bg-white hover:scale-105'} }`}
                                aria-label="Request previous trip"
                            >
                                <img src={arrowLeftIcon} alt="" className={`h-8 w-8 dark:invert`} />
                            </button>
                            <button
                                type="button"
                                onClick={() => incremementJourneyCounter('next')}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-slate-900 shadow-sm transition dark:border-slate-600 dark:bg-slate-700 dark:text-white ${journeyCounter === 0 ? 'opacity-40' : 'hover:bg-white hover:scale-105'} }`}
                                aria-label="Request next trip"
                            >
                                <img src={arrowRightIcon} alt="" className="h-8 w-8 dark:invert" />
                            </button>
                        </div>
                    </div>
                    {!latestJourney && !journeyError && (
                        <p className="text-sm mt-1 text-slate-600 dark:text-slate-300">
                            Loading previous trip…
                        </p>
                    )}
                    {journeyError && (
                        <p className="text-sm mt-1 text-red-500">
                            {journeyError}
                        </p>
                    )}
                    <div className="w-full overflow-y-auto max-h-64">
                        <table className="min-w-full table-auto border-collapse"> 
                            <colgroup>
                                <col className="w-1/4" />
                                <col className="w-1/4" />
                                <col className="w-1/4" />
                                <col className="w-1/4" />
                            </colgroup>
                            <thead>
                                <tr className="sticky top-0 bg-transparent">
                                <th className="px-1 py-2 text-center">Departure</th>
                                <th className="px-1 py-2 text-center">Arrival</th>
                                <th className="px-1 py-2 text-center">Distance (nm)</th>
                                <th className="px-1 py-2 text-center">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="even:bg-transparent odd:bg-transparent">
                                    <td className="px-1 py-2 text-center">
                                        <div className="font-semibold">{formatTimestamp(journeyToRender.departure_time)}</div>
                                    </td>
                                    <td className="px-1 py-2 text-center">
                                        <div className="font-semibold">{formatTimestamp(journeyToRender.arrival_time)}</div>
                                    </td>
                                    <td className="px-1 py-2 text-center">{formatDistance(journeyToRender.distance_travelled)}</td>
                                    <td className="px-1 py-2 text-center">{formatDuration(journeyToRender.duration_seconds)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
    )
}

export default DepthGuage
