import { Matrix4 } from "./math/matrix4.js";
import { Quaternion } from "./math/quaternion.js";
import { toDegrees, toRadians } from "./math/utils.js";
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

    getLocalX() {
        return this.rotation.rotate(
            Vector3.unitX()
        ).normalize();
    }

    getLocalY() {
        return this.rotation.rotate(
            Vector3.unitY()
        ).normalize();
    }

    getLocalZ() {
        return this.rotation.rotate(
            Vector3.unitZ()
        ).normalize();
    }

    direction(): Vector3 {
        return this.getLocalZ();
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
        ).normalize();

        this.correctPitch(angle);
    }

    correctPitch(angle: number) {
        const localX = this.getLocalX();
        const localZ = this.getLocalZ();

        const qUpper = Quaternion.angleAxis(toRadians(5), localX);
        const qLower = Quaternion.angleAxis(toRadians(175), localX);

        const upper = qUpper.rotate(Vector3.unitY());
        const lower = qLower.rotate(Vector3.unitY());

        const angleToUpper = localZ.signedAngleTo(upper, localX);
        const angleToLower = localZ.signedAngleTo(lower, localX);

        if (Math.sign(angle) === 1) {
            if (Math.sign(angleToLower) === -1) {
                this.rotation = this.rotation.mul(
                    Quaternion.angleAxis(angleToLower, localX)
                ).normalize();
            }
        } else {
            if (Math.sign(angleToUpper) === 1) {
                this.rotation = this.rotation.mul(
                    Quaternion.angleAxis(angleToUpper, localX)
                ).normalize();
            }
        }
    }

    roll(angle: number) {
        this.rotation = this.rotation.mul(
            Quaternion.angleAxis(angle, Vector3.unitZ())
        ).normalize()
    }

    correctRoll() {
        const localX = this.getLocalX();
        const localZ = this.getLocalZ();
        const yawX = Vector3.unitY()
            .cross(localZ)
            .normalize();

        const rollError = localX.signedAngleTo(yawX, localZ);
        this.rotation = Quaternion.angleAxis(rollError, localZ)
            .mul(this.rotation)
            .normalize();
    }

    setRotationFromYawPitch(yaw: number, pitch: number) {
        const qYaw = Quaternion.angleAxis(yaw, Vector3.unitY());
        const qPitch = Quaternion.angleAxis(pitch, Vector3.unitX());
        this.rotation = qYaw.mul(qPitch).normalize();
    }
}
