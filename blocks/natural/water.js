import { Block, Blocks } from '../block.js'
import { fluidify } from '../fluid.js'

class Water extends Block{
	static solid = false
	static replacable = true
	static climbable = true
	static viscosity = 0.15
}
void({
	filled: Blocks.water,
	top: Blocks.waterTop,
	flowing: Blocks.waterFlowing
} = fluidify(Water))

class Lava extends Water{
	static viscosity = 0.5
}
void({
	filled: Blocks.lava,
	top: Blocks.lavaTop,
	flowing: Blocks.lavaFlowing
} = fluidify(Lava))