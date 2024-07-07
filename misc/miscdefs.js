import { jsonToType, typeToJson } from '../modules/dataproto.js'
import { Chunk } from '../world/chunk.js'
import { World } from '../world/world.js'

const loaded = task('Loading misc defs...')

let modified = false
export let index
const list = await DB.get('miscindex').catch(e=>'{}').then(a=>(index = ''+a).split('\n'))
const classes = [World, Chunk]
for(let i = 0; i < classes.length; i++){
	if(i>=list.length) list.push('{}')
	const history = list[i].split(' ')
	const C = classes[i]
	let sd = typeToJson(C.savedata)
	if((history[history.length-1] || 'null') == sd){history.pop()}else{
		modified = true
		list[i] = history.length ? history.join(' ') + ' ' + sd : sd
	}
	C.savedatahistory = history.mutmap(jsonToType)
}
if(modified) await DB.put('miscindex', index = list.join('\n'))

loaded(`${list.length} Class savedatas loaded`)