import BaseEvent = Events.BaseEvent;

function pos() {
    return Player.getPlayer().getPos()
}

function eventPromise<T extends BaseEvent>(eventName: string): Promise<T> {
    return new Promise(resolve => {
        JsMacros.once(eventName, JavaWrapper.methodToJava((event: T): any => {
            resolve(event)
        }))
    })
}

async function eventUntil<T extends BaseEvent>(eventName: string, predicate: (event: T) => boolean): Promise<void> {
    while (true) {
        const event = await eventPromise<T>(eventName)
        if (predicate(event)) {
            return
        }
    }
}

function waitTick(): Promise<void> {
    return new Promise((resolve) => {
        JsMacros.once("Tick", JavaWrapper.methodToJava((ev: BaseEvent): any => {
            resolve()
        }))
    })
}

async function waitTicks(count: number): Promise<number> {
    for (let i = 0; i < count; i++) {
        await waitTick()
    }
    return count
}

async function spawn(callback: () => Promise<void>): Promise<void> {
    await callback()
}

async function doUntilObstructed(callback: () => void): Promise<void> {
    let {x: lastX, y: lastY, z: lastZ} = pos()

    do {
        lastX = pos().x, lastY = pos().y, lastZ = pos().z
        callback()
        await waitTicks(2)
    } while (lastX != pos().x || lastY != pos().y || lastZ != pos().z)
}

async function pressFor(key: string, ticks: number): Promise<void> {
    KeyBind.keyBind(key, true)
    await waitTicks(ticks)
    KeyBind.keyBind(key, false)
}

async function blockBreakPromise(): Promise<void> {
    await eventUntil<Events.Sound>("Sound", ev => {
        return ev.sound.startsWith("minecraft:block.") && ev.sound.endsWith(".break")
    })
}

async function walkForwardUntilObstructed(sneak: boolean = true): Promise<void> {
    snapToCardinal()
    await doUntilObstructed(() => {
        KeyBind.keyBind("key.sneak", sneak)
        KeyBind.keyBind("key.forward", true)
    })
    KeyBind.keyBind("key.forward", false)
    if (sneak) {
        await pressFor("key.back", 1)
        KeyBind.keyBind("key.sneak", false)
    }
}

async function tryIt() {
    await walkForwardUntilObstructed(true)
    context.getCtx().closeContext()
}

function snapToCardinal() {
    const yaw = cardinalToAngle(playerCardinal()) - 180
    const pitch = Player.getPlayer().getPitch()
    Player.getPlayer().lookAt(yaw, pitch)
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

function finish() {
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.attack", false)

    context.getCtx().closeContext()
}

JsMacros.on("Key" as const, JavaWrapper.methodToJava((hi: Events.Key): any => {
    if (hi.key == "key.keyboard.x") {
        finish()
    }
}))

enum Cardinal {
    North,
    East,
    South,
    West,
}

function inAngleRange(val: number, angle: number): boolean {
    if (val == angle) {
        return true
    }
    return isAngleBetween(val, wrapAngle(angle-45), wrapAngle(angle+45))
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

const FORWARD_PITCH = 0
const SLIGHTLY_DOWN_PITCH = 35

function lookStraight() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, FORWARD_PITCH)
}
function lookStraightSlightlyDown() {
    Player.getPlayer().lookAt(cardinalToAngle(playerCardinal()) - 180, SLIGHTLY_DOWN_PITCH)
}

JsMacros.on("RecvMessage" as const, JavaWrapper.methodToJava((hi: Events.RecvMessage): any => {
    if (hi.text.getString().includes("You sense a")) {
        finish()
    }
}))

JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
    const inventory = Player.openInventory()
    const hand = inventory.getSlot(inventory.getMap()["hotbar"][inventory.getSelectedHotbarSlotIndex()])
    if (hand.getItemID().includes("pickaxe")) {
        return
    }

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
    }
}))

spawn(async () => {
    while (true) {
        const brokenPromise = blockBreakPromise()
        const tickPromise = waitTicks(20 * 5)
        const result = await Promise.race([brokenPromise, tickPromise])
        // we timed out
        if (typeof result == "number") {
            finish()
        }
    }
})

spawn(async () => {
    while (true) {
        lookStraight()
        KeyBind.keyBind("key.attack", true)
        await walkForwardUntilObstructed(true)

        // break top block
        await blockBreakPromise()
        KeyBind.keyBind("key.attack", false)
        
        // break bottom block
        lookStraightSlightlyDown()
        KeyBind.keyBind("key.attack", true)
        await blockBreakPromise()
        KeyBind.keyBind("key.attack", false)
    }
})
