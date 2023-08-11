import * as Utils from "./utils"

function finish() {
    KeyBind.keyBind("key.forward", false)

    context.getCtx().closeContext()
}

Utils.launchExitGuard(() => finish())
Utils.spawn(async () => {
    while (true) {
        KeyBind.keyBind("key.forward", true)
        await Utils.waitTick()
    }
})
