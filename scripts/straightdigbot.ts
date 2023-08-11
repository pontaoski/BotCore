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
Utils.launchShovelGuard(() => finish())

Utils.spawn(async () => {
    while (true) {
        lookStraight()

        // break top block
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            Utils.attackUntilBrokenTimeout(),
        ])

        // break bottom block
        lookStraightSlightlyDown()
        await Utils.attackUntilBrokenTimeout()
    }
})
