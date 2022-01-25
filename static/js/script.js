'use strict';

const update = (event) => {
    const data = JSON.parse(event.data);
    const node = document.getElementById("ws-content");
    node.innerHTML = data.content;
};

(function main() {
    const ws = new WebSocket("ws://localhost:9999/socktest");
    ws.onmessage = update;
})();
