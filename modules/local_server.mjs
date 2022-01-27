import express from "express";
import { WebSocketServer } from 'ws';

export class LocalServer {
    constructor() {
        this.server = express();
        this.ws_paths = {};
        this.dyn_router = express.Router();

        this.server.use('/', this.dyn_router);
    }

    run() {
        this.server = this.server.listen(9999);

        this.server.on('upgrade', (req, sock, head) => {
            console.log('upgrading connection to WS...');
            const url = new URL(req.url, `ws://${req.headers.host}`);
            const path = url.pathname;

            if (path in this.ws_paths)
            {
                const wss = this.ws_paths[path];
                wss.handleUpgrade(req, sock, head, (ws) => {
                    wss.emit('connection', ws, req);
                });
            }
            else
            {
                sock.destroy();
            }
        });
    }

    add_route(method, pathname, handler) {
        this.dyn_router[method](pathname, handler);
    }

    add_static(dir, mount_point) {
        if (mount_point)
        {
            this.dyn_router.use(mount_point, express.static(dir));
        }
        else
        {
            this.dyn_router.use(express.static(dir));
        }
    }

    add_wss(pathname, connect_fn) {
        const wss = new WebSocketServer({ noServer: true });
        wss.on('connection', connect_fn);
        this.ws_paths[pathname] = wss;
    }
}