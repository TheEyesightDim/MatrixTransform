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
	//log JSON response to help with documentation and debuging
	console.log(JSON.stringify(ctx.user, null, 4));
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
	if (response.ok)
	{
		const data = await response.json();
		const summary = data["extract"];
		ctx.client.say(ctx.channel, summary);
	} else
	{
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
	if (dice)
	{
		const captures = dice[0].match(/\d+/g).map((n) => Number.parseInt(n));
		let arr = [];
		for (let i = 0; i < captures[0]; ++i)
		{
			arr = [...arr, range_roll(1, 1 + captures[1])];
		}
		const msg = `@${ctx.user["display-name"]}, the outcome is: [${arr.join(
			", "
		)}]`;
		ctx.client.say(ctx.channel, msg);
	} else if (range)
	{
		const captures = range[0].match(/\d+/g).map((n) => Number.parseInt(n));
		const r = range_roll(captures[0], captures[1]);
		const msg = `@${ctx.user["display-name"]}, the outcome is: ${r}`;
		ctx.client.say(ctx.channel, msg);
	} else
	{
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
	if (!(city || postcode))
	{
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
	if (response.ok)
	{
		const data = await response.json();
		const city_name = data.name;
		const desc = data.weather[0].description;
		const temp = data.main.temp;
		const msg = `Weather in ${city_name}: ${desc}. The current temperature is ${temp >> 0}C.`;
		ctx.client.say(ctx.channel, msg);
	} else
	{
		ctx.client.say(
			ctx.channel,
			`@${ctx.user["display-name"]}, I couldn't find info on that location, sorry!`
		);
	}
}

async function add_quote(ctx) {
	//https://regex101.com/r/kyF4kC/1 to match format "[--from:[@]user] quote"
	const usage = 'Usage: !addquote [--from:[@]username] "quote_string"';
	const re = /^(?:--from:@?(?<author>\w+)\s+)?(?<quote>".+")$/mu;
	const matches = ctx.content.match(re);
	let [author, quote] = matches ? matches.slice(1) : [null, null];
	author = author
		? author
		: ctx.channel[1].toUpperCase() + ctx.channel.slice(2);
	const quoted_by = ctx.user["display-name"];
	const unix_timestamp = Date.now();

	if (!quote)
	{
		ctx.client.say(ctx.channel, `@${ctx.user["display-name"]}, ${usage}`);
		return;
	}

	const db = process.db;
	const result = db
		.prepare(
			"INSERT INTO quotes (author, quoted_by, quote, date) VALUES (?,?,?,?)"
		)
		.run(author, quoted_by, quote, unix_timestamp);

	if (result.changes === 1)
	{
		ctx.client.say(
			ctx.channel,
			`Quote table updated with quote #${result.lastInsertRowid}.`
		);
	} else
	{
		ctx.client.say(
			ctx.channel,
			`There was some kind of issue inserting the new quote, check the log!`
		);
	}
}

async function get_quote(ctx) {
	const db = process.db;
	let max = 0;
	try
	{
		max = db.prepare("SELECT COUNT(id) FROM quotes").pluck().get();
	} catch (e)
	{
		console.log(e);
		return;
	}
	let id = Number.parseInt(ctx.content);
	id = isNaN(id) ? Math.ceil(Math.random() * max) : id;
	const row = db
		.prepare("SELECT author, quoted_by, quote, date FROM quotes WHERE id = ?")
		.get(id);
	const date = new Date(row.date).toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});
	const msg = `Quote #${id}: ${row.quote} from ${row.author}, quoted by @${row.quoted_by} on ${date}`;
	ctx.client.say(ctx.channel, msg);
	//console.log(msg);
}

async function jisho(ctx) {
	const input = ctx.content.trim().normalize("NFKC");
	const usage = `@${ctx.user["display-name"]}, Usage: !jisho <search_term> [num_results] ...The search term should contain no spaces, and the number of results to show is limited to 3.`;
	const arg_regex = /^(?<term>\S+)(?<count>[\s][123])?$/; //this regexp is only guaranteed to work on input normalized with compatibility decomposition, followed by canonical composition.
	if (!arg_regex.test(input))
	{
		ctx.client.say(ctx.channel, usage);
		return;
	}
	const { term = "", count = "1" } = arg_regex.exec(input).groups;
	const uri = `https://jisho.org/api/v1/search/words?keyword=${term}`;
	const response = await fetch(uri);

	if (response.ok)
	{
		const { data = [] } = await response.json();
		if (data.length === 0) 
		{
			ctx.client.say(ctx.channel, `No entries found for ${term}, sorry.`);
			return;
		}
		for (const datum of data.slice(0, count)) //count will be coerced to Number type
		{
			const entry = datum.japanese[0].word;
			const reading = datum.japanese[0].reading;
			const def = datum.senses[0].english_definitions.join(", ");
			const speech = datum.senses[0].parts_of_speech.join(", ");
			ctx.client.say(ctx.channel, `Entry: ${entry} | Reading: ${reading} | Definition: ${def} | Part of speech: ${speech}`);
		}
	}
}

async function lurk(ctx) {
	ctx.client.say(ctx.channel, `Enjoy your lurk! Thanks for stopping by, ${ctx.user["display-name"]}. Much love MeikoLove`);
}

//This exports chat commands to the dispatcher.
//The key is the name of the command, and the value is the name of the function.
//Remember to include the '!'
const commands = {
	"!time": { fn: time, needs_mod: false },
	"!echo": { fn: echo, needs_mod: false },
	"!eve": { fn: parasite_eve, needs_mod: false },
	"!wiki": { fn: wikipedia, needs_mod: false },
	"!help": { fn: help, needs_mod: false },
	"!bs": { fn: backseat_policy, needs_mod: false },
	"!roll": { fn: random_roll, needs_mod: false },
	"!weather": { fn: weather, needs_mod: false },
	"!quote": { fn: get_quote, needs_mod: false },
	"!addquote": { fn: add_quote, needs_mod: true },
	"!jisho": { fn: jisho, needs_mod: false },
	"!lurk": { fn: lurk, needs_mod: false },
};

Object.freeze(commands);
export { commands as command_list };
