# Block, Item and Entity definition

This is an example for defining a cheese block:
```js
Blocks.cheese_block = class extends Block{
	//behaviour properties
	static breaktime = 0.5
	static tool = 'sword'
	...
}
```
> Note: use camel_case for block names
All possible properties with their default values can be found in `blocks/blockdefaults.js` (and likewise in `items/itemdefaults.js` for items and `entities/entitydefaults.js` for entities)

**Savedata**: Suppose we want to define a cheese pickaxe that needs to be saved with a durability value
```js
Items.cheese_pickaxe = class extends Item{
	durability = 1000
	static breaktime(block){
		return block.tool == 'pick' ? block.breaktime / 3 : block.breaktime
	}
	...
	static savedata = {
		durability: Short
	}
}
```
Savedata can apply to blocks (for example, chests), items and entities (for example, donkeys, which also store data about any chest they're wearing)
</details>
<details>
<summary><h2 style="display:inline-block">Block, Item and Entity usage</h2></summary>

Example for using our cheese block and item from earlier:
```js
//Blocks:
//Blocks.<name> (OR new Blocks.<name>() for tile data)
const blockToPlace = isMelty ? new Blocks.furnace() : Blocks.cheese_block
place(blockToPlace)
//Items:
//new Items.<name>(count)
player.give(new Items.cheese_pickaxe(1))
//Entities:
//new Entities.<name>(x, y)
summon(new Entities.tnt())

```

</details>
<hr>
</details>