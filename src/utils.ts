export function cleanPath(path: string): string {
	if (!path || typeof path !== 'string') return path;
	
	let cleaned = path.trim();
	// Remove surrounding quotes
	if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
		cleaned = cleaned.substring(1, cleaned.length - 1).trim();
	}
	// Remove any actual newline characters and carriage returns
	cleaned = cleaned.replace(/[\n\r]+/g, '').trim();
	return cleaned;
}

export function stringToHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

export function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) {
        return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
}

export function parseTime(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parts[0] * 3600;
        seconds += parts[1] * 60;
        seconds += parts[2];
    } else if (parts.length === 2) {
        seconds += parts[0] * 60;
        seconds += parts[1];
    } else if (parts.length === 1) {
        seconds += parts[0];
    }
    return seconds;
}
