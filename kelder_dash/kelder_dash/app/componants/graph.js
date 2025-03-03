import { Line } from "react-chartjs-2";

import {CategoryScale} from 'chart.js'; 
Chart.register(CategoryScale);

const Graph = function(input_data){

    return(
        <div className="flex flex-row justify-evenly">
            <Line
                data={{
                    labels: input_data.data.map(row => row.year),
                    datasets: [
                        {
                            label: "Lull Speed",
                            data: input_data.data.map(row => row.low)
                        },
                        {
                            label: "Gusts Speed",
                            data: input_data.data.map(row => row.high)
                        }
                    ]
                }}
            />
        </div>
    )
}

export default Graph