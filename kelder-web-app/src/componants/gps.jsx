import React, {useState, useEffect} from 'react';
import axios from 'axios';


const GpsDisplay = function({}){

    const [gpsData, setGpsData] = useState(null);
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
        <div className="grid rounded-xl p-3 bg-teal-900 text-white">
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {gpsData ? (
                <div>
                <p><strong>Time:</strong> {gpsData.timestamp}</p>
                <p><strong>Latitude:</strong> {gpsData.latitude_fmt}</p>
                <p><strong>Longitude:</strong> {gpsData.longitude_fmt}</p>
                <p><strong>Speed over ground:</strong> {gpsData.speed_over_ground} knts</p>
                </div>
            ) : (
                <p>Loading GPS data...</p>
            )}
        </div>
    )
}

export default GpsDisplay