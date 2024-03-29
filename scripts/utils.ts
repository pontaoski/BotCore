import { snapToCardinal } from "./angles";
import BaseEvent = Events.BaseEvent;

export class CancellationToken {
    cancelled: boolean

    constructor() {
        this.cancelled = false
    }
    throwIfCancelled() {
        throw new Error("Cancelled")
    }
    isCancelled(): boolean {
        return this.cancelled
    }
    cancel() {
        this.cancelled = true
    }
}

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

const cim = Client.getMinecraft().field_1761
const CimClass = Reflection.getClass("net.minecraft.class_636")
const CimField1 = (CimClass as any).getDeclaredField("field_3714") // cbp
const CimField1_5 = (CimClass as any).getDeclaredField("field_3716") // cd
const CimField2 = (CimClass as any).getDeclaredField("field_3717") // bb
CimField1.setAccessible(true)
CimField1_5.setAccessible(true)
CimField2.setAccessible(true)

function scrongle(a: any): string {
    return `${a.method_10263()} ${a.method_10264()} ${a.method_10260()}`
}

export const BlockBreak: unique symbol = Symbol.for("BlockBreak")

export async function blockBreakPromise(token?: CancellationToken): Promise<typeof BlockBreak> {
    KeyBind.keyBind("key.attack", true)
    let event = await eventUntil<Events.Sound>("Sound", ev => {
        KeyBind.keyBind("key.attack", true)
        if (!(ev.sound.startsWith("minecraft:block.") && ev.sound.endsWith("break"))) {
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
    return BlockBreak
}

// export async function blockBreakPromise(token?: CancellationToken): Promise<typeof BlockBreak> {
//     do {
//         KeyBind.keyBind("key.attack", true)
//         await waitTick()
//     } while (!CimField2.get(cim))
//     // Chat.log(`${CimField2.get(cim)} && ${CimField1_5.get(cim) != 5}` as any)

//     let past: number
//     let current: number = CimField1.get(cim) as number
//     do {
//         if (token?.isCancelled()) {
//             return BlockBreak
//         }

//         past = current
//         current = CimField1.get(cim) as number
//         await waitTick()
//         // Chat.log(`${CimField2.get(cim)} && ${CimField1_5.get(cim)} != 5` as any)
//     } while (CimField2.get(cim) && CimField1_5.get(cim) != 5)
//     // await waitTick()
// //    CimField1_5.set(cim, 0)
//     return BlockBreak
// }

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

export async function attackUntilBroken(token?: CancellationToken): Promise<typeof BlockBreak> {
    KeyBind.keyBind("key.attack", true)
    let result = await blockBreakPromise(token)
    if (token?.isCancelled()) return BlockBreak
    KeyBind.keyBind("key.attack", false)
    return BlockBreak
}

export async function attackUntilBrokenTimeout(timeout: number = 5): Promise<number | typeof BlockBreak> {
    const cancellation = new CancellationToken()
    const brokenPromise = attackUntilBroken(cancellation)
    const tickPromise = waitTicks(20 * timeout)
    const result = await Promise.race([
        brokenPromise,
        tickPromise,
    ])
    cancellation.cancel()
    return result
}

export function countItems(callback: (item: _javatypes.xyz.wagyourtail.jsmacros.client.api.helpers.ItemStackHelper) => boolean): number {
    const inventory = Player.openInventory()
    let count = 0
    for (let i = 0; i < inventory.getTotalSlots(); i++) {
        const slot = inventory.getSlot(i)
        if (callback(slot)) {
            count += slot.getCount()
        }
    }
    return count
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

export function isEnchanted(item: _javatypes.xyz.wagyourtail.jsmacros.client.api.helpers.ItemStackHelper): boolean {
    if (!item.getNBT()?.asCompoundHelper().has(`Enchantments`))
        return false

    return item.getNBT()?.asCompoundHelper().get(`Enchantments`).asListHelper().length() > 0
}

export function shouldUse(item: _javatypes.xyz.wagyourtail.jsmacros.client.api.helpers.ItemStackHelper): boolean {
    const pricey = item.getItemID().includes(`netherite`) || isEnchanted(item)
    if (pricey && (item.getMaxDamage() - item.getDamage()) < 10)
        return false

    return true
}

export function holdPickaxe(): boolean {
    return holdItem((item) => {
        return item.getItemID().includes("pickaxe") && shouldUse(item)
    })
}

export function holdShovel(): boolean {
    return holdItem((item) => {
        return item.getItemID().includes("_shovel") && shouldUse(item)
    });
}

export function holdAxe(): boolean {
    return holdItem((item) => {
        return item.getItemID().includes("_axe") && shouldUse(item)
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

export function launchShovelGuard(callback: () => void): void {
    JsMacros.on("HeldItemChange" as const, JavaWrapper.methodToJava((hi: Events.HeldItemChange): any => {
        if (_suspendGuards) return

        let ok = holdShovel()
        if (!ok) {
            Chat.log("No more shovels! :/" as any)
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

export async function ensureFed(): Promise<boolean> {
    const MinimumFood = 12
    const FoodItems = [
        "minecraft:apple",
        "minecraft:mushroom_stew",
        "minecraft:bread",
        "minecraft:cooked_porkchop",
        "minecraft:cooked_cod",
        "minecraft:cooked_salmon",
        "minecraft:cookie",
        "minecraft:melon_slice",
        "minecraft:cooked_beef",
        "minecraft:cooked_chicken",
        "minecraft:carrot",
        "minecraft:baked_potato",
        "minecraft:pumpkin_pie",
        "minecraft:cooked_rabbit",
        "minecraft:rabbit_stew",
        "minecraft:cooked_mutton",
        "minecraft:beetroot_soup",
        "minecraft:sweet_berries",
    ]

    if (Player.getPlayer().getFoodLevel() >= MinimumFood) {
        return true
    }
    suspendGuard()
    for (const food of FoodItems) {
        while (Player.getPlayer().getFoodLevel() < MinimumFood && holdItem(item => item.getItemID() == food)) {
            KeyBind.keyBind("key.use", true)
            await waitTicks(5)
        }
        KeyBind.keyBind("key.use", false)
    }
    stopSuspendGuard()
    return Player.getPlayer().getFoodLevel() < MinimumFood
}
