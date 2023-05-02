import { veins } from "../ores.js";
import { fill } from "../util/perlin.js";
import { imxs32_2 } from "../util/random.js";
import { Blocks, chunk } from "../vars.js";

export default function(cx, cy){
	fill(cx, cy, Blocks.netherrack, Blocks.lava, -10)
	let rand = imxs32_2(cx, cy, -1377466049, -676095574)
	rand = veins(rand, Blocks.quartz_ore, 3, 5, Blocks.netherrack)
}