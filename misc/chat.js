import { chatImport } from '../entities/entity.js'
import { players } from '../world/index.js'

export const BLACK = 0
export const DARK_RED = 1
export const DARK_GREEN = 2
export const GOLD = 3
export const DARK_BLUE = 4
export const DARK_PURPLE = 5
export const DARK_AQUA = 6
export const LIGHT_GREY = 7
export const DARK_GREY = 8
export const RED = 9
export const GREEN = 10
export const YELLOW = 11
export const BLUE = 12
export const PURPLE = 13
export const AQUA = 14
export const WHITE = 15

export const BOLD = 16
export const ITALIC = 32
export const UNDERLINE = 64
export const STRIKETHROUGH = 128
/**
 * 
 * @param {string} msg Message to be sent
 * @param {number} style Color and style to send the message as
 * @param {{getName: () => string, getAvatar: () => string}} [player] sender of chat message, primarily used to prefix the message. Setting this to their websocket object will send the message as a command output
 */
const hexToInt = a => a>47&&a<58?a-48:a>64&&a<71?a-55:a>96&&a<103?a-87:a==43?131072:65536
let style = 15
const ansiReplacer = a => {
	let c = a.charCodeAt(0)
	if(c == 127) return '\u2421'
	if(c < 32) return String.fromCharCode(0x2400 | c)
	c = a.charCodeAt(1)
	if(c > 96) c -= 32
	if(c == 92) return '\\'
	if(c == 78) return '␊'
	if(c == 84) return '␉'
	if(c == 88 || c == 85){
		c = (parseInt(a.slice(2),16)+1||65534)-1
		if(c == 127) c = 0x2421
		if(c < 32) c |= 0x2400
		return String.fromCharCode(c)
	}
	let e = style&240 ? '\x1b[0;' : '\x1b['
	const s = style; style = hexToInt(a.charCodeAt(1))<<4|hexToInt(a.charCodeAt(2))
	if(style&131072) style = style&-131088|s&15
	if(style&2097152) style = style&-2097393|s&240
	if(style>65535){ style = s; return '' }
	if(style&16) e+='1;'
	if(style&32) e+='3;'
	if(style&64) e+='4;'
	e += (style & 8 ? 82 : 30) + (style & 15) + 'm' //30-37, 90-97
	return e
}
const discordReplacer = a => {
	let c = a.charCodeAt(0)
	if(c == 127) return '\u2421'
	if(c < 32) return String.fromCharCode(0x2400 | c)
	if(c != 92) return '\\'+a
	c = a.charCodeAt(1)
	if(c > 96) c -= 32
	if(c == 92) return '\\'
	if(c == 78) return '␊'
	if(c == 84) return '␉'
	if(c == 88 || c == 85){
		c = (parseInt(a.slice(2),16)+1||65534)-1
		if(c == 127) c = 0x2421
		if(c < 32) c |= 0x2400
		return String.fromCharCode(c)
	}
	let e = ''
	const s = style; style = hexToInt(a.charCodeAt(1))<<4|hexToInt(a.charCodeAt(2))
	if(style&131072) style = style&-131088|s&15
	if(style&2097152) style = style&-2097393|s&240
	if(style>65535){ style = s; return '\0' }
	if(style != s){
		if(s&128) e+='~~'
		if(s&64) e+='__'
		if(s&32) e+='*'
		if(s&16|(~s&15)) e+='**'
		e += '\0'
		if(style&16|(~style&15)) e+='**'
		if(style&32) e+='*'
		if(style&64) e+='__'
		if(style&128) e+='~~'
	}
	return e
}
export function chat(msg, who = null){
	style = 15
	const ansiMsg = msg.replace(/[\x00-\x1f\x7f]|\\(\\|x[^][^]|u[^][^][^][^]|[^][^])/gi, ansiReplacer) + '\x1b[0m'
	console.log(ansiMsg)
	a: if(CONFIG.webhook){
		const wpf = (CONFIG.webhook_profiles ?? true) && !!who
		style = 15
		let safeMsg = msg.replace(/[\x00-\x1f\x7f]|[`*_#@|\[:~>]|\\(\\|x[^][^]|u[^][^][^][^]|[^][^])/gi, discordReplacer)
		if(style&16|(~style&15)) safeMsg+='**'
		if(style&32) safeMsg+='*'
		if(style&64) safeMsg+='__'
		if(style&128) safeMsg+='~~'
		if(safeMsg.length>2000) break a
		fetch(CONFIG.webhook, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({
			content: (wpf ? safeMsg.replace(/<\w+\\> ?/y,'') : safeMsg),
			username: wpf ? who.getName() : CONFIG.name,
			avatar_url: wpf && host ? 'https://' + host + '/avatar/' + who.name + (who.sock ? '?t=' + who.sock.joinedAt : '') : CONFIG.icon,
			allowed_mentions: { parse: [] }, flags: 4
		})}).catch(e => null)
	}
	for(const {sock} of players.values()) sock.send(msg)
}
export function printChat(msg){
	style = 15
	console.log(msg.replace(/[\x00-\x08\x10-\x1f\x7f]|\\(\\|x[^][^]|u[^][^][^][^]|[^][^])/gi, ansiReplacer) + '\x1b[0m')
}

// Every system has its flaws
chatImport.chat = chat