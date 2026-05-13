import { Quaternion } from "./quaternion.js";
import { Vector3 } from "./vector3.js";

export class Matrix4 {
    m11: number; m12: number; m13: number; m14: number;
    m21: number; m22: number; m23: number; m24: number;
    m31: number; m32: number; m33: number; m34: number;
    m41: number; m42: number; m43: number; m44: number;

    public static readonly NUM_ENTRIES = 16;
    static readonly BYTE_SIZE =
        Matrix4.NUM_ENTRIES * Float32Array.BYTES_PER_ELEMENT;

    constructor(
        m11 = 1, m12 = 0, m13 = 0, m14 = 0,
        m21 = 0, m22 = 1, m23 = 0, m24 = 0,
        m31 = 0, m32 = 0, m33 = 1, m34 = 0,
        m41 = 0, m42 = 0, m43 = 0, m44 = 1
    ) {
        this.m11 = m11; this.m12 = m12; this.m13 = m13; this.m14 = m14;
        this.m21 = m21; this.m22 = m22; this.m23 = m23; this.m24 = m24;
        this.m31 = m31; this.m32 = m32; this.m33 = m33; this.m34 = m34;
        this.m41 = m41; this.m42 = m42; this.m43 = m43; this.m44 = m44;
    }

    mul(b: Matrix4): Matrix4 {
        const a = this;

        return new Matrix4(
            a.m11 * b.m11 + a.m12 * b.m21 + a.m13 * b.m31 + a.m14 * b.m41,
            a.m11 * b.m12 + a.m12 * b.m22 + a.m13 * b.m32 + a.m14 * b.m42,
            a.m11 * b.m13 + a.m12 * b.m23 + a.m13 * b.m33 + a.m14 * b.m43,
            a.m11 * b.m14 + a.m12 * b.m24 + a.m13 * b.m34 + a.m14 * b.m44,

            a.m21 * b.m11 + a.m22 * b.m21 + a.m23 * b.m31 + a.m24 * b.m41,
            a.m21 * b.m12 + a.m22 * b.m22 + a.m23 * b.m32 + a.m24 * b.m42,
            a.m21 * b.m13 + a.m22 * b.m23 + a.m23 * b.m33 + a.m24 * b.m43,
            a.m21 * b.m14 + a.m22 * b.m24 + a.m23 * b.m34 + a.m24 * b.m44,

            a.m31 * b.m11 + a.m32 * b.m21 + a.m33 * b.m31 + a.m34 * b.m41,
            a.m31 * b.m12 + a.m32 * b.m22 + a.m33 * b.m32 + a.m34 * b.m42,
            a.m31 * b.m13 + a.m32 * b.m23 + a.m33 * b.m33 + a.m34 * b.m43,
            a.m31 * b.m14 + a.m32 * b.m24 + a.m33 * b.m34 + a.m34 * b.m44,

            a.m41 * b.m11 + a.m42 * b.m21 + a.m43 * b.m31 + a.m44 * b.m41,
            a.m41 * b.m12 + a.m42 * b.m22 + a.m43 * b.m32 + a.m44 * b.m42,
            a.m41 * b.m13 + a.m42 * b.m23 + a.m43 * b.m33 + a.m44 * b.m43,
            a.m41 * b.m14 + a.m42 * b.m24 + a.m43 * b.m34 + a.m44 * b.m44
        );
    }

    transformPoint(v: Vector3): Vector3 {
        const x = v.x, y = v.y, z = v.z;

        const tx = x * this.m11 + y * this.m12 + z * this.m13 + this.m14;
        const ty = x * this.m21 + y * this.m22 + z * this.m23 + this.m24;
        const tz = x * this.m31 + y * this.m32 + z * this.m33 + this.m34;
        const tw = x * this.m41 + y * this.m42 + z * this.m43 + this.m44;

        return new Vector3(tx / tw, ty / tw, tz / tw);
    }

    transformDirection(v: Vector3): Vector3 {
        const x = v.x, y = v.y, z = v.z;

        return new Vector3(
            x * this.m11 + y * this.m12 + z * this.m13,
            x * this.m21 + y * this.m22 + z * this.m23,
            x * this.m31 + y * this.m32 + z * this.m33
        );
    }

    toFloat32Array(): Float32Array {
        return new Float32Array([
            this.m11, this.m12, this.m13, this.m14,
            this.m21, this.m22, this.m23, this.m24,
            this.m31, this.m32, this.m33, this.m34,
            this.m41, this.m42, this.m43, this.m44
        ]);
    }

    static perspectiveLH(
        fov: number,
        aspect: number,
        near: number,
        far: number
    ): Matrix4 {
        const f = 1 / Math.tan(fov / 2);
        return new Matrix4(
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, far / (far - near), 1,
            0, 0, -(near * far) / (far - near), 0
        );
    }

    static identity(): Matrix4 {
        return new Matrix4();
    }

    static translation(v: Vector3): Matrix4 {
        return new Matrix4(
            1, 0, 0, v.x,
            0, 1, 0, v.y,
            0, 0, 1, v.z,
            0, 0, 0, 1
        );
    }

    static scale(v: Vector3): Matrix4 {
        return new Matrix4(
            v.x, 0, 0, 0,
            0, v.y, 0, 0,
            0, 0, v.z, 0,
            0, 0, 0, 1
        );
    }

    static fromQuaternion(q: Quaternion): Matrix4 {
        const n = q.normalize();

        const xx = n.x * n.x;
        const yy = n.y * n.y;
        const zz = n.z * n.z;

        const xy = n.x * n.y;
        const xz = n.x * n.z;
        const yz = n.y * n.z;

        const wx = n.w * n.x;
        const wy = n.w * n.y;
        const wz = n.w * n.z;

        return new Matrix4(
            1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
            2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
            2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
            0, 0, 0, 1
        );
    }

    static fromQuaternionVector3(q: Quaternion, v: Vector3): Matrix4 {
        const n = q.normalize();

        const xx = n.x * n.x;
        const yy = n.y * n.y;
        const zz = n.z * n.z;

        const xy = n.x * n.y;
        const xz = n.x * n.z;
        const yz = n.y * n.z;

        const wx = n.w * n.x;
        const wy = n.w * n.y;
        const wz = n.w * n.z;

        const t = n.conjugate().rotate(v.negate());

        return new Matrix4(
            1 - 2 * (yy + zz), 2 * (xy - wz), 2 * (xz + wy), 0,
            2 * (xy + wz), 1 - 2 * (xx + zz), 2 * (yz - wx), 0,
            2 * (xz - wy), 2 * (yz + wx), 1 - 2 * (xx + yy), 0,
            t.x, t.y, t.z, 1
        );
    }

    static perspective(
        fov: number,
        aspect: number,
        near: number,
        far: number
    ): Matrix4 {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (far - near);

        return new Matrix4(
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, far * nf, 1,
            0, 0, -near * far * nf, 0
        );
    }

    static lookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4 {
        const z = target.sub(eye).normalize();
        const x = up.cross(z).normalize();
        const y = z.cross(x);

        return new Matrix4(
            x.x, x.y, x.z, -x.dot(eye),
            y.x, y.y, y.z, -y.dot(eye),
            z.x, z.y, z.z, -z.dot(eye),
            0, 0, 0, 1
        );
    }
}
