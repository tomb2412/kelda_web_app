// Formats an NMEA "degrees + decimal minutes" coordinate (DDMM.mm / DDDMM.mm, optionally
// signed or with a trailing N/S/E/W) as degrees, minutes and seconds, e.g. 5046.12 -> 50°46'07" N.
// axis ('lat' | 'lon') picks the hemisphere letter from the sign when none is given.
export const formatDdMmSs = (value, axis) => {
    if (value === null || value === undefined) {
        return '--';
    }

    const stringValue = String(value).trim();
    const letter = (stringValue.match(/[NSEW]/i) || [])[0]?.toUpperCase();
    const negative = stringValue.startsWith('-');
    const match = stringValue.match(/(\d+)(?:\.(\d+))?/);

    if (!match) {
        return '--';
    }

    const [, whole, frac = ''] = match;
    let degrees = Number(whole.slice(0, -2) || '0');
    const minutesDecimal = Number(`${whole.slice(-2)}.${frac || '0'}`);

    // Round to whole seconds, carrying into minutes and degrees (e.g. 59.999' -> next degree)
    let totalSeconds = Math.round(minutesDecimal * 60);
    if (totalSeconds >= 3600) {
        degrees += 1;
        totalSeconds -= 3600;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const hemisphere = letter ??
        (axis === 'lat' ? (negative ? 'S' : 'N') : axis === 'lon' ? (negative ? 'W' : 'E') : null);
    const sign = !hemisphere && negative ? '-' : '';
    const pad = (n) => String(n).padStart(2, '0');

    return `${sign}${degrees}°${pad(minutes)}'${pad(seconds)}"${hemisphere ? ` ${hemisphere}` : ''}`;
};
