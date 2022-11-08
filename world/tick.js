import { Chunk } from './chunk.js'
import { allDimensions, Dimensions } from './dimensions.js'


export function tick(){
	for(const d of allDimensions)
		for(const v of Dimensions[d].values()){
			if(!(v instanceof Chunk))continue
			d.check(v)
		}
}

let tickTimer = null
export function setTPS(a){
	clearInterval(tickTimer)
	tickTimer = setInterval(tick, 1 / a - 1)
}