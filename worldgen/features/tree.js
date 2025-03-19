import { Blocks } from "../globals.js"
import { cull, getX, placeAir, cmpxchgatAir, cmpxchgAir, up, placeatAir, placedown, peekFeature } from "../util/chunk.js"
import { Rng1D } from "../util/random.js"

let treeNoise = Rng1D('overworld.tree')

export const OakTree = () => {
	if(!cull(2, 2, 0, 8) || peekFeature(1,-1) === OakTree || peekFeature(1,0) === OakTree || peekFeature(1,1) === OakTree) return
	const x = treeNoise(getX())
	placedown(Blocks.dirt)
	for(let i = (x&3)+2; i; i--)
		cmpxchgAir(Blocks.oak_leaves, Blocks.oak_log_leaves) || placeAir(Blocks.oak_log_back), up()
	placeAir(Blocks.oak_log_leaves)
	placeatAir(0, 1, Blocks.oak_log_leaves)
	cmpxchgatAir(0, 2, Blocks.air, Blocks.oak_leaves) || cmpxchgatAir(0, 2, Blocks.oak_log_back, Blocks.oak_log_leaves)
	cmpxchgatAir(0, 3, Blocks.air, Blocks.oak_leaves) || cmpxchgatAir(0, 3, Blocks.oak_log_back, Blocks.oak_log_leaves)
	for(let i=0; i<4; i++){
		cmpxchgatAir(1, i, Blocks.air, Blocks.oak_leaves) || cmpxchgatAir(1, i, Blocks.oak_log_back, Blocks.oak_log_leaves)
		cmpxchgatAir(-1, i, Blocks.air, Blocks.oak_leaves) || cmpxchgatAir(-1, i, Blocks.oak_log_back, Blocks.oak_log_leaves)
		cmpxchgatAir((i<<1&4)-2, i&1, Blocks.air, Blocks.oak_leaves) || cmpxchgatAir((i<<1&4)-2, i&1, Blocks.oak_log_back, Blocks.oak_log_leaves)
	}
}