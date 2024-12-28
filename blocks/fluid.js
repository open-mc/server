import { down, left, peek, peekdown, peekleft, peekright, peekup, place, right, up } from "../misc/ant.js"
import { GAMERULES } from "../world/index.js"
import { tickBits } from "../world/tick.js"
import { BlockFlags, Blocks } from "./block.js"
import { BlockShape } from "./blockshapes.js"

export const fluidify = (B, t, renewable = false) => {
	B.fluidType = t
	const filled = class extends B{
		static destroy = undefined
		variant(){ return !peekup().fluidLevel ? top : undefined }
		update(){
			if(!(tickBits>>B.delay&1) && !GAMERULES.fastfluids) return 1
			down()
			const b = peek()
			if(b.fluidLevel && b.fluidType != t) return void this.combine?.(b)
			if(!b.replaceable | b.fluidLevel >= 8){
				up(); right()
				let b = peek()
				if(b.replaceable && !b.fluidLevel) b.destroy?.(), place(levels[7])
				else if(b.replaceable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else b.destroy?.(), place(levels[7])
				}else if(b.replaceable && b.fluidType != t) this.combine?.(b)
				left(); left()
				b = peek()
				if(b.replaceable && !b.fluidLevel) b.destroy?.(), place(levels[7])
				else if(b.replaceable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else b.destroy?.(), place(levels[7])
				}else if(b.replaceable && b.fluidType != t) this.combine?.(b)
			}else if(b.fluidLevel){
				if(b.fluidType != t) this.combine?.(b)
				else b.destroy?.(), place(flowing)
			}else b.destroy?.(), place(flowing)
		}
		static fluidLevel = 8
		static source = true
		static flags = B.flags | BlockFlags.TARGET_FLUID
	}
	const top = class extends filled{
		static destroy = undefined
		variant(){ return peekup().fluidLevel ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
	}
	const flowing = class extends B{
		static fluidLevel = 8
		static source = false
		static destroy = undefined
		static pushY = -6
		update(){
			if(!(tickBits>>B.delay&1) && !GAMERULES.fastfluids) return 1
			let b = peekup()
			if(b.fluidType != t){
				const l = max(peekleft().fluidLevel??0, peekright().fluidLevel??0) - 1 - (B.delay > 10)*2
				place(l <= 0 ? Blocks.air : levels[l])
			}
			down()
			b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t) this.combine?.(b)
				else if(renewable && b.source){
					up()
					b = peekright()
					if(!b.replaceable){
						b = peekleft()
						if(b.fluidType != t || !b.source) return
					}else{
						if(b.fluidType != t || !b.source) return
						b = peekleft()
						if((b.fluidType != t || !b.source) && b.replaceable) return
					}
					place(filled)
				}
				return
			}
			if(!b.replaceable){
				up(); right()
				let b = peek()
				let fillSource = renewable<<2
				if(!b.replaceable) fillSource-=2
				else if(!b.fluidLevel||b.fluidLevel < 7) b.destroy?.(), place(levels[7]), fillSource = 0
				else if(b.fluidType != t) this.combine?.(b), fillSource = 0
				else if(!b.source) fillSource = 0
				else fillSource--
				left(); left()
				b = peek()
				if(!b.replaceable) fillSource-=2
				else if(!b.fluidLevel||b.fluidLevel < 7) b.destroy?.(), place(levels[7]), fillSource = 0
				else if(b.fluidType != t) this.combine?.(b), fillSource = 0
				else if(!b.source) fillSource = 0
				else fillSource--
				if(fillSource>=1) right(), place(filled)
			}else if(b.fluidLevel){
				if(b.fluidType != t) this.combine?.(b)
				else b.destroy?.(), place(flowing)
			}else b.destroy?.(), place(flowing)
		}
	}
	const level = class extends B{
		get pushX(){
			const L = this.fluidLevel
			return (peekright().fluidLevel??0) < L ? (peekleft().fluidLevel??0) < L ? 0 : 8 : (peekleft().fluidLevel??0) < L ? -8 : 0
		}
		static source = false
		static destroy = undefined
		update(){
			if(!(tickBits>>B.delay&1) && !GAMERULES.fastfluids) return 1
			const u = peekup(), r = peekright(), l = peekleft()
			if(u.fluidLevel && u.fluidType != t) u.combine?.(this)
			if(r.fluidLevel && r.fluidType != t)
				right(), this.combine?.(r), left()
			if(l.fluidLevel && l.fluidType != t)
				left(), this.combine?.(l), right()

			const lvl = max(u.fluidLevel ?? 0, r.fluidLevel ?? 0, l.fluidLevel ?? 0), a=1+(B.delay > 10)*2
			if(this.fluidLevel >= lvl) return void place(lvl<=a?Blocks.air:levels[lvl-a])
			down()
			let b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t) this.combine?.(b)
				else if(renewable && b.source){
					up()
					b = peekright()
					if(!b.replaceable){
						b = peekleft()
						if(b.fluidType != t || !b.source) return
					}else{
						if(b.fluidType != t || !b.source) return
						b = peekleft()
						if((b.fluidType != t || !b.source) && b.replaceable) return
					}
					place(filled)
				}
				return
			}
			if(!b.replaceable){
				let L = this.fluidLevel - 1 - (B.delay > 10)*2
				if(L<=0) return
				up(); right()
				let b = peek()
				let fillSource = renewable<<2
				if(!b.replaceable) fillSource-=2
				else if(!b.fluidLevel||b.fluidLevel < L) b.destroy?.(), place(levels[L]), fillSource = 0
				else if(b.fluidType != t) this.combine?.(b), fillSource = 0
				else if(!b.source) fillSource = 0
				else fillSource--
				left(); left()
				b = peek()
				if(!b.replaceable) fillSource-=2
				else if(!b.fluidLevel||b.fluidLevel < L) b.destroy?.(), place(levels[L]), fillSource = 0
				else if(b.fluidType != t) this.combine?.(b), fillSource = 0
				else if(!b.source) fillSource = 0
				else fillSource--
				if(fillSource>=1) right(), place(filled)
			}else if(b.fluidLevel){
				if(b.fluidType != t) this.combine?.(b)
				else place(flowing)
			}else place(flowing)
		}
	}
	const levels = [
		Blocks.air,
		class extends level{static fluidLevel = 1; static blockShape = [0, 0, 1, 2/16]},
		class extends level{static fluidLevel = 2; static blockShape = [0, 0, 1, 4/16]},
		class extends level{static fluidLevel = 3; static blockShape = [0, 0, 1, 6/16]},
		class extends level{static fluidLevel = 4; static blockShape = [0, 0, 1, 8/16]},
		class extends level{static fluidLevel = 5; static blockShape = [0, 0, 1, 10/16]},
		class extends level{static fluidLevel = 6; static blockShape = [0, 0, 1, 12/16]},
		class extends level{static fluidLevel = 7; static blockShape = [0, 0, 1, 14/16]},
	]
	return {filled, top, flowing, levels}
}