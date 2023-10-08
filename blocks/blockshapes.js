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

export const slabifyItem = (I, B) => class extends I{
	place(_, fy){ place(fy > 0.5 ? B.upperSlabVariant : B.slabVariant); super.use() }
}
const variantKeys = new Map()
	.set(BlockShape.SLAB, 'slabVariant')
	.set(BlockShape.UPPER_SLAB, 'upperSlabVariant')

export const blockShaped = (C, s, d, o = class extends C{
	static blockShape = s
	static itemVariant = null
	static drops = d
}) => { const k = variantKeys.get(s); if(k)C[k]=o; return o }