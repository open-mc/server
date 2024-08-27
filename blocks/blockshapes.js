import { Item } from "../items/item.js"
import { placeblock } from "../misc/ant.js"

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

export const slabifyItem = (I, B) => {
	const o = class extends I{
		place(fx, fy){ placeblock(fy > 0.5 ? B.upperSlabShape : B.slabShape); return 1 }
	}
	if(B.slabShape) B.slabShape.itemForm = o
	if(B.upperSlabShape) B.upperSlabShape.itemForm = o
	return o
}
const shapeKeys = new Map()
	.set(BlockShape.SLAB, 'slabShape')
	.set(BlockShape.UPPER_SLAB, 'upperSlabShape')

export const blockShaped = (C, s) => { 
	const o = class extends C{
		static blockShape = s
		static itemForm = null
		drops(){return new o.itemForm(1)}
	}
	const k = shapeKeys.get(s); if(k) C[k] = o
	return o
}

export const itemify = (C, K=Item) => class extends K{
	place(){ placeblock(C); return 1 }
}