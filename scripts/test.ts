import BaseEvent = Events.BaseEvent;

function finish() {
    Chat.log("Stopped the Miner!" as any)
    stop()
    context.getCtx().closeContext()
}

function start() {
    KeyBind.keyBind("key.forward", true)
    KeyBind.keyBind("key.attack", true)
    KeyBind.keyBind("key.sneak", true)
}

function stop() {
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.sneak", false)
}

function wrapAngle(angle) {
    if (angle < 0) {
        return 360 + angle
    } else if (angle > 360) {
        return angle - 360
    } else {
        return angle
    }
}

function isAngleBetween(target: number, angle1: number, angle2: number): boolean {
    const rAngle = ((angle2 - angle1) % 360 + 360) % 360;
    if (rAngle >= 180)
        [angle1, angle2] = [angle2, angle1]

    if (angle1 <= angle2) {
        return target >= angle1 && target <= angle2
    } else {
        return target >= angle1 || target <= angle2
    }
}

function inAngleRange(val: number, angle: number): boolean {
    if (val == angle) {
        return true
    }
    return isAngleBetween(val, wrapAngle(angle-45), wrapAngle(angle+45))
}

enum Cardinal {
    North,
    East,
    South,
    West,
}

function offset(x: number, z: number, by: number, direction: Cardinal): [number, number] {
    switch (direction) {
    case Cardinal.North:
        return [x, z - by]
    case Cardinal.East:
        return [x + by, z]
    case Cardinal.South:
        return [x, z + by]
    case Cardinal.West:
        return [x - by, z]
    }
}

function cardinalToAngle(c: Cardinal): number {
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

function playerCardinal(): Cardinal {
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

const FORWARD_PITCH = 0
const SLIGHTLY_DOWN_PITCH = 35

let pickedUpTop = true

function lookStraight() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, FORWARD_PITCH)
}
function lookStraightSlightlyDown() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, SLIGHTLY_DOWN_PITCH)
}

// JsMacros.on("PlayerPositionChanged" as const, JavaWrapper.methodToJava((): any => {
//     lookStraight()
// }))

JsMacros.on("Key" as const, JavaWrapper.methodToJava((hi: Events.Key): any => {
    if (hi.key == "key.keyboard.x") {
        finish()
    }
}))


JsMacros.on("Damage" as const, JavaWrapper.methodToJava((hi: Events.Damage): any => {
    finish()
}))

let prevItem = null

JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
    if (hi.item.getItemID() == "minecraft:air") {
        const inventory = Player.openInventory()
        let ok = false
        for (let i = 0; i < inventory.getTotalSlots(); i++) {
            if (inventory.getSlot(i).getItemID().includes("pickaxe")) {
                inventory.swapHotbar(i, inventory.getSelectedHotbarSlotIndex())
                ok = true
                break
            }
        }
        inventory.close()
        if (!ok) {
            Chat.log("No more pickaxes! :/" as any)
            finish()
        } else {
            start()
        }
    } else if (
        prevItem == null ||
        (hi.item.getItemID().includes("pickaxe") &&
        hi.item.getItemID() == prevItem.getItemID() &&
        hi.item.getDamage() > prevItem.getDamage())
    ) {
        if (pickedUpTop) {
            lookStraightSlightlyDown()
            pickedUpTop = false
        } else {
            lookStraight()
            pickedUpTop = true
        }
    }
    prevItem = hi.item
}))

start()

/* */
