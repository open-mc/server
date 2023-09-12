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

export const slabify = C => class extends C{
	static blockShape = BlockShape.SLAB
}
export const upperslabify = C => class extends C{
	static blockShape = BlockShape.UPPER_SLAB
}