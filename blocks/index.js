//import all block files
import { fs } from '../internals.js'
import { jsonToType, typeToJson } from '../utils/data.js'
import {BlockIDs, Blocks} from './block.js'
await Promise.all((await fs.readdir(PATH + 'blocks/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'blocks/' + name).then(a => Promise.all(a.map(file => import(PATH + 'blocks/' + name + '/' + file))))))
let modified = false
export let blockindex
for(const a of await fs.readFile(WORLD + 'defs/blockindex.txt').then(a=>(blockindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	let block = Blocks[name]
	if(!block){BlockIDs.push(Blocks.air);continue}
	let sd = typeToJson(block._._savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	block._._savedatahistory = history.map(jsonToType)
	BlockIDs.push(block)
}
for(let j=0;j<BlockIDs.length;j++)BlockIDs[j]._.id = j
for(let i in Blocks){
	Blocks[i]._.name = i
	if(Blocks[i]._.id<0){
		Blocks[i]._.id = BlockIDs.length
		BlockIDs.push(Blocks[i])
		modified = true
	}
}
if(modified){
	await fs.writeFile(WORLD + 'defs/blockindex.txt', blockindex = BlockIDs.map(({_})=>_.name + (_._savedatahistory.length ? _._savedatahistory.map(a=>' '+typeToJson(a)).join('') + ' '+typeToJson(_._savedata) : (_._savedata ? ' '+typeToJson(_._savedata) : ''))).join('\n'))
}