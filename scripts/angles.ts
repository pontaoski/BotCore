export enum Cardinal {
    North,
    East,
    South,
    West,
}

export function snapToCardinal() {
    const yaw = cardinalToAngle(playerCardinal()) - 180
    const pitch = Player.getPlayer().getPitch()
    Player.getPlayer().lookAt(yaw, pitch)
}

export function cardinalToAngle(c: Cardinal): number {
    switch (c) {
    case Cardinal.North:
        return 0
    case Cardinal.East:
        return 90
    case Cardinal.South:
        return 180
    case Cardinal.West:
        return 270
    }
}

export function cardinalRight(from: Cardinal): Cardinal {
    switch (from) {
    case Cardinal.North:
        return Cardinal.East
    case Cardinal.East:
        return Cardinal.South
    case Cardinal.South:
        return Cardinal.West
    case Cardinal.West:
        return Cardinal.North
    }
}

export function cardinalLeft(from: Cardinal): Cardinal {
    switch (from) {
    case Cardinal.North:
        return Cardinal.West
    case Cardinal.West:
        return Cardinal.South
    case Cardinal.South:
        return Cardinal.East
    case Cardinal.East:
        return Cardinal.North
    }
}

export function playerCardinal(): Cardinal {
    const ang = Player.getPlayer().getYaw()+180
    if (inAngleRange(ang, 0)) {
        return Cardinal.North
    } else if (inAngleRange(ang, 90)) {
        return Cardinal.East
    } else if (inAngleRange(ang, 180)) {
        return Cardinal.South
    } else {
        return Cardinal.West
    }
}

export function inAngleRange(val: number, angle: number): boolean {
    if (val == angle) {
        return true
    }
    return isAngleBetween(val, wrapAngle(angle-45), wrapAngle(angle+45))
}

export function wrapAngle(angle) {
    if (angle < 0) {
        return 360 + angle
    } else if (angle > 360) {
        return angle - 360
    } else {
        return angle
    }
}

export function isAngleBetween(target: number, angle1: number, angle2: number): boolean {
    const rAngle = ((angle2 - angle1) % 360 + 360) % 360;
    if (rAngle >= 180)
        [angle1, angle2] = [angle2, angle1]

    if (angle1 <= angle2) {
        return target >= angle1 && target <= angle2
    } else {
        return target >= angle1 || target <= angle2
    }
}

const FORWARD_PITCH = 0
const SLIGHTLY_DOWN_PITCH = 35
const SLIGHTLY_UP_PITCH = -70

export function lookStraight() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, FORWARD_PITCH)
}
export function turnRight() {
    Player.getPlayer().lookAt(cardinalToAngle(cardinalRight(playerCardinal())) - 180, Player.getPlayer().getPitch())
}
export function turnLeft() {
    Player.getPlayer().lookAt(cardinalToAngle(cardinalLeft(playerCardinal())) - 180, Player.getPlayer().getPitch())
}
export function lookStraightSlightlyUp() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, SLIGHTLY_UP_PITCH)
}
export function lookStraightUp() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, -180)
}
export function lookStraightDown() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, 180)
}
export function lookStraightSlightlyDown() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, SLIGHTLY_DOWN_PITCH)
}