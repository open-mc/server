import { cmpxchg, cmpxchgat } from "../util/chunk.js"
import { Blocks, Features } from "../globals.js"
import { Vein } from "../util/vein.js"

export const CoalVein = Features.coal_ore = v => {
	if(v > .75) return false
	const v1 = v%.25
	const th = 8*PI*v1, r = (v-v1)*4+5
	Vein(2.25, Blocks.coal_ore, Blocks.stone)(1.25, sin(th)*r, cos(th)*r)
}

export const IronVein = Features.iron_ore = v => {
	if(v > .6666) return false
	Vein(v*2+1, Blocks.iron_ore, Blocks.stone)
}

Features.ores = [Features.coal_ore, Features.iron_ore]