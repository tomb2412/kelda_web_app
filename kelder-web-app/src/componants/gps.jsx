import React, {useState, useEffect} from 'react';
import axios from 'axios';


const GpsDisplay = function({}){

    const [gpsData, setGpsData] = useState(
        {
            timestamp: "2025.05.01T08:22:23",
            latitude_fmt: "12°45\"59.11\'",
            longitude_fmt: "12°45\"59.11\'",
            speed_over_ground: "4.3",
            drift_on_tack: "1.0",
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
                setError("Error fetching GPS data");
            }
        };

        requestGpsData(); // On startup

        const interval = setInterval(requestGpsData, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-3 rounded-xl bg-[#024887]/10 dark:bg-teal-900">
            {gpsData ? (
                <div className='flex flex-col grid-cols-2 items-center justify-center rounded-xl '>
                <p><strong>Time:</strong> {gpsData.timestamp}</p>
                <p><strong>Latitude:</strong> {gpsData.latitude_fmt}</p>
                <p><strong>Longitude:</strong> {gpsData.longitude_fmt}</p>
                <p><strong>Speed over ground:</strong> {gpsData.speed_over_ground} knts</p>
                <p><strong>Drift on tack</strong> {gpsData.drift_on_tack} knts</p> 
                <p><strong>Distance covered:</strong> {gpsData.distance_covered} nm</p>
                <p><strong>Distance to Lauren Marine Services:</strong> {gpsData.distance_to_lauren} nm</p>
                <p><strong>Distance to Cowes:</strong> {gpsData.distance_to_cowes} nm</p>
                </div>
            ) : (
                <p className="text-2xl text-slate-900 dark:text-white">Loading GPS data...</p>
            )}
            {error && <p className="text-red-500 font-bold text-3xl text-center align-middle">{error}</p>}
        </div>
    )
}

export default GpsDisplay