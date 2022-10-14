//terrain shape, ores, caves
//3479348553, 1397169014
export function imxs32_2(x, y, h = 2570712328, i = 4048968661){
	let g = seed ^ (Math.imul(x, h) + Math.imul(y, i))
	g ^= g << 13
	g ^= g >> 7
	g ^= g << 17
	return g
}

export function imxs32(g, h = 1937311086){
	g = seed ^ Math.imul(g, h)
	g ^= g << 13
	g ^= g >> 7
	g ^= g << 17
	return g
}