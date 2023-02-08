import { GAMERULES, TPS, version } from '../config.js'
import { players } from '../world/index.js'
import { Dimensions } from '../world/index.js'
import { chat, LIGHT_GREY, ITALIC, prefix } from './chat.js'
import { MOD, OP } from '../config.js'
import { Entities, Entity } from '../entities/entity.js'
import { World } from '../world/world.js'
import { stats } from '../internals.js'
import { Item, Items } from '../items/item.js'
import { DataWriter } from '../utils/data.js'

export function formatTime(t){
	t /= 1000
	if(t < 3600){
		if(t >= 60)return floor(t/60)+'m '+floor(t%60)+'s'
		else if(t >= 1)return floor(t)+'s'
		else return t*1000+'ms'
	}else{
		if(t < 86400)return floor(t/3600)+'h '+floor(t%3600/60)+'m'
		else if(t < 864000)return floor(t/86400)+'d '+floor(t%86400/3600)+'h'
		else return floor(t/86400)+'d'
	}
}

function log(who, msg){
	if(!GAMERULES.commandlogs)return
	chat(prefix(who, 1)+msg, LIGHT_GREY + ITALIC)
}

function selector(a, who){
	if(!a)throw 'Selector missing!'
	if(a[0] == '@'){
		if(a[1] == 's')return who instanceof Entity ? [who] : []
		if(a[1] == 'e')throw "@e unimplemented"
		const candidates = [...players.values()]
		if(!candidates.length)throw "No targets matched selector"
		if(a[1] == 'a')return candidates
		if(a[1] == 'p'){
			if(!who || who.clients)throw "No targets matched selector"
			const closest = candidates.winner(a => {
				if(a.world != who.world)return -Infinity
				const dx = a.x - who.x, dy = a.y - who.y
				return -(dx * dx + dy * dy)
			})
			return [closest]
		}
		if(a[1] == 'r')return [candidates[floor(random() * candidates.length)]]
	}else{
		const player = players.get(a)
		if(!player)throw "No targets matched selector"
		return [player]
	}
}

let stack = null
export function err(e){
	if(!e.stack)return e
	stack = e.stack
	return e + '\nType /stacktrace to view full stack trace'
}
export const commands = {
	list(){
		let a = "Online players"
		for(let pl of players.values())a += '\n' + pl.name + ' ('+pl.health+')'
		return a
	},
	say(s, ...l){
		if(!l.length)throw 'Command usage: /say <style> <text...>\nExample: /say lime-bold Hello!'
		let col = 0, txt = s.includes('raw') ? l.join(' ') : prefix(this, 1) + l.join(' ')
		for(let [m] of (s.match(/bold|italic|underline|strike/g)||[]))col |= (m > 'i' ? m == 'u' ? 64 : 128 : m == 'b' ? 16 : 32)
		col += s.match(/()black|()dark[-_]?red|()dark[-_]?green|()(?:gold|dark[-_]?yellow)|()dark[-_]?blue|()dark[-_]?purple|()dark[-_]?(?:aqua|cyan)|()(?:light[-_]?)?gr[ea]y|()dark[-_]?gr[ea]y|()red|()(?:green|lime)|()yellow|()blue|()purple|()(?:aqua|cyan)|$/).slice(1).indexOf('') & 15
		chat(txt, col)
	},
	tpe(a, b){
		if(!b)b = a, a = '@s'
		const players = selector(a, this)
		const [target, _] = selector(b, this)
		if(_ || !target)throw 'Selector must return exactly 1 target'
		const {x, y, world} = target
		for(const pl of players)pl.transport(x, y, world), pl.rubber()
		if(players.length>1)log(this, `Teleported ${players.length} entities to ${target.name}`)
		else log(this, `Teleported ${players[0].name} to ${target.name}`)
	},
	tp(a, x, y, d = this.world || 'overworld'){
		if(!y)y=x,x=a,a='@s'
		if(!x || !y)throw 'Invalid coordinates'
		if(typeof d == 'string')d = Dimensions[d]
		if(!(d instanceof World))throw 'Invalid dimension'
		const players = selector(a, this)
    if(x[0] == "^" && y[0] == "^"){
			x = (+x.slice(1))/180*PI - this.facing
			y = +y.slice(1);
			[x, y] = [this.x + sin(x) * y, this.y + cos(x) * y]
		}else{
			if(x[0] == "~")x = this.x + +x.slice(1)
			else x -= 0
			if(y[0] == "~")y = this.y + +y.slice(1)
			else y -= 0
		}
		if(x != x || y != y)throw 'Invalid coordinates'
		for(const pl of players)pl.transport(x, y, d), pl.rubber()
		if(players.length>1)log(this, `Teleported ${players.length} entities to (${x}, ${y}) in the ${d.id}`)
		else log(this, `Teleported ${players[0].name} to (${x}, ${y}) in the ${d.id}`)
	},
	kick(a, ...r){
		const reason = r.join(' ')
		let players = selector(a, this)
		if(players.length > 1 && this.sock.permissions < OP)throw 'Moderators may not kick more than 1 person at a time'
		for(const pl of players){
			pl.sock.send(reason ? '-12fYou were kicked for: \n'+reason : '-12fYou were kicked')
			pl.sock.close()
		}
	},
	give(sel, item, count = '1'){
		let itm = Items[item], c = max(count | 0, 0)
		if(!itm)throw 'No such item: '+item
		for(const player of selector(sel, this)){
			const stack = itm(c)
			player.give(stack)
			if(stack.count){
				const e = Entities.item(player.x, player.y)
				e.x = player.x; e.y = player.y; e.place(player.world)
			}
		}
	},
	clear(sel, _item, _max = '2147483647'){
		const Con = _item && Items[_item]?.constructor || Item
		let cleared = 0, es = 0
		for(const e of selector(sel, this)){
			let max = +_max
			const buf = new DataWriter()
			buf.byte(32)
			buf.uint32(e._id); buf.short(e._id / 4294967296 | 0)
			if(e.inv) for(let i = 0; max && i < e.inv.length; i++){
				const item = e.inv[i]
				if(!item || !(item instanceof Con)) continue
				buf.byte(i)
				if(item.count <= max)max -= item.count, e.inv[i] = null, buf.item(null)
				else item.count -= max, max = 0, buf.item(item)
			}
			if(e.items) for(let i = 0; max && i < e.items.length; i++){
				const item = e.items[i]
				if(!item || !(item instanceof Con)) continue
				buf.byte(i | 128)
				if(item.count <= max)max -= item.count, e.items[i] = null, buf.item(null)
				else item.count -= max, max = 0, buf.item(item)
			}
			cleared += +_max - max; es++
			e.emit(buf)
		}
		log(this, `Cleared a total of ${cleared} items from ${es} entities`)
	},
	help(c){
		const cmds = this.sock.permissions == MOD ? mod_help : this.sock.permissions == OP ? help : anyone_help
		if(!c){
			return 'Commands: /'+Object.keys(cmds).join(', /')+'\n/help '+cmds.help
		}else if(c in cmds){
			return Array.isArray(cmds[c]) ? cmds[c].map(a => '/' + c + ' ' + a).join('\n') : '/' + c + ' ' + cmds[c]
		}else{
			return 'No such command: /'+c
		}
	},
	stacktrace(){
		if(!stack)return 'No stack trace found...'
		console.warn(stack)
		return stack
	},
	time(time, d = this.world || 'overworld'){
		if(typeof d == 'string')d = Dimensions[d]
		if(!time){
			return `This dimension is on tick ${d.tick}\nThe day is ${floor((d.tick + 7000) / 24000)} and the time is ${floor((d.tick/1000+6)%24).toString().padStart(2,'0')}:${(floor((d.tick/250)%4)*15).toString().padStart(2,'0')}`
		}else if(time[0] == '+' || time[0] == '-'){
			let t = d.tick + +time
			if(t < 0)t = (t % 24000 + 24000) % 24000
			if(t != t)throw `'${time}' is not a valid number`
			d.tick = t
			return 'Set the time to '+t
		}else if(time[0] >= '0' && time[0] <= '9'){
			const t = +time
			if(!(t >= 0))throw `'${time}' is not a valid number`
			d.tick = t
			return 'Set the time to '+t
		}
		let t;
		switch(time){
			case 'day': t = 1800; break
			case 'noon': t = 6000; break
			case 'afternoon': t = 9000; break
			case 'sunset': t = 13800; break
			case 'night': t = 15600; break
			case 'midnight': t = 18000; break
			case 'dark': t = 22000; break
			case 'sunrise': t = 0; break
			default:
			throw "'invalid option: '"+time+"'"
		}
		t = (d.tick - t) % 24000
		if(t >= 12000)d.tick += (24000 - t)
		else d.tick -= t
		return 'Set the time to '+time
	},
	gamerule(a, b){
		if(!a){
			return 'List of gamerules:\n' + Object.entries(GAMERULES).map(([k, v]) => k + ': ' + typeof v).join('\n')
		}
		if(!b){
			if(!(a in GAMERULES)) throw 'No such gamerule: ' + a
			return 'Gamerule ' + a + ': ' + JSON.stringify(GAMERULES[a])
		}
		switch(typeof GAMERULES[a]){
			case 'boolean': if(b.toLowerCase() == 'true' || b == '1') GAMERULES[a] = true; else if(b.toLowerCase() == 'false' || b == '0') GAMERULES[a] = false; else throw 'Invalid boolean value: ' + b; break
			case 'number': const c = +b; if(c == c) GAMERULES[a] = c; else throw 'Invalid number value: ' + b; break
			case 'string': GAMERULES[a] = c; break
			default: throw 'No such gamerule: ' + a
		}
		return 'Set gamerule ' + a + ' to ' + JSON.stringify(GAMERULES[a])
	},
	info(){
		return `Vanilla server software ${version}\nUptime: ${formatTime(Date.now() - started)}, CPU: ${(stats.elu.cpu1*100).toFixed(1)}%, RAM: ${(stats.mem.cpu1/1048576).toFixed(1)}MB` + (this.age ? '\nYou have been in this server for: ' + formatTime(this.age * 1000 / TPS) : '')
	}
}

//Aliases
commands.i = commands.info

export const anyone_help = {
	help: '<cmd> -- Help for a command',
	list: '-- List online players'
}, mod_help = {
	...anyone_help,
	kick: '[player] -- Kick a player',
	say: '[style] [msg] -- Send a message in chat',
	tp: '[targets] [x] [y] (dimension) -- teleport someone to a dimension',
	tpe: '[targets] [destEntity]',
	time: ['+<amount> -- Add to time', '-<amount> -- Substract from time', '<value> -- Set time', '-- Get current time']
}, help = {
	...mod_help,
}
Object.setPrototypeOf(anyone_help, null)
Object.setPrototypeOf(mod_help, null)
Object.setPrototypeOf(help, null)