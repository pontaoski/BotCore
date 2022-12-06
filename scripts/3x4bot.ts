import { lookStraight, lookStraightSlightlyDown, lookStraightSlightlyUp, lookStraightUp, turnRight } from "./angles"
import * as Utils from "./utils"

function finish() {
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.attack", false)

    context.getCtx().closeContext()
}

Utils.launchExitGuard(() => finish())
Utils.launchVeinGuard(() => finish())
Utils.launchPickaxeGuard(() => finish())

async function breakBlock(): Promise<void> {
    if (await Utils.attackUntilBrokenTimeout()) {
        finish()
    }
}

Utils.spawn(async () => {
    while (true) {
        lookStraight()

        // break top block
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            breakBlock(),
        ])

        // break bottom block
        lookStraightSlightlyDown()
        await breakBlock()

        Utils.walkForwardUntilObstructed(false)

        // break top two blocks
        lookStraightUp()
        await breakBlock()

        lookStraightUp()
        await breakBlock()

        lookStraight()
        turnRight()

        for (let i = 0; i < 2; i++) {
            lookStraightSlightlyUp()
        
            // break top block
            await Promise.all([
                Utils.walkForwardUntilObstructed(false),
                Utils.waitTicks(5).then(() => breakBlock()),
            ])
    
            // break mid block
            lookStraight()
            await breakBlock()
            
            // break bottom block
            lookStraightSlightlyDown()
            await breakBlock()

            // break topmost block
            await Utils.walkForwardUntilObstructed(false)
            lookStraightUp()
            await breakBlock()
        }

        turnRight()
        turnRight()
        await Utils.walkForwardUntilObstructed(false)
        turnRight()
    }
})
