import { lookStraight, lookStraightSlightlyDown, lookStraightSlightlyUp, lookStraightUp, turnRight } from "./angles"
import * as Utils from "./utils"

async function breakBlock(failure: () => void): Promise<void> {
    if (typeof await Utils.attackUntilBrokenTimeout() == 'number') {
        failure()
    }
}

export async function mine3x3(failure: () => void) {
    while (true) {
        lookStraight()

        // break top block
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            breakBlock(failure),
        ])

        // break bottom block
        lookStraightSlightlyDown()
        await breakBlock(failure)

        Utils.walkForwardUntilObstructed(false)

        // break top block
        lookStraightUp()
        await breakBlock(failure)

        lookStraight()
        turnRight()

        for (let i = 0; i < 2; i++) {
            lookStraightSlightlyUp()
        
            // break top block
            await Promise.all([
                Utils.walkForwardUntilObstructed(false),
                Utils.waitTicks(5).then(() => breakBlock(failure)),
            ])
    
            // break mid block
            lookStraight()
            await breakBlock(failure)
            
            // break bottom block
            lookStraightSlightlyDown()
            await breakBlock(failure)
        }

        turnRight()
        turnRight()
        await Utils.walkForwardUntilObstructed(false)
        turnRight()
    }
}

export async function mine3x4(failure: () => void) {
    while (true) {
        lookStraight()

        // break top block
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            breakBlock(failure),
        ])

        // break bottom block
        lookStraightSlightlyDown()
        await breakBlock(failure)

        Utils.walkForwardUntilObstructed(false)

        // break top two blocks
        lookStraightUp()
        await breakBlock(failure)

        lookStraightUp()
        await breakBlock(failure)

        lookStraight()
        turnRight()

        for (let i = 0; i < 2; i++) {
            lookStraightSlightlyUp()
        
            // break top block
            await Promise.all([
                Utils.walkForwardUntilObstructed(false),
                Utils.waitTicks(5).then(() => breakBlock(failure)),
            ])
    
            // break mid block
            lookStraight()
            await breakBlock(failure)
            
            // break bottom block
            lookStraightSlightlyDown()
            await breakBlock(failure)

            // break topmost block
            await Utils.walkForwardUntilObstructed(false)
            lookStraightUp()
            await breakBlock(failure)
        }

        turnRight()
        turnRight()
        await Utils.walkForwardUntilObstructed(false)
        turnRight()
    }
}

export async function mine5x5(failure: () => void) {
    while (true) {
        lookStraight()

        // break top block
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            breakBlock(failure),
        ])

        // break bottom block
        lookStraightSlightlyDown()
        await breakBlock(failure)
        
        await Promise.all([
            Utils.walkForwardUntilObstructed(false),
            Utils.waitTick(),
        ])

        // break top block 1
        lookStraightUp()
        await breakBlock(failure)

        // break top block 2
        lookStraightUp()
        await breakBlock(failure)

        // break top block 3
        lookStraightUp()
        await breakBlock(failure)

        lookStraight()
        turnRight()

        for (let i = 0; i < 4; i++) {
            lookStraightSlightlyUp()
        
            // break top block
            await Promise.all([
                Utils.walkForwardUntilObstructed(false),
                Utils.waitTicks(5).then(() => breakBlock(failure)),
            ])
    
            // break mid block
            lookStraight()
            await breakBlock(failure)
            
            // break bottom block
            lookStraightSlightlyDown()
            await breakBlock(failure)

            await Utils.walkForwardUntilObstructed(false)
            
            // break topmost block 1
            lookStraightUp()
            await breakBlock(failure)

            // break topmost block 2
            lookStraightUp()
            await breakBlock(failure)
        }

        turnRight()
        turnRight()
        await Utils.walkForwardUntilObstructed(false)
        turnRight()
    }
}
