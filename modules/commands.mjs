import fetch from "node-fetch";
import { readFile, writeFile } from "fs/promises";

//This file implements chat commands.

function time(ctx) {
  let now = new Date();
  let s = now.toTimeString();
  ctx.client.say(ctx.channel, `The current time for Ortho is ${s}.`);
}

function echo(ctx) {
  if (ctx.is_self) return;
  ctx.client.say(ctx.channel, `@${ctx.user["display-name"]} ${ctx.content}`);
}

function parasite_eve(ctx) {
  let str =
    "God Jul! To celebrate X-Mas, I'll be playing Parasite Eve for the first time. Please no spoilers or backseating!";
  ctx.client.say(ctx.channel, str);
}

async function wikipedia(ctx) {
  //https://en.wikipedia.org/api/rest_v1/#/Page%20content/get_page_summary__title_
  const topic = encodeURIComponent(ctx.content);
  const uri = `https://en.wikipedia.org/api/rest_v1/page/summary/${topic}?redirect=true`;
  const response = await fetch(uri);
  if (response.ok) {
    const data = await response.json();
    const summary = data["extract"];
    ctx.client.say(ctx.channel, summary);
  } else {
    const err_msg = `@${ctx.user["display-name"]}, couldn't find a summary for that on Wikipedia. Double-check your spelling, or try using a synonym.`;
    ctx.client.say(ctx.channel, err_msg);
  }
}

function help(ctx) {
  const pastebin = "https://pastebin.com/DfzD6Lry";
  const msg = `I'm a new implementation-in-progress, so I don't have a lot of commands yet, sorry to disappoint you. To see a list of what I can do right now, check out this link: ${pastebin}`;
  ctx.client.say(ctx.channel, msg);
}

function backseat_policy(ctx) {
  const msg =
    "Right now, no backseating or spoilers allowed. Thanks for understanding!";
  ctx.client.say(ctx.channel, msg);
}

function random_roll(ctx) {
  //to match rolls like "!roll 2d12"
  const dice_re = /^[1-9]d\d{1,8}$/;
  //to match rolls like "!roll 2, 32"
  const range_re = /^-?\d{1,8}(?:,| |, )-?\d{1,8}$/;

  const range_roll = (a, b) => {
    const range = Math.max(a, b) - Math.min(a, b);
    const n = Math.random() * range + Math.min(a, b);
    return n >> 0;
  };

  const dice = ctx.content.trim().match(dice_re);
  const range = ctx.content.trim().match(range_re);
  if (dice) {
    const captures = dice[0].match(/\d+/g).map((n) => Number.parseInt(n));
    let arr = [];
    for (let i = 0; i < captures[0]; ++i) {
      arr = [...arr, range_roll(1, 1 + captures[1])];
    }
    const msg = `@${ctx.user["display-name"]}, the outcome is: [${arr.join(
      ", "
    )}]`;
    ctx.client.say(ctx.channel, msg);
  } else if (range) {
    const captures = range[0].match(/\d+/g).map((n) => Number.parseInt(n));
    const r = range_roll(captures[0], captures[1]);
    const msg = `@${ctx.user["display-name"]}, the outcome is: ${r}`;
    ctx.client.say(ctx.channel, msg);
  } else {
    const msg = `@${ctx.user["display-name"]}, Usage: !roll <dice_notation | min max> (ex: "!roll 2d6" or "!roll -12 14") Maximum 9 dice, up to 8 digit numbers in range`;
    ctx.client.say(ctx.channel, msg);
    return;
  }
}

async function weather(ctx) {
  //https://openweathermap.org/current for API info
  const key = process.settings["openweathermap_token"];
  const city_re = /[a-zA-Z][- a-zA-Z]+/;
  const postcode_re = /\d+$/;
  const city = ctx.content.trim().match(city_re);
  const postcode = ctx.content.trim().match(postcode_re);
  if (!(city || postcode)) {
    ctx.client.say(
      ctx.channel,
      `@${ctx.user["display-name"]}, Usage: !weather <city_name[,state_name][,country_name] | postal_code>`
    );
    return;
  }
  const q = city ? `q=${city.join(",")}` : `zip=${postcode[0]}`;
  console.log(
    `https://api.openweathermap.org/data/2.5/weather?${q}&units=metric&lang=en&appid=${key}`
  );
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${q}&units=metric&lang=en&appid=${key}`
  );
  if (response.ok) {
    const data = await response.json();
    const city_name = data.name;
    const desc = data.weather[0].description;
    const temp = data.main.temp;
    const msg = `Weather in ${city_name}: ${desc}. The current tempurature is ${
      temp >> 0
    }C.`;
    ctx.client.say(ctx.channel, msg);
  } else {
    ctx.client.say(
      ctx.channel,
      `@${ctx.user["display-name"]}, I couldn't find info on that location, sorry!`
    );
  }
}

async function set_quote(ctx) {
  if (!ctx.user.mod || !ctx.user["display-name"] == "Orthogonality") return;
  const from = "Orthogonality";
  const quot = ctx.content.trim();
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const datestr = new Date().toLocaleDateString("en-US", options);

  if (quot === "") {
    /*ctx.client.say(
      ctx.channel,
      `@${
        ctx.user[display - name]
      }, Usage: !addquote <quote> (no need to add quotation marks)`
    );*/
    console.log(
      `@${
        ctx.user[display - name]
      }, Usage: !addquote <quote> (no need to add quotation marks)`
    );
    return;
  }

  new_quote = {
    author: ctx.user["display-name"],
    from: from,
    date: datestr,
    quote: quot,
  };

  const json_promise = readFile("quotes.json", {
    encoding: "utf-8",
    flag: "r",
  });
  const q = await json_promise
    .then((v) => JSON.parse(v))
    .catch(() => {
      console.error("Couldn't open quotes.json!");
      return;
    });

  q.quotes = [...q.quotes, new_quote];

  const data = JSON.stringify(q);
  await writeFile("quotes.json", data).catch(() =>
    console.error("Couldn't save quotes file")
  );
  //ctx.client.say(ctx.channel, `Quote saved with index ${q.quotes.length - 1}.`);
  console.log(`Quote saved with index ${q.quotes.length - 1}.`);
}

async function get_quote(ctx) {
  const json_promise = readFile("quotes.json", {
    encoding: "utf-8",
    flag: "r",
  });
  const q = await json_promise
    .then((v) => JSON.parse(v))
    .catch(() => {
      console.error("Couldn't open quotes.json!");
      return;
    });

  let idx = Number.parseInt(ctx.content);
  idx =
    idx < q.quotes.length && idx >= 0
      ? idx
      : (Math.random() * q.quotes.length) >> 0;
  const msg = `"${q.quotes[idx].quote}" - ${q.quotes[idx].from}, ${q.quotes[idx].date}`;
  //ctx.client.say(ctx.channel, msg);
  console.log(msg);
}

//This exports chat commands to the dispatcher.
//The key is the name of the command, and the value is the name of the function.
//Remember to include the '!'
const commands = {
  "!time": time,
  "!echo": echo,
  "!eve": parasite_eve,
  "!wiki": wikipedia,
  "!help": help,
  "!bs": backseat_policy,
  "!roll": random_roll,
  "!weather": weather,
  //"!quote": get_quote,
  //"!addquote": set_quote,
};

Object.freeze(commands);
export { commands as command_list };
