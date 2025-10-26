import {useState, useEffect} from 'react';
import axios from 'axios';

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
        if (typeof payload.value === 'number') {
            return payload.value;
        }
    }

    const parsed = Number(payload);
    return Number.isFinite(parsed) ? parsed : null;
};

const DepthGuage = function(){

    const [error, setError] = useState(null);
    const [tidal_event, setTidalEvent] = useState({
        datetime_stamp: "13:22",
        height_of_tide: "5.2",
        event: "HW"
    })
    const [liveHeight, setLiveHeight] = useState(null);


    useEffect(()=> {
        const requestTidalEvent = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/get_next_tidal_event`)
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
                const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/get_height_of_tide`);
                setLiveHeight(normalizeHeightResponse(response.data));
            } catch (err) {
                console.log("Error fetching current height of tide: ", err);
            }
        };

        requestHeightOfTide();

        const interval = setInterval(requestHeightOfTide, 2000);

        return () => clearInterval(interval);
    }, []);

    let unit = "m"
    const currentHeightDisplay = formatHeight(liveHeight);

    return(
        <div className="">
            <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-teal-900 dark:text-white mb-3">
                <span className="text-3xl text-center font-semibold">{describeTidalEvent(tidal_event)}</span>
                <div className='flex row-span-4 items-center justify-center'>
                    <h1 className="text-9xl font-sans font-bold">{currentHeightDisplay}</h1>
                    <p className="text-right text-7xl p-3">{unit}</p>
                </div>
                <span className="text-center text-3xl mt-2 font-semibold ml-3.5">Height of tide</span>
            </div>
            <div>
                <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-teal-900 dark:text-white">
                <span className="text-left text-3xl font-semibold">Bilge Depth</span>
                <h1 className="flex row-span-4 items-center justify-center text-9xl font-sans font-bold">12.3</h1>
                <p className="text-right text-7xl p-3">cm</p>
            </div>
            </div>
        </div>
        
    )
}

export default DepthGuage
