```sh
git clone https://github.com/open-mc/server
cd server
npm i
node .
```
Will create 2 folders where the command is run:
- `world` containing world data as well as config files
  - Contains `properties.yaml` which you can edit

- `server` containing the server code, which you can edit if you are interested in modding this game

You may want to secure your server so that it can run on the default client:

Make sure you have a domain that points to your server's IP.

Go over to https://certbot.eff.org/instructions, follow their instructions for your OS.

Once it has finished, it will show you where the certificate and private key are saved, for example, `/etc/letsencrypt/live/mydomain.com/privkey.key` and `/etc/letsencrypt/live/mydomain.com/fullchain.pem`.

Enter those paths into the `key` and `pem` entries in the `world/properties.yaml` file respectively, and restart the server.

If you want to connect without HTTPS, you can run the [client](https://github.com/open-mc/client) locally

# Updating

```sh
cd server
git pull
```

# Keeping alive

You can use a tool like [tmux](https://linuxize.com/post/getting-started-with-tmux/) or systemd to keep your server running
You can update the server software while it is running, just remember to restart it for the updates to apply.

# Server management

Starting the server will start a CLI, where you can chat or enter commands
Press tab to switch between chat mode (for chat and commands) and REPL mode (for debugging)