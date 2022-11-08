import { Block, Blocks } from '../block.js'

const ICE = {
	drops(){return []}
}
Blocks.ice = Block.define({...ICE})
Blocks.packed_ice = Block.define({...ICE})