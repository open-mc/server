import { BlockIDs } from '../blocks/block.js'
import { chat, prefix } from './chat.js'
import { anyone_help, commands, mod_help } from './commands.js'
import { MOD } from '../config.js'
function playerMovePacket(player, {x, y, r, dx, dy, f}){
	if(r != player.r)return
	player.tp(x, y)
	player.dx = dx; player.dy = dy; player.f = f
}
playerMovePacket.type = {
	r: Byte,
	x: Double, y: Double,
	dx: Float, dy: Float,
	f: Float
}

function setBlockPacket(player, {x, y, id}){
	const block = BlockIDs[id]
	if(!block)return
	player.world.put(x, y, block())
}
setBlockPacket.type = {
	x: Int,
	y: Int,
	id: Short
}


export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	8: setBlockPacket
})

export const types = codes.map(a => a.type)

export function string(player, text){
	if(text[0] == '/'){
		try{
			let args = text.slice(1).match(/"(?:[^\\"]|\\.)*"|[^"\s]\S*|"/g).map((a,i)=>{
				try{return a[0]=='"'?JSON.parse(a):a}catch(e){throw 'Failed parsing argument '+i}
			})
			if(!(args[0] in commands))throw 'No such command: /'+args[0]
			if(player.permissions < MOD){
				if(!anyone_help[args[0]])throw "You do not have permission to use /"+args[0]
			}else if(player.permission == MOD && !mod_help[args[0]])throw "You do not have permission to use /"+args[0]
			let res = commands[args[0]].apply(player, args.slice(1))
			res && player.chat(res)
		}catch(e){
			player.chat(e, 9)
		}
	}else chat(prefix(player)+text)
}