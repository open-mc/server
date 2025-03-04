import { Blocks } from "../globals.js"
import { cull, getX, placeAir, placeatAir, placedown, up } from "../util/chunk.js"
import { Rng1D } from "../util/random.js"

let treeNoise = Rng1D('overworld.tree')

export const OakTree = () => {
	if(!cull(2, 2, 0, 8)) return
	const x = treeNoise(getX())
	for(let i = (x&3)+2; i; i--)
		placeAir(Blocks.oak_log_back), up()
	placeAir(Blocks.oak_log_leaves)
	placeatAir(0, 1, Blocks.oak_log_leaves)
	placeatAir(0, 2, Blocks.oak_leaves)
	placeatAir(0, 3, Blocks.oak_leaves)
	for(let i=0; i<4; i++){
		placeatAir(1, i, Blocks.oak_leaves)
		placeatAir(-1, i, Blocks.oak_leaves)
		placeatAir((i<<1&4)-2, i&1, Blocks.oak_leaves)
	}
}