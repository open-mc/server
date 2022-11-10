import { BlockIDs } from '../blocks/block.js'
import { chat, prefix } from './chat.js'
import { anyone_help, commands, err, mod_help } from './commands.js'
import { MOD } from '../config.js'
function playerMovePacket(player, buf){
	if(buf.byte() != player.r)return
	player.move(buf.double(), buf.double())
	player.dx = buf.float(); player.dy = buf.float(); player.f = buf.float()
}

function setBlockPacket(player, buf){
	const x = buf.int(), y = buf.int()
	const block = BlockIDs[buf.short()]
	if(!block)return
	player.world.put(x, y, block())
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	8: setBlockPacket
})
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
			player.chat(err(e), 9)
		}
	}else chat(prefix(player)+text)
}