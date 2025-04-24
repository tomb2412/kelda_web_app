"use client";
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsExporting from 'highcharts/modules/exporting'
import datagrouping from "highcharts/modules/datagrouping";
import windbarb from "highcharts/modules/windbarb";
//import HighchartsSolidGauge from 'highcharts/modules/solid-gauge'

if (typeof Highcharts === 'function') {
    //HighchartsSolidGauge(Highcharts)
    datagrouping(Highcharts);
    windbarb(Highcharts);
    HighchartsExporting(Highcharts);
}


const WindBarb = function(){
    const chart_options={//Highcharts.Options={
            colorAxis:{
                lineColor:"#ffffff",
                gridLineColor:"#ffffff"
            },
            title: {
                text:'Wind speed and direction',
                style:{color:"#ffffff"}
            },
            chart: {
                backgroundColor:"#134e4a"
            },
            series: [
                {
                type: 'line',
                color: "#ffffff",
                data: [["0",1],["1",2],["2",3],["3",1],["4",2],["5",3]]
            },
            {
                type:'windbarb',
                color: "#ffffff",
                data: [
                    {
                        x:0,
                        value:1,
                        direction:0},
                    {
                        x:1,
                        value:2,
                        direction:45},
                    {
                        x:2,
                        value:5,
                        direction:90},
                    {
                        x:3,
                        value:1,
                        direction:135},
                    {
                        x:4,
                        value:2,
                        direction:180},
                    {
                        x:5,
                        value:5,
                        direction:225},
                    ]
            }
        ]
    };

    return (
        <div className="rounded-xl p-3 bg-slate-200 dark:bg-teal-900">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default WindBarb