import { down, getX, getY, left, peek, peekdown, peekleft, peekright, peekup, place, right, up } from "../misc/ant.js"
import { GAMERULES } from "../world/index.js"
import { Blocks } from "./block.js"
import { BlockShape } from "./blockshapes.js"

export const fluidify = (B, t, renewable = false) => {
	B.fluidType = t
	const filled = class extends B{
		variant(){ return !peekup().fluidLevel ? top : undefined }
		update(v){
			if(v < B.delay && !GAMERULES.fastfluids) return v+1
			down()
			const b = peek()
			if(b.fluidLevel && b.fluidType != t) return void this.combine?.(b)
			if(!b.nonSolidAndReplacable | b.fluidLevel >= 8){
				up(); right()
				let b = peek()
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[7])
				else if(b.nonSolidAndReplacable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[7])
				}
				left(); left()
				b = peek()
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[7])
				else if(b.nonSolidAndReplacable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[7])
				}
			}else if(b.fluidLevel){
				if(b.fluidType != t) this.combine?.(b)
				else place(flowing)
			}else place(flowing)
		}
		static fluidLevel = 8
		static flows = false
	}
	const top = class extends filled{
		variant(){ return peekup().fluidLevel ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
	}
	const flowing = class extends B{
		update(v){
			if(v < B.delay && !GAMERULES.fastfluids) return v+1
			let b = peekup()
			if(b.fluidType != t){
				const l = max(peekleft().fluidLevel??0, peekright().fluidLevel??0) - 1 - (B.delay > 10)*2
				place(l <= 0 ? Blocks.air : levels[l])
			}
			down()
			b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t) this.combine?.(b)
				else if(renewable && !b.flows){
					up()
					b = peekright()
					if(!b.nonSolidAndReplacable){
						b = peekleft()
						if(b.fluidType != t || b.flows) return
					}else{
						if(b.fluidType != t || b.flows) return
						b = peekleft()
						if((b.fluidType != t || b.flows) && b.nonSolidAndReplacable) return
					}
					place(filled)
				}
				return
			}
			if(!b.nonSolidAndReplacable){
				up(); right()
				let b = peek()
				const sourceRight = renewable && b.fluidType == t && !b.flows
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[7])
				else if(b.nonSolidAndReplacable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[7])
				}
				left(); left()
				b = peek()
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[7])
				else if(b.nonSolidAndReplacable && b.fluidLevel < 7){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[7])
				}
				if(sourceRight && b.fluidType == t && !b.flows){
					right(); place(filled)
				}
			}else if(b.fluidLevel){
				if(b.fluidType != t) this.combine?.(b)
				else place(flowing)
			}else place(flowing)
		}
		static fluidLevel = 8
		static flows = true
	}
	const level = class extends B{
		static flows = true
		update(v){
			if(v < B.delay && !GAMERULES.fastfluids) return v+1
			const u = peekup(), r = peekright(), l = peekleft()
			if(u.fluidLevel && u.fluidType != t) u.combine?.(this)
			if(r.fluidLevel && r.fluidType != t)
				right(), this.combine?.(r), left()
			if(l.fluidLevel && l.fluidType != t)
				left(), this.combine?.(l), right()

			const lvl = max(u.fluidLevel ?? 0, r.fluidLevel ?? 0, l.fluidLevel ?? 0)-1-(B.delay > 10)*2
			if(this.fluidLevel > lvl) return void place(lvl<=0?Blocks.air:levels[lvl])
			down()
			let b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t) this.combine?.(b)
				else if(renewable && !b.flows){
					up()
					b = peekright()
					if(!b.nonSolidAndReplacable){
						b = peekleft()
						if(b.fluidType != t || b.flows) return
					}else{
						if(b.fluidType != t || b.flows) return
						b = peekleft()
						if((b.fluidType != t || b.flows) && b.nonSolidAndReplacable) return
					}
					place(filled)
				}
				return
			}
			if(!b.nonSolidAndReplacable){
				let L = this.fluidLevel - 1 - (B.delay > 10)*2
				if(L<0) L=0
				up(); right()
				let b = peek()
				const sourceRight = renewable && b.fluidType == t && !b.flows
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[L])
				else if(b.nonSolidAndReplacable && b.fluidLevel < L){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[L])
				}
				left(); left()
				b = peek()
				if(b.nonSolidAndReplacable && !b.fluidLevel) place(levels[L])
				else if(b.nonSolidAndReplacable && b.fluidLevel < L){
					if(b.fluidType != t) this.combine?.(b)
					else place(levels[L])
				}
				if(sourceRight && b.fluidType == t && !b.flows){
					right(); place(filled)
				}
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