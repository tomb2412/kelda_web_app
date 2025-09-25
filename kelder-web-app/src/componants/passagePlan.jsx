import { useState, useEffect } from 'react';
import { useThemeContext } from './ThemeContext';
import axios from 'axios';

const PassagePlan = function(){
    const {theme} = useThemeContext();

    let mock_response_model = {
        timestamp: '2025-09-10T09:00:00Z',
        title: 'Cowes to Yarmouth (Isle of Wight) – Day Skipper passage plan (2025-09-11)',
        course_to_steer: [
            {
                name: "Cowes Yacht Haven (departure)",
                coordinates: "50°45.3'N, 001°18.3'W",
                bearing: "270",
                distance_nm: 3.7,
                eta: "10:37 BST",
            },
            {
                name: "Mid-Solent (off Gurnard) waypoint",
                coordinates: "50°45.0'N, 001°24.0'W",
                bearing: "272",
                distance_nm: 2.9,
                eta: "11:06 BST",
            },
        ]
    };


    const [passagePlan, setPassagePlan] = useState(mock_response_model);

    useEffect(() => {
        const requestPassagePlan = async () => {
            try {mock_response_model // await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/passage_plan`);
                setPassagePlan(response)
                console.log(response)
            } catch (error) {
                console.log("Error recieving the passage plan")
            }
        }

        requestPassagePlan();
        const interval = setInterval(requestPassagePlan, 2000);

        return () => clearInterval(interval)

    }, []);

    return (
        <div className="rounded-xl p-3 bg-slate-200 dark:bg-teal-900">
            <span className="text-left mt-5 text-3xl font-semibold">Passage Plan: {passagePlan.departure_place_name} to {passagePlan.desination_place_name}</span>
            <div className="w-full overflow-y-auto max-h-64">
                <table className="min-w-full table-auto border-collapse"> 
                    <colgroup>
                        <col className="w-1/2" />
                        <col className="w-1/3" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                    </colgroup>
                    <thead>
                        <tr className="sticky top-0 bg-transparent">
                        <th className="px-4 py-2 text-center">Waypoint</th>
                        <th className="px-4 py-2 text-center">Coordinates</th>
                        <th className="px-1 py-2 text-center">Distance (nm)</th>
                        <th className="px-1 py-2 text-center">Bearing (°T)</th>
                    </tr>
                    </thead>
                    <tbody>
                    {passagePlan.course_to_steer.map((waypoint, index) => (
                        <tr key={index} className="even:bg-transparent odd:bg-transparent">
                            <td className="px-4 py-2 text-center"><strong>{waypoint.name}</strong></td>
                            <td className="px-4 py-2 text-center">{waypoint.coordinates}</td>
                            <td className="px-1 py-2 text-center">{waypoint.distance_nm}</td>
                            <td className="px-1 py-2 text-center">{waypoint.bearing}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PassagePlan
