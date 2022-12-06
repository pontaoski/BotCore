interface Adjustable {
    x: number;
    y: number;
    getWidth(): number
    setPos(x: number, y: number): void
}
interface Size {
    w: number
    h: number
}
export function column(y: number, spacing: number, it: () => Generator<Adjustable, void, number>) {
    const gen = it()
    let width = -1
    let height = -1
    let result = gen.next(y)
    while (!result.done) {
        const val = result.value as Adjustable
        val.setPos(val.x, y)
        y += spacing
        height = y + spacing
        width = Math.max(width, val.getWidth())
        result = gen.next(y)
    }
}