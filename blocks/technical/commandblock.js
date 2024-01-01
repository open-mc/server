import { Block, Blocks } from "../block.js"

Blocks.command_block = class CommandBlock extends Block{
	type = 0
	commands = []
	static savedata = {
		type: Uint8,
		commands: [[String]]
	}
	static breaktime = Infinity
	static tool = 'pick'
	static blast = 2147483647
}