export let chunk
export const chunkBiomes = new Uint8Array(10)

export const air = () => chunk = empty.slice(0)

export const Blocks = {}
export const Items = {}
export const Entities = {}
export const Biomes = {}

export let seed = 0

export function setSeed(a){ seed = a ^ 0xC0FFEBAD }

export const empty = Array.from({length:4096},()=>null)