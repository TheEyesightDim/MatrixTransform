import pkg from "tmi.js";
const tmi = pkg;
import { readFile } from "fs/promises";
import { msg_dispatcher } from "./modules/dispatchers.mjs";
//import { console_call } from "./modules/console_commands.mjs";
//import * as readline from "readline/promises";
//import { stdin, stdout } from "process";

export class Chatbot {
    constructor(settings_path) {
        const json_promise = readFile(settings_path, {
            encoding: "utf-8",
            flag: "r",
        });

        this.settings = await json_promise
            .then((v) => JSON.parse(v))
            .catch(() => {
                console.error("Couldn't open settings.json!");
            });

        this.client = new tmi.Client(this.settings);

        this.msg_dispatcher = msg_dispatcher;

    }

    run() {
        this.client.on('message', this.msg_dispatcher(this.client));
    }
}