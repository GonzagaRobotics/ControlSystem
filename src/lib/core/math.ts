import type { QuaternionMsg, Vector3Msg } from "$lib/comm/interfaces";

/**
 * Converts a quaternion to Euler angles (roll, pitch, yaw).
 * The returned angles are in radians.
 * @param quat The quaternion to convert, with properties x, y, z, w.
 * @returns An object with properties x (roll), y (pitch), z (yaw) representing the Euler angles.
 */
export function quatToEuler(quat: QuaternionMsg): Vector3Msg {
    const { x, y, z, w } = quat;

    return {
        x: Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y)),
        y: Math.asin(2 * (w * y - x * z)),
        z: Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))
    };
}