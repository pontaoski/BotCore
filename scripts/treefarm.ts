import { lookStraight, lookStraightDown, lookStraightSlightlyDown, lookStraightUp, turnLeft, turnRight } from "./angles"
import * as Utils from "./utils"

function finish(): never {
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.attack", false)

    context.getCtx().closeContext()
    while (true) {}
}

async function breakBlock(): Promise<typeof Utils.BlockBreak> {
    let result = await Utils.attackUntilBrokenTimeout(3)
    if (typeof result == 'number') {
        KeyBind.keyBind("key.attack", false)
        throw new Error("Breaking block timed out")
    }
    return result
}

Utils.launchExitGuard(() => finish())
Utils.launchAxeGuard(() => finish())

Utils.spawn(async () => {
    Utils.holdAxe()
    let leftRow = true
    try {
        while (true) {
            try {
                let past: number
                let current: number = Utils.countItems(x => x.getItemID().includes("log"))
                do {
                    await Utils.walkForwardUntilObstructed(false)
                    lookStraight()
                    await breakBlock()
                    past = current
                    await Utils.waitTick()
                    current = Utils.countItems(x => x.getItemID().includes("log"))
                } while (past == current)
            } catch (error) {
                if (leftRow) {
                    turnLeft()
                    await Utils.walkForwardUntilObstructed(false)
                    turnLeft()
                } else {
                    turnRight()
                    await Utils.walkForwardUntilObstructed(false)
                    turnRight()
                }
                leftRow = !leftRow
                continue
            }

            lookStraightSlightlyDown()
            await breakBlock()

            await Utils.walkForwardFor(1)
            lookStraightUp()
    
            try {
                let past: number
                let current: number = Utils.countItems(x => x.getItemID().includes("log"))
                let lastPickup = Time.time()
                do {
                    await breakBlock()
                    past = current
                    current = Utils.countItems(x => x.getItemID().includes("log"))
                    if (past != current) {
                        lastPickup = Time.time()
                    }
                    await Utils.waitTick()
                } while ((Time.time() - lastPickup) < 1000)
            } catch (error) { }

            Utils.suspendGuard()
            if (!Utils.holdItem(item => item.getItemID().includes("spruce_sapling"))) {
                Chat.log(`no more saplings!` as any)
                finish()
            }
            lookStraightDown()
            KeyBind.keyBind("key.use", true)
            await Utils.waitTicks(5)
            KeyBind.keyBind("key.use", false)
            lookStraight()
            Utils.stopSuspendGuard()

            await Utils.ensureFed()
            Utils.holdAxe()
        }
    } catch (error) {
        Chat.log(`Fatal error` as any)
        Chat.log(`${error.stack}` as any)
        finish()
    }
})
