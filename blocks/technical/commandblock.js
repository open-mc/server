import { antWorld, getX, getY } from "../../misc/ant.js"
import { executeCommand } from "../../misc/_commands.js"
import { Block, Blocks } from "../block.js"

Blocks.command_block = class CommandBlock extends Block{
	// 0 = impulse
	// 1 = impulse inversed
	// 2 = repeating
	// 3 = repeating needs redstone
	// 4 = callable
	// 5 = callable once per tick
	type = 0
	commands = []
	static savedata = {
		type: Uint8,
		commands: [[[String]]]
	}
	static breaktime = Infinity
	static tool = 'pick'
	static blast = 2147483647
	update(a){
		if(this.type == 2){
			const ctx = {x: getX()+.5, y: getY(), world: antWorld, name: '!', sock: {perms: 4}}
			for(const group of this.commands) execGroup(group, ctx).catch(e => null)
			return a
		}
	}
	interact(_, player){
		player.openInterface(this, 0)
		return 0
	}
}

async function execGroup(group, ctx){
	for(const command of group){
		executeCommand(command[0], command.slice(1), ctx, 4)
	}
}