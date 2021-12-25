import { command_list } from "./commands.mjs";
import { watcher } from "./watchers.mjs";

function msg_dispatcher(client_obj) {
  const callback = (ch, user, msg, is_self) => {
    let command = msg.match(/^![a-zA-Z0-9]+/);
    let content = command ? msg.replace(command, "").trim() : msg;

    let context = {
      channel: ch,
      user: user,
      msg: msg,
      command: command,
      content: content,
      is_self: is_self,
      client: client_obj,
    };

    if (command) {
      if (command_list.hasOwnProperty(command)) {
        command_list[command](context);
      } else {
        client_obj.say(
          ch,
          `@ ${user["display-name"]}, ${command} is not a valid command (yet...). Try !help.`
        );
      }
    } else {
      watcher(context);
    }
  };

  return callback;
}

export { msg_dispatcher };
