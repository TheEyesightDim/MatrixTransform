import { msg_dispatcher } from "./dispatchers.mjs";

function shutdown() {
  process.db.close();
  process.kill(process.pid, "SIGTERM");
}

async function dbg(...args) {
  //allows for debugging chat commands "silently" with /dbg !cmd args...

  const channel = "<<Debug>>";
  const user = {
    "display-name": "dbg",
  };
  const msg = args.join(" ");
  const is_self = false;
  //const command = args[0];
  //const content = args.slice(1).join(" ");
  const client = {
    say: console.log,
  };

  await msg_dispatcher(client)(channel, user, msg, is_self);
}

const console_commands = {
  "/shutdown": shutdown,
  "/dbg": dbg,
};

export function console_call(input) {
  const list = input.trim().split(/\s/);
  if (console_commands.hasOwnProperty(list[0])) {
    console_commands[list[0]](...list.slice(1));
  } else {
    console.log(`Invalid command "${list[0]}".`);
  }
}
