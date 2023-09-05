import { optimize } from '../internals.js'
import { goto, load, peekat, save } from '../misc/ant.js'
import { currentTPS } from './tick.js'

export function stepEntity(e, dt = 1 / currentTPS){
	if(e.state & 1)e.dy = 0
	else{
		e.dy += dt * e.world.gy * e.gy
		e.dy = e.dy * e.yDrag ** dt
		e.dx += dt * e.world.gx * e.gx
	}
	e.dx = e.dx * (e.impactDy < 0 ? e.groundDrag : e.airDrag) ** dt

	// Entity collision
	const x0 = e.x - e.width - e.collisionPaddingX, x1 = e.x + e.width + e.collisionPaddingX
	const y0 = e.y - e.collisionPaddingY, y1 = e.y + e.height + e.collisionPaddingY
	const cx0 = floor(x0 - 16) >>> 6, cx1 = ceil((x1 + 16) / 64) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = ceil((y1 + 32) / 64) & 0x3FFFFFF
	for(let cx = cx0; cx != cx1; cx = cx + 1 & 0x3FFFFFF){
		for(let cy = cy0; cy != cy1; cy = cy + 1 & 0x3FFFFFF){
			const chunk = e.chunk && (e.chunk.x == cx & e.chunk.y == cy) ? e.chunk : e.world && e.world.get(cx+cy*0x4000000)
			if(!chunk || !chunk.tiles) continue
			for(const e2 of chunk.entities){
				const {collisionPaddingX: ctpx, collisionPaddingY: ctpy} = e2
				if((!e2.world | e2.netId <= e.netId) || e2.x + e2.width + ctpx < x0 || e2.x - e2.width - ctpx > x1 || e2.y + e2.height + ctpy < y0 || e2.y - ctpy > y1) continue
				e.touch?.(e2)
				e2.touch?.(e)
			}
		}
	}
	e.age++
	e.update?.()
}

export const EPSILON = .0001
export function fastCollision(e, dt = 1 / currentTPS){
	const dx = e.dx * dt, dy = e.dy * dt
	e.state &= 0xFFFF
	e.impactDx = e.impactDy = 0
	let x0 = floor(e.x - e.width + EPSILON), xw = ceil(e.x + e.width - EPSILON) - x0 - 1
	let y0 = floor(e.y + EPSILON), yh = ceil(e.y + e.height - EPSILON) - y0 - 1
	goto(x0, y0, e.world)
	y: if(dy > 0){
		const ey = ceil(e.y + e.height + dy - EPSILON) + 1 - y0
		for(let y = yh; y < ey; y++){
			let ys = 2, ex0 = e.x - e.width + EPSILON - x0, ex1 = 1
			for(let x = 0; x <= xw; x++){
				const {solid, blockShape} = peekat(x, y - 1)
				if(!solid) { ex0 = 0; continue }
				if(!blockShape){ ys = 0; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i + 1] <= ys) ys = blockShape[i + 1]
				}
				ex0 = 0
			}
			const ty = ys + y + y0 - e.height
			if((y === ey - 1 ? ty >= e.y + dy + EPSILON : ys > 1) || ty < e.y - EPSILON) continue
			e.y = ty
			e.impactDy = e.dy
			e.dy = 0
			break y
		}
		e.y = ifloat(e.y + dy)
	}else if(dy < 0){
		const ey = floor(e.y + dy + EPSILON) - 1 - y0
		for(let y = 1; y > ey; y--){
			let ys = -1, ex0 = e.x - e.width + EPSILON - x0, ex1 = 1
			for(let x = 0; x <= xw; x++){
				if(x === xw) ex1 = e.x + e.width - x0 - xw
				const {solid, blockShape} = peekat(x, y)
				if(!solid) { ex0 = 0; continue }
				if(!blockShape){ ys = 1; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i + 3] > ys) ys = blockShape[i + 3]
				}
				ex0 = 0
			}
			const ty = ys + y + y0
			if((y === ey + 1 ? ty <= e.y + dy - EPSILON : ys < 0) || ty > e.y + EPSILON) continue
			e.y = ty
			e.impactDy = e.dy
			e.dy = 0
			break y
		}
		e.y = ifloat(e.y + dy)
	}
	y0 = floor(e.y + EPSILON), yh = ceil(e.y + e.height - EPSILON) - y0 - 1
	goto(x0, y0, e.world)
	x: if(dx > 0){
		const ex = ceil(e.x + e.width + dx - EPSILON) - x0
		for(let x = xw; x < ex; x++){
			let xs = 2, ey0 = e.y + EPSILON - y0, ey1 = 1
			for(let y = 0; y <= yh; y++){
				if(y === yh) ey1 = e.y + e.height - y0 - yh
				const {solid, blockShape} = peekat(x, y)
				if(!solid) { ey0 = 0; continue }
				if(!blockShape){ xs = 0; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ey0 >= blockShape[i+3] | ey1 <= blockShape[i+1]) continue
					if(blockShape[i] <= xs) xs = blockShape[i]
				}
				ey0 = 0
			}
			const tx = xs + x + x0 - e.width
			if((x === ex - 1 ? tx >= e.x + dx + EPSILON : xs > 1) || tx < e.x - EPSILON) continue
			e.x = tx
			e.impactDx = e.dx
			e.dx = 0
			break x
		}
		e.x = ifloat(e.x + dx)
	}else if(dx < 0){
		const ex = floor(e.x - e.width + dx + EPSILON) - 1 - x0
		for(let x = 1; x > ex; x--){
			let xs = -1, ey0 = e.y + EPSILON - y0, ey1 = 1
			for(let y = 0; y <= yh; y++){
				if(y === yh) ey1 = e.y + e.height - y0 - yh
				const {solid, blockShape} = peekat(x, y)
				if(!solid) { ey0 = 0; continue }
				if(!blockShape){ xs = 1; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ey0 >= blockShape[i+3] | ey1 <= blockShape[i+1]) continue
					if(blockShape[i+2] >= xs) xs = blockShape[i+2]
				}
				ey0 = 0
			}
			const tx = xs + x + x0 + e.width
			if((x === ex + 1 ? tx <= e.x + dx - EPSILON : xs < 0) || tx > e.x + EPSILON) continue
			e.x = tx
			e.impactDx = e.dx
			e.dx = 0
			break x
		}
		e.x = ifloat(e.x + dx)
	}
	x0 = floor(e.x - e.width + EPSILON), xw = ceil(e.x + e.width - EPSILON) - x0 - 1
	goto(x0, y0, e.world)
	const p = save()
	a: for(let y = yh; y >= 0; y--)
		b: for(let x = xw; x >= 0; x--){
			const b = peekat(x, y)
			if(!b.touched) continue b
			const {blockShape} = b
			if(blockShape){
				const bx0 = e.x - e.width - x - x0, bx1 = e.x + e.width - x - x0
				const by0 = e.y - y - y0, by1 = e.y + e.height - y - y0
				for(let i = 0; i < blockShape.length; i += 4){
					if((bx0 > blockShape[i+2] | bx1 < blockShape[i]) || (by0 > blockShape[i+3] | by1 < blockShape[i+1])) continue b
				}
			}
			if(b.touched(e)){load(p);break a}else load(p)
		}
}


optimize(stepEntity)
optimize(fastCollision)