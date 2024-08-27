import { stat } from '../world/index.js'
import { getX, getY, up, jump, peek, right, select, goto, place } from '../misc/ant.js'
import { Blocks } from '../blocks/block.js'
import { damageTypes } from './deathmessages.js'
import { DXDY } from './entity.js'

let DIAMETER = 0, LEFT = DIAMETER - 1 >>> 1
const bufferS = new Int32Array(23 * 23), bufferM = new Int32Array(43 * 43), bufferL = new Int32Array(73 * 73)
let buffer

let x = 0, y = 0
const get = (xo=0,yo=0) => buffer[x+xo + LEFT + (y+yo + LEFT) * DIAMETER]
const set = a => buffer[x + LEFT + (y + LEFT) * DIAMETER] = a
export function explode(entity, strength = 100, fire = false){
	stat('world', 'explosions')
	if(strength>200) buffer = bufferL, DIAMETER = 73
	else if(strength>100) buffer = bufferM, DIAMETER = 43
	else buffer = bufferS, DIAMETER = 23
	LEFT = DIAMETER - 1 >>> 1
	buffer.fill(0); x = y = 0
	if(entity){
		goto(entity)
		entity.remove()
	}
	const bl = peek()
	set(strength -= bl.blast)
	if(strength > 0) bl.destroy?.(false), place(Blocks.air)
	else return
	up(); y = 1
	for(let i = 1; i < LEFT; i++){
		y = -i; jump(1,-2*i); x++
		while(y <= i){
			const bl = peek()
			let v
			if(y == -i) v = get(-1,1)-bl.blast*(2-(i&1))
			else if(y < i) v = get(-1,0)-bl.blast
			else v = get(-1,-1)-bl.blast*(2-(i&1))
			if(v > 0) bl.destroy?.(false), place(Blocks.air), set(v)
			up(); y++
		}
	}
	jump(-x,1-y); x = 0; y = 1
	for(let i = 1; i < LEFT; i++){
		y = -i; jump(-1,-2*i); x--
		while(y <= i){
			const bl = peek()
			let v
			if(y == -i) v = get(1,1)-bl.blast*(2-(i&1))
			else if(y < i) v = get(1,0)-bl.blast
			else v = get(1,-1)-bl.blast*(2-(i&1))
			if(v > 0) bl.destroy?.(false), place(Blocks.air), set(v)
			up(); y++
		}
	}
	jump(-x,-y); x = y = 0
	for(let i = 1; i < LEFT; i++){
		x = 1-i; jump(2-2*i,1); y++
		while(x < i){
			const bl = peek()
			const v = get(0,-1)-bl.blast
			if(v > 0) bl.destroy?.(false), place(Blocks.air), set(v)
			right(); x++
		}
	}
	jump(-x,-y); x = y = 0
	for(let i = 1; i < LEFT; i++){
		x = 1-i; jump(2-2*i,-1); y--
		while(x < i){
			const bl = peek()
			const v = get(0,1)-bl.blast
			if(v > 0) bl.destroy?.(false), place(Blocks.air), set(v)
			right(); x++
		}
	}
	jump(-x,-y); x = Number(getX())+.5; y = Number(getY())+.5
	select(-LEFT, -LEFT, LEFT, LEFT, e => {
		let dx = e.x - x, dy = e.y - y
		const dmg = buffer[floor(dx+LEFT) + floor(dy+LEFT)*DIAMETER]
		const d = sqrt(dx * dx + dy * dy)
		dx /= d; dy /= d
		e.dx += dx * dmg / 4; e.dy += dy * dmg / 4
		e.damage?.(round(dmg / 4), damageTypes.explosion)
		if(e.sock) e.rubber(DXDY)
	})
}
Function.optimizeImmediately(explode)