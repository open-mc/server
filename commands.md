Selectors:
- `[player name]` - E.g `/kill pro_gamer123`
- `@s` - Yourself, e.g `/give @s command_block` (Not available in CLI)
- `@a` - All players, e.g `/tp @a ~ ~`
- `@x` - All players except yourself
- `@e` - All entities, e.g `/kill @e`
- `@n` - All entities except yourself
- `@p` - Closest player (possibly yourself), e.g `/where @p[r>1]`
- `@r` - Random player (possibly yourself), e.g `/give @r diamond 64`
- `!` - Marked entity (See [marking](#marking))

Selectors can be followed by specifier(s), e.g `@e[x>20,x<30,type!=player]`.

Most selectors support `=`, `!=`, `>`, `>=`, `<`, `<=`.

When using specifiers, you can omit `@e`, e.g. `[r<3]` is the same as `@e[r<3]`

Non-number types use prefix comparison, e.g
- `carpet` > `car`
- `karpet` is not > `car`
- `ca` is not > `car`
- `car` < `carpet`
- `cat` is not < `carpet`
- `carpets` is not < `carpet`

Specifier types:
- `type` - Type of this entity, e.g `@e[type=tnt]`
- `name` - Entity name (player name / mob name tag), e.g `/ban @a[name>=bob]` will ban all players whose name starts with `bob`
- `perms` - Players who have a specific permission, e.g `/tp @a[perms>=MOD] ~ ~` will teleport everyone who is mod and above to you
- `world` - Entities who are in a specific dimension, e.g `/kill @e[world=nether]`
- `player` - Entities that are controlled by players (including players), e.g `/kill @e[!player]` kills all non-players
- `x` - Entities at/within some x position, e.g `@a[x>5,x<20]`
- `y` - Entities at/within some y position, e.g `@a[y=0]`
- `f` - Entities looking a specific direction, e.g `@a[f=90+30]` selects everyone looking right (90deg), within 30 degrees tolerance
- `r` - Entities within a specific distance of you, e.g `@a[r<=20]` selects everyone within 20 blocks

Position selectors:
- `[x] [y]` - A position specified by its X and Y, e.g `20 0`
- `~[dx] ~[dy]` - A position specified relative to you, e.g `~ ~20` is 20 blocks above you
- `! !` - Marked position (See [marking](#marking))
- Mix and match above, e.g `0 ~20`, 20 blocks above you but at X=0, `! ~2`, marked X but 2 blocks above your Y
- `^[theta] ^[r]` - `r` blocks in front of you (based on the direction you are looking). `theta` to offset this direction clockwise in degrees
Most places that accept coordinates also accept a dimension, which can also be `~` to specify the current dimension

# Marking

Set a mark at an entity and position, that can then later be referenced by commands. Marks are specific to you and are cleared on rejoin
`/mark [target] (x_off) (y_off)`
`/mark (x_off) (y_off)`

E.g to fill from point A to point B with a stone rectangle, go to point A and run `/mark`, then go to point B and run `/fill ! ! ~ ~ stone`