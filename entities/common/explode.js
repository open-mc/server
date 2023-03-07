import { getX, getY } from "../../misc/ant.js"

const DIAMETER = 40, LEFT = DIAMETER - 1 >>> 1
const buffer = new Int32Array(DIAMETER * DIAMETER * 2)

export function explode(strength = 10, fire = false){
	let x = 0, y = 0
	buffer.fill(0)
}