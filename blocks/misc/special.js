import { breakBlock, peekdown, peekup } from "../../misc/ant.js"
import { Block, Blocks } from "../block.js"

Blocks.portal = class extends Block{
	update(){
		const d = peekdown(), u = peekup()
		if((d != Blocks.obsidian & d != Blocks.portal) | (u != Blocks.obsidian & u != Blocks.portal)){
			breakBlock()
		}
	}
}