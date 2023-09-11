import { mine1x5, mine3x3, mine3x4, mine5x5 } from "./mining_bots"
import * as Utils from "./utils"

type IScreen = _javatypes.xyz.wagyourtail.jsmacros.client.api.sharedinterfaces.IScreen
type Obj = _javatypes.java.lang.Object

function makeScreen() {
    function init(screen: IScreen) {
        screen.addButton(50, 50, 100, 20, 1, "3x3 Bot", JavaWrapper.methodToJava((): any => {
            startWith(mine3x3)
        }))
        screen.addButton(50, 80, 100, 20, 1, "3x4 Bot", JavaWrapper.methodToJava((): any => {
            startWith(mine3x4)
        }))
        screen.addButton(50, 110, 100, 20, 1, "5x5 Bot", JavaWrapper.methodToJava((): any => {
            startWith(mine5x5)
        }))
        screen.addButton(50, 140, 100, 20, 1, "1x5 Bot", JavaWrapper.methodToJava((): any => {
            startWith(mine1x5)
        }))
    }

    const theScreen = Hud.createScreen("Miner Bot", false) as unknown as IScreen
    theScreen.setOnInit(JavaWrapper.methodToJava((x: IScreen): any => init(x)))
    return theScreen
}

function finish() {
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.attack", false)

    context.getCtx().closeContext()
}

function startWith(fn: (fail: () => void) => Promise<void>) {
    Hud.getOpenScreen().close()
    Chat.toast("Press X to stop mining" as any, "The bot will instantly stop" as any)
    Utils.spawn(async () => await(fn(() => finish())))
}

Utils.launchExitGuard(() => finish())
Utils.launchVeinGuard(() => finish())
Utils.launchPickaxeGuard(() => finish())

const scr = makeScreen()
Hud.openScreen(scr)
