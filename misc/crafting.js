const shapelessRecipes = new Map()
const shapedRecipes = new Map()

function uListToEntry(itms, set = null){
	if(!itms.length) return null
	itms.sort((a,b)=>a-b)
	const L = itms.length
	const end = 281474976710656+(L%3==1?itms.pop()+281474976645120:L%3==2?itms.pop()*65536+itms.pop()+281470681743360:itms.pop()*4294967296+itms.pop()*6553+itms.pop())
	let map = shapelessRecipes
	for(let i = 0;i<L-1;i+=3){
		const key = itms[i]+itms[i+1]*65536+itms[i+2]*4294967296
		const m = map.get(key)
		m ? map = m : map.set(key, map = new Map)
	}
	if(set) return map.set(end, set), set
	else return map.get(end) ?? null
}

function oListToEntry(itms, flag = 0, set = null){
	if(!itms.length) return null
	const L = itms.length
	const end = 281474976710656*(flag<<2|L%3)+(L%3==1?itms.pop()+281474976645120:L%3==2?itms.pop()*65536+itms.pop()+281470681743360:itms.pop()*4294967296+itms.pop()*6553+itms.pop())
	let map = shapedRecipes
	for(let i = 0;i<L-1;i+=3){
		const key = itms[i]+itms[i+1]*65536+itms[i+2]*4294967296
		const m = map.get(key)
		m ? map = m : map.set(key, map = new Map)
	}
	if(set) return map.set(end, set), set
	else return map.get(end)
}

export function createShapelessRecipe(items, output, count = 1, leftovers = null){
	if(leftovers && leftovers.length > items.length) throw 'leftovers.length > items.length'
	uListToEntry(items.map(a=>a.id), {output, count, leftovers})
}

function csr(items, output, count = 1, leftovers = null){
	if(leftovers && leftovers.length != items.length) throw 'leftovers.length != items.length'
	oListToEntry(items.map(a=>a?a.id:65535), 0, {output, count, leftovers})
}
function csrf(items, output, count = 1, leftovers = null){
	if(leftovers && leftovers.length != items.length) throw 'leftovers.length != items.length'
	oListToEntry(items.map(a=>a?a.id:65535), 1, {output, count, leftovers})
}
export const createShaped1x2Recipe = csr
export const createShaped1x3Recipe = csr
export const createShaped2x2Recipe = csr
export const createShaped2x3Recipe = csr
export const createShaped3x3Recipe = csr
export const createShaped2x1Recipe = csrf
export const createShaped3x1Recipe = csrf
export const createShaped3x2Recipe = csrf

export function getOutput({0:a,1:b,2:c,3:d,4:e,5:f,6:g,7:h,8:i}){
	let size = 9
	if(!a&&!b&&!c){
		if(!d&&!e&&!f){ a=g;b=h;c=i; size -= 6 }
		else{ a=d;b=e;c=f;d=g;e=h;f=i; size -= d||e||f?3:6 }
	}else size -= (g||h||i?0:d||e||f?3:6)
	if(!a&&!d&&!g){
		if(!b&&!e&&!h){ a=c;d=f;g=i; size -= 2 }
		else{ a=b;d=e;g=h;b=c;e=f;h=i; size -= b||e||h?1:2 }
	}else size -= (c||f||i?0:b||e||h?1:2)
	if(!a) return null
	let match = null
	switch(size){
		case 9: match = oListToEntry([a.id,b?.id??65535,c?.id??65535,d?.id??65535,e?.id??65535,f?.id??65535,g?.id??65535,h?.id??65535,i?.id??65535], 0); break
		case 8: match = oListToEntry([a.id,b?.id??65535,d?.id??65535,e?.id??65535,g?.id??65535,h?.id??65535], 0); break
		case 7: match = oListToEntry([a.id,d?.id??65535,g?.id??65535], 0); break
		case 6: match = oListToEntry([a.id,b?.id??65535,c?.id??65535,d?.id??65535,e?.id??65535,f?.id??65535], 1); break
		case 5: match = oListToEntry([a.id,b?.id??65535,d?.id??65535,e?.id??65535], 0); break
		case 4: match = oListToEntry([a.id,d?.id??65535], 0); break
		case 3: match = oListToEntry([a.id,b?.id??65535,c?.id??65535], 1); break
		case 2: match = oListToEntry([a.id,b?.id??65535], 1); break
	}
	if(match) return match
	const l = size == 9 ? [a.id,0,0,0,0,0,0,0,0] : [a.id,0,0,0,0,0]; let j = 0
	if(b&&(size%3>1)) l[j++] = b.id; if(c&&(size%3>2)) l[j++] = c.id
	if(d&&size>3) l[j++] = d.id; if(e&&(size>4&&size!=7)) l[j++] = e.id
	if(f&&(size==6||size==9)) l[j++] = f.id; if(g&&size>6) l[j++] = g.id
	if(h&&(size>7)) l[j++] = h.id; if(i&&size==9) l[j++] = i.id
	l.length = j
	return uListToEntry(l)
}
export function getOutput4({0:a,1:b,2:c,3:d}){
	let size = 4
	if(!a&&!b) a=c, b=d, size -= 2 
	else if(!c&&!d) size -= 2
	if(!a&&!c) a=b, c=d, size--
	else if(!b&&!d) size--
	if(!a) return null
	let match = null
	switch(size){
		case 4: match = oListToEntry([a.id,b?.id??65535,c?.id??65535,d?.id??65535], 0); break
		case 3: match = oListToEntry([a.id,c?.id??65535], 0); break
		case 2: match = oListToEntry([a.id,b?.id??65535], 1); break
	}
	return match || uListToEntry(size==4?d?b?c?[a.id,b.id,c.id,d.id]:[a.id,b.id,d.id]:c?[a.id,c.id,d.id]:[a.id,d.id]:[a.id,b.id,c.id]:size==3?[a.id,c.id]:size==2?[a.id,b.id]:[a.id])
}


export const smeltMap = new Map

export function createSmeltRecipe(item, output, xp = 0){
	smeltMap.set(item.id, {output, xp})
}