import fs from 'fs/promises'
import { jsonToType, typeToJson } from '../utils/data.js'
//import all item files
import { ItemIDs, Items } from './item.js'
await Promise.all((await fs.readdir(PATH + 'items/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'items/' + name).then(a => Promise.all(a.map(file => import(PATH + 'items/' + name + '/' + file))))))
let modified = false
let itemindex
for(const a of await fs.readFile(WORLD + 'defs/itemindex.txt').then(a=>(itemindex = a+'').split('\n'))){
	let [name, ...history] = a.split(' ')
	let item = Items[name]
	if(!item){ItemIDs.push(Items.stone);continue}
	let sd = typeToJson(item._.savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	for(const h of history)item._.savedatahistory.push(jsonToType(h))
	ItemIDs.push(item)
}
for(let j=0;j<ItemIDs.length;j++)ItemIDs[j]._.id = j
for(let i in Items){
	Items[i]._.name = i
	if(Items[i]._.id<0){
		Items[i]._.id = ItemIDs.length
		ItemIDs.push(Items[i])
		modified = true
	}
}
if(modified){
	await fs.writeFile(WORLD + 'defs/itemindex.txt', itemindex = ItemIDs.map(({_})=>_.name + ' ' + _.savedatahistory.map(a=>typeToJson(a)+' ').join('') + (_.savedata ? typeToJson(_.savedata) : '')).join('\n'))
}