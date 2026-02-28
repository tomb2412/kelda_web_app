"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import HighchartsMore from "highcharts/highcharts-more";
import { useThemeContext } from "./ThemeContext";
import { useSensorData } from '../context/SensorDataContext';

const INITIAL_HEADING = 0;
const ROTATION_ANIMATION_MS = 800;
const DEFAULT_COMPASS_READING = {
    heading: INITIAL_HEADING,
    course_over_ground: INITIAL_HEADING,
};
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

const formatHeadingValue = (heading) => {
  const numericHeading = Number(heading);
  if (!Number.isFinite(numericHeading)) {
    return '---';
  }
  const normalizedHeading = normalizeAngle(numericHeading);
  const roundedHeading = Math.round(normalizedHeading);
  const wrappedHeading = roundedHeading === 360 ? 0 : roundedHeading;
  return wrappedHeading.toString().padStart(3, '0');
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

    const compassData = useSensorData('compass');
    const [compassHeading, setCompassHeading] = useState(DEFAULT_COMPASS_READING);
    const [displayHeading, setDisplayHeading] = useState(INITIAL_HEADING);
    const [displayCog, setDisplayCog] = useState(INITIAL_HEADING);
    const displayedHeadingRef = useRef(INITIAL_HEADING);
    const displayedCogRef = useRef(INITIAL_HEADING);
    const chartRef = useRef(null);
    const headingAnimationRef = useRef(null);
    const cogAnimationRef = useRef(null);

    useEffect(() => {
        if (!compassData) return;
        const nextHeading = Number(compassData?.heading);
        const nextCog = Number(compassData?.course_over_ground);
        setCompassHeading((prev) => ({
            heading: Number.isFinite(nextHeading) ? nextHeading : prev.heading,
            course_over_ground: Number.isFinite(nextCog) ? nextCog : prev.course_over_ground,
        }));
    }, [compassData]);
    
    useEffect(() => {
        const chart = chartRef.current?.chart;
        const targetHeading = compassHeading.heading;
        const targetCog = compassHeading.course_over_ground;

        const updateInstant = (value, setter, ref) => {
            if (!Number.isFinite(value)) {
                return;
            }
            const normalizedValue = normalizeAngle(value);
            ref.current = normalizedValue;
            setter(normalizedValue);
        };

        if (!chart || !chart.renderer) {
            updateInstant(targetHeading, setDisplayHeading, displayedHeadingRef);
            updateInstant(targetCog, setDisplayCog, displayedCogRef);
            return;
        }

        const ensureAnimator = (ref, initialValue, attrKey) => {
            if (!ref.current) {
                ref.current = chart.renderer
                    .rect(0, 0, 0, 0)
                    .attr({ opacity: 0, [attrKey]: initialValue })
                    .add();
            }
            return ref.current;
        };

        const animateAngle = (ref, currentRef, targetValue, attrKey, setter) => {
            if (!Number.isFinite(targetValue)) {
                return;
            }

            const animator = ensureAnimator(ref, currentRef.current, attrKey);
            if (animator.stop) {
                animator.stop();
            }

            const current = currentRef.current;
            const target = current + shortestAngleDelta(current, targetValue);

            animator.attr({ [attrKey]: current });
            animator.animate(
                { [attrKey]: target },
                {
                    duration: ROTATION_ANIMATION_MS,
                    easing: 'easeInOutSine',
                    step: function (value, fx) {
                        const isMatchingProp = !fx || fx.prop === attrKey;
                        if (!isMatchingProp) {
                            return;
                        }
                        const normalized = normalizeAngle(value);
                        currentRef.current = normalized;
                        setter(normalized);
                    },
                    complete: function () {
                        const normalizedTarget = normalizeAngle(targetValue);
                        currentRef.current = normalizedTarget;
                        setter(normalizedTarget);
                    }
                }
            );
        };

        animateAngle(headingAnimationRef, displayedHeadingRef, targetHeading, 'dummyHeading', setDisplayHeading);
        animateAngle(cogAnimationRef, displayedCogRef, targetCog, 'dummyCog', setDisplayCog);

        return () => {
            if (headingAnimationRef.current?.stop) {
                headingAnimationRef.current.stop();
            }
            if (cogAnimationRef.current?.stop) {
                cogAnimationRef.current.stop();
            }
        };
    }, [compassHeading.heading, compassHeading.course_over_ground]);

    useEffect(() => {
        const cleanupAnimator = (animatorRef) => {
            if (animatorRef.current) {
                if (animatorRef.current.stop) {
                    animatorRef.current.stop();
                }
                animatorRef.current.destroy();
                animatorRef.current = null;
            }
        };

        return () => {
            cleanupAnimator(headingAnimationRef);
            cleanupAnimator(cogAnimationRef);
        };
    }, []);
    
    const compass_labels = useMemo(
        () => rotateCompassLabels(displayHeading),
        [displayHeading]
    );

    const formattedHeading = useMemo(
        () => formatHeadingValue(displayHeading),
        [displayHeading]
    );

    const formattedCog = useMemo(
        () => formatHeadingValue(displayCog),
        [displayCog]
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
            spacing: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
        },
        exporting: {
            enabled: false,
        },
        tooltip: {
            enabled: false,
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
                dataLabels: {
                    enabled: false,
                },
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
            },
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
        
        ],

        series: [
            {
                //pointStart: 100,
                name: "Heading",
                data: [(parseInt(displayHeading) - displayHeading + 540) % 360],
                color: theme==='light' ? "#000000" : "#ffffff",
                tooltip: {
                    valueSuffix: '0 M'
                },
                colorAxis: "#55BF3B"
            },
            {
                name: "Course over ground",
                data: [(parseInt(displayCog) - displayHeading + 540) % 360],
                color: '#DF5353',
                tooltip: {
                    valueSuffix: '0 M'
                }
            }
    ]
    };

    return (
        <div className="rounded-xl p-3 bg-[#024887]/10 dark:bg-slate-800/90">
            <div className="flex flex-row items-center justify-center">
                {/* <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWS: 10.2</p> */}
                <div>
                    <p className = "text-6xl text-slate-900 dark:text-white font-bold">{formattedHeading}°</p>
                    <p className = "text-2xl text-center text-slate-900 dark:text-white font-bold">{formattedCog}°</p>
                </div>
                {/* <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWS: 13.3</p>  */}
            </div>
            <HighchartsReact ref={chartRef} highcharts = {Highcharts} options = {chart_options}/> 
            {/* <div className="flex flex-row items-center justify-between">
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">TWA: 335°</p>
                <p className = "text-2xl text-slate-900 dark:text-white font-bold">AWA: 260°</p> 
            </div> */}
        </div>
    )
}

export default WindRose
