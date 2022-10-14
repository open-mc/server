import { fs } from '../internals.js'
import { jsonToType, typeToJson } from '../utils/data.js'
//import all entity files
import { Entities, EntityIDs } from './entity.js'
await Promise.all((await fs.readdir(PATH + 'entities/', {withFileTypes: true})).filter(a=>a.isDirectory()).map(({name}) => fs.readdir(PATH + 'entities/' + name).then(a => Promise.all(a.map(file => import(PATH + 'entities/' + name + '/' + file))))))
let modified = false
export let entityindex
for(const a of await fs.readFile(WORLD + 'defs/entityindex.txt').then(a=>(entityindex = ''+a).split('\n'))){
	let [name, ...history] = a.split(' ')
	let entity = Entities[name]
	if(!entity){EntityIDs.push(Entities.player);continue}
	let sd = typeToJson(entity._._savedata)
	if(history[history.length-1] == sd){history.pop()}else if(sd != 'null'){modified = true}
	entity._._savedatahistory = history.map(jsonToType)
	EntityIDs.push(entity)
}

for(let j=0;j<EntityIDs.length;j++)EntityIDs[j]._.id = j
for(let i in Entities){
	Entities[i]._.name = i
	if(Entities[i]._.id<0){
		Entities[i]._.id = EntityIDs.length
		EntityIDs.push(Entities[i])
		modified = true
	}
}
if(modified){
	await fs.writeFile(WORLD + 'defs/entityindex.txt', entityindex = EntityIDs.map(({_})=>_.name + (_._savedatahistory.length ? _._savedatahistory.slice(0,-1).map(a=>' '+typeToJson(a)).join('') : (_._savedata ? ' '+typeToJson(_._savedata) : ''))).join('\n'))
}