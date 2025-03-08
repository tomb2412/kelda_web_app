import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsMore from "highcharts/highcharts-more"
import HighchartsSolidGauge  from "highcharts/modules/solid-gauge";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts)
    HighchartsSolidGauge(Highcharts) 
}



const Guage = function({}){
    const chartValue = 10
    
    const chart_options:Highcharts.Options={
        chart: {
            type: 'solidgauge'
        },
    
        title: {text:"Fuel"},
    
        pane: {
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor:
                    Highcharts.defaultOptions.legend.backgroundColor || '#fafafa',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },

    
        // the value axis
        yAxis: {
            stops: [
                [0.1, '#55BF3B'], // green
                [0.5, '#DDDF0D'], // yellow
                [0.9, '#DF5353'] // red
            ],
            lineWidth: 0,
            tickWidth: 0,
            minorTickInterval: null,
            tickAmount: 2,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },
    
        plotOptions: {
            solidgauge: {
                borderRadius: 3,
                dataLabels: {
                    y: 5,
                    borderWidth: 0,
                    useHTML: true
                }
            }
        },
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: '%'
            }
        },

        series: [{
            name: 'Speed',
            data: [30],
            tooltip: {
                valueSuffix: '%'
            }
        }]

    };
    
        return (
            <div className="border rounded-xl">
            <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
            </div>
        )
}

export default Guage