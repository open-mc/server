import { Item } from "../items/item.js"
import { place } from "../misc/ant.js"

export const BlockShape = {}
BlockShape.SLAB = [0, 0, 1, 0.5]
BlockShape.UPPER_SLAB = [0, 0.5, 1, 1]
BlockShape.STAIRS_RIGHT = [0, 0, 1, 0.5, 0, 0.5, 0.5, 1]
BlockShape.STAIRS_LEFT = [0, 0, 1, 0.5, 0.5, 0.5, 1, 1]
BlockShape.UPPER_STAIRS_RIGHT = [0, 0.5, 1, 1, 0, 0, 0.5, 0.5]
BlockShape.UPPER_STAIRS_LEFT = [0, 0.5, 1, 1, 0.5, 0, 1, 0.5]
BlockShape.VERTICAL_THIN = [0.25, 0, 0.75, 1]
BlockShape.HORIZONTAL_THIN = [0, 0.25, 1, 0.75]
BlockShape.ONE_SHORT = [0, 0, 1, 15/16]
BlockShape.TWO_SHORT = [0, 0, 1, 14/16]

export const slabifyItem = (I, B) => class extends I{
	place(_, fy){ place(fy > 0.5 ? B.upperSlabShape : B.slabShape); super.use() }
}
const shapeKeys = new Map()
	.set(BlockShape.SLAB, 'slabShape')
	.set(BlockShape.UPPER_SLAB, 'upperSlabShape')

export const blockShaped = (C, s, d) => { 
	const o = class extends C{
		static blockShape = s
		static itemVariant = null
		drops(){return new d(1)}
	}
	const k = shapeKeys.get(s); if(k) C[k] = o
	return o
}

export const itemify = C => class extends Item{
	place(){ place(C); super.use() }
}