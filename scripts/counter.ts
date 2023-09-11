import * as Utils from "./utils"

const exitPromise = new Promise<number>((resolve) => {
    Utils.launchExitGuard(() => resolve(1))
})

Utils.spawn(async () => {
    const counter = new Map<string, number>()

    Chat.log(`Counting items...` as any)
    while (true) {
        const event = await Promise.race([Utils.eventPromise<Events.OpenContainer>("OpenContainer"), exitPromise])
        if (typeof event === 'number') {
            const keys = [...counter.keys()].sort()
            const items = ["Item,Count"]
            for (const key of keys) {
                items.push(`${key},${counter.get(key)!}`)
            }

            const name = `itemcount-${new Date().toISOString()}.txt`
            const file = FS.open(name)
            file.write(items.join("\n"))
            Chat.log(`Wrote item counts to ${file}` as any)
            return
        }
        await Utils.waitTicks(5)
        Chat.log(`Counting chest...` as any)

        const inv = event.inventory
        const slots = event.inventory.getMap().get("container")!
        for (const i of slots) {
            const slot = inv.getSlot(i)
            if (slot.isEmpty())
                continue
            const key = slot.getDefaultName().getString()
            counter.set(key, (counter.get(key) || 0) + slot.getCount())
        }
    }
})
