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

export enum StateEnum {
    /** Error state, should not happen */
    UNKNOWN = 0,
    /** Searching for a path to the target */
    PLANNING = 1,
    /** Following the plan to get near the target */
    TRAVELING = 2,
    /** At the target area, searching for the target */
    TERMINAL_SEARCHING = 3,
    /** Found the target, moving to it */
    TERMINAL_MOVING = 4,
    /** Stopped near the target */
    SUCCESS = 5,
    /** Unable to reach the target */
    FAILURE = 6
}
export type StateMsg = {
    state: StateEnum;
};

export type LocationMsg = {
    latitude: number;
    longitude: number;
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
    state: StateMsg;
    result: string;
}

export type GoToFeedback = {
    state: StateMsg;
    status: string;
};