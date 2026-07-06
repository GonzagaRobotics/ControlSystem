/**
 * The types of targets that AutoNav can navigate to.
 */
export enum TargetType {
    /** High precision GNSS coordinates. */
    GNSS,
    /** Post marked with ArUco tags. */
    ARUCO,
    /** Water bottle. */
    BOTTLE,
    /** Rubber mallet. */
    MALLET,
    /** Rock hammer. */
    HAMMER
}

export type LocationMsg = {
    latitude: number;
    longitude: number;
    altitude: number;
};

export type TargetMsg = {
    location: LocationMsg;
    type: TargetType;
};

export type PlanMsg = {
    waypoints: LocationMsg[];
};

export type GoToGoal = {
    target: TargetMsg;
};

export type GoToRes = {
    status: string;
}

export type GoToFeedback = {
    status: string;
};