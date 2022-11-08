import { DataWriter } from '../utils/data.js'

const packet = (type, c) => (sock, data) => {
	const d = new DataWriter()
	d.byte(c)
	d.write(type, data)
	d.pipe(sock)
}
export const DropChunk = packet([Int], 17)
export const BlockSet = packet({x: Int, y: Int, id: Short}, 8)