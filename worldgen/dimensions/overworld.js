import { veins } from '../ores.js'
import { biomesFor } from '../util/biomes.js'
import { filler } from '../util/perlin.js'
import { imxs32_2 } from '../util/random.js'
import { Blocks, chunk } from '../vars.js'

const generation = (filler) => (cx, cy) => {
	filler(cx,cy)
	let rand = imxs32_2(cx, cy, 139827386, -1012498625)
	rand = veins(rand, Blocks.coal_ore)
	rand = veins(rand, Blocks.iron_ore, 2, 2)
	if(cy == -33554432){
		for(let y = 5; y >= 0; y--){
			for(let x = 0; x < 64; x++){
				if(Math.random() * 6 > y)chunk[x + y * 64] = Blocks.bedrock
			}
		}
	}
}

export function superflat(_,cy){
	if(cy>=0) chunk.fill(Blocks.air)
	else chunk.fill(Blocks.stone)
	if(cy==-1){
		let i = 3840
		while(i<4032)chunk[i++]=Blocks.dirt
		while(i<4096)chunk[i++]=Blocks.grass
	}
}

export function classic_superflat(_,cy){
	if(cy) return void chunk.fill(Blocks.air)
	let i = 256
	while(--i>=192)chunk[i]=Blocks.grass
	while(--i>=64)chunk[i]=Blocks.dirt
	while(--i>=0)chunk[i]=Blocks.bedrock
}

export const fill = generation(() => void(chunk.fill(Blocks.stone)))
export const flat = generation(superflat)
export const perlin = generation(filler(Blocks.stone, Blocks.water, Blocks.waterTop, 0, biomesFor, 1))
export default generation(filler(Blocks.stone, Blocks.water, Blocks.waterTop, 0, biomesFor), 3, -2)