import {useState, useEffect} from 'react';
import axios from 'axios';

const DepthGuage = function(){

    const [error, setError] = useState(null);
    const [tidal_event, setTidalEvent] = useState({
        datetime_stamp: "13:22",
        height_of_tide: "5.2",
        event: "HW"
    })


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

    let unit = "m"

    return(
        <div className="">
            <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-teal-900 dark:text-white mb-3">
                <span className="text-3xl text-center font-semibold">{tidal_event.event === "HW" ? 'High water' : 'Low water'} at {tidal_event.datetime_stamp}, {tidal_event.height_of_tide} m</span>
                <div className='flex row-span-4 items-center justify-center'>
                    <h1 className="text-9xl font-sans font-bold">3.4</h1>
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