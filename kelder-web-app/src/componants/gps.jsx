import React, {useState, useEffect} from 'react';
import axios from 'axios';



const GpsDisplay = function({}){

    const [gpsData, setGpsData] = useState(
        {
            timestamp: "2025.05.01T08:22:23",
            latitude_fmt: "12°45\"59\'",
            longitude_fmt: "12°45\"59\'",
            instantaneous_speed_over_ground: "4.3",
            drift_on_tack: "1.0",
            heading_over_ground: "178",
            distance_covered: "10.2",
            distance_to_lauren: "5.1",
            distance_to_cowes: "8.6",
        }

    );
    const [error, setError] = useState(null);
    
    useEffect(()=> {
        const requestGpsData = async () => {
            try {
                const response = await axios.get("http://raspberrypi.local:8000/gps_coords");
                console.log(response.data);
                setGpsData(response.data);

                setError(null);
            } catch (err) {
                console.log("Error fetching GPS data: ", err);
                setError(null);//"Error fetching GPS data");
            }
        };

        requestGpsData(); // On startup

        const interval = setInterval(requestGpsData, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-3 rounded-xl bg-[#024887]/10 dark:bg-teal-900">
            {gpsData ? (
                <div>
                    <div className='flex flex-row grid grid-cols-2 2xl:grid-cols-3 items-center justify-around p-5'>
                        <div className="col-span-2 2xl:col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Timestamp</p> 
                            <p className='font-bold text-2xl sm:text-3xl lg:text-2xl'>{gpsData.timestamp.split("T")[1]}</p>
                        </div>
                        <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Latitude</p>
                            <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{gpsData.latitude_fmt}</p>
                        </div>
                        <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                            <p className='font-semibold text-2xl lg:text-xl'>Longitude</p>
                            <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{gpsData.longitude_fmt}</p>
                        </div>
                    </div>
                    <div className='grid grid-rows-2 grid-cols-2 gap-4 p-5'> 
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold  text-3xl">SOG</p>
                            <p className = "font-bold text-5xl"> {Math.round(gpsData.instantaneous_speed_over_ground * 10) / 10} knts</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">LOG</p>
                            <p className = "font-bold text-5xl"> {gpsData.distance_covered} nm</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">Drift</p>
                            <p className = "font-bold text-5xl"> {gpsData.drift_on_tack} knts</p>
                        </div>
                        <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                            <p className = "font-semibold text-3xl">HOG</p>
                            <p className = "font-bold text-5xl">  {gpsData.heading_over_ground}°</p>
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