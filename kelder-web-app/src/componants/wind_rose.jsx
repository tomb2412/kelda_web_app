"use client";

import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
import { useThemeContext } from "./ThemeContext";
//import HighchartsSolidGauge  from "highcharts/modules/gauge";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts);
    //HighchartsSolidGauge(Highcharts);
}



const WindRose = function({}){

    const {theme} = useThemeContext();
    
    const compass_labels = {180:"N", 225:"NE", 270:"E", 315:"SE", 0:"S", 45:"SW", 90:"W", 135:"NW"};

    const chart_options={
        chart: {
            type: 'gauge',
            styledMode: false,
            backgroundColor: "transparent",
        },
        title: {
            text:"Wind Rose",
            style: {
                opacity: 0,
                color: theme==='light' ? "#000000" : "#ffffff",
                fontSize: '1px'
            }
        },
    
        pane: {
            size: "70%",
            startAngle: -180,
            endAngle: 180,
            background: [{
                backgroundColor:'transparent',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }]
        },
        plotOptions: {
            gauge: {
                dial: {
                    radius: '80%',
                    backgroundColor: theme==='light' ? "#000000" : "#ffffff",
                    baseWidth: 5,
                    topWidth: 1,
                }
            }
        },

        // the value axis
        yAxis: 
        [
            {
                min: -180,
                max: 180,
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                tickColor: theme==='light' ? "#000000" : "#ffffff",
                minorTickColor: theme==='light' ? "#000000" : "#ffffff",
                lineWidth: 5,
                offset: 5,
                labels: {
                    style:{
                        color: theme==='light' ? "#000000" : "#ffffff",
                        fontSize: "1em"
                    },
                    distance: -30
                },
                tickLength: 20,
                minorTickLength: 10,
                endOnTick: false
            },
            {
                min: 0,
                max: 360,
                tickPosition: 'outside',
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                tickColor: theme==='light' ? "#000000" : "#ffffff",
                minorTickColor: theme==='light' ? "#000000" : "#ffffff",
                lineWidth: 5,
                offset: 15,
                tickInterval: 45,
                labels: {
                    distance: 25,
                    style:{
                        color: theme==='light' ? "#000000" : "#ffffff",
                        fontSize: "1.5em"
                    },
                    formatter: function () {
                        var value = compass_labels[this.value]// as keyof typeof compass_labels];
                        return value !== 'undefined' ? value : this.value;
                    }
                },
                tickLength: 10,
                minorTickLength: 5,
                endOnTick: false
            }
        
        ],

        series: [
            {
                //pointStart: 100,
                data: [-100],
                color: theme==='light' ? "#000000" : "#ffffff",
                tooltip: {
                    valueSuffix: '0 M'
                },
                colorAxis: "#55BF3B"
            },
            {
                data: [-30],
                color: '#DF5353',
                tooltip: {
                    valueSuffix: '0 M'
                }
            }
    ]
    };

    return (
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-teal-900">
            <div className="flex flex-row items-center justify-between">
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWS: 10.2</p>
                <p className = "text-6xl text-slate-900 dark:text-white font-bold">000°</p>
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWS: 13.3</p> 
            </div>
            <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
            <div className="flex flex-row items-center justify-between">
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWA: 335°</p>
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWA: 260°</p> 
            </div>
        </div>
    )
}

export default WindRose