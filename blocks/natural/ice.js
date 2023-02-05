import { Block, Blocks } from '../block.js'

class Ice extends Block{
	drops(){return []}
}
Blocks.ice = Ice

Blocks.packed_ice = class PackedIce extends Ice{

}