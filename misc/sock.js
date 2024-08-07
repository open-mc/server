import { Dimensions, players, PERMISSIONS, GAMERULES, stat } from '../world/index.js'
import { chat } from './chat.js'
import { entityindex } from '../entities/index.js'
import { itemindex } from '../items/index.js'
import { blockindex } from '../blocks/index.js'
import { index } from '../misc/miscdefs.js'
import { DataReader, DataWriter } from '../modules/dataproto.js'
import { playerLeft, playerLeftQueue, queue } from './queue.js'
import { Entities, EntityIDs, newId } from '../entities/entity.js'
import { Items } from '../items/item.js'
import { actualTPS, currentTPS } from '../world/tick.js'

function sendTabMenu(encodePlayers = false){
	const buf = new DataWriter()
	buf.byte(4)
	buf.string('\\1fYou are playing on '+(host||'localhost'))
	buf.string(`\\0${actualTPS>=currentTPS*0.8?'a':actualTPS>=currentTPS/2?'b':'9'}TPS: ${actualTPS.toFixed(2)}`)
	if(encodePlayers){
		buf.flint(players.size)
		for(const pl of players.values()){
			buf.string(pl.name)
			if(pl.skin){
				for(let i = 396; i < 1068; i += 84)
					buf.uint8array(new Uint8Array(pl.skin.buffer, pl.skin.byteOffset + i, 24), 24)
			}else for(let i = 0; i < 24; i++) buf.double(0)
			buf.byte(pl.health)
			buf.short(Math.min(65535, pl.sock.pingTime))
		}
	}
	const b = buf.build()
	for(const pl of players.values()) pl.sock.send(b)
}

setInterval(sendTabMenu, 2000)

export const playersLevel = DB.sublevel('players', {valueEncoding: 'binary'})
export const playersConnecting = new Set
const indexCompressed = deflate(blockindex + '\0' + itemindex + '\0' + entityindex + '\0' + index + '\0' + (CONFIG.components||['/vanilla/index.js']).join('\0'))
export async function open(){
	this.state = 2
	if(playersConnecting.has(this.username)){
		this.end(1000, '\\19You are still logging in/out from another session')
		throw 'Connect / disconnect shamble'
	}
	if(CONFIG.maxplayers && players.size + playersConnecting.size >= CONFIG.maxplayers){
		if(await queue(this)) return
		if(!this.state) return
	}
	this.state = 1; this.send(indexCompressed)
	let perms = PERMISSIONS[this.username] ?? CONFIG.permissions.default
	if(perms*1000 > Date.now()){
		this.end(1000, perms >= 2147483647 ? '\\19You are permanently banned from this server':'\\19You are banned from this server for '
			+ Date.formatTime(perms*1000-Date.now())+(CONFIG.ban_appeal_info?'\nBan appeal: '+CONFIG.ban_appeal_info:''))
		return
	}else if(perms == 0)
		return this.end(1000, '\\1fYou are not invited to play on this server')
	else if(perms > 9){ perms = CONFIG.permissions.default }
	playersConnecting.add(this.username)
	let player, other = players.get(this.username)
	let link = true
	this.mode = 0
	if(other){
		other.unlink()
		other.sock.entity = null
		other.sock.end(1000, '\\19You are logged in from another session')
		other.sock = null
		other._world = null
		perms = other.perms; this.mode = other.mode
		player = other
		playersConnecting.delete(this.username)
	}else try{
		const buf = new DataReader(await playersLevel.get(this.username))
		playersConnecting.delete(this.username)
		if(!this.state) return
		other = null
		let id = buf.short()
		if(id===65535) id = buf.short(), link = false
		player = new EntityIDs[id]()
		player.x = buf.double(); player.y = buf.double()
		player.world = Dimensions[buf.string()]
		player._state = player.state = buf.short()
		player._dx = player.dx = buf.float(); player.dy = player.dy = buf.float()
		player.f = player.f = buf.float(); player.age = buf.double()
		buf.read(player.savedatahistory[buf.flint()] || player.savedata, player)
		if(buf.left) this.mode = buf.byte()
	}catch{
		player = new Entities.player()
		player.x = GAMERULES.spawnx; player.y = GAMERULES.spawny
		player.world = Dimensions[GAMERULES.spawnworld]
		player.inv[0] = new Items.stone(20)
		player.inv[1] = new Items.oak_log(20)
		player.inv[2] = new Items.oak_planks(20)
		player.inv[3] = new Items.tnt(10)
		player.inv[4] = new Items.flint_and_steel()
		player.inv[5] = new Items.obsidian(64)
		player.inv[6] = new Items.grass(32)
		player.inv[7] = new Items.diamond_pickaxe()
		player.inv[8] = new Items.diamond_shovel()
		player.inv[9] = new Items.netherrack(10)
		player.inv[10] = new Items.sandstone(10)
		stat('misc', 'unique_players')
		playersConnecting.delete(this.username)
		link = !CONFIG.permissions.join_as_spectator
	}
	const now = Date.now()
	if(Object.hasOwn(player, 'skin')) player.skin = this.skin
	player._avatar = null
	player.sock = this
	player.name = this.username
	this.perms = perms
	this.movePacketCd = now / 1000 - 1
	this.joinedAt = now
	this.r = 255
	this.rx = CONFIG.socket.movement_check_mercy
	this.ry = CONFIG.socket.movement_check_mercy
	this.entity = player
	this.netId = player.netId
	this.packets = []
	this.interface = null; this.interfaceId = 0
	this.interfaceD = null
	this.send(configPacket())
	if(link) player.link()
	else this.netId = newId(), player.rubber(127)
	players.set(this.username, player)
	this.tbuf = new DataWriter()
	this.ebuf = new DataWriter()
	this.ibuf = null; this.ibufLastA = 0; this.ibufLastB = NaN
	this.ebuf.byte(20)
	this.tbuf.byte(8)
	sendTabMenu(true)
	this.bigintOffsetX = 0n
	this.bigintOffsetY = 0n
	if(!other){
		stat('misc', 'sessions')
		chat('\\+b' + this.username + (other === null ? ' joined the game' : ' joined the server'))
	}
}

export async function close(){
	const state = this.state; this.state = 0
	if(state == 2) return playerLeftQueue(this)
	const {entity} = this
	if(!entity) return
	entity.closeInterface()
	if(entity.sock && entity.sock != this) return
	players.delete(this.username)
	playersConnecting.add(this.username)
	const buf = new DataWriter()
	if(!entity.linked) buf.short(65535)
	buf.short(entity.id)
	buf.double(entity.x)
	buf.double(entity.y)
	buf.string(entity.world?.id ?? 'overworld')
	buf.short(entity.state)
	buf.float(entity.dx)
	buf.float(entity.dy)
	buf.float(entity.f)
	buf.double(entity.age)
	buf.flint(entity.savedatahistory.length), buf.write(entity.savedata, entity)
	if(!exiting) chat('\\+b' + entity.name + ' left the game')
	buf.byte(this.mode)
	await playersLevel.put(this.username, buf.build())
	playersConnecting.delete(this.username)
	if(entity.world) entity.remove()
	sendTabMenu()
	playerLeft()
}

function configPacket(d = new DataWriter()){
	d.byte(5)
	d.float(typeof CONFIG.proximity_chat != 'number' ? Infinity : CONFIG.proximity_chat)
	return d.build()
}

configLoaded(() => {
	const p = configPacket()
	for(const s of players.values()) s.sock.send(p)
})