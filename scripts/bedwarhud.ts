import * as Utils from "./utils"
import * as Layout from "./layout"

const BWDraw2D = Hud.createDraw2D()

BWDraw2D.register()

Layout.column(20, 10, function*() {
    yield BWDraw2D.addText("Gold", 20, 0, 0xFFAA00, true)
    yield BWDraw2D.addText("Iron", 20, 0, 0xAAAAAA, true)
    yield BWDraw2D.addText("Diamond", 20, 0, 0x55FFFF, true)
    yield BWDraw2D.addText("Emerald", 20, 0, 0x55FF55, true)
})

type Text = _javatypes.xyz.wagyourtail.jsmacros.client.api.sharedclasses.RenderCommon$Text

let goldCountText: Text
let ironCountText: Text
let diamondCountText: Text
let emeraldCountText: Text

Layout.column(20, 10, function*() {
    yield (goldCountText = BWDraw2D.addText("0", 80, 0, 0xFFFFFF, true))
    yield (ironCountText = BWDraw2D.addText("0", 80, 0, 0xFFFFFF, true))
    yield (diamondCountText = BWDraw2D.addText("0", 80, 0, 0xFFFFFF, true))
    yield (emeraldCountText = BWDraw2D.addText("0", 80, 0, 0xFFFFFF, true))
})

function evaluateCounts() {
    let goldCount = 0
    let ironCount = 0
    let diamondCount = 0
    let emeraldCount = 0
    const inventory = Player.openInventory()
    for (let i = 0; i < inventory.getTotalSlots(); i++) {
        if (inventory.getSlot(i).getItemID() == "minecraft:gold_ingot") goldCount += inventory.getSlot(i).getCount()
        if (inventory.getSlot(i).getItemID() == "minecraft:iron_ingot") ironCount += inventory.getSlot(i).getCount()
        if (inventory.getSlot(i).getItemID() == "minecraft:diamond") diamondCount += inventory.getSlot(i).getCount()
        if (inventory.getSlot(i).getItemID() == "minecraft:emerald") emeraldCount += inventory.getSlot(i).getCount()
    }
    goldCountText.setText(`${goldCount}`)
    ironCountText.setText(`${ironCount}`)
    diamondCountText.setText(`${diamondCount}`)
    emeraldCountText.setText(`${emeraldCount}`)
    if (Hud.getOpenScreen() != inventory.getRawContainer())
        inventory.close()
}

evaluateCounts()

JsMacros.on("DropSlot" as const, JavaWrapper.methodToJava((): any => evaluateCounts()))
JsMacros.on("ClickSlot" as const, JavaWrapper.methodToJava((): any => evaluateCounts()))
JsMacros.on("Death" as const, JavaWrapper.methodToJava((): any => evaluateCounts()))
JsMacros.on("ItemPickup" as const, JavaWrapper.methodToJava((): any => evaluateCounts()))
JsMacros.on("DimensionChange" as const, JavaWrapper.methodToJava((): any => evaluateCounts()))

JsMacros.on("Key" as const, JavaWrapper.methodToJava((hi: Events.Key): any => {
    if (hi.key == "key.keyboard.x") {
        finishBWHud()
    }
}))

function finishBWHud() {
    BWDraw2D.unregister()
    Utils.exit()
}
