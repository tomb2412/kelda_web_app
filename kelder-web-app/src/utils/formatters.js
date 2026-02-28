export const formatDdMmSs = (value) => {
    if (value === null || value === undefined) {
        return '--';
    }

    const stringValue = String(value).trim();
    const direction = (stringValue.match(/[NSEW]/i) || [])[0] || '';
    const sign = stringValue.startsWith('-') ? '-' : '';
    const raw = stringValue.replace(/[^0-9]/g, '');

    if (!raw) {
        return '--';
    }

    const seconds = raw.slice(-2) || '00';
    const minutes = raw.slice(-4, -2) || '00';
    const degrees = raw.slice(0, -4) || '0';
    const suffix = direction ? ` ${direction.toUpperCase()}` : '';

    return `${sign}${degrees}°${minutes}'${seconds}"${suffix}`;
};
