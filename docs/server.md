# server.js

## Overview
This documentation provides an explanation of server.js.

## Import Statements
- `argv` and `fs` are imported from the `./internals.js` module.
- `WebSocket` and `WebSocketServer` are imported from the 'ws' module.
- `Dimensions` and `players` are imported from the `./world/index.js` module.
- `chat` and `YELLOW` are imported from the `./misc/chat.js` module.
- `PROTOCOL_VERSION`, `codes`, and `onstring` are imported from the `./misc/incomingPacket.js` module.
- Various constants and functions (`CONFIG`, `GAMERULES`, `HANDLERS`, `packs`, `PERMISSIONS`, `stat`, `STATS`) are imported from the `./config.js` module.
- `DataReader` and `DataWriter` are imported from the `./utils/data.js` module.
- `playerLeft`, `playerLeftQueue`, and `queue` are imported from the `./misc/queue.js` module.
- `crypto` is imported from the Node.js built-in `crypto` module.
- `deflateSync` is imported from the Node.js built-in `zlib` module.
- `entityindex`, `itemindex`, and `blockindex` are imported from their respective index modules.
- `Entities` and `Items` are imported from their respective modules.
- `index` is imported from the `./misc/miscdefs.js` module.

## HTTP Server Setup
- The `PUBLICKEY` constant contains an RSA public key used for verifying signatures.
- `endpoints` is an object mapping endpoint names to handler functions for HTTP requests.
- The `handler` function serves HTTP requests based on the requested endpoint.
- The `httpServer` is created using either HTTP or HTTPS depending on whether `key` and `pem` are provided in the configuration.
- The `secure` variable is set based on whether HTTPS is used.

## WebSocket Server Setup
- A WebSocket server `server` is created with `perMessageDeflate` disabled.
- The `started` variable stores the timestamp when the server starts listening.

## Connection Handling
- A custom `logMalicious` function is added to the `WebSocket` prototype to log potential malicious activity.
- Upon connection, the server verifies the client's public key signature and sends a challenge for authentication.
- The `play` function handles player authentication and initialization.
- A player's permissions and session information are managed during connection.

## Close Event Handling
- The `close` function is called when a WebSocket connection is closed.
- Player data is saved and removed from the active player list.

## Message Handling
- The `message` function processes incoming WebSocket messages.
- It verifies client signatures, handles player authentication, and delegates message handling based on message codes.

## Miscellaneous
- Index data for entities, items, and blocks is compressed using zlib.
- Various constants and variables are initialized for server operation.
