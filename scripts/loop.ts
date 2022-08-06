const playerPosEvent = JsMacros.createCustomEvent("PlayerPositionChanged")
playerPosEvent.registerEvent()

const player = Player.getPlayer()
let oldX = 0, oldY = 0, oldZ = 0

while (true) {
    const {x, y, z} = player.getBlockPos()
    if (oldX != x || oldY != y || oldZ != z) {
        playerPosEvent.trigger()
    }
    oldX = x, oldY = y, oldZ = z
    Client.waitTick(1)
}
