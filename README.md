```sh
git clone https://github.com/openmc2d/server
cd server
npm i
node .
```
Will create 2 folders where the command is run:
- `world` containing world data as well as config files
  - Contains `properties.yaml` which you can edit

- `server` containing the server code, which you can edit if you are interested in modding this game

You may want to secure your server so that it can run on the default client:

Make sure you have a domain that points to your server's IP
Go over to https://certbot.eff.org/instructions, follow their instructions for your OS.
Once it has finished, it will show you where the certificate and private key are saved, for example, `/etc/letsencrypt/live/mydomain.com/privkey.key` and `/etc/letsencrypt/live/mydomain.com/fullchain.pem`.
Enter those paths into the `key` and `pem` entries in the `world/properties.yaml` file respectively

If you want to connect without HTTPS, you can run the [client](https://github.com/openmc2d/client) locally