import { useState, useEffect } from 'react';
import { useThemeContext } from './ThemeContext';
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

const fallbackWaypoint = {
    name: '--',
    latitude: '--',
    longitude: '--',
    distance_nm: '--',
    bearing: '--',
};

const fallbackPlan = {
    departure_place_name: '--',
    desination_place_name: '--',
    course_to_steer: [fallbackWaypoint],
};

const PassagePlan = function(){
    const {theme} = useThemeContext();

    const [passagePlan, setPassagePlan] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const requestPassagePlan = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/passage_plan`);
                setPassagePlan(response.data.passage_plan);
                setError(null);
            } catch (fetchError) {
                console.error("Error receiving the passage plan", fetchError);
                setError('Unable to load the passage plan right now.');
            }
        }

        requestPassagePlan();
        const interval = setInterval(requestPassagePlan, 10000);
        return () => clearInterval(interval);
    }, []);

    const isLoading = !passagePlan && !error;
    const planToRender = passagePlan ?? fallbackPlan;
    const waypointsSource = Array.isArray(planToRender.course_to_steer) ? planToRender.course_to_steer : [];
    const waypoints = waypointsSource.length ? waypointsSource : fallbackPlan.course_to_steer;

    const hasRealPlan =
        Boolean(passagePlan) &&
        passagePlan.departure_place_name &&
        passagePlan.desination_place_name;
    const headingText = hasRealPlan
        ? `Passage Plan: ${planToRender.departure_place_name} to ${planToRender.desination_place_name}`
        : 'Passage Plan';

    return (
        <div className="rounded-xl p-3 bg-slate-200 text-slate-900 dark:bg-slate-800/90 dark:text-white">
            <span className="text-left mt-5 text-3xl font-semibold">{headingText}</span>
            {isLoading && (
                <p className="text-sm mt-1 text-slate-600 dark:text-white">
                    Loading passage plan…
                </p>
            )}
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
                            <td className="px-4 py-2 text-center">
                                {formatDdMmSs(waypoint.latitude)}, {formatDdMmSs(waypoint.longitude)}
                            </td>
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
