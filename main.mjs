//We'll use ECMAScript modules in our code;
//CommonJS modules are relegated to ./modules/common.cjs
//import { tmi } from "./modules/common.cjs";
import pkg from "tmi.js";
const tmi = pkg;
import { readFile } from "fs/promises";
import { msg_dispatcher } from "./modules/dispatchers.mjs";

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

const client = new tmi.Client(settings_obj);

client.connect();

process.tmi_client = client;

client.on("message", msg_dispatcher(client));
