//"use client";
import React, {useState, useEffect, useRef} from 'react';
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsExporting from 'highcharts/modules/exporting'
import datagrouping from "highcharts/modules/datagrouping";
import windbarb from "highcharts/modules/windbarb";
import axios from 'axios';
import { useThemeContext } from './ThemeContext';

//import HighchartsSolidGauge from 'highcharts/modules/solid-gauge'

if (typeof Highcharts === 'function') {
    //HighchartsSolidGauge(Highcharts)
    datagrouping(Highcharts);
    windbarb(Highcharts);
    HighchartsExporting(Highcharts);
}

const WindBarb = () => {
    
    const {theme} = useThemeContext();

    const [series, setSeries] = useState([]);
    const [error_wind, setError_wind] = useState(null);
    const chartRef = useRef(null);

    // Fetch data and update series every 2 seconds
    useEffect(() => {
        const requestWindyData = async () => {
            try {
                const today = new Date();
                const start_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 5,0,0);
                const end_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21,0,0);

                console.log("Running")
                console.log(start_time <= end_time)

                const response = await axios.get("https://api.open-meteo.com/v1/forecast?latitude=52.1964531&longitude=-2.221358&hourly=temperature_2m,pressure_msl,wind_speed_10m,wind_direction_10m,rain,wind_gusts_10m&models=ukmo_seamless&forecast_days=1");

                console.log("API response:", response.data);

                const timestamps = response.data.hourly.time
                    .map(t => new Date(t).getTime())
                    .filter(
                        timestamp => {
                            const date = new Date(timestamp);
                            return start_time <= date  && end_time  >= date;
                        }
                    );
                const temperatureSeries = timestamps.map((ts, i) => ({ x: ts, y: response.data.hourly.temperature_2m[i] })).filter(
                    ({ x, y }) => {
                    const date = new Date(x);
                    return start_time <= date  && end_time  >= date;
                  });
                const pressureSeries = timestamps.map((ts, i) => ({ x: ts, y: response.data.hourly.pressure_msl[i] })).filter(
                    ({ x, y }) => {
                    const date = new Date(x);
                    return start_time <= date  && end_time  >= date;
                  });
                const windSeries = timestamps.map((ts, i) => ({
                    x: ts, // Convert time string to timestamp (milliseconds)
                    value: response.data.hourly.wind_speed_10m[i],
                    direction: response.data.hourly.wind_direction_10m[i],
                  })).filter(
                    ({x,value, direction}) => {
                        const date = new Date(x);
                        return start_time <= date  && end_time  >= date;
                    }
                );

                // Log the individual series
                console.log("Temperature Series:", temperatureSeries);
                console.log("Pressure Series:", pressureSeries);
                console.log("Wind series:", windSeries);

                // Set the series state here, to be passed to Highcharts
                setSeries([
                    {
                        name: "Temperature (2m)",
                        data: temperatureSeries,
                        type: 'line',
                        yAxis: 0,
                    },
                    {
                        name: "Pressure (Surface)",
                        data: pressureSeries,
                        type: 'line',
                        yAxis: 1,
                    },
                    {
                        name: "Wind Barb",
                        type:'windbarb',
                        color: "#000000",
                        data: windSeries,
                    }
                ]);

                // Reset any error message
                setError_wind(null);

            } catch (err) {
                console.log("Error fetching point weather data:", err);
                setError_wind("Error fetching point weather data");
            }
        };

        // Request data immediately and then at 1 hour intervals
        requestWindyData();
        const interval = setInterval(requestWindyData, 3600000);

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);

    // Define the chart options (dynamic series)
    const chartOptions = {
        title: {
            text: 'Weather Data (Temperature & Pressure)',
            style: { color: "#000000" },
        },
        chart: {
            backgroundColor: "transparent",
        },
        xAxis: [{
            type: 'datetime',
            tickInterval: 2 * 36e5, // two hours
            minorTickInterval: 36e5, // one hour
            tickLength: 10,
            gridLineWidth: 0,
            minorGridLineWidth: 0,
        }],
        yAxis: [
            {
                gridLineWidth: 0,
                title: { text: 'Temperature (°C)' },
                opposite: false, // Temperature on the left axis
            },
            {
                gridLineWidth: 0,
                title: { text: 'Pressure (hPa)' },
                opposite: true, // Pressure on the right axis
            }
        ],
        series: series, // Dynamically updated series
    };

    return (
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-teal-900">
            {series.length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartRef} />
            ) : (
                <p className="text-2xl text-slate-900 dark:text-white">Loading weather data...</p>
            )}
            {error_wind && <p className="text-red-500 font-bold text-3xl text-center align-middle">{error_wind}</p>}
        </div>
    );
};

export default WindBarb;