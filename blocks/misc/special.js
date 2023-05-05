import { peekdown, peekup } from "../../misc/ant.js"
import { Block, Blocks } from "../block.js"

Blocks.portal = class extends Block{
	static solid = false
	update(){
		const d = peekdown(), u = peekup()
		if((d != Blocks.obsidian & d != Blocks.portal) | (u != Blocks.obsidian & u != Blocks.portal)){
			this.destroy(true, undefined)
		}
	}
}