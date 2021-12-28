function shutdown() {
  process.kill(process.pid, "SIGTERM");
}

const console_commands = {
  "/shutdown": shutdown,
};

export function console_call(input) {
  const list = input.trim().split(/\s/);
  if (console_commands.hasOwnProperty(list[0])) {
    console_commands[list[0]](...list.slice(1));
  } else {
    console.log(`Invalid command "${list[0]}".`);
  }
}
