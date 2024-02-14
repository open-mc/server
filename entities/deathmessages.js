export const damageTypes = {
	void: 0, fire: 1, water: 2, fall: 3, hitGround: 4, burning: 5, explosion: 6, suffocation: 7
}
Object.setPrototypeOf(damageTypes, null)

export const deathMessages = {
	[damageTypes.void]: '\0 was killed',
	[damageTypes.burning]: '\0 burned up to death',
	[damageTypes.fire]: '\0 burned to death',
	[damageTypes.fall]: '\0 fell from a high place',
	[damageTypes.hitGround]: '\0 hit the ground too hard',
	[damageTypes.explosion]: '\0 blew up',
	[damageTypes.suffocation]: '\0 suffocated to death'
}