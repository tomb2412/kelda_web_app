import { useThemeContext } from './ThemeContext';
import { useSensorData } from '../context/SensorDataContext';

const fallbackWaypoint = { name: '--', latitude: null, longitude: null, latitude_hemisphere: '', longitude_hemisphere: '' };
const fallbackPlan = {
    departure_place_name: '--',
    desination_place_name: '--',
    course_to_steer: [fallbackWaypoint],
};

const fmtCoord = (value, hemisphere) => {
    if (value === null || value === undefined) return '--';
    return `${Math.abs(value).toFixed(4)}° ${hemisphere}`;
};

const PassagePlan = function(){
    const {theme} = useThemeContext();

    const passagePlanData = useSensorData('passagePlan');
    const passagePlan = passagePlanData?.passage_plan ?? null;
    const isLoading = !passagePlan;
    const planToRender = passagePlan ?? fallbackPlan;
    const waypointsSource = Array.isArray(planToRender.course_to_steer) ? planToRender.course_to_steer : [];
    const waypoints = waypointsSource.length ? waypointsSource : fallbackPlan.course_to_steer;
    // Prepend null for the departure waypoint (no incoming leg)
    const distances = passagePlan?.distance_between_waypoints
        ? [null, ...passagePlan.distance_between_waypoints]
        : Array(waypoints.length).fill(null);
    const bearings = passagePlan?.bearing_between_waypoints
        ? [null, ...passagePlan.bearing_between_waypoints]
        : Array(waypoints.length).fill(null);
    
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
            <div className="w-full overflow-y-auto max-h-[375px] mt-2">
                <table className="min-w-full table-auto border-collapse">
                    <colgroup>
                        <col className="w-1/2" />
                        <col className="w-1/3" />
                        <col className="w-1/6" />
                        <col className="w-1/6" />
                    </colgroup>
                    <thead>
                        <tr className="sticky top-0 bg-slate-200 dark:bg-slate-700">
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
                                {fmtCoord(waypoint.latitude, waypoint.latitude_hemisphere)}, {fmtCoord(waypoint.longitude, waypoint.longitude_hemisphere)}
                            </td>
                            <td className="px-1 py-2 text-center">
                                {distances[index] != null ? distances[index].toFixed(2) : '—'}
                            </td>
                            <td className="px-1 py-2 text-center">
                                {bearings[index] != null ? bearings[index].toFixed(1) : '—'}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default PassagePlan
