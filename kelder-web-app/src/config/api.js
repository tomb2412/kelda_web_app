const rawBaseUrl = import.meta.env?.VITE_KELDER_API_URL || '';
const sanitizedBaseUrl = rawBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = sanitizedBaseUrl;

export const apiUrl = (path = '') => {
    if (!path) return API_BASE_URL;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
