import React, { useState, useEffect } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useThemeContext } from './ThemeContext';
import axios from 'axios';

const BilgeDepth = function(){
    const {theme} = useThemeContext();

    const [passagePlan, setPassagePlan] = useState(
        {
            timestamp: '2025-09-10T09:00:00Z',
            title: 'Cowes to Yarmouth (Isle of Wight) – Day Skipper passage plan (2025-09-11)',
            course_to_steer: [
                {
                    name: "Cowes Yacht Haven (departure)",
                    coordinates: "50°45.3'N, 001°18.3'W",
                    bearing: "270°T",
                    distance_nm: 3.7,
                    eta: "10:37 BST",
                },
                {
                    name: "Mid-Solent (off Gurnard) waypoint",
                    coordinates: "50°45.0'N, 001°24.0'W",
                    bearing: "272°T",
                    distance_nm: 2.9,
                    eta: "11:06 BST",
                },
                ]
            }
    );

    useEffect(() => {
        const requestPassagePlan = async () => {
            try {
                const response = {
                    timestamp: '2025-09-10T09:00:00Z',
                    title: 'Cowes to Yarmouth (Isle of Wight) – Day Skipper passage plan (2025-09-11)',
                    course_to_steer: [
                        {
                            name: "Cowes Yacht Haven (departure)",
                            coordinates: "50°45.3'N, 001°18.3'W",
                            bearing: "270°T",
                            distance_nm: 3.7,
                            eta: "10:37 BST",
                        },
                        {
                            name: "Mid-Solent (off Gurnard) waypoint",
                            coordinates: "50°45.0'N, 001°24.0'W",
                            bearing: "272°T",
                            distance_nm: 2.9,
                            eta: "11:06 BST",
                        },
                        ]
                    }//await axios.get("http://localhost:8000/passage_plan");
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
            <div className=''>
                <span className="text-left text-3xl font-semibold">Passage Plan</span>
                <div>{passagePlan.title}</div>
                <div>Waypoints</div>
                <ul>
                    {passagePlan.course_to_steer.map((waypoint, index) => (
                        <li key={index}>
                            <strong>{waypoint.name}</strong>
                            <div>Coordinates: {waypoint.coordinates}</div>
                            <div>Bearing: {waypoint.bearing}</div>
                            <div>Distance (nm): {waypoint.distance_nm}</div>
                            <div>ETA: {waypoint.eta}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default BilgeDepth
