import { snapToCardinal } from "./angles";
import BaseEvent = Events.BaseEvent;

export function eventPromise<T extends BaseEvent>(eventName: string): Promise<T> {
    return new Promise(resolve => {
        JsMacros.once(eventName, JavaWrapper.methodToJava((event: T): any => {
            resolve(event)
        }))
    })
}

export function exit(): never {
    const ctx = context.getCtx();
    ctx.releaseBoundEventIfPresent()
    ctx.closeContext()
    while (true) {}
}

export function eventUntil<T extends BaseEvent>(eventName: string, predicate: (event: T) => boolean): Promise<T> {
    return new Promise((resolve) => {
        const listener = JsMacros.on(eventName, JavaWrapper.methodToJava((event: T): any => {
            if (predicate(event)) {
                JsMacros.off(listener)
                resolve(event)
            }
        }))
    })
}

export function waitTick(): Promise<void> {
    return new Promise((resolve) => {
        JsMacros.once("Tick", JavaWrapper.methodToJava((ev: BaseEvent): any => {
            resolve()
        }))
    })
}

export async function waitTicks(count: number): Promise<number> {
    for (let i = 0; i < count; i++) {
        await waitTick()
    }
    return count
}

export async function spawn(callback: () => Promise<void>): Promise<void> {
    await callback()
}

export async function blockBreakPromise(): Promise<string> {
    let event = await eventUntil<Events.Sound>("Sound", ev => {
        if (!(ev.sound.startsWith("minecraft:block.") && ev.sound.endsWith(".break"))) {
            return false
        }
        const pos = ev.position
        const ppos = Player.getPlayer().getPos()
        const dx = pos.getX() - ppos.getX()
        const dy = pos.getY() - ppos.getY()
        const dz = pos.getZ() - ppos.getZ()
        const d = Math.sqrt(dx**2 + dy**2 + dz**2)
        return d < 5
    })
    return event.sound.slice("minecraft:block.".length, -".break".length)
}

export function pos(): _javatypes.xyz.wagyourtail.jsmacros.client.api.sharedclasses.PositionCommon$Pos3D {
    return Player.getPlayer().getPos()
}

export async function doUntilObstructed(callback: () => void): Promise<void> {
    let {x: lastX, y: lastY, z: lastZ} = pos()

    do {
        lastX = pos().x, lastY = pos().y, lastZ = pos().z
        callback()
        await waitTicks(2)
    } while (lastX != pos().x || lastY != pos().y || lastZ != pos().z)
}

export async function pressFor(key: string, ticks: number): Promise<void> {
    KeyBind.keyBind(key, true)
    await waitTicks(ticks)
    KeyBind.keyBind(key, false)
}

export async function walkForwardUntilObstructed(sneak: boolean = true): Promise<void> {
    snapToCardinal()
    await doUntilObstructed(() => {
        KeyBind.keyBind("key.sneak", sneak)
        KeyBind.keyBind("key.forward", true)
    })
    KeyBind.keyBind("key.forward", false)
    if (sneak) {
        await pressFor("key.back", 2)
        KeyBind.keyBind("key.sneak", false)
    }
}

export async function walkForwardFor(blocks: number): Promise<void> {
    snapToCardinal()

    let {x: firstX, y: firstY, z: firstZ} = pos()
    let {x: lastX, y: lastY, z: lastZ} = pos()

    const distance = () => {
        const dx = firstX - lastX
        const dy = firstY - lastY
        const dz = firstZ - lastZ
        const d = Math.sqrt(dx**2 + dy**2 + dz**2)
        return d
    }

    KeyBind.keyBind("key.forward", true)
    KeyBind.keyBind("key.sneak", true)
    do {
        lastX = pos().x, lastY = pos().y, lastZ = pos().z
        await waitTick()
    } while ((distance() - blocks) < -0.4)
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
}

export async function attackUntilBroken(): Promise<string> {
    KeyBind.keyBind("key.attack", true)
    let result = await blockBreakPromise()
    KeyBind.keyBind("key.attack", false)
    return result
}

export async function attackUntilBrokenTimeout(timeout: number = 5): Promise<number | string> {
    const brokenPromise = attackUntilBroken()
    const tickPromise = waitTicks(20 * timeout)
    const result = await Promise.race([
        brokenPromise,
        tickPromise,
    ])
    return result
}

export function holdItem(callback: (item: _javatypes.xyz.wagyourtail.jsmacros.client.api.helpers.ItemStackHelper) => boolean): boolean {
    const inventory = Player.openInventory()
    const hand = inventory.getSlot(inventory.getMap()["hotbar"][inventory.getSelectedHotbarSlotIndex()])
    if (callback(hand)) {
        return true
    }

    let ok = false
    for (let i = 0; i < inventory.getTotalSlots(); i++) {
        const slot = inventory.getSlot(i)
        if (callback(slot)) {
            inventory.swapHotbar(i, inventory.getSelectedHotbarSlotIndex())
            ok = true
            break
        }
    }
    inventory.close()
    return ok
}

export function holdPickaxe(): boolean {
    return holdItem((item) => {
        return item.getItemID().includes("pickaxe") && (item.getMaxDamage() - item.getDamage()) > 10
    })
}

export function holdAxe(): boolean {
    return holdItem((item) => {
        return item.getItemID().includes("_axe") && (item.getMaxDamage() - item.getDamage()) > 10;
    });
}

let _suspendGuards = false

export function suspendGuard() {
    _suspendGuards = true
}

export function stopSuspendGuard() {
    _suspendGuards = false
}

export function launchPickaxeGuard(callback: () => void): void {
    JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
        if (_suspendGuards) return

        let ok = holdPickaxe()
        if (!ok) {
            Chat.log("No more pickaxes! :/" as any)
            callback()
        }
    }))
}

export function launchAxeGuard(callback: () => void): void {
    JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
        if (_suspendGuards) return

        let ok = holdAxe()
        if (!ok) {
            Chat.log("No more axes! :/" as any)
            callback()
        }
    }))
}

export function launchVeinGuard(callback: () => void): void {
    JsMacros.on("RecvMessage" as const, JavaWrapper.methodToJava((hi: Events.RecvMessage): any => {
        if (hi.text.getString().includes("You sense a")) {
            callback()
        }
    }))
}

export function launchExitGuard(callback: () => void): void {
    JsMacros.on("Key" as const, JavaWrapper.methodToJava((hi: Events.Key): any => {
        if (hi.key == "key.keyboard.x") {
            callback()
        }
    }))
}
