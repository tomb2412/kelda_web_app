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
    const chart_options:Highcharts.Options={
            title: {text:'Wind speed and direction'},
            series: [{
                type: 'line',
                data: [["0",1],["1",2],["2",3],["3",1],["4",2],["5",3]]
            },
            {
                type:'windbarb',
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
        <div className="boarder rounded-xl p-3">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default WindBarb