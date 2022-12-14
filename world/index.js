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

export const players = new Map()
players[Symbol.for('nodejs.util.inspect.custom')] = function(){
	let a = '\x1b[32m' + this.size + '\x1b[m player'+(this.size==1?'':'s')+':'
	for(let pl of this){
		a += '\n' + pl[1]
	}
	return a
}