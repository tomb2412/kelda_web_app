"use client";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
import HighchartsSolidGauge  from "highcharts/modules/solid-gauge";
import useTheme from "./lightDarkToggle";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts);
    HighchartsSolidGauge(Highcharts);
}



const Guage = function({}){

    const {theme} = useTheme();
    const isNightMode = theme === "light";
    
    const chart_options={//Highcharts.Options={
        chart: {
            type: 'solidgauge',
            styledMode: false
        },
    
        title: {text:"Fuel"},
    
        pane: {
            startAngle: -90,
            endAngle: 90,
            background: [{
                backgroundColor: isNightMode ? '#00000' : '#fafafa',
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
            data: [100],
            tooltip: {
                valueSuffix: '%'
            }
        }]
    };

    return (
        <div className="rounded-xl p-3 bg-[#c8d9c3] dark:bg-teal-900">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default Guage