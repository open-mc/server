import { BlockIDs } from '../blocks/block.js'
import { chat, ITALIC, LIGHT_GREY, prefix } from './chat.js'
import { anyone_help, commands, err, mod_help } from './commands.js'
import { MOD } from '../config.js'
import { entityMap } from '../entities/entity.js'

const REACH = 10

function playerMovePacket(player, buf){
	if(buf.byte() != player.r)return
	player.move(buf.double(), buf.double())
	player.state = buf.short()
	player.dx = buf.float(); player.dy = buf.float(); player.f = buf.float()
	player.selected = buf.byte()
}

function setBlockPacket(player, buf){
	const x = buf.int(), y = buf.int()
	const block = BlockIDs[buf.short()]
	if(!block)return
	player.world.put(x, y, block())
}


function openContainerPacket(player, buf){
	const x = buf.int(), y = buf.int()
	player.world.at(x, y, player)
}
function openEntityPacket(player, buf){
	const bufferStart = buf.i - 1
	const e = entityMap.get(buf.int() + buf.short() * 4294967296)
	const id = buf.byte()
	const dx = e.x - player.x, dy = e.y - player.y
	if(dx * dx + dy * dy > (REACH + 2) * REACH || !e.chunk.players.includes(player)) return
	player.interface = e
	player.interfaceId = id
	player.sock.send(!bufferStart ? buf : new Uint8Array(buf.buffer, buf.byteOffset + bufferStart, buf.byteLength))
}

export const codes = Object.assign(new Array(256), {
	4: playerMovePacket,
	8: setBlockPacket,
	12: openContainerPacket,
	13: openEntityPacket,
	15(player, _){player.interface = null}
})
export function onstring(player, text){
	if(!(text = text.trimEnd())) return
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