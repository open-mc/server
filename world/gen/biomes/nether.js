import { Biomes, Blocks } from "../vars.js"

Biomes.nether = {
	surface: null,
	offset: -640,
	height: 800,
	deepsurface: null
}

Biomes.netherinverted = {
	...Biomes.nether,
	offset: 320,
	height: -400
}

Biomes.netherfloor = {
	...Biomes.nether,
	offset: -640,
	height: 80
}