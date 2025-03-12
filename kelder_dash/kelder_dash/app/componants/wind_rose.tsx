"use client";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
//import HighchartsSolidGauge  from "highcharts/modules/gauge";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts);
    //HighchartsSolidGauge(Highcharts);
}



const WindRose = function({}){
    
    var compass_labels = {180:"N", 225:"NE", 270:"E", 315:"SE", 0:"S", 45:"SW", 90:"W", 135:"NW"};


    const chart_options:Highcharts.Options={
        chart: {
            type: 'gauge'
        },
    
        title: {text:"Wind Rose"},
    
        pane: {
            startAngle: -180,
            endAngle: 180,
            background: [{
                backgroundColor:'#fafafa',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }]
        },

        // the value axis
        yAxis: 
        [
            {
                min: -180,
                max: 180,
                lineColor: '#000000',
                tickColor: '#000000',
                minorTickColor: '#000000',
                lineWidth: 2,
                offset: -10,
                labels: {
                    distance: -20,
                    rotation: 'auto'
                },
                tickLength: 5,
                minorTickLength: 5,
                endOnTick: false
            },
            {
                min: 0,
                max: 360,
                tickPosition: 'outside',
                lineColor: '#000000',
                tickColor: '#000000',
                minorTickColor: '#00000',
                lineWidth: 2,
                offset: 0,
                tickInterval: 45,
                labels: {
                    distance: 10,
                    formatter: function() {
                        var value = compass_labels[this.value];
                        return value !== 'undefined' ? value : this.value;
                    },
                    rotation: 'auto'
                },
                tickLength: 5,
                minorTickLength: 5,
                endOnTick: false
            }
        
        ],

        series: [
            {
                //pointStart: 100,
                data: [-100],
                color: '#55BF3B',
                tooltip: {
                    valueSuffix: '0 M'
                }
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
        <div className="border rounded-xl p-3">
        <HighchartsReact highcharts = {Highcharts} options = {chart_options}/> 
        </div>
    )
}

export default WindRose