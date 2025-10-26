import { useState, useEffect } from 'react';
import { useThemeContext } from './ThemeContext';
import axios from 'axios';

const PassagePlan = function(){
    const {theme} = useThemeContext();

    const [passagePlan, setPassagePlan] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const requestPassagePlan = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/passage_plan`);
                setPassagePlan(response.data);
                setError(null);
            } catch (error) {
                console.error("Error receiving the passage plan", error);
                setError('Unable to load the passage plan right now.');
            }
        }

        requestPassagePlan();
        const interval = setInterval(requestPassagePlan, 10000);
        return () => clearInterval(interval);
    }, []);

    if (error) {
        return (
            <div className="rounded-xl p-3 bg-slate-200 dark:bg-teal-900">
                <span className="text-left mt-5 text-lg font-semibold text-red-600 dark:text-red-300">{error}</span>
            </div>
        );
    }

    if (!passagePlan) {
        return (
            <div className="rounded-xl p-3 bg-slate-200 dark:bg-teal-900 animate-pulse">
                <span className="text-left mt-5 text-lg font-semibold">Loading passage plan…</span>
            </div>
        );
    }

    const waypoints = Array.isArray(passagePlan.course_to_steer) ? passagePlan.course_to_steer : [];

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
                    {waypoints.map((waypoint, index) => (
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
