import { Block, Blocks } from "../block.js";

const ICE = {
	drops(){return []}
}
Blocks.ice = new Block({...ICE})
Blocks.packed_ice = new Block({...ICE})