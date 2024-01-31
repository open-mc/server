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
	else return map.get(end)
}

function oListToEntry(itms, flag = 0, set = null){
	if(!itms.length) return null
	const L = itms.length
	const end = 281474976710656*(flag<<1|1)+(L%3==1?itms.pop()+281474976645120:L%3==2?itms.pop()*65536+itms.pop()+281470681743360:itms.pop()*4294967296+itms.pop()*6553+itms.pop())
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
	oListToEntry(items.map(a=>a.id), 0, {output, count, leftovers})
}
function csrf(items, output, count = 1, leftovers = null){
	if(leftovers && leftovers.length != items.length) throw 'leftovers.length != items.length'
	oListToEntry(items.map(a=>a.id), 1, {output, count, leftovers})
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
	let match = null
	switch(size){
		case 9: match = oListToEntry([a.id,b.id,c.id,d.id,e.id,f.id,g.id,h.id,i.id], 0); break
		case 8: match = oListToEntry([a.id,b.id,d.id,e.id,g.id,h.id], 0); break
		case 7: match = oListToEntry([a.id,d.id,g.id], 0); break
		case 6: match = oListToEntry([a.id,b.id,c.id,d.id,e.id,f.id], 1); break
		case 5: match = oListToEntry([a.id,b.id,d.id,e.id], 0); break
		case 4: match = oListToEntry([a.id,d.id], 0); break
		case 3: match = oListToEntry([a.id,b.id,c.id], 1); break
		case 2: match = oListToEntry([a.id,b.id], 1); break
	}
	if(match) return match
	const l = size == 9 ? [0,0,0,0,0,0,0,0,0] : [0,0,0,0,0,0]; let j = 0
	if(a) l[j++] = a.id; if(b) l[j++] = b.id; if(c) l[j++] = c.id
	if(d) l[j++] = d.id; if(e) l[j++] = e.id; if(f) l[j++] = f.id
	if(g) l[j++] = g.id; if(h) l[j++] = h.id; if(i) l[j++] = i.id
	l.length = j
	return uListToEntry(l)
}