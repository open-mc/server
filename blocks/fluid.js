import { down, getX, getY, left, peek, peekdown, peekleft, peekright, peekup, place, right, up } from "../misc/ant.js"
import { Blocks } from "./block.js"
import { BlockShape } from "./blockshapes.js"

export const fluidify = (B, t) => {
	B.fluidType = t
	const filled = class extends B{
		variant(){ return !peekup().fluidLevel ? top : undefined }
		update(v){
			if(v < B.delay) return v+1
			down()
			const b = peek()
			if(b.solid | b.fluidLevel >= 8){
				up(); right()
				let b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[7])
				else if(!b.solid && b.fluidLevel < 7){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[7])
				}
				left(); left()
				b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[7])
				else if(!b.solid && b.fluidLevel < 7){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[7])
				}
			}else if(b.fluidLevel){
				if(b.fluidType != t && this.combine) this.combine(b)
				else place(flowing)
			}else b.destroy?.(false, undefined, flowing)
		}
		static fluidLevel = 8
	}
	const top = class extends filled{
		variant(){ return peekup().fluidLevel ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
	}
	const flowing = class extends B{
		update(v){
			if(v < B.delay) return v+1
			let b = peekup()
			if(!(b instanceof B)){
				const l = max(peekleft().fluidLevel??0, peekright().fluidLevel??0) - 1
				if(l <= 0) place(Blocks.air)
				else place(levels[l])
			}
			down()
			b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t && this.combine) this.combine(b)
				return
			}
			if(b.solid){
				up(); right()
				let b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[7])
				else if(!b.solid && b.fluidLevel < 7){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[7])
				}
				left(); left()
				b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[7])
				else if(!b.solid && b.fluidLevel < 7){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[7])
				}
			}else if(b.fluidLevel){
				if(b.fluidType != t && this.combine) this.combine(b)
				else place(flowing)
			}else b.destroy?.(false, undefined, flowing)
		}
		static fluidLevel = 8
		static flows = true
	}
	const level = class extends B{
		static flows = true
		update(v){
			if(v < B.delay) return v+1
			const lvl = max(peekup().fluidLevel??0, peekright().fluidLevel??0, peekleft().fluidLevel??0)
			if(this.fluidLevel >= lvl) return void place(levels[max(0,this.fluidLevel-2)])
			down()
			const b = peek()
			if(b.fluidLevel >= 8){
				if(b.fluidType != t && this.combine) this.combine(b)
				return
			}
			if(b.solid){
				const L = this.fluidLevel - 1
				up(); right()
				let b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[L])
				else if(!b.solid && b.fluidLevel < L){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[L])
				}
				left(); left()
				b = peek()
				if(!b.solid && !b.fluidLevel) b.destroy?.(false, undefined, levels[L])
				else if(!b.solid && b.fluidLevel < L){
					if(b.fluidType != t && this.combine) this.combine(b)
					else place(levels[L])
				}
			}else if(b.fluidLevel){
				if(b.fluidType != t && this.combine) this.combine(b)
				else place(flowing)
			}else b.destroy?.(false, undefined, flowing)
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