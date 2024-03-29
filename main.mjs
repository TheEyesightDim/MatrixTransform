//We'll use ECMAScript modules in our code;
//CommonJS modules are relegated to ./modules/common.cjs
//import { tmi } from "./modules/common.cjs";
import pkg from "tmi.js";
const tmi = pkg;
import { readFile } from "fs/promises";
import { msg_dispatcher } from "./modules/dispatchers.mjs";
import { console_call } from "./modules/console_commands.mjs";
import * as readline from "readline/promises";
import { stdin, stdout } from "process";
import Database from "better-sqlite3";
import { LocalServer } from "./modules/local_server.mjs";

const read = readline.createInterface(stdin, stdout);

const json_promise = readFile("settings.json", {
  encoding: "utf-8",
});
const settings_obj = await json_promise
  .then((v) => JSON.parse(v))
  .catch(() => {
    console.error("Couldn't open settings.json!");
    return;
  });

//I just want these things to be available everywhere without passing it around.
process.settings = settings_obj;
process.db = new Database("res/user.db", { verbose: console.log });
process.auth_header = {
  'Client-Id': settings_obj.options?.clientId,
  'Authorization': `Bearer ${settings_obj.app_access_token}`
};
//This is for session-persistent storage used by commands
process.globals = {};

//backup db
process.db.backup(`res/backup-${Date.now()}.db`)
  .then(() => console.log('Database backup sucessful.'))
  .catch((e) => console.log(`Database backup failed: ${e}`));

const client = new tmi.Client(settings_obj);

client.connect();

client.on("message", msg_dispatcher(client));

///test
const server = new LocalServer();
server.add_static('static');
server.add_wss('/socktest', (ws) => {
  console.log('connected to socktest');
  ws.send(JSON.stringify({ content: "<p>Connected.</p>" }));
});
server.run();
///endtest

while (true)
{
  const input = await read.question(">>>");
  if (/^\s*\/\w+/.test(input))
  {
    console_call(input);
  } else
  {
    client.say("orthogonality", input);
  }
}
