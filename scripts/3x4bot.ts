import { mine3x4 } from "./mining_bots"
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

Utils.spawn(async () => await mine3x4(() => finish()))
