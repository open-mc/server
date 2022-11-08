import { World } from './world.js'
import { promises as fs, existsSync } from 'fs'
export const Dimensions = {
	overworld: new World('overworld'),
	nether: new World('nether'),
	end: new World('end')
}

for(let i in Dimensions){
	let {id} = Dimensions[i]
	if(existsSync(WORLD + 'chunks/' + id))continue
	fs.mkdir(WORLD + 'chunks/' + id)
}
export const allDimensions = Object.values(Dimensions)