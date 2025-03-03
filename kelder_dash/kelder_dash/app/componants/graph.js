import { Line } from "react-chartjs-2";
import Chart from 'chart.js/auto'

const Graph = function(input_data){

    return(
        <div>
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