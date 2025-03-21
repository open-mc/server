import { Blocks, Features } from "../globals.js"
import { getY } from "../util/chunk.js"
import { Vein } from "../util/vein.js"

Features.coal_ore = v => {
	if(v > .75) return false
	const v1 = v%.25
	const th = 8*PI*v1, r = (v-v1)*4+5
	Vein(2.25, Blocks.coal_ore, Blocks.stone)(1.25, sin(th)*r, cos(th)*r)
}

Features.iron_ore = v => {
	const prob = min(.9,.45+max(0, 128-abs((getY()+192&511)-128))*.005)
	if(v > prob) return false
	Vein(v+1.4, Blocks.iron_ore, Blocks.stone)
}

Features.gold_ore = v => {
	const prob = max(0, 128-abs((getY()-128&511)-128))*.005
	if(v > prob) return false
	Vein(v+1.2, Blocks.gold_ore, Blocks.stone)
}

Features.diamond_ore = v => {
	const y = getY()
	if(y > -64) return false
	const prob = y > -320 ? (-64-y)*.0009765625 : y > -1600 ? .25 : y > -3200 ? y*-.00015625 : .5
	if(v > prob) return false
	Vein(v+1, Blocks.diamond_ore, Blocks.stone)
}

Features.lapis_ore = v => {
	const prob = min(.9,.45+max(0, 128-abs((getY()&511)-128))*.004)
	if(v > prob) return false
	Vein(1, Blocks.lapis_ore, Blocks.stone)
}

Features.ores = [Features.coal_ore, Features.iron_ore, Features.gold_ore, Features.diamond_ore, Features.lapis_ore]