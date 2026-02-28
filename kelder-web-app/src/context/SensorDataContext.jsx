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
    errors: {},
};

function reducer(state, { type, payload }) {
    if (type === 'UPDATE') return { ...state, ...payload };
    if (type === 'UPDATE_ERRORS') return { ...state, errors: { ...state.errors, ...payload } };
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
            const errors = {};
            results.forEach((result, i) => {
                const key = FAST_ENDPOINTS[i][0];
                if (result.status === 'fulfilled') {
                    payload[key] = result.value.data;
                    errors[key] = false;
                } else {
                    errors[key] = true;
                }
            });
            dispatch({ type: 'UPDATE', payload });
            dispatch({ type: 'UPDATE_ERRORS', payload: errors });
        }

        async function fetchSlow() {
            try {
                const res = await axios.get(apiUrl('/passage_plan'));
                dispatch({ type: 'UPDATE', payload: { passagePlan: res.data } });
                dispatch({ type: 'UPDATE_ERRORS', payload: { passagePlan: false } });
            } catch {
                dispatch({ type: 'UPDATE_ERRORS', payload: { passagePlan: true } });
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

export function useSensorErrors() {
    const ctx = useContext(SensorDataContext);
    if (!ctx) throw new Error('useSensorErrors must be used within SensorDataProvider');
    return ctx.errors;
}
