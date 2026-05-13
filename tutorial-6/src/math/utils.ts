export function toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
}

export function toDegrees(radians: number) {
    return radians * (180 / Math.PI);
}

export function clamp(
    value: number,
    min: number,
    max: number
): number {
    return Math.max(min, Math.min(max, value));
}
