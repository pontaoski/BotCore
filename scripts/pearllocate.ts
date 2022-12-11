import * as Utils from "./utils"

Utils.launchExitGuard(() => context.getCtx().closeContext())
GlobalVars.putBoolean("inChest", false)

JsMacros.on("RecvMessage" as const, JavaWrapper.methodToJavaAsync((hi: Events.RecvMessage): any => {
    let mu = hi.text.getStringStripFormatting()
    if (mu.includes("The pearl of")) {
        GlobalVars.putBoolean("inChest", hi.text.getStringStripFormatting().includes("a Chest"))
    }
}))

Utils.spawn(async () => {
    while (true) {
        if (!GlobalVars.getBoolean("inChest")) {
            Chat.say("/ep locate")
        }
        await Utils.waitTicks(20 * 5)
    }
})
