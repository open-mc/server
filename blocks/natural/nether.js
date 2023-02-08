import { Items } from "../../items/item.js";
import { Block, Blocks } from "../block.js";

Blocks.netherrack = class Netherrack extends Block{
	static breaktime = 2
	drops(i){ return Items.netherrack(1) }
	static tool = 'pick'
}