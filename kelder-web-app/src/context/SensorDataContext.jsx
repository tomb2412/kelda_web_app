import { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';
import { POLL_INTERVAL_MS, SLOW_POLL_INTERVAL_MS } from '../config/constants';

const SensorDataContext = createContext(null);
const PassagePlanRefreshContext = createContext(null);

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

    // Stable so consumers can call it after mutating the plan without waiting for the slow poll
    const fetchPassagePlan = useCallback(async () => {
        try {
            const res = await axios.get(apiUrl('/passage_plan'));
            dispatch({ type: 'UPDATE', payload: { passagePlan: res.data } });
            dispatch({ type: 'UPDATE_ERRORS', payload: { passagePlan: false } });
        } catch {
            dispatch({ type: 'UPDATE_ERRORS', payload: { passagePlan: true } });
        }
    }, []);

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

        fetchFast();
        fetchPassagePlan();

        const fastTimer = setInterval(fetchFast, POLL_INTERVAL_MS);
        const slowTimer = setInterval(fetchPassagePlan, SLOW_POLL_INTERVAL_MS);

        return () => {
            clearInterval(fastTimer);
            clearInterval(slowTimer);
        };
    }, [fetchPassagePlan]);

    return (
        <SensorDataContext.Provider value={data}>
            <PassagePlanRefreshContext.Provider value={fetchPassagePlan}>
                {children}
            </PassagePlanRefreshContext.Provider>
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

export function useRefreshPassagePlan() {
    const ctx = useContext(PassagePlanRefreshContext);
    if (!ctx) throw new Error('useRefreshPassagePlan must be used within SensorDataProvider');
    return ctx;
}
