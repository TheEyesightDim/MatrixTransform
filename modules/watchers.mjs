import fetch from 'node-fetch';

//This file contains functions that run for all non-command chat messages
async function openai(ctx) {
  if (!ctx.content.endsWith('?')) return;
  const key = process.settings["openai_key"];
  const data = {
    prompt: ctx.content,
    max_tokens: 100,
    temperature: 0.60,
    top_p: 1,
    frequency_penalty: 0.4,
    presence_penalty: 0
  };

  const opts = {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify(data)
  };

  console.log(JSON.stringify(opts, null, 4));

  const url = "https://api.openai.com/v1/engines/davinci/completions";
  const res = await fetch(url, opts);
  if (res.ok)
  {
    //const a = res.json();
    const ans = await res.json();
    const a = ans.choices[0].text;
    ctx.client.say(ctx.channel, a);
  }
  //console.log(res);

}

export async function watcher(ctx) {
  //await openai(ctx);
}
