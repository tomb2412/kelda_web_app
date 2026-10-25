import { useEffect, useRef, useState } from 'react';
import { useSensorData } from '../context/SensorDataContext';
import { formatDdMmSs } from '../utils/formatters';

const formatSpeeds = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) | (numericValue === 0)) {
        return '--';
    }
    return Math.round(numericValue * 10) / 10;
};

const formatDistance = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) | (numericValue === 0)) {
        return '--';
    }
    return Math.round(numericValue * 100) / 100;
};

const formatBasicValue = (value) => {
    if (value === null || value === undefined) {
        return '--';
    }

    const trimmed = String(value).trim();
    return trimmed.length ? trimmed : '--';
};

const fallbackGpsData = {
    timestamp: '--',
    latitude: '--',
    longitude: '--',
    speed_over_ground: '--',
    drift: '--',
    log: '--',
    dtw: '--',
};

// Fix quality from the latest GPS reading: red = no fix / no data, orange = fewer than
// 4 satellites (no reliable position) or HDOP above 5, green otherwise
const MIN_SATELLITES = 4;
const MAX_GOOD_HDOP = 5;
const FIX_DOT = {
    good: 'bg-emerald-500 ring-emerald-500/20',
    weak: 'bg-amber-500 ring-amber-500/20',
    none: 'bg-red-500 ring-red-500/20',
};

const fixQuality = (gpsData) => {
    if (!gpsData || gpsData.fix_status === 'V') {
        return { level: 'none', text: 'No GPS Fix' };
    }
    const satellites = Number.isFinite(gpsData.satellites) ? gpsData.satellites : null;
    const hdop = Number.isFinite(gpsData.hdop) ? gpsData.hdop : null;
    // All good: just say so. Otherwise name only what's wrong
    const issues = [
        satellites !== null && satellites < MIN_SATELLITES && `${satellites} ${satellites === 1 ? 'sat' : 'sats'}`,
        hdop !== null && hdop > MAX_GOOD_HDOP && `HDOP ${hdop.toFixed(1)}`,
    ].filter(Boolean);
    if (!issues.length) {
        return { level: 'good', text: 'GPS Fixed' };
    }
    return { level: 'weak', text: ['Weak GPS Fix', ...issues].join(' · ') };
};

const labelClass = 'text-sm font-semibold uppercase tracking-[0.14em]';

// One coordinate row: chart-plotter style with zero-padded degrees (050° / 001°) and true
// prime marks, centred in the row
function Coordinate({ label, value, degreeDigits }) {
    const [, figure, hemisphere] = value.match(/^(.*?)(?:\s([NSEW]))?$/);
    const [degrees, rest] = figure.split('°');
    const display = rest === undefined
        ? figure
        : `${degrees.padStart(degreeDigits, '0')}°${rest.replace("'", '′').replace('"', '″')}`;

    return (
        <div className="flex justify-center px-4 py-3" aria-label={`${label} ${value}`}>
            <span className="flex items-baseline gap-1.5">
                <span className="text-[1.75rem] sm:text-3xl font-bold leading-none">{display}</span>
                <span className="text-xl font-semibold">{hemisphere}</span>
            </span>
        </div>
    );
}

function Metric({ label, value, unit, tip }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Tap-to-toggle (no hover dependency, so it works the same on touch); any tap
    // outside the tile or Escape closes it
    useEffect(() => {
        if (!open) return;
        const onPointerDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const content = (
        <>
            <p className={labelClass}>{label}</p>
            <p className="mt-1 flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold leading-none">{value}</span>
                {value !== '--' && <span className="text-base font-semibold">{unit}</span>}
            </p>
        </>
    );

    if (!tip) {
        return <div className="min-w-0 px-4 py-3 text-center">{content}</div>;
    }

    return (
        <div ref={ref} className="relative min-w-0">
            <button
                type="button"
                className="w-full rounded-lg px-4 py-3 text-center transition active:bg-slate-900/5 dark:active:bg-white/5"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-label={`${label} ${value} ${unit}, ${tip}`}
            >
                {content}
            </button>
            {open && (
                <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 z-10 mb-1 max-w-[12rem] -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900"
                >
                    <span className="block truncate">{tip}</span>
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[6px] border-x-transparent border-t-slate-900 dark:border-t-white" aria-hidden="true" />
                </div>
            )}
        </div>
    );
}

const GpsDisplay = function(){
    const gpsData = useSensorData('gps');
    const dataToRender = gpsData ?? fallbackGpsData;

    const latitude = formatDdMmSs(dataToRender.latitude, 'lat');
    const longitude = formatDdMmSs(dataToRender.longitude, 'lon');
    const fix = fixQuality(gpsData);

    return (
        <div className="p-3 rounded-xl bg-[#024887]/10 dark:bg-slate-800/90 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ring-[3px] ${FIX_DOT[fix.level]}`} aria-hidden="true" />
                    <span className="truncate text-sm font-semibold">{fix.text}</span>
                </div>
                <span className="text-base font-semibold">
                    {formatBasicValue(dataToRender.timestamp)}
                </span>
            </div>

            <div>
                <Coordinate label="Latitude" value={latitude} degreeDigits={2} />
                <Coordinate label="Longitude" value={longitude} degreeDigits={3} />
            </div>

            <div className="mt-1 grid grid-cols-2">
                <Metric label="SOG" unit="kn" value={formatSpeeds(dataToRender.speed_over_ground)} />
                <Metric label="Log" unit="nm" value={formatDistance(dataToRender.log)} />
                <Metric label="Drift" unit="kn" value={formatSpeeds(dataToRender.drift)} />
                <Metric
                    label="DTW"
                    unit="nm"
                    value={formatBasicValue(dataToRender.dtw)}
                    tip={dataToRender.next_waypoint ? `To ${dataToRender.next_waypoint}` : null}
                />
            </div>
        </div>
    )
}

export default GpsDisplay
