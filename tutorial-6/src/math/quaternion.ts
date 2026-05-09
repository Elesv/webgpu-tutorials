import { Vector3 } from "./vector3.js";

export class Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(
        x: number,
        y: number,
        z: number,
        w: number) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    mul(q: Quaternion): Quaternion {
        return new Quaternion(
            this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
            this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
            this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
            this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z
        );
    }

    normalize(): Quaternion {
        const len = Math.hypot(this.x, this.y, this.z, this.w);
        return new Quaternion(
            this.x / len,
            this.y / len,
            this.z / len,
            this.w / len
        );
    }

    conjugate(): Quaternion {
        return new Quaternion(-this.x, -this.y, -this.z, this.w);
    };

    rotate(v: Vector3): Vector3 {
        const result = this.mul(new Quaternion(v.x, v.y, v.z, 0))
            .mul(this.conjugate());
        return new Vector3(result.x, result.y, result.z); 
    }

    static angleAxis(angle: number, axis: Vector3): Quaternion {
        const half = angle * 0.5;
        const s = Math.sin(half);
        return new Quaternion(
            axis.x * s,
            axis.y * s,
            axis.z * s,
            Math.cos(half)
        );
    }

    static identity(): Quaternion {
        return new Quaternion(0, 0, 0, 1);
    }
}
