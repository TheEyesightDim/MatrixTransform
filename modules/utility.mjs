//This file is for utility functions to be used by commands,
//and implementing bot functionality that would be better off wrapped into
//their own isolated functions.

import fetch from "node-fetch";

export async function get_twitch_user_data(username) {
	const url_get_user = `https://api.twitch.tv/helix/users?login=${username.toLowerCase()}`;
	const opts = { headers: process.auth_header };
	const ch_info = await fetch(url_get_user, opts)
		.then(r => r.json())
		.then(usr => {
			console.log(usr);
			const url_get_channel_info = `https://api.twitch.tv/helix/channels?broadcaster_id=${usr.data[0].id}`;
			return fetch(url_get_channel_info, opts);
		});

	return ch_info.json();
}