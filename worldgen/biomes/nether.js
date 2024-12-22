import { Biomes, Blocks } from '../util/vars.js'

Biomes.nether = {
	surface: null,
	deepsurface: null,
	offset(_,cy){
		const icy = cy - (cy = (cy+16&31)-16) << 6
		return (cy>=0)*960 - 640 + icy
	},
	height(_,cy){
		cy = (cy+16&31)-16
		return (cy<0?cy<-10?80:800:-400)
	}
}
Biomes.netheropensky = {
	...Biomes.nether,
	offset: -640,
	height(_,cy){return cy<-10?80:800}
}