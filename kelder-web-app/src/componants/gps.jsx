import React, {useState, useEffect} from 'react';
import axios from 'axios';

const formatDdMmSs = (value) => {
    if (value === null || value === undefined) {
        return '--';
    }

    const stringValue = String(value).trim();
    const direction = (stringValue.match(/[NSEW]/i) || [])[0] || '';
    const sign = stringValue.startsWith('-') ? '-' : '';
    const raw = stringValue.replace(/[^0-9]/g, '');

    if (!raw) {
        return '--';
    }

    const seconds = raw.slice(-2) || '00';
    const minutes = raw.slice(-4, -2) || '00';
    const degrees = raw.slice(0, -4) || '0';
    const suffix = direction ? ` ${direction.toUpperCase()}` : '';

    return `${sign}${degrees}°${minutes}'${seconds}"${suffix}`;
};

const GpsDisplay = function({}){

    let back_up_data_model = {
        data : {
            timestamp: "08:22:23",
            latitude: "12°45\"59\'",
            longitude: "12°45\"59\'",
            speed_over_ground: "4.3",
            drift: "1.0",
            log: "10.2",
            dtw: "8.6",
        }
    };
    const [gpsData, setGpsData] = useState();
    const [error, setError] = useState(null);
    
    useEffect(()=> {
        const requestGpsData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/gps_card_data`);//"http://raspberrypi.local:8000/gps_card_data");//back_up_data_model;// 
                console.log("Returned GPS data raw: "+ response.data);
                setGpsData(response.data);
                setError(null);
            } catch (err) {
                console.log("Error fetching GPS data: ", err);
                setError("Error fetching GPS data");
                //setGpsData(back_up_data_model) // TODO: Remove when live
            }
        };

        requestGpsData(); // On startup

        const interval = setInterval(requestGpsData, 2000);

        return () => clearInterval(interval);
    }, []);

    console.log(gpsData)

    return (
        <div className="p-3 rounded-xl bg-[#024887]/10 dark:bg-teal-900">
            {gpsData ? (
                <div>
                    <div className='flex flex-row grid grid-cols-2 2xl:grid-cols-3 items-center justify-around p-5'>
                        <div className="col-span-2 2xl:col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Timestamp</p> 
                            <p className='font-bold text-2xl sm:text-3xl lg:text-2xl'>{gpsData.timestamp}</p>
                        </div>
                        <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Latitude</p>
                            <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{formatDdMmSs(gpsData.latitude)}</p>
                        </div>
                        <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Longitude</p>
                            <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{formatDdMmSs(gpsData.longitude)}</p>
                        </div>
                    </div>
                    <div className='grid grid-rows-2 grid-cols-2 gap-4 p-5'> 
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold  text-3xl">SOG</p>
                            <p className = "font-bold text-5xl"> {Math.round(gpsData.speed_over_ground * 10) / 10} knts</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">LOG</p>
                            <p className = "font-bold text-5xl"> {gpsData.log} nm</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">Drift</p>
                            <p className = "font-bold text-5xl"> {gpsData.drift} knts</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">DTW</p>
                            <p className = "font-bold text-5xl"> {gpsData.dtw}nm</p>
                        </div>
                    </div>
                </div>
            ) : (
                <p className="text-2xl text-slate-900 dark:text-white">Loading GPS data...</p>
            )}
            {error && <p className="text-red-500 font-bold text-3xl text-center align-middle">{error}</p>}
        </div>
    )
}

export default GpsDisplay
