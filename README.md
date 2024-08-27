## Overview

Clone this repository and run the start script:
```sh
# Run this in your shell/terminal:
git clone https://github.com/open-mc/server
sh server/node/start
```
Requirements: [Git](https://git-scm.com/downloads) and [Nodejs](https://nodejs.org/en/download)

Starting the server will create 1 file and 1 folder where the command is run:
- `world` containing world data as well as config files
- `properties.yaml` for server properties which you can edit in any text editor.
	- You can optionally add a different path with something like `sh server/node/start /Path/To/Properties/File` to change where this file is read/created.
	- In this file you can also specify where the `world` directory should be read/created, relative to `properties.yaml`

Got any issues? Open a new issue, or directly ask for help on [our discord](https://discord.gg/mqQwHNTncV)!

## Encryption

You may want to secure your server so that players on other computers can join:

Make sure you have a domain that points to your server's IP. We recommend [no-ip](https://ddns.net)

1. Go over to https://certbot.eff.org/instructions, follow their instructions to install certbot for your OS if you haven't already.
2. Run `certbot certonly --standalone`.
3. If this is your first time using certbot, enter your email, and agree to their required and optional emails if you wish.
4. Enter your domain name(s)
5. Once the command has finished, it will show you where the private key and certificate are saved, for example, `/etc/letsencrypt/live/mydomain.com/privkey.key` and `/etc/letsencrypt/live/mydomain.com/fullchain.pem`. Copy these
6. Enter those paths into the `key: ` and `cert: ` entries in the `properties.yaml` file respectively, and restart the server.

If you are running your server on a local network (such as a home router) you will need to enable port forwarding first before doing all of the above.

## Port forwarding

If you are running your server on a local network (such as a home router) you may need to enable port forwarding

1. Open up your router's home page, this is usually on [192.168.1.1](http://192.168.1.1) or [192.168.1.254](http://192.168.1.254)
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

You can use a tool like [`tmux`](https://linuxize.com/post/getting-started-with-tmux/) or `systemd` to keep your server running even after you close your terminal session. Neither of these are available on windows, but I recommend using another hosting medium (such as a raspberry pi or a VPS) that runs on a linux distribution if you intend on keeping your server up around the clock.

## Server management

Consider reading through `properties.yaml` and fine-tuning your server's configuration, most properties are well documented so you're unlikely to mess up.

Starting the server will start a CLI, where you can chat or enter commands
Press tab to switch between chat mode (for chat and commands) and REPL mode (for debugging, experts only!)

Type `/help` for a list of commands or `/help <command>` for more help on a specific command. Here are some basic must-know commands:
- `/list`, see who's online
- `/info` or `/i`, see server info (version, uptime, CPU & RAM usage)
- `/give [player]`
- `/hide [player]`, `/show [player]` - Put someone in/out of spectator
- `/perm [player] [op or mod or normal or visitor or deny]` - Change someone's perms
- `/op [player]` - Same as `/perm [player] op`
- `/ban [player] (duration)` - Ban a player from your server
- `/wipe [player]` - Wipe someone's playerdata, sending them back to world spawn with an empty inventory.
- `/where [player]` - See where a player is without having to join the game or teleport to them
- `/restart (delay)` - Restart the server after some time, or immediately