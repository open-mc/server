```sh
git clone https://github.com/open-mc/server
sh server/start
```
Will create 2 folders where the command is run:
- `world` containing world data as well as config files
  - Contains `properties.yaml` which you can edit
  - Contains `permissions.yaml` for player permissions
  - Contains a folder `static` for the server's http homepage

- `server` containing the server code, which you can edit if you are interested in modding this game

You may want to secure your server so that it can run on the default client:

Make sure you have a domain that points to your server's IP. We recommend [no-ip](https://ddns.net)

1. Go over to https://certbot.eff.org/instructions, follow their instructions to install certbot for your OS if you haven't already.
2. Run `certbot certonly --standalone`.
3. If this is your first time using certbot, enter your email, and agree to their required and optional emails if you wish.
4. Enter your domain name(s)
5. Once the command has finished, it will show you where the certificate and private key are saved, for example, `/etc/letsencrypt/live/mydomain.com/privkey.key` and `/etc/letsencrypt/live/mydomain.com/fullchain.pem`. Copy these
6. Enter those paths into the `key` and `cert` entries in the `world/properties.yaml` file respectively, and restart the server.

Issues? Ask for help on [our discord](https://discord.gg/mqQwHNTncV)

If you want to connect without HTTPS, you will need to run the [client](https://github.com/open-mc/client) locally

# Updating

Updating is done automatically by the start script

# Keeping alive

You can use a tool like [tmux](https://linuxize.com/post/getting-started-with-tmux/) or systemd to keep your server running

# Server management

Starting the server will start a CLI, where you can chat or enter commands
Press tab to switch between chat mode (for chat and commands) and REPL mode (for debugging)