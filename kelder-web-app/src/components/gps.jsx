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

const formatMetric = (value, unit, formatter = formatBasicValue) => {
    const formatted = formatter(value);
    if (formatted === '--') {
        return '--';
    }
    return `${formatted} ${unit}`.trim();
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


const GpsDisplay = function(){
    const gpsData = useSensorData('gps');
    const dataToRender = gpsData ?? fallbackGpsData;

    return (
        <div className="p-3 rounded-xl bg-[#024887]/10 dark:bg-slate-800/90">
            <div>
                <div className='flex flex-row grid grid-cols-2 2xl:grid-cols-3 items-center justify-around p-5'>
                    <div className="col-span-2 2xl:col-span-1 text-slate-900 dark:text-white text-center" >
                        <p className='font-semibold text-2xl lg:text-xl'>Timestamp</p> 
                        <p className='font-bold text-2xl sm:text-3xl lg:text-2xl'>{dataToRender.timestamp}</p>
                    </div>
                    <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                        <p className='font-semibold text-2xl lg:text-xl'>Latitude</p>
                        <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{formatDdMmSs(dataToRender.latitude)}</p>
                    </div>
                    <div className="col-span-1 text-slate-900 dark:text-white text-center" >
                        <p className='font-semibold text-2xl lg:text-xl'>Longitude</p>
                        <p className='font-bold text-3xl sm:text-3xl lg:text-2xl'>{formatDdMmSs(dataToRender.longitude)}</p>
                    </div>
                </div>
                <div className='grid grid-rows-2 grid-cols-2 gap-4 p-5'> 
                    <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                        <p className = "font-semibold text-3xl flex items-baseline gap-2">
                            <span>SOG</span>
                            <span className="text-xl font-medium">/knts</span>
                        </p>
                        <p className = "font-bold text-5xl"> {formatMetric(dataToRender.speed_over_ground, '', formatSpeeds)}</p>
                    </div>
                    <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                        <p className = "font-semibold text-3xl flex items-baseline gap-2">
                            <span>LOG</span>
                            <span className="text-xl font-medium">/nm</span>
                        </p>
                        <p className = "font-bold text-5xl"> {formatMetric(dataToRender.log, '', formatDistance)}</p>
                    </div>
                    <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                        <p className = "font-semibold text-3xl flex items-baseline gap-2">
                            <span>Drift</span>
                            <span className="text-xl font-medium">/knts</span>
                        </p>
                        <p className = "font-bold text-5xl"> {formatMetric(dataToRender.drift, '', formatSpeeds)}</p>
                    </div>
                    <div className = "flex flex-col items-center text-slate-900 dark:text-white text-3xl py-5">
                        <p className = "font-semibold text-3xl flex items-baseline gap-2">
                            <span>DTW</span>
                            <span className="text-xl font-medium">/nm</span>
                        </p>
                        <p className = "font-bold text-5xl"> {formatMetric(dataToRender.dtw, '')}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GpsDisplay
