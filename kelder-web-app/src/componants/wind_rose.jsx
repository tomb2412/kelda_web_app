"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
import { useThemeContext } from "./ThemeContext";
import axios from 'axios';

const COMPASS_REFRESH_MS = 2000;
const INITIAL_HEADING = 2;
const ROTATION_ANIMATION_MS = 800;
//import HighchartsSolidGauge  from "highcharts/modules/gauge";

if (typeof Highcharts === 'function') {
    HighchartsMore(Highcharts);
    //HighchartsSolidGauge(Highcharts);
}

const directionLabels = {
  "180": "N",
  "225": "NE",
  "270": "E",
  "315": "SE",
  "0": "S",
  "45": "SW",
  "90": "W",
  "135": "NW"
};

function rotateCompassLabels(heading) {
  const rotated = {};
  for (const angle in directionLabels) {
    const adjusted = (parseInt(angle) - heading + 360) % 360;
    rotated[adjusted] = directionLabels[angle];
  }
  return rotated;
}

const normalizeAngle = (angle) => {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
};

const shortestAngleDelta = (from, to) => {
  const current = normalizeAngle(from);
  const target = normalizeAngle(to);
  let delta = target - current;
  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }
  return delta;
};

const WindRose = function({}){
    const {theme} = useThemeContext();

    const [compassHeading, setCompassHeading] = useState({heading: INITIAL_HEADING});
    const [displayHeading, setDisplayHeading] = useState(INITIAL_HEADING);
    const displayedHeadingRef = useRef(INITIAL_HEADING);
    const chartRef = useRef(null);
    const animationElementRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(()=> {
        const requestCompassData = async () => {
            try {
                // const response = await axios.get(`${import.meta.env.VITE_KELDER_API_URL}/compass_heading`);//"http://raspberrypi.local:8000/compass_heading");
                // console.log(response.data);
                setCompassHeading({heading: 155});
                setError(null);
            } catch (err) {
                console.log("Error fetching compass data: ", err);
                setError(null);//"Error fetching GPS data");
            }
        };

        requestCompassData(); // On startup

        const interval = setInterval(requestCompassData, COMPASS_REFRESH_MS);

        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        const chart = chartRef.current?.chart;
        const targetHeading = compassHeading.heading;

        if (!chart || !chart.renderer) {
            const normalizedTarget = normalizeAngle(targetHeading);
            displayedHeadingRef.current = normalizedTarget;
            setDisplayHeading(normalizedTarget);
            return;
        }

        if (!animationElementRef.current) {
            animationElementRef.current = chart.renderer
                .rect(0, 0, 0, 0)
                .attr({ opacity: 0, dummyAngle: displayedHeadingRef.current })
                .add();
        }

        const animator = animationElementRef.current;
        if (animator.stop) {
            animator.stop();
        }

        const currentHeading = displayedHeadingRef.current;
        const targetValue = currentHeading + shortestAngleDelta(currentHeading, targetHeading);

        animator.attr({ dummyAngle: currentHeading });
        animator.animate(
            { dummyAngle: targetValue },
            {
                duration: ROTATION_ANIMATION_MS,
                easing: 'easeInOutSine',
                step: function (value) {
                    const normalized = normalizeAngle(value);
                    displayedHeadingRef.current = normalized;
                    setDisplayHeading(normalized);
                },
                complete: function () {
                    const normalizedTarget = normalizeAngle(targetHeading);
                    displayedHeadingRef.current = normalizedTarget;
                    setDisplayHeading(normalizedTarget);
                }
            }
        );

        return () => {
            if (animator.stop) {
                animator.stop();
            }
        };
    }, [compassHeading.heading]);

    useEffect(() => {
        return () => {
            if (animationElementRef.current) {
                if (animationElementRef.current.stop) {
                    animationElementRef.current.stop();
                }
                animationElementRef.current.destroy();
                animationElementRef.current = null;
            }
        };
    }, []);
    
    const compass_labels = useMemo(
        () => rotateCompassLabels(displayHeading),
        [displayHeading]
    );

    const tickPositions = useMemo(
        () => Object.keys(compass_labels).map((key) => Number(key)).sort((a, b) => a - b),
        [compass_labels]
    );

    const chart_options={
        chart: {
            type: 'gauge',
            styledMode: false,
            backgroundColor: "transparent",
        },
        title: {
            text:"Wind Rose",
            style: {
                opacity: 0,
                color: theme==='light' ? "#000000" : "#ffffff",
                fontSize: '1px'
            }
        },
    
        pane: {
            size: "70%",
            startAngle: -180,
            endAngle: 180,
            background: [{
                backgroundColor:'transparent',
                borderRadius: 5,
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }]
        },
        plotOptions: {
            gauge: {
                dial: {
                    radius: '80%',
                    backgroundColor: theme==='light' ? "#000000" : "#ffffff",
                    baseWidth: 5,
                    topWidth: 1,
                }
            }
        },

        // the value axis
        yAxis: 
        [
            {
                min: -180,
                max: 180,
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                tickColor: theme==='light' ? "#000000" : "#ffffff",
                minorTickColor: theme==='light' ? "#000000" : "#ffffff",
                lineWidth: 5,
                offset: 5,
                tickPositions: [-135,-90,-45,0,45,90,135,180],
                labels: {
                    style:{
                        color: theme==='light' ? "#000000" : "#ffffff",
                        fontSize: "1em"
                    },
                    distance: -30
                },
                tickLength: 20,
                minorTickLength: 10,
                endOnTick: false
            },
            {
                min: 0,
                max: 360,
                tickPosition: 'outside',
                lineColor: theme==='light' ? "#000000" : "#ffffff",
                tickColor: theme==='light' ? "#000000" : "#ffffff",
                minorTickColor: theme==='light' ? "#000000" : "#ffffff",
                lineWidth: 5,
                offset: 15,
                tickPositions,
                tickInterval: 45,
                labels: {
                    distance: 25,
                    style:{
                        color: theme==='light' ? "#000000" : "#ffffff",
                        fontSize: "1.5em"
                    },
                    formatter: function () {
                        var value = compass_labels[this.value]// as keyof typeof compass_labels];
                        return value !== 'error' ? value : this.value;
                    }
                },
                tickLength: 10,
                minorTickLength: 5,
                endOnTick: false
            }
        
        ],

        series: [
            {
                //pointStart: 100,
                data: [-100],
                color: theme==='light' ? "#000000" : "#ffffff",
                tooltip: {
                    valueSuffix: '0 M'
                },
                colorAxis: "#55BF3B"
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
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-teal-900">
            <div className="flex flex-row items-center justify-between">
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWS: 10.2</p>
                <div>
                    <p className = "text-6xl text-slate-900 dark:text-white font-bold">{String(compassHeading.heading).padStart(3, '0')}°</p>
                    <p className = "text-2xl text-center text-slate-900 dark:text-white font-bold">{String(compassHeading.heading).padStart(3, '0')}°</p>
                </div>
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWS: 13.3</p> 
            </div>
            <HighchartsReact ref={chartRef} highcharts = {Highcharts} options = {chart_options}/> 
            <div className="flex flex-row items-center justify-between">
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWA: 335°</p>
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWA: 260°</p> 
            </div>
        </div>
    )
}

export default WindRose
