import { createContext, useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { POLL_INTERVAL_MS, SLOW_POLL_INTERVAL_MS } from '../config/constants';

const SensorDataContext = createContext(null);

const initialState = {
    gps: null,
    compass: null,
    vessel: null,
    tidal: null,
    tide: null,
    bilge: null,
    journey: null,
    gpsPosition: null,
    passagePlan: null,
};

function reducer(state, { type, payload }) {
    if (type === 'UPDATE') return { ...state, ...payload };
    return state;
}

// [key, path, axiosConfig?]
const FAST_ENDPOINTS = [
    ['gps',         '/gps_card_data'],
    ['compass',     '/compass_heading'],
    ['vessel',      '/vessel_state'],
    ['tidal',       '/get_next_tidal_event'],
    ['tide',        '/get_height_of_tide'],
    ['bilge',       '/bilge_depth'],
    ['journey',     '/journeys/latest', { params: { limit: 10 }, headers: { accept: 'application/json' } }],
    ['gpsPosition', '/gps_map_position'],
];

export function SensorDataProvider({ children }) {
    const [data, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        async function fetchFast() {
            const results = await Promise.allSettled(
                FAST_ENDPOINTS.map(([, path, config]) => axios.get(apiUrl(path), config))
            );
            const payload = {};
            results.forEach((result, i) => {
                if (result.status === 'fulfilled') {
                    payload[FAST_ENDPOINTS[i][0]] = result.value.data;
                }
            });
            dispatch({ type: 'UPDATE', payload });
        }

        async function fetchSlow() {
            try {
                const res = await axios.get(apiUrl('/passage_plan'));
                dispatch({ type: 'UPDATE', payload: { passagePlan: res.data } });
            } catch {
                // swallow — stale data stays in state
            }
        }

        fetchFast();
        fetchSlow();

        const fastTimer = setInterval(fetchFast, POLL_INTERVAL_MS);
        const slowTimer = setInterval(fetchSlow, SLOW_POLL_INTERVAL_MS);

        return () => {
            clearInterval(fastTimer);
            clearInterval(slowTimer);
        };
    }, []);

    return (
        <SensorDataContext.Provider value={data}>
            {children}
        </SensorDataContext.Provider>
    );
}

export function useSensorData(key) {
    const ctx = useContext(SensorDataContext);
    if (!ctx) throw new Error('useSensorData must be used within SensorDataProvider');
    return ctx[key];
}
