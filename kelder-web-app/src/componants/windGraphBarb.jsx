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

    const [series, setSeries] = useState([[],[],[]]);
    const [error_wind, setError_wind] = useState(null);
    const chartRef = useRef(null);

    // Fetch data and update series every 2 seconds
    useEffect(() => {
        const requestWindyData = async () => {
            try {
                const today = new Date();
                const start_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 5,0,0);
                const end_time = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 21,0,0);

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
                    x: ts,
                    value: response.data.hourly.wind_speed_10m[i],
                    direction: response.data.hourly.wind_direction_10m[i],
                  })).filter(
                    ({x,value, direction}) => {
                        const date = new Date(x);
                        return start_time <= date  && end_time  >= date;
                    }
                );

                console.log("Temperature Series:", temperatureSeries);
                console.log("Pressure Series:", pressureSeries);
                console.log("Wind series:", windSeries);

                // from the usesState hook
                setSeries([temperatureSeries, pressureSeries, windSeries]);

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
            style: {color: theme==='light' ? "#000000" : "#ffffff" },
        },
        chart: {
            backgroundColor: "transparent",
        },
        xAxis: [{
            type: 'datetime',
            tickInterval: 2 * 36e5, // two hours
            minorTickInterval: 36e5, // one hour
            tickLength: 10,
            lineColor: theme==='light' ? "#000000" : "#ffffff",
            gridLineWidth: 0,
            minorGridLineWidth: 0,
            labels: {style: { color : theme==='light' ? "#000000" : "#ffffff"}}
        }],
        yAxis: [
            {
                gridLineWidth: 0,
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                title: { text: 'Temperature (°C)' , color : theme==='light' ? "#000000" : "#ffffff"},
                opposite: false, // Temperature on the left axis
                labels: {style: { color : theme==='light' ? "#000000" : "#ffffff"}}
            },
            {
                gridLineWidth: 0,
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                title: { text: 'Pressure (hPa)' },
                opposite: true, // Pressure on the right axis
                labels: {style: { color : theme==='light' ? "#000000" : "#ffffff"}}
            }
        ],
        series: [
            {
                name: "Temperature (2m)",
                data: series[0],
                type: 'line',
                yAxis: 0,
                color: theme==='light' ? "#257373" : "#45d9d9",
            },
            {
                name: "Pressure (Surface)",
                data: series[1],
                type: 'line',
                yAxis: 1,
                color: theme==='light' ? "#407325" : "#73d43f",
            },
            {
                name: "Wind Barb",
                type:'windbarb',
                data: series[2],
                color: theme==='light' ? "#000000" : "#ffffff",

            }
        ], // Dynamically updated series
    };

    return (
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-teal-900">
            {series[0].length > 0 ? (
                <HighchartsReact highcharts={Highcharts} options={chartOptions} ref={chartRef} />
            ) : (
                <p className="text-2xl text-slate-900 dark:text-white text-center align-middle">Loading weather data...</p>
            )}
            {error_wind && <p className="text-red-500 font-bold text-3xl text-center align-middle">{error_wind}</p>}
        </div>
    );
};

export default WindBarb;