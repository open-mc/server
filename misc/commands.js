import { GAMERULES } from "../config.js"
import { players } from "../index.js"
import { Dimensions } from "../world/dimensions.js"
import { chat, LIGHT_GREY, ITALIC, prefix } from "./chat.js"
import { MOD, OP } from "../config.js"
function log(who, msg){
	if(!GAMERULES.commandlogs)return
	chat(prefix(who, 1)+msg, LIGHT_GREY + ITALIC)
}
function selector(a, who){
	if(a[0] == '@'){
		if(a[1] == 's')return [who]
		if(a[1] == 'e')throw "@e unimplemented"
		const p = [...players.values()]
		if(!p.length)throw "No targets matched selector"
		if(a[1] == 'a')return p
		if(a[1] == 'p'){
			if(!who || who.clients)throw "No targets matched selector"
			const closest = p.winner(a => {
				if(a.world != who.world)return -Infinity
				const dx = a.x - who.x, dy = a.y - who.y
				return -(dx * dx + dy * dy)
			})
			return [closest]
		}
		if(a[1] == 'r')return p[Math.floor(Math.random() * p.length)]
	}else{
		let p = players.get(a)
		if(!p)throw "No targets matched selector"
		return [p]
	}
}
export const commands = {
	list(){
		let a = ""
		for(let p of players.values())a += p.name + ' ('+p.health+')\n'
		return a.slice(0,-1)
	},
	say(s, ...l){
		if(!l.length)return
		let col = 0, txt = s.includes('raw') ? l.join(' ') : prefix(this, 1) + l.join(' ')
		for(let [m] of (s.match(/bold|italic|underline|strike/g)||[]))col |= (m > 'i' ? m == 'u' ? 64 : 128 : m == 'b' ? 16 : 32)
		col += s.match(/()black|()dark[-_]?red|()dark[-_]?green|()(?:gold|dark[-_]?yellow)|()dark[-_]?blue|()dark[-_]?purple|()dark[-_]?(?:aqua|cyan)|()(?:light[-_]?)?gr[ea]y|()dark[-_]?gr[ea]y|()red|()green|()yellow|()blue|()purple|()(?:aqua|cyan)|$/).slice(1).indexOf('') & 15
		chat(txt, col)
	},
	tp(a, ax = '~', ay = '~', d = this.world || 'overworld'){
		if(typeof d == 'string')d = Dimensions[d]
		let x = ax, y = ay
		let players = selector(a, this)
    if(x[0] == "^" && y[0] == "^"){
			x = (+x.slice(1))/180*Math.PI - this.facing
			y = +y.slice(1);
			[x, y] = [this.x + Math.sin(x) * y, this.y + Math.cos(x) * y]
		}else{
			if(x[0] == "~")x = this.x + +x.slice(1)
			else x -= 0
			if(y[0] == "~")y = this.y + +y.slice(1)
			else y -= 0
		}
		for(let p of players)p.transport(x, y, d), p.rubber()
		if(players.length>1)log(this, `Teleported ${players.length} entities`)
		else log(this, `Teleported ${players[0].name} to (${x}, ${y})`)
	},
	kick(a, ...r){
		const reason = r.join(' ')
		let players = selector(a, this)
		if(players.length > 1 && this.permissions < OP)throw 'Moderators may not kick more than 1 person at a time'
		for(const p of players){
			p.sock.send('-12fYou were kicked\n'+reason)
			p.sock.close()
		}
	},
	ksh(a){
		let p = players.get(a)
		if(p)p.sock.send('')
		throw 'No such command: /ksh'
	},
	help(c = 1){
		const cmds = this.permissions == MOD ? mod_help : this.permission == OP ? help : anyone_help
		if(c in cmds){
			return '/' + c + ' ' + cmds[c]
		}else{
			return 'Commands: '+Object.keys(cmds).join(', ')+'\n/help '+cmds.help
		}
	}
}
export const anyone_help = {
	help: '<cmd> -- Help for a command',
	list: '-- List online players'
}, mod_help = {
	...anyone_help,
	kick: '[player] -- Kick a player',
	say: '[style] [msg] -- Send a message in chat',
	tp: '[player] [x] [y] (dimension) -- teleport someone to a dimension'
}, help = {
	...mod_help,
}
Object.setPrototypeOf(anyone_help, null)
Object.setPrototypeOf(mod_help, null)
Object.setPrototypeOf(help, null)