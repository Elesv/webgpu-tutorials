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

    static fromBasis(right: Vector3, up: Vector3, forward: Vector3): Quaternion {
        const m00 = right.x, m01 = up.x, m02 = forward.x;
        const m10 = right.y, m11 = up.y, m12 = forward.y;
        const m20 = right.z, m21 = up.z, m22 = forward.z;

        const trace = m00 + m11 + m22;

        let x, y, z, w;

        if (trace > 0) {
            const s = Math.sqrt(trace + 1.0) * 2;
            w = 0.25 * s;
            x = (m21 - m12) / s;
            y = (m02 - m20) / s;
            z = (m10 - m01) / s;
        } else if (m00 > m11 && m00 > m22) {
            const s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
            w = (m21 - m12) / s;
            x = 0.25 * s;
            y = (m01 + m10) / s;
            z = (m02 + m20) / s;
        } else if (m11 > m22) {
            const s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
            w = (m02 - m20) / s;
            x = (m01 + m10) / s;
            y = 0.25 * s;
            z = (m12 + m21) / s;
        } else {
            const s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
            w = (m10 - m01) / s;
            x = (m02 + m20) / s;
            y = (m12 + m21) / s;
            z = 0.25 * s;
        }

        return new Quaternion(x, y, z, w).normalize();
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
