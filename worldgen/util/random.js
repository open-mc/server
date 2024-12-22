let a = 0, b = 0, c = 0, d = 0
export const setPartialSeed = (a1, b1, c1, d1) => { a = a1; b = b1; c = c1; d = d1 }

// If you know the original name of these functions please edit this comment!
export function hash2(a, b){
	let x = a ^ imul(b, 1597334673)
	x = imul(x, 0x7feb352d)
	x = x ^ (x >> 15)
	return imul(x, 0x846ca68b)
}
export const utof = v => v*.0000000004656612873
export function hash3(a, b, c){
	let x = a ^ imul(b, 1597334673)
	x = imul(x, 0x7feb352d)
	x = x ^ (x >> 15) ^ imul(c, 3812015801)
	x = imul(x, 0xbce6059f)
	x = x ^ (x >> 8)
	return imul(x, 0x846ca68b)
}

// Horner's method
export function hashCode(str){
	let x = 0
	for(let i = 0; i < str.length; i++)
		x = x*31 + str.charCodeAt(i) | 0
	return x
}
const lerp = x => (3-2*x)*x*x
const used = {__proto__:null}, getHash = (n,t) => {
	const u = used[t] ??= new Map()
	const h = hashCode(n)
	if(u.has(h)) console.warn(t+' %s has the same hash as %s (0x%s)', n, u.get(h), h.toString(16).padStart(8, '0'))
	u.set(h, n)
	return h
}
export const Noise1D = (name, period = 256) => {
	if(period != (period = 1<<31-clz32(period))) throw 'Period must be a power of 2!'
	const h = getHash(name,'Noise1D'), i_period = 1/period
	const p1 = period>>1, p2 = p1>>1, p3 = p2>>1, p4 = p3>>1
	return x => {
		const x0 = x+p1&-period, x1 = x+p2&-p1, x2 = x+p3&-p2, x3 = x+p4&-p3
		const l0 = utof(hash2(h^a, x0)), r0 = utof(hash2(h^a, x0+period|0))
		const l1 = utof(hash2(h^b, x1)), r1 = utof(hash2(h^b, x1+p1|0))
		const l2 = utof(hash2(h^c, x2)), r2 = utof(hash2(h^c, x2+p2|0))
		const l3 = utof(hash2(h^d, x3)), r3 = utof(hash2(h^d, x3+p3|0))
		return (l0 + lerp((x+p1-x0)*i_period)*(r0-l0))*.533 + (l1 + lerp((x+p2-x1)*i_period*.5)*(r1-l1))*.267
			+ (l2 + lerp((x+p3-x2)*i_period*.25)*(r2-l2))*.133 + (l3 + lerp((x+p4-x3)*i_period*.125)*(r3-l3))*.067
	}
}
export const LowNoise1D = (name, period = 256) => {
	if(period != (period = 1<<31-clz32(period))) throw 'Period must be a power of 2!'
	const h = getHash(name,'LowNoise1D'), i_period = 1/period
	const p1 = period>>1
	return x => {
		const x0 = x+p1&-period
		const l0 = utof(hash2(h^a, x0)), r0 = utof(hash2(h^a, x0+period|0))
		return (l0 + lerp((x+p1-x0)*i_period)*(r0-l0))
	}
}

export const Rng1D = (name) => {
	const h = getHash(name, 'Rng1D')
	return x => hash2(h^a^b, x)
}
export const Rng2D = (name) => {
	const h = getHash(name, 'Rng2D')
	return (x, y) => hash3(h^a^b, x, y)
}