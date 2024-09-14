import { gotopos } from '../misc/ant.js'
import { currentTPS } from './tick.js'
import { BlockIDs } from '../blocks/block.js'

export function stepEntity(e, dt = 1 / currentTPS){
	if(!e.world) return
	if(e.state & 1) e.dy = 0
	else{
		e.dy += dt * e.world.gy * e.gy
		e.dy = e.dy * e.yDrag ** dt
		e.dx += dt * e.world.gx * e.gx
	}
	e.dx = e.dx * (e.impactDy < 0 ? e.groundDrag : e.airDrag) ** dt

	// Entity collision
	const x0 = e.x - e.width - e.collisionPaddingX, x1 = e.x + e.width + e.collisionPaddingX
	const y0 = e.y - e.collisionPaddingY, y1 = e.y + e.height + e.collisionPaddingY
	const cx0 = floor(x0 - 16) >>> 6, cx1 = -(floor(-x1 - 16) >> 6) & 0x3FFFFFF
	const cy0 = floor(y0) >>> 6, cy1 = -(floor(-y1 - 16) >> 6) & 0x3FFFFFF
	for(let cx = cx0; cx != cx1; cx = cx + 1 & 0x3FFFFFF){
		for(let cy = cy0; cy != cy1; cy = cy + 1 & 0x3FFFFFF){
			const chunk = e.chunk && (e.chunk.x == cx & e.chunk.y == cy) ? e.chunk : e.world?.get(cx+cy*0x4000000)
			if(!chunk) continue
			for(const e2 of chunk.entities){
				const {collisionPaddingX: ctpx, collisionPaddingY: ctpy} = e2
				if((!e2.world | e2.netId <= e.netId) || e2.x + e2.width + ctpx < x0 || e2.x - e2.width - ctpx > x1 || e2.y + e2.height + ctpy < y0 || e2.y - ctpy > y1) continue
				e.touch?.(e2)
				if(!e.world) return
				if(e2.world) e2.touch?.(e)
			}
		}
	}
	e.age++
	e.update?.()
}

const EPS = .000002

export const COSMIC_SPEED_LIMIT = 32
export function fastCollision(e, dt = 1 / currentTPS){
	const dx = max(-COSMIC_SPEED_LIMIT, min(e.dx * dt, COSMIC_SPEED_LIMIT)), dy = max(-COSMIC_SPEED_LIMIT, min(e.dy * dt, COSMIC_SPEED_LIMIT))
	e.state &= 0xffff
	const CLIMB = e.impactDy < 0 ? e.stepHeight ?? 0.01 : 0.01
	e.impactDx = e.impactDy = e.impactSoftness = 0
	let x0 = floor(e.x)&-64, y0 = floor(e.y)&-64
	let ch = e.world.get((x0>>>6)+(y0>>>6)*0x4000000)
	const xs = floor(e.x - e.width + EPS), xw = ceil(e.x + e.width - EPS)-xs
	const ex0v = e.x - e.width - xs + EPS + 1, ex1v = e.x + e.width - xs - EPS + 1
	y: if(dy > 0){
		let y = ceil(e.y + e.height - EPS) - 1
		const ey = ceil(e.y + e.height + dy - EPS)
		let c = y<y0?ch?.down:y>(y0|63)?ch?.up:ch, i = xs&63|y<<6&4032
		c = xs<x0?c?.left:xs>(x0|63)?c?.right:c
		for(;c&&y<ey;y++,(i+=64)>=4096&&(i&=63,c=c.up)){
			let yf = 2, ex0 = ex0v, ex1 = ex1v
			let j = i, c1 = c.flags&1?(yf=0,null):c
			for(let x = 0; c1&&x<xw; x++,(++j&63)||(j-=64,c1=c1.right,(c1?.flags&1)&&x<xw&&(yf=0,c1=null))){
				ex0 -= 1; ex1 -= 1
				const id = c1[j], {solid, blockShape} = id==65535?c1.tileData.get(j):BlockIDs[id]
				if(!solid) continue
				if(!blockShape){ yf = 0; break }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i+1] <= yf) yf = blockShape[i+1]
				}
			}
			const ty = yf + y - e.height
			if((y === ey - 1 ? ty >= e.y + dy + EPS : yf > 1) || ty < e.y - EPS) continue
			e.y = ty
			e.impactDy = e.dy
			e.dy = 0
			break y
		}
		e.y += dy
	}else if(dy < 0){
		let y = floor(e.y + EPS)
		const ey = floor(e.y + dy + EPS) - 1
		let c = y<y0?ch?.down:y>(y0|63)?ch?.up:ch, i = xs&63|y<<6&4032
		c = xs<x0?c?.left:xs>(x0|63)?c?.right:c
		for(;c&&y>ey;y--,(i-=64)<0&&(i=i&63|4032,c=c.down)){
			let yf = -1, ex0 = ex0v, ex1 = ex1v
			let j = i, c1 = c.flags&1?(yf=1,null):c
			let soft = 0
			for(let x = 0; c1&&x<xw; x++,(++j&63)||(j-=64,c1=c1.right,(c1?.flags&1)&&x<xw&&(yf=1,c1=null))){
				ex0 -= 1; ex1 -= 1
				const id = c1[j], {solid, blockShape, softness: s=0} = id==65535?c1.tileData.get(j):BlockIDs[id]
				if(!solid) continue
				if(!blockShape){ yf = 1; if(s>soft) soft=s; continue }
				for(let i = 0; i < blockShape.length; i += 4){
					if(ex0 >= blockShape[i+2] | ex1 <= blockShape[i]) continue
					if(blockShape[i+3] >= yf){
						yf = blockShape[i+3]
						if(s>soft) soft=s
					}
				}
			}
			const ty = yf + y
			if((y === ey + 1 ? ty <= e.y + dy - EPS : yf < 0) || ty > e.y + EPS) continue
			e.y = ty
			e.impactDy = e.dy
			e.impactSoftness = soft
			e.dy = 0
			break y
		}
		e.y += dy
	}
	const ny0 = floor(e.y)>>>6
	if(!ch) ch = e.world.get((x0>>>6)+ny0*0x4000000)
	else if(ny0!=y0>>>6) ch = ny0==y0-64>>>6?ch.down:ny0==y0+64>>>6?ch.up:e.world.get((x0>>>6)+ny0*0x4000000); y0 = ny0<<6
	let ys = floor(e.y + EPS), yh = ceil(e.y + e.height - EPS)-ys
	let ey0v = e.y + EPS - ys + 1, ey1v = e.y + e.height - ys - EPS + 1
	x: if(dx > 0){
		let x = ceil(e.x + e.width - EPS) - 1
		const ex = ceil(e.x + e.width + dx - EPS)
		let c = x<x0?ch?.left:x>(x0|63)?ch?.right:ch, i = x&63|ys<<6&4032
		c = ys<y0?c?.down:ys>(y0|63)?c?.up:c
		for(;c&&x<ex;x++,(++i&63)||(i-=64,c=c.right)){
			let xf = 2, ey0 = ey0v, ey1 = ey1v
			let climb = 0
			let j = i, c1 = c.flags&1?(xf=0,null):c
			for(let y = 0; c1&&y<yh; y++,(j+=64)>=4096&&(j&=63,c1=c1.up,(c1?.flags&1)&&y<yh&&(xf=0,c1=null))){
				ey0 -= 1; ey1 -= 1
				const id = c1[j], {solid, blockShape} = id==65535?c1.tileData.get(j):BlockIDs[id]
				if(!solid) continue
				if(!blockShape){ xf = 0; if(1-ey0>climb) climb=1-ey0-climb>CLIMB?Infinity:1-ey0; continue }
				for(let i = 0; i < blockShape.length; i += 4){
					const c = blockShape[i+3] - ey0
					if(c > climb) climb = c-climb>CLIMB?Infinity:c
					if(c <= 0 | ey1 <= blockShape[i+1]) continue
					if(blockShape[i] <= xf) xf = blockShape[i]
				}
			}
			const tx = xf + x - e.width
			if((x === ex - 1 ? tx >= e.x + dx + EPS : xf > 1) || tx < e.x - EPS) continue
			a: if(climb > 0 && climb < Infinity){
				const sx = xf + x - e.width - e.width + EPS, sy = e.y + e.height + EPS, ex1 = (x === ex - 1 ? e.x + dx + e.width : x + 1) - EPS, ey = e.y + e.height + climb - EPS, xa = floor(sx), ya = floor(sy)
				let c0 = xa<(x&-64)?c?.left:xa>=(x|63)?c?.right:c, i = xa&63|ya<<6&4032; c0 = ya<y0?c0?.down:ya>(y0|63)?c0?.up:c0
				for(let y = ya; c0&&y<ey; y++, (i+=64)>=4096&&(i&=63,c0=c0.up)){
					let j = i, c1 = c0
					for(let x = xa; c1&&x<ex1; x++,(++j&63)||(j-=64,c1=c1.right)){
						if(c1.flags&1) break a
						const id = c1[j], {solid, blockShape} = id==65535?c1.tileData.get(j):BlockIDs[id]
						if(!solid) continue
						if(!blockShape) break a
						for(let i = 0; i < blockShape.length; i+=4){
							if(blockShape[i]+x>=ex1 | blockShape[i+2]+x<=sx) continue
							if(blockShape[i+1]+y>=ey | blockShape[i+3]+y<=sy) continue
							break a
						}
					}
				}
				e.y += climb + EPS
				ys = floor(e.y + EPS), yh = ceil(e.y + e.height - EPS)-ys
				ey0v = e.y + EPS - ys + 1, ey1v = e.y + e.height - ys - EPS + 1
				if(e.y>=y0+64){
					y0+=64; ch = ch?.up
					if(!(c=c.up)) break
				}
				continue
			}
			e.x = tx
			e.impactDx = e.dx
			e.dx = 0
			break x
		}
		e.x += dx
	}else if(dx < 0){
		let x = floor(e.x - e.width + EPS)
		const ex = floor(e.x - e.width + dx + EPS) - 1
		let c = x<x0?ch?.left:x>(x0|63)?ch?.right:ch, i = x&63|ys<<6&4032
		c = ys<y0?c?.down:ys>(y0|63)?c?.up:c
		for(;c&&x>ex;x--,(i--&63)||(i+=64,c=c.left)){
			let xf = -1, ey0 = ey0v, ey1 = ey1v
			let climb = 0
			let j = i, c1 = c.flags&1?(xf=1,null):c
			for(let y = 0; c1&&y<yh; y++,(j+=64)>=4096&&(j&=63,c1=c1.up,(c1?.flags&1)&&y<yh&&(xf=1,c1=null))){
				ey0 -= 1; ey1 -= 1
				const id = c1[j], {solid, blockShape} = id==65535?c1.tileData.get(j):BlockIDs[id]
				if(!solid) continue
				if(!blockShape){ xf = 1; if(1-ey0>climb) climb=1-ey0-climb>CLIMB?Infinity:1-ey0; continue }
				for(let i = 0; i < blockShape.length; i += 4){
					const c = blockShape[i+3] - ey0
					if(c > climb) climb = c-climb>CLIMB?Infinity:c
					if(c <= 0 | ey1 <= blockShape[i+1]) continue
					if(blockShape[i+2] >= xf) xf = blockShape[i+2]
				}
			}
			const tx = xf + x + e.width
			if((x === ex + 1 ? tx <= e.x + dx - EPS : xf < 0) || tx > e.x + EPS) continue
			a: if(climb > 0 && climb < Infinity){
				const sx = (x === ex + 1 ? e.x + dx - e.width : x) + EPS, sy = e.y + e.height + EPS, ex1 = xf + x + e.width + e.width - EPS, ey = e.y + e.height + climb - EPS, xa = floor(sx), ya = floor(sy)
				let c0 = xa<(x&-64)?c?.left:xa>=(x|63)?c?.right:c, i = xa&63|ya<<6&4032; c0 = ya<y0?c0?.down:ya>(y0|63)?c0?.up:c0
				for(let y = ya; y < ey; y++, (i+=64)>=4096&&(i&=63,c0=c0.up)){
					let j = i, c1 = c0
					for(let x = xa; x < ex1; x++,(++j&63)||(j=j-1&4032,c1=c1.right)){
						if(c1.flags&1) break a
						const id = c1[j], {solid, blockShape} = id==65535?c1.tileData.get(j):BlockIDs[id]
						if(!solid) continue
						if(!blockShape) break a
						for(let i = 0; i < blockShape.length; i+=4){
							if(blockShape[i]+x>=ex1 | blockShape[i+2]+x<=sx) continue
							if(blockShape[i+1]+y>=ey | blockShape[i+3]+y<=sy) continue
							break a
						}
					}
				}
				e.y += climb + EPS
				ys = floor(e.y + EPS), yh = ceil(e.y + e.height - EPS)-ys
				ey0v = e.y + EPS - ys + 1, ey1v = e.y + e.height - ys - EPS + 1
				if(e.y>=y0+64){
					y0+=64; ch = ch?.up
					if(!(c=c.up)) break
				}
				continue
			}
			e.x = tx
			e.impactDx = e.dx
			e.dx = 0
			break x
		}
		e.x += dx
	}
	const nx0 = floor(e.x)>>>6
	if(!ch) ch = e.world.get(nx0+(y0>>>6)*0x4000000)
	else if(nx0!=x0>>>6) ch = nx0==x0-64>>>6?ch.left:nx0==x0+64>>>6?ch.right:e.world.get(nx0+(y0>>>6)*0x4000000)
	x0 = nx0<<6
	let v = 0, c = false
	let x = floor(e.x - e.width + EPS)
	const ex = ceil(e.x + e.width - EPS)
	ch = x<x0?ch?.left:x>(x0|63)?ch?.right:ch
	ch = ys<y0?ch?.down:ys>(y0|63)?ch?.up:ch
	let i = x&63|ys<<6&4032
	let px0 = 0, px1 = 0, py0 = 0, py1 = 0
	a: for(;ch&&x<ex;x++,(++i&63)||(i-=64,ch=ch.right)){
		let c1 = ch, j = i
		b: for(let y = 0; c1&&y<yh; y++,(j+=64)>=4096&&(j&=63,c1=c1.up)){
			const id = c1[j], b = id==65535?c1.tileData.get(j):BlockIDs[id]
			gotopos(c1, j)
			const {blockShape, fluidLevel, viscosity, climbable = false, pushX = 0, pushY = 0} = b
			let touchingBottom = 1 - (e.y - y - ys)
			if(blockShape){
				const bx0 = e.x - e.width - x, bx1 = e.x + e.width - x
				const by0 = 1-touchingBottom, by1 = by0 + e.height
				for(let i = 0; i < blockShape.length; i += 4){
					const y = blockShape[i+3] - by0
					if(y > touchingBottom) touchingBottom = y
					if((bx0 > blockShape[i+2] | bx1 < blockShape[i]) || (y < 0 | by1 < blockShape[i+1])) continue b
				}
			}
			if(pushX){ if(pushX < 0){ if(pushX < px0) px0 = pushX }
			else if(pushX > px1) px1 = pushX }
			if(pushY){ if(pushY < 0){ if(pushY < py0) py0 = pushY }
			else if(pushY > py1) py1 = pushY }
			if(fluidLevel) e.impactSoftness = 1
			if(viscosity > v) v = viscosity
			if(climbable & !c)
				c = touchingBottom > (e.impactDx ? 0 : dy > 0 ? .125 : .375) * e.height
			if(!b.touched) continue b
			if(b.touched(e)) break a
		}
	}
	e.dx += (px0+px1)*dt; e.dy += (py0+py1)*dt
	v = (1 - v)**dt
	e.dx *= v
	if(e.dx > -.00390625 && e.dx < .00390625) e.dx = 0
	/* fast pow(, 60) */
	const v2 = v*v, v4 = v2*v2, v8 = v4*v4, v16 = v8*v8
	e.dy *= v4*v8*v16*v16*v16
	if(e.dy > -.00390625 && e.dy < .00390625) e.dy = 0
	e.x = ifloat(e.x); e.y = ifloat(e.y)
}


Function.optimizeImmediately(stepEntity)
Function.optimizeImmediately(fastCollision)