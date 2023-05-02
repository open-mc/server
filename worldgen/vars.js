export const chunk = []
export const chunkBiomes = new Uint8Array(10)


export const Blocks = {}
export const Items = {}
export const Biomes = {}

export let seed = 0

export function setSeed(a){ seed = a ^ 0xC0FFEBAD }

for(let i = 0; i < 4096; i++)chunk.push(Blocks.air)