export class Vector3 {
    x: number;
    y: number;
    z: number;

    constructor(
        x: number,
        y: number,
        z: number) {

        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v: Vector3): Vector3 {
        return new Vector3(
            this.x + v.x,
            this.y + v.y,
            this.z + v.z
        );
    }

    sub(v: Vector3): Vector3 {
        return new Vector3(
            this.x - v.x,
            this.y - v.y,
            this.z - v.z
        );
    }

    mulScalar(s: number): Vector3 {
        return new Vector3(
            this.x * s,
            this.y * s,
            this.z * s
        );
    }

    divScalar(s: number): Vector3 {
        return new Vector3(
            this.x / s,
            this.y / s,
            this.z / s
        );
    }

    dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    length(): number {
        return Math.hypot(this.x, this.y, this.z);
    }

    normalize(): Vector3 {
        const len = this.length();
        if (len === 0) {
            return new Vector3(0, 0, 0);
        }
        return this.divScalar(len);
    }

    negate(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    angleTo(v: Vector3): number {
        return Math.acos(Math.max(-1, Math.min(1, this.dot(v) / (this.length() * v.length()))));
    }

    signedAngleTo(v: Vector3, normal: Vector3): number {
        return Math.atan2(normal.dot(this.cross(v)), this.dot(v));
    }

    clone(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    addSelf(v: Vector3): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    subSelf(v: Vector3): this {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    mulScalarSelf(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    normalizeSelf(): this {
        const len = this.length();
        if (len !== 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    static zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    static one(): Vector3 {
        return new Vector3(1, 1, 1);
    }

    static unitX(): Vector3 {
        return new Vector3(1, 0, 0);
    }

    static unitY(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    static unitZ(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    static dot(a: Vector3, b: Vector3): number {
        return a.dot(b);
    }

    static cross(a: Vector3, b: Vector3): Vector3 {
        return a.cross(b);
    }

    static distance(a: Vector3, b: Vector3): number {
        return a.sub(b).length();
    }

    static lerp(a: Vector3, b: Vector3, t: number): Vector3 {
        return new Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }
}
