export type StdMsg<T> = {
    data: T;
};

export type HeaderMsg = {
    stamp: {
        sec: number;
        nanosec: number;
    };
    frame_id: string;
};

export type QuaternionMsg = {
    x: number;
    y: number;
    z: number;
    w: number;
};

export type Vector3Msg = {
    x: number;
    y: number;
    z: number;
};

export type NavSatFix = {
    header: HeaderMsg;
    status: {
        status: number;
        service: number;
    }
    latitude: number;
    longitude: number;
    altitude: number;
    position_covariance: number[];
    position_covariance_type: number;
};

export type ImuMsg = {
    header: HeaderMsg;
    orientation: QuaternionMsg;
    orientation_covariance: number[];
    angular_velocity: Vector3Msg;
    angular_velocity_covariance: number[];
    linear_acceleration: Vector3Msg;
    linear_acceleration_covariance: number[];
};