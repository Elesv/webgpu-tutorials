import { Matrix4 } from "./math/matrix4.js";
import { Quaternion } from "./math/quaternion.js";
import { Vector3 } from "./math/vector3.js";

export class Camera {
    position: Vector3;
    rotation: Quaternion;

    constructor(position: Vector3, rotation: Quaternion) {
        this.position = position;
        this.rotation = rotation;
    }

    view(): Matrix4 {
        return Matrix4.fromQuaternionVector3(
            this.rotation, this.position
        );
    }

    getYaw(): number {
        const direction = this.direction();
        return Math.atan2(direction.x, direction.z)
    }

    getPitch(): number {
        const direction = this.direction();
        return Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
    }

    direction(): Vector3 {
        return this.rotation.rotate(
            Vector3.unitZ()
        ).normalize();
    }

    move(distance: number) {
        this.position = this.position.add(
            this.direction().mulScalar(distance)
        );
    }

    yaw(angle: number) {
        this.rotation = Quaternion.angleAxis(
            angle, Vector3.unitY()
        ).mul(this.rotation).normalize();
    }

    pitch(angle: number) {
        this.rotation = this.rotation.mul(
            Quaternion.angleAxis(angle, Vector3.unitX())
        ).normalize()
    }

    roll(angle: number) {
        this.rotation = this.rotation.mul(
            Quaternion.angleAxis(angle, Vector3.unitZ())
        ).normalize()
    }

    setRotationFromYawPitch(yaw: number, pitch: number) {
        const qYaw = Quaternion.angleAxis(yaw, Vector3.unitY());
        const qPitch = Quaternion.angleAxis(pitch, Vector3.unitX());
        this.rotation = qYaw.mul(qPitch).normalize();
    }
}
