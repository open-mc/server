# Overview

Clone this repository and run the start script:
```sh
git clone https://github.com/open-mc/server
server/node/start
```
The following command will create 2 folders and 1 file where the command is run:
- `world` containing world data as well as config files
- `properties.yaml` for server properties which you can edit. You can optionally add a different path after the second command to change where this file is read/created. In this file you can also specify where the `world` directory should be read/created
- `server` containing the server code, which you can edit if you are interested in modding this game

You may want to secure your server so that it is accessible outside of localhost:

Make sure you have a domain that points to your server's IP. We recommend [no-ip](https://ddns.net)

1. Go over to https://certbot.eff.org/instructions, follow their instructions to install certbot for your OS if you haven't already.
2. Run `certbot certonly --standalone`.
3. If this is your first time using certbot, enter your email, and agree to their required and optional emails if you wish.
4. Enter your domain name(s)
5. Once the command has finished, it will show you where the certificate and private key are saved, for example, `/etc/letsencrypt/live/mydomain.com/privkey.key` and `/etc/letsencrypt/live/mydomain.com/fullchain.pem`. Copy these
6. Enter those paths into the `key` and `cert` entries in the `properties.yaml` file respectively, and restart the server.

## Updating

Updating is done automatically by the start script

## Keeping alive

You can use a tool like [tmux](https://linuxize.com/post/getting-started-with-tmux/) or systemd to keep your server running even after you close your terminal session

## Server management

Starting the server will start a CLI, where you can chat or enter commands
Press tab to switch between chat mode (for chat and commands) and REPL mode (for debugging)

## Misc
Got any issues? Open a new issue, or directly ask for help on [our discord](https://discord.gg/mqQwHNTncV)!
