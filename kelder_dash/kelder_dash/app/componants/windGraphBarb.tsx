import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
//import HighchartsExporting from 'highcharts/modules/exporting'
import datagrouping from "highcharts/modules/datagrouping";
import windbarb from "highcharts/modules/windbarb";
//import HighchartsSolidGauge from 'highcharts/modules/solid-gauge'

if (typeof Highcharts === 'function') {
    //HighchartsSolidGauge(Highcharts)
    datagrouping(Highcharts);
    windbarb(Highcharts);
    //HighchartsExporting(Highcharts);
}



const WindBarb = function(){
    const chartValue = 10

    const chart_options:Highcharts.Options={
            title: {text:'Wind speed and direction'},
            series: [{
                type: 'line',
                data: [1,2,3]
            },
            {
                type:'windbarb',
                data: [(0,1,1),(1,2,2),(2,3,3)]
            }
        ]
    };

    return (
        <div className="boarder rounded-xl">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default WindBarb