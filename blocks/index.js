//import all block files
import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../utils/data.js'
import { BlockIDs, Blocks, Block } from './block.js'
// Monstrosity for importing all ./*/*.js
await Promise.all((await fs.readdir(PATH + 'blocks/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'blocks/' + name).then(a => Promise.all(a.map(file => import(PATH + 'blocks/' + name + '/' + file))))))
let modified = false
export let blockindex
for(const a of await fs.readFile(WORLD + 'defs/blockindex.txt').then(a=>(blockindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	let block = Blocks[name]
	if(!block){BlockIDs.push(Blocks.air);continue}
	let sd = typeToJson(block.savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	block.savedatahistory = history.mutmap(jsonToType)
	block.id = BlockIDs.length
	BlockIDs.push(null)
}
for(const i in Blocks){
	const B = Blocks[i]
	if(Object.hasOwn(B.prototype, 'prototype')){ console.warn('Reused class for ' + B.prototype.className + ' (by ' + i + ')'); continue }
	Object.defineProperty(B, 'name', {value: i})
	// Force extend
	if(!(B.prototype instanceof Block)){
		console.warn('Class ' + i + ' does not extend Block\n')
		Object.setPrototypeOf(B, Block)
		Object.setPrototypeOf(B.prototype, Block.prototype)
	}
	const shared = new B
	BlockIDs[B.id] = Blocks[i] = B.savedata ? () => new B : Function.returns(shared)
	// Copy static props to prototype
	// This will also copy .prototype, which we want
	const desc = Object.getOwnPropertyDescriptors(B)
	delete desc.length; delete desc.name; desc.className = {value: i, enumerable: false, writable: false}; desc.constructor = {value: Blocks[i], enumerable: false, writable: false}
	Object.defineProperties(B.prototype, desc)
	if(B.id < 0) B.id = BlockIDs.length, BlockIDs.push(null), modified = true
	Object.setPrototypeOf(Blocks[i], B.prototype)
	Object.defineProperties(Blocks[i], Object.getOwnPropertyDescriptors(shared))
}
if(modified){
	await fs.writeFile(WORLD + 'defs/blockindex.txt', blockindex = BlockIDs.map(def => def.className + def.savedatahistory.map(a=>' '+typeToJson(a)).join('') + (def.savedata ? ' ' + typeToJson(def.savedata) : '')).join('\n'))
}