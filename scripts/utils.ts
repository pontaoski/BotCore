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

export function eventUntil<T extends BaseEvent>(eventName: string, predicate: (event: T) => boolean): Promise<void> {
    return new Promise((resolve) => {
        const listener = JsMacros.on(eventName, JavaWrapper.methodToJava((event: T): any => {
            if (predicate(event)) {
                JsMacros.off(listener)
                resolve()
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

export async function blockBreakPromise(): Promise<void> {
    await eventUntil<Events.Sound>("Sound", ev => {
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

export async function attackUntilBroken(): Promise<void> {
    KeyBind.keyBind("key.attack", true)
    await blockBreakPromise()
    KeyBind.keyBind("key.attack", false)
}

export async function attackUntilBrokenTimeout(): Promise<boolean> {
    const brokenPromise = attackUntilBroken()
    const tickPromise = waitTicks(20 * 5)
    const result = await Promise.race([
        brokenPromise,
        tickPromise,
    ])
    return typeof result === "number"
}

export function launchPickaxeGuard(callback: () => void): void {
    JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
        const inventory = Player.openInventory()
        const hand = inventory.getSlot(inventory.getMap()["hotbar"][inventory.getSelectedHotbarSlotIndex()])
        if (hand.getItemID().includes("pickaxe") && (hand.getMaxDamage() - hand.getDamage()) > 10) {
            return
        }
    
        let ok = false
        for (let i = 0; i < inventory.getTotalSlots(); i++) {
            const slot = inventory.getSlot(i)
            if (slot.getItemID().includes("pickaxe") && (slot.getMaxDamage() - slot.getDamage()) > 10) {
                inventory.swapHotbar(i, inventory.getSelectedHotbarSlotIndex())
                ok = true
                break
            }
        }
        inventory.close()
        if (!ok) {
            Chat.log("No more pickaxes! :/" as any)
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
