//We'll use ECMAScript modules in our code; CommonJS modules are relegated to ./modules/common.cjs
import { tmi } from "./modules/common.cjs";

const client = new tmi.Client({
  channels: ["orthogonality"],
});

client.connect();

const dispatcher_chatmsg = (channel, tags, msg, is_from_self) => {
  console.log(`[${channel}] ${tags["display-name"]}: ${msg}`);
};

client.on("message", dispatcher_chatmsg);
