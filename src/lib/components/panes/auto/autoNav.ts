/**
 * The possible states of AutoNav.
 */
export enum State {
	/** AutoNav is disabled and won't do anything. */
	DISABLED,
	/** AutoNav is ready to receive a target. */
	READY,
	/** AutoNav is making a plan to reach the target. */
	PLANNING,
	/** AutoNav has a plan and is waiting for an instruction. */
	WAITING,
	/** AutoNav is traveling towards the target. */
	TRAVELING,
	/** AutoNav is searching for the target. */
	TERMINAL_SEARCHING,
	/** AutoNav found the target and is moving towards it. */
	TERMINAL_MOVING,
	/** AutoNav is paused. */
	PAUSED,
	/** AutoNav reached the target. */
	SUCCESS,
	/** AutoNav is unable to reach the target. */
	FAILURE
}

/**
 * The instructions that can be sent to AutoNav.
 */
export enum Instruction {
	/** Temporarily stop the current plan. */
	PAUSE,
	/** Continue following the current plan. */
	RESUME,
	/** Begin executing the current plan. */
	EXECUTE,
	/** Stop the current plan and return to the READY state. */
	TERMINATE
}

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

export type StateMsg = {
	state: State;
};

export type TargetMsg = {
	location: {
		latitude: number;
		longitude: number;
		altitude: number;
	};
	type: TargetType;
};

export type PlanMsg = {
	waypoints: {
		latitude: number;
		longitude: number;
		altitude: number;
	}[];
};

export type GetStateRes = {
	state: State;
	hasTarget: boolean;
	target: TargetMsg;
	hasPlan: boolean;
	plan: PlanMsg;
};

export type InstructReq = {
	instruction: Instruction;
};

export type InstructRes = {
	ok: boolean;
	reason: string;
};

export type SetTargetReq = {
	target: TargetMsg;
};

export type SetTargetRes = {
	ok: boolean;
	reason: string;
};

export function stateToString(state: State): string {
	switch (state) {
		case State.DISABLED:
			return 'Disabled';
		case State.READY:
			return 'Ready';
		case State.PLANNING:
			return 'Planning';
		case State.WAITING:
			return 'Waiting';
		case State.TRAVELING:
			return 'Traveling';
		case State.TERMINAL_SEARCHING:
			return 'Terminal Searching';
		case State.TERMINAL_MOVING:
			return 'Terminal Moving';
		case State.PAUSED:
			return 'Paused';
		case State.SUCCESS:
			return 'Success';
		case State.FAILURE:
			return 'Failure';
	}
}

export function instructionToString(instruction: Instruction): string {
	switch (instruction) {
		case Instruction.PAUSE:
			return 'Pause';
		case Instruction.RESUME:
			return 'Resume';
		case Instruction.EXECUTE:
			return 'Execute';
		case Instruction.TERMINATE:
			return 'Terminate';
	}
}

export function targetToString(target: TargetMsg | null): string {
	if (!target) {
		return 'No Target';
	}

	const { location, type } = target;
	let typeStr: string;
	switch (type) {
		case TargetType.GNSS:
			typeStr = 'GNSS';
			break;
		case TargetType.ARUCO:
			typeStr = 'ArUco';
			break;
		case TargetType.BOTTLE:
			typeStr = 'Water Bottle';
			break;
		case TargetType.MALLET:
			typeStr = 'Rubber Mallet';
			break;
		case TargetType.HAMMER:
			typeStr = 'Rock Hammer';
			break;
		default:
			typeStr = 'Unknown';
	}

	return `${typeStr} at (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}, ${location.altitude.toFixed(0)})`;
}


export const DummyGetStateRes: GetStateRes = {
	state: State.DISABLED,
	hasTarget: false,
	target: {
		location: {
			latitude: 0,
			longitude: 0,
			altitude: 0
		},
		type: TargetType.GNSS
	},
	hasPlan: false,
	plan: {
		waypoints: []
	}
};