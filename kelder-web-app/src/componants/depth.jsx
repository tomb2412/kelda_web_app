import React, {useState, useEffect, useRef} from 'react';

const DepthGuage = function(){

    const [tidal_event, setTidalEvent] = useState({
        datetime_stamp: "13:22",
        height_of_tide: "5.2",
        event: "HW"
    })


    useEffect(()=> {
        const requestTidalEvent = async () => {
            try {
                const response = await axios.get("http://192.168.1.167:8000/get_next_tidal_event")//"http://raspberrypi.local:8000/gps_coords");//
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

    

    let depth = 17.3
    let unit = "m"

    return(
        <div className="">
            <div className="grid grid-row-6 rounded-xl p-3 bg-[#024887]/10 text-slate-800 dark:bg-teal-900 dark:text-white mb-3">
                <span className="text-left text-3xl font-semibold">{tidal_event.event === "HW" ? 'High water' : 'Low water'} at {tidal_event.datetime_stamp} with {tidal_event.height_of_tide} m</span>
                <span className="text-left text-3xl mt-2 font-semibold">Current height of tide:</span>
                <h1 className="flex row-span-4 items-center justify-center text-9xl font-sans font-bold">3.4</h1>
                <p className="text-right text-7xl p-3">{unit}</p>
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