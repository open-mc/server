import { Biomes } from '../vars.js'

Biomes.end = {
	surface: null, offset: 0, height: 64, deepsurface: null,
	offset(cx, cy){return (1.5-abs(cx))*((cy>=0)*40-32)},
	height(cx, cy){return (cy>=0)*18-16}
}