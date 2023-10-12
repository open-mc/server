import { peekup } from "../misc/ant.js"
import { BlockShape } from "./blockshapes.js"

export const fluidify = B => {
	B.fluid = true
	const filled = class extends B{
		variant(){ return !peekup().fluid ? top : undefined }
		update(){
			
		}
	}
	const top = class extends filled{
		variant(){ return peekup().fluid ? filled : undefined }
		static blockShape = BlockShape.TWO_SHORT
	}
	const flowing = class extends B{
	}
	return {filled, top, flowing}
}