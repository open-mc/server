## Overview

Requirements: [Git](https://git-scm.com/downloads) and [Nodejs](https://nodejs.org/en/download)

Note: For **windows**, it is recommended to install both via [scoop](https://scoop.sh). Follow the install instructions on their website, then install both by typing `scoop install git` and `scoop install nodejs@20.17.0`

Note 2: The server software currently does not work with bun or deno due to the use of [uWebSockets.js](https://github.com/uNetworking/uWebSockets.js). Make your complaints there.

Clone this repository and run the start script:
```sh
git clone https://github.com/open-mc/server
sh server/node/start
```

Starting the server will create 1 file and 1 folder where the command is run:
- `world` containing world data as well as config files
- `properties.yaml` for server properties which you can edit in any text editor.
	- You can optionally use a different path with something like `sh server/node/start /Path/To/Properties/File` to change where this file is read/created.
	- In this file you can also specify where the `world` directory should be read/created, relative to `properties.yaml`
	- Fiddle around! Most of the values are well documented and safe to modify

You may consider setting up a TLS certificate of your own, domain name and/or port forwarding for your server to be accessible to everyone (see next few sections).

Got any issues? Open a new issue, or directly ask for help on [our discord](https://discord.gg/mqQwHNTncV)!

## Encryption

You may want to secure your server so that players on other computers can join:

Make sure you have a domain that points to your server's IP. We recommend [no-ip](https://ddns.net) as you can set it to automatically update when your IP inevitably changes

If you are running your server on a local network (such as a home router) you will need to enable port forwarding first (See next section). Repeat those instructions with port 80 (which is necessary for generating a certificate)

Run the following command:

```sh
npx instacert ssl.key ssl.crt "http:" [your_domain]
```

This will save files called `ssl.key` and `ssl.crt`. Put those files' path in `properties.yaml`, e.g

```yaml
key: "./ssl.key"
cert: "./ssl.crt"
```

> Note: Certificates expire after 90 days so you'll need to repeat this step every few months

## Port forwarding

If you are running your server on a local network (such as a home router) you may need to enable port forwarding

1. Open up your router's admin page, this is usually on [192.168.1.0](http://192.168.1.0), [192.168.1.1](http://192.168.1.1) or [192.168.1.254](http://192.168.1.254), but your box will likely tell you
2. Find the page for "Port Forwarding" options or "IPv6 pinholes" (one, the other, or both), these settings are usually under "Firewall", "Devices" or "IPv4"/"IPv6" category. You may need to enter your router's admin password (which is different from the WiFi password)
3. Create a new rule:
	- Select your device (there may be a dropdown menu or you may need to enter its local IP address which should start in `192.168.`, this can be found in your device's wifi info settings)
	- Set all external/internal ports to be `27277`
	- Set the protocol to `TCP`
	- Give it a nice name if prompted (this part doesn't matter)
4. Save and exit

## Updating & Keeping alive

Updating is done automatically by the start script.

If you're starting the server directly without the start script, updating is as simple as performing `git pull`. If you are running a public server consider keeping to the `release` branch

You can use a tool like [`tmux`](https://linuxize.com/post/getting-started-with-tmux/) or `systemd` to keep your server running even after you close your terminal session. Neither of these are available on windows, but why are you hosting on windows anyway? Renting a VPS than runs linux can cost as little as $1/mo and you won't need to leave your computer on.

## Server management

Consider reading through `properties.yaml` and fine-tuning your server's configuration, most properties are well documented so you're unlikely to mess up.

Starting the server will start a CLI, where you can chat or enter commands
Press tab to switch between chat mode (for chat and commands) and REPL mode (for debugging, experts only!)

Type `/help` for a list of commands or `/help <command>` for more help on a specific command. Here are some basic must-know commands:
- `/list`, see who's online
- `/info` or `/i`, see server info (version, uptime, CPU & RAM usage)
- `/give [player] [item] (count) (nbt)`
- `/tp [player] [x] [y] (dimension)` - Teleport a player or entity to (x, y)
	- Shorthand `/tp [x] [y]` - Teleports you to (x, y)
- `/tpe [player] [player2]` - Teleport a player or entity to another
	- Shorthand `/tpe [player2]` - Teleports you to a player or entity
- `/hide [player]`, `/show [player]` - Put someone in/out of spectator
- `/perm [player] [op or mod or normal or visitor or deny]` - Change someone's perms
- `/op [player]` - Same as `/perm [player] op`
- `/ban [player] (duration)` - Ban a player from your server
- `/wipe [player]` - Wipe someone's playerdata, sending them back to world spawn with an empty inventory.
- `/where [player]` - See where a player is without having to join the game or teleport to them
- `/restart (delay)` - Restart the server after some time, or immediately
- `/kill [player]` - Kill a player or entity