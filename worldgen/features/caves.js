import { Blocks, Features } from "../globals.js"
import { jitterNoise, peekAirType, peekNoise } from "../util/chunk.js"
import { Vein } from "../util/vein.js"

Features.noodle_cave = v => {
	if(v > .333333333) return false
	let dir = 6*PI*v
	if(
		(!peekNoise() && peekAirType() != Blocks.air)
	|| (!peekNoise(3, 0) && peekAirType(3, 0) != Blocks.air)
	|| (!peekNoise(-3, 0) && peekAirType(-3, 0) != Blocks.air)
	|| (!peekNoise(0, 3) && peekAirType(0, 3) != Blocks.air)
	|| (!peekNoise(0, -3) && peekAirType(0, -3) != Blocks.air)) return false
	let vein = Vein(2+v, Blocks.air)
	for(let i=0;i<12;i++){
		const x = sin(dir)*4, y = cos(dir)*4
		if(
			(!peekNoise(x, y) && peekAirType(x, y) != Blocks.air)
		|| (!peekNoise(x+3, y) && peekAirType(x+3, y) != Blocks.air)
		|| (!peekNoise(x-3, y) && peekAirType(x-3, y) != Blocks.air)
		|| (!peekNoise(x, y+3) && peekAirType(x, y+3) != Blocks.air)
		|| (!peekNoise(x, y-3) && peekAirType(x, y-3) != Blocks.air)) break
		vein(2+v, x, y)
		dir += ((jitterNoise()&0xffff)-0x8000)*.000015
	}
	dir = 6*PI*v+PI
	vein = Vein(2+v, Blocks.air, null, false)
	for(let i=0;i<12;i++){
		const x = sin(dir)*4, y = cos(dir)*4
		if(
			(!peekNoise(x, y) && peekAirType(x, y) != Blocks.air)
		|| (!peekNoise(x+3, y) && peekAirType(x+3, y) != Blocks.air)
		|| (!peekNoise(x-3, y) && peekAirType(x-3, y) != Blocks.air)
		|| (!peekNoise(x, y+3) && peekAirType(x, y+3) != Blocks.air)
		|| (!peekNoise(x, y-3) && peekAirType(x, y-3) != Blocks.air)) break
		vein(2+v, x, y)
		dir += ((jitterNoise()&0xffff)-0x8000)*.000015
	}
}

Features.caves = [Features.noodle_cave]