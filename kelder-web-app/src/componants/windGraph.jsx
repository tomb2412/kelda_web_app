import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const WindGraph = function(input_data){
    return(
        <div className="rounded-xl flex flex-col items-center justify-start border
            text-center text-lg  bg-teal-900">
            <Line className=""
                options= {{
                    responsive:true,
                    plugins:{
                        legend:{
                            display: false,
                            position: "right"
                        },
                        title:{
                            display: true,
                            text: "Wind speed",
                            position: "top"
                        }
                    },
                    scales: {
                        x: {
                            title:{
                                display: true,
                                text: "Time",
                                type: 'time'
                            }
                        },
                        y: {
                            title:{
                                display: true,
                                text: "Speed mps",
                                type: 'time'
                            }
                        
                        }
                    }
                }}
                data={{
                    labels: input_data.data.map(row => row.Time),
                    datasets: [
                        {
                            label: "Lull Speed",
                            data: input_data.data.map(row => row.low),
                            borderColor: '#09e30d',
                            backgroundColor: '#09e30d',
                            pointStyle: false,
                            pointRadius: '5',
                            pointRotation:'45',
                            borderWidth: "1.5",
                            pointHitRadius:10
                        },
                        {
                            label: "Gusts Speed",
                            data: input_data.data.map(row => row.high),
                            borderColor: '#d11b0a',
                            backgroundColor: '#d11b0a',
                            pointStyle: false,
                            pointRadius: '5',
                            pointRotation:'45',
                            borderWidth: "1.5",
                            pointHitRadius:10
                        }
                    ]
                }}
            />
        </div>
    )
}

export default WindGraph