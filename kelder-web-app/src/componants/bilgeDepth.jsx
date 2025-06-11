import React, { useState, useEffect } from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useThemeContext } from './ThemeContext';

const BilgeDepth = function(){
    const {theme} = useThemeContext();

    const [chart_options, set_chart_options] = useState(
        {
            chart: {
                backgroundColor:"#134e4a"
            },
            xAxis: {
            categories: ['A', 'B', 'C'],
            },
            series: [
            { data: [1, 2, 3] }
            ]
        }
    );

    useEffect(() => {
        set_chart_options(prevOptions => ({
          ...prevOptions,
          chart: {
            backgroundColor: theme === 'dark' ? '#134e4a' : '#ffffff'
          }
        }));
      }, [theme]);
      

    return (
        <div className="rounded-xl p-3 bg-slate-200 dark:bg-teal-900">
            <HighchartsReact
                highcharts={Highcharts}
                options={chart_options}
                updateArgs={[true,true,true]}
            />
        </div>
    )
}

export default BilgeDepth
