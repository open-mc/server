const shapelessRecipes = new Map()
const shapedRecipes = new Map()

function uListToEntry(list, set = null){
	if(!list.length) return null
	const itms = [list[0].id]
	for(let i = 1; i < list.length; i++){
		let j = 0; const itm = list[i].id
		while(j<itms.length&&itms[j]<itm) j++;
		itms.splice(j, 0, itm)
	}
	let i = 0, j = 0
	const L = itms.length
	const end = 281474976710656+(L%3==1?itms.pop()+281474976645120:L%3==2?itms.pop()*65536+itms.pop()+281470681743360:itms.pop()*4294967296+itms.pop()*6553+itms.pop())
	let map = shapelessRecipes
	for(let i = 0;i<L-1;i+=3){
		const key = itms[i]+itms[i+1]*65536+itms[i+2]*4294967296
		const m = map.get(key)
		m ? map = m : map.set(key, map = m)
	}
	if(set) return map.set(end, set), set
	else return map.get(end)
}

function uListToEntry(list, set = null){
	if(!list.length) return null
	const itms = [list[0].id]
	for(let i = 1; i < list.length; i++){
		let j = 0; const itm = list[i].id
		while(j<itms.length&&itms[j]<itm) j++;
		itms.splice(j, 0, itm)
	}
	let i = 0, j = 0
	const L = itms.length
	const end = 281474976710656+(L%3==1?itms.pop()+281474976645120:L%3==2?itms.pop()*65536+itms.pop()+281470681743360:itms.pop()*4294967296+itms.pop()*6553+itms.pop())
	let map = shapelessRecipes
	for(let i = 0;i<L-1;i+=3){
		const key = itms[i]+itms[i+1]*65536+itms[i+2]*4294967296
		const m = map.get(key)
		m ? map = m : map.set(key, map = m)
	}
	if(set) return map.set(end, set), set
	else return map.get(end)
}

export function createShapelessRecipe(items, output, count = 1, leftovers){
	if(leftovers.length > items.length) throw 'leftovers.length > items.length'
	uListToEntry(items, {output, count, leftovers})
}

export function createShaped2x2Recipe(items, output, count = 1, leftovers){
	if(items.length != 4) throw 'items.length != 4'
}

export function createShaped3x3Recipe(items, output, count = 1, leftovers){
	if(items.length != 9) throw 'items.length != 9'
}

export function getRecipe(items){
	return null
}