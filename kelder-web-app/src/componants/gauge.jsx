"use client";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
import HighchartsSolidGauge  from "highcharts/modules/solid-gauge";
import { useThemeContext } from "./ThemeContext";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts);
    HighchartsSolidGauge(Highcharts);
}



const Guage = function({}){

    const {theme} = useThemeContext();

    const chart_options={//Highcharts.Options={
        chart: {
            type: 'solidgauge',
            styledMode: false,
            backgroundColor:  "transparent",
        },
    
        title: {
            text:"Fuel", 
            style: {
                color:theme==='light' ? "#000000" : "#ffffff",
                fontSize:'30px'
            }
        },
    
        pane: {
            startAngle: -90,
            endAngle: 90,
            background: [{
                backgroundColor: '#ffffff',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }]
        },

        // the value axis
        yAxis: {
            stops: [
                [0.1, '#DF5353'], // red
                [0.5, '#DDDF0D'], // yellow
                [0.9, '#55BF3B'] // green
            ],
            lineWidth: 0,
            tickWidth: 0,
            tickAmount: 2,
            labels: {
                y: 16
            },
            min: 0,
            max: 100,
            title: {
                text: '%',
                y: -100
            }
        },

        series: [{
            type: "solidgauge",
            data: [40],
            tooltip: {
                valueSuffix: '%'
            }
        }]
    };

    return (
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-slate-800/90">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default Guage