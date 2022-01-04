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
import { executionAsyncResource } from "async_hooks";

const read = readline.createInterface(stdin, stdout);

const json_promise = readFile("settings.json", {
  encoding: "utf-8",
  flag: "r",
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

process.db.backup(`res/backup-${Date.now()}.db`)
  .then(() => console.log('Database backup sucessful.'))
  .catch((e) => console.log(`Database backup failed: ${e}`));

const client = new tmi.Client(settings_obj);

client.connect();

client.on("message", msg_dispatcher(client));

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
