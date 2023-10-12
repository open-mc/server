# Block, Item and Entity definition

This is an example for defining a cheese block:
```js
Blocks.cheese_block = class extends Item{
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
//Block.<name>
const blockToPlace = Blocks.cheese_block
//Items:
//Item.<name>(count)
player.give(new Items.cheese_pickaxe(1))
//Entities:
//Entity.<name>(x, y)

```

</details>
<hr>
</details>