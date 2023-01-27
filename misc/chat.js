import { server } from '../index.js'
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
 * @param {Player | WebSocket | null} player sender of chat message, primarily used to prefix the message. Setting this to their websocket object will send the message as a command output
 * @param {string} message Message to be sent
 * @param {*} style Color to send the message as
 */
export function chat(msg, style = 15){
	let a = ''
	if(style&BOLD)a+='1;'
	if(style&ITALIC)a+='3;'
	if(style&UNDERLINE)a+='4;'
	a += (style & 8 ? 82 : 30) + (style & 15) //30-37, 90-97
	console.log('\x1b[' + a + 'm' + (style&STRIKETHROUGH?msg.replace(/[\x20-\uffff]/g,'$&\u0336'):msg).replace(/[\x00-\x1f\x7f]/g, a => a == '\x7f' ? '\u2421' : String.fromCharCode(0x2400 + a.charCodeAt())) + '\x1b[m')
	msg = (style<16?'0'+style.toString(16):style.toString(16)) + msg
	for(const sock of server.clients)sock.send(msg)
}


export function prefix(player, style = 0){
	const {name} = player || server
	return name ? style ? '[' + name + '] ' : '<' + name + '> ' : style ? '[!] ' : '[server] '
}