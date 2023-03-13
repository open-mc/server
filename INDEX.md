I feel like this is a type of file a lot of open source projects are missing.

Here, I'll explain:
- Where you can find the code for specific things
- The coding style that I use (in case you want to contribute)
- What different variable names and terminology mean
- How to use the codebase I've already written (API)


<details>
<summary><h1 style="display:inline-block">Code Index</h1></summary>

<details>
<summary><h2 style="display:inline-block">Things related to world simulation</h1></summary>

Coming soon
</details>
<details>
<summary><h2 style="display:inline-block">Things related to players & connections</h2></summary>

- Connection handler: `index.js`
- Player definition: `entities/misc/player.js`
- Chunk loading: `entities/chunkloader.js`
- Queue: `misc/queue.js`
</details>
<details>
<summary><h2 style="display:inline-block">Things related to world generation</h2></summary>

Everything can be found in `world/gen`
- Random number generators: `world/gen/util/random.js`
- Perlin, biome map: `world/gen/util/perlin.js`, `world/gen/util/biomes.js`
- All the different biomes: `world/gen/biomes/*.js`
- IPC and setup (world gen uses a seperate process): `world/gen/genprocess.js`, `world/gendelegator.js`
</details>
<hr>
</details>

<details>
<summary><h1 style="display:inline-block">Coding style</h1></summary>

## Syntax standard

It is recommended that you enable the option to render whitespace characters in your code editor.

1. Use tabs. If I see 2+ spaces next to each other to form a tab, I'll hunt you down and report you to the police as a psycopath. TABS EXIST FOR A REASON.
2. Proper, even, but not excessive, spacing.
3. No `;` semicolons except when strictly necessary
4. If your single-line statements wrap around or go past the edge of the screen, they're too long. Ideally they should have a gap to the edge and be no more than ~100 cols.
5. Please use single-line if and while syntax when you deem it appropriate
6. useCamelCase, it's pretty ;)
	- Exception: names that appear in-game, such as block namespace IDs (e.g grass_block)
7. `var` is completely BANNED. Also, do not use old ES5 method for declaring classes. Use the ES6 `class` syntax
8. Prefer concise over precise names
```js
//DO NOT DO:
//Space indentation
//More than 1 consecutive spaces
//Spaces before commas
//Spaces on the inside edge of parentheses
//Uneven spacing
//Double-tabs. 1 pair of {} curly braces = 1 indentation level.
//Trailing spaces or tabs
//Overly long lines
//Semicolons (why waste time on them??)
//if/while condition and corresponding `{` on seperate lines
//var
//reallyLongDescriptiveNames
//ES5 `function` classes
function  test( b ,x= 1 ) {
    var numberOfThings = 1; 
    if (numberOfThings == x)
    {
      return true;
    }
    if(reallyLongLineThatIsHardToRead(0 & also(painful.to(lookAt)))){thisLineIsGoingPast() & wrappedAround & isDefinitelyLongerThan(100*characters) => thisIsBad, DontDoThis()}
}
//DO DO:
//1 space after every comma, e.g: a, b
//camelCase
//Spaces around operators (optional, still looks better though)
//) and { on the same line, stuck together
//Omit {} when if/while/for statement only has a single statement inside
// Concise variable names
//e.g the above code could've been like this:
function test(b, x = 1){
	let count = 1
	if (count == x)return true
	if(easyToRead(0 & also(nice.to(lookAt))))
		thisIsFine() & wrapped & notLongerThan(100*chars) => code.shouldBe(likeThis)
}
```

## Logic standard

> Warning! This requires you to have a measurable amount of intelligence! Being able to follow this standard is a very quick way to tell apart someone who knows what they're doing from someone who doesn't.

**Beware of stupid unnecessary long-cuts, such as**
```js
if(condition){
	return false
}else{
	return true
}
```
Which could easily be fixed and rewritten as
```js
return !condition
```
**Other long-cuts**
```js
let value
if(condition){
	value = 1
}else{
	value = 3
}
value = value + other
```
```js
let value = condition ? 1 : 3
value += other
```
Or, even better
```js
let value = (condition ? 1 : 3) + other
```
**`else`s of insecurity**
```js
if(condition){
	//true
}else if(!condition){
	//false
}else{
	//invalid
}
```
Of course, a value can only be truthy or falsy, and if it isn't truthy, it must be falsy
```js
if(condition){
	//true
}else{
	//Can only be false
}
```
**Useless functions**
```js
import {action} from ...
function doAction(a){
	let value = action(a)
	return value
}
doAction(1)
```
This function doesn't actually do anything, it's pretty useless
```js
import {action} from ...

action(1)
```
**Unnecessary variables**
```js
function calculate(a, b, c){
	let valueOnlyUsedOnce = a + b / c
	let result = 1 - 1 / valueOnlyUsedOnce
	return result
}
```
Variables are only useful if they're needed more than once (or very sparingly to break up _really_ long lines)
```js
function calculate(a, b, c){
	return 1 - 1 / (a + b / c)
}
//Or even better
const calculate = (a, b, c) => 1 - 1 / (a + b / c)
```

## Performance standard

Coming soon
In a nutshell, do things fast, not O(2^n).

<hr>
</details>
<details>
<summary><h1 style="display:inline-block">Terminology</h1></summary>
<details>
<summary><h2 style="display:inline-block">Common variable names</h2></summary>

- `pl`: player (instanceof `Entity`, typically attached to a socket, `sock.player`)
- `sock`: Network socket (typically attached to a player, `pl.sock`)
- `ch`: Chunk (64x64 world section)
- `x`, `y`: x and y position
- `cx`, `cy`: Chunk position x and y (chunk at cx=10 would be at position x=640)
- `buf`: Buffer of bytes used for reading / writing
- `e`: Entity (any entity)
- `world`, `w`: A `World` object for a specific dimension
- `i`, `j`: Indexes or counters
- `k`: A key (for example, a key in a Map)
- `t`: Time in ticks
- `f`: Direction an entity is **f**acing (0 being up and pi/2 being right)
</details>
<details>
<summary><h2 style="display:inline-block">Rubber</h2></summary>

A packet that indicates that the server has modified a value that the client normally controls (e.g the player's position) and that serves the purpose of preventing the client from controlling that value until it's received the server's packet

Example:
1. player has been teleported by server, all incoming position packets will be ignored. Rubber packet sent
2. Client later recieves rubber packet which contains a new key (called `r`)
3. Server starts recieving movement packets with the new key and starts accepting them again
Like this, Client will not send move packets that could move the player back to its previous location (which would in effect revert the teleport)

</details>
<details>
<summary><h2 style="display:inline-block">Chunk</h2></summary>

If you're trying to work with this game's source code and you don't yet know what a chunk is, well, you've got a lot of catch-up to do. In traditional minecraft, a chunk is a 16x256x16 section of blocks. Many chunks are stitched together to create a world. In this version, each chunk is 64x64 in size (for a total of 4096 blocks per chunk). Since loading an infinite world would take an infinite amount of memory, the world is split up into these chunks and only a few are loaded at a time around each player. The boundaries between chunks are designed to be completely seamless and indetectable.

</details>
<details>
<summary><h2 style="display:inline-block">Buffer</h2></summary>

A buffer is raw binary data, which can be read from or written to (left to right). Many types can be written to a buffer, each taking up a different amount of space in the buffer. The length of a buffer is typically measured in bytes. Here are some common things written to a buffer:
- Int or Int32 (**4 bytes**): number between -2147483648 and 2147483647
- Short or Int16 (**2 bytes**): Similar to an Int, but with a much shorter range. Short = 0 to 65536, Int16 = -32768 to 32767
- Byte or Int8 (**1 byte**): Byte = 0 to 255, Int8 = -128 to 127
- Float (**4 bytes**): Any number, including fractional. Float allows for around 7 digits of precision, and values up to around ±3.4e38.
- Double (**8 bytes**): Any number, including fractional. Double allows for around 16 digits of precision, and values up to around ±1.8e308.
- Bool (**1 byte**): Bool can store 2 values: true and false. Used to represent an additional detail that you could answer with "yes" or "no", such as whether the player is crouching.
- String (**any size**): Some text, of any length. May or may not contain new lines
- Item: An item is an example of a complex object that can be encoded with entirely the above types. Items are encoded in this order:
	- Amount in stack, as a **byte**
	- Item ID, as a **short**
	- Custom name (or blank), as a **string**
	- If the item supports it, any additional data. Encoded differently depending on the item

</details>
<details>
<summary><h2 style="display:inline-block">thing</h2></summary>

thing

</details>
<hr>
</details>
<details>
<summary><h1 style="display:inline-block">API</h1></summary>
<details>
<summary><h2 style="display:inline-block">Block, Item and Entity definition</h2></summary>

Example for defining a cheese block:
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
<details>
<summary><h2 style="display:inline-block">Block, Item and Entity usage</h2></summary>

Example for using our cheese block and item from earlier:
```js
//Blocks:
//Block.<name>
const blockToPlace = Blocks.cheese_block
//Items:
//Item.<name>(count)
player.give(Items.cheese_pickaxe(1))
//Entities:
//Entity.<name>(x, y)

```

</details>
<hr>
</details>