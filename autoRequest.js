const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const userStore = require('./users.json');
const keyStorePath = './processedKeys.json';
const rioConfig = {
	hostName: 'https://raider.io',
	method: 'GET',
	fields: 'mythic_plus_recent_runs',
	region: 'us',
	getUser: 'api/v1/characters/profile',
	getAffixes: 'api/v1/mythic-plus/affixes?region=us&locale=en'
};
const logo = 'https://i.imgur.com/p9YJXv4.png';
const pjson = require('./package.json');
// var timeFloor = new Date();
// timeFloor.setHours( timeFloor.getHours() -1 );

const sendRequest = async (channel) => {

	// const today = new Date();
	var timeFloor = new Date();
	// timeFloor.setHours(timeFloor.getHours() - 12);
	timeFloor.setDate(timeFloor.getDate() - 3);
	// console.log(`update process started for Channel: ${channel}...`);

	const toons = userStore.Users;
	const allRioData = await getAll(toons, getRioData);

	let allRecentRuns = [];
	allRioData.forEach((rioData) => {		
		if (rioData !== undefined && rioData.mythic_plus_recent_runs.length > 0) {
			rioData.mythic_plus_recent_runs.forEach(run => {
				allRecentRuns.push({ run });
			})
		}
	})

	// if (allRecentRuns.length < 1) {
	// 	console.log(`process exited: no updates`)
	// 	return false;
	// }

	let filteredRecentKeys = [];
	allRecentRuns.forEach((key) => {
		let runDate = new Date(key.run.completed_at);
		let isProcessed = checkProcessedKeys(key.run.url);
		if ((runDate > timeFloor) && !isProcessed) {
			filteredRecentKeys.push(key.run);
		}
	})

	// if (filteredRecentKeys.length < 1) {
	// 	console.log(`process exited: no updates`)
	// 	return false;
	// }

	const keyIdx = 'url';
	const uniqueKeys = [...new Map(filteredRecentKeys.map(item => [item[keyIdx], item])).values()];	

	uniqueKeys.forEach((key) => {
		sendEmbed(channel, key);
	})	
};

const checkProcessedKeys = (key) => {
	let keyStoreFile = fs.readFileSync(keyStorePath);
	let keyStore = JSON.parse(keyStoreFile);
	return keyStore.Keys.some(k => k === key);
}

const saveProcessedKey = async (key) => {
	const pKeys = fs.readFileSync(keyStorePath);
	const pKeysData = JSON.parse(pKeys);
	pKeysData.Keys.push(key);
	var processedKey = JSON.stringify(pKeysData);
	fs.writeFileSync(keyStorePath, processedKey, (err) => {
		if (err) console.log(`Error Processing Key: ${err}`);
	})
}

const setStars = (upgradeCount) => {
	switch (upgradeCount) {
		case 1:
			return ':star:';
		case 2:
			return `:star: :star:`;
		case 3:
			return ':star: :star: :star:';
		default:
			return ':x:';
	}
}

const getRequestUrl = (user) => {
	return `${rioConfig.hostName}/${rioConfig.getUser}?region=${rioConfig.region}&realm=${user.server}&name=${user.name}&fields=${rioConfig.fields}`;
}

const getAffixUrl = () => {
	return `${rioConfig.hostName}/${rioConfig.getAffixes}`;
}

const getAll = async (list, asyncFn) => {
	const promises = [];

	list.forEach(x => {
		promises.push(asyncFn(x));
	});

	return Promise.all(promises);
}

const getRioData = (toon) => {
	const requestUrl = getRequestUrl(toon);
	let rioData = axios.get(requestUrl).then(res => {
		return res.data;
	})
		.catch(err => {
			console.error(`Player Request Failed: ${toon.name} ${toon.server}`)
			console.error('Error: ', err.message);
		})

	return Promise.resolve(rioData);
}

const sendEmbed = async (channel, uniqueKeys) => {
	let dungeon = uniqueKeys;
	let playersString = '';
	let players = await getPlayers(uniqueKeys.url);

	players.forEach((player, idx) => {
		let emblem = idx === 0 ? ':shield:' : idx === 1 ? ':green_heart:' : ':crossed_swords:';
		playersString += `${emblem} ${player.name} (${player.spec} ${player.class}) - ${player.score}\n`;
	})

	//let affixes = dungeon.affixes;
	const rioEmbed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle(`${dungeon.short_name} +${dungeon.mythic_level} - ${millisToMinutesAndSeconds(dungeon.clear_time_ms)}/${millisToMinutesAndSeconds(dungeon.par_time_ms)} (${(dungeon.clear_time_ms / dungeon.par_time_ms).toLocaleString("en", { style: "percent" })})  -  ${setStars(dungeon.num_keystone_upgrades)}`)
		.setURL(`${dungeon.url}`)
		.setAuthor(`iRio v${pjson.version}`)
		.setDescription(`${setAffixes(dungeon)}`)
		.setThumbnail('https://static.wikia.nocookie.net/wowpedia/images/6/60/AllianceLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123400')
		//getFactionEmblem()
		.addFields(
			{ name: '\u200B', value: `${playersString}` }
		)
		.setImage(getDungeonImage(dungeon.short_name))
		.setTimestamp(new Date(dungeon.completed_at))
		.setFooter('Completed', logo)

	channel.send({ embeds: [rioEmbed] });
	await saveProcessedKey(dungeon.url);
	console.log(`Processed Key: ${dungeon.short_name} +${dungeon.mythic_level}`);
}

const setAffixes = (dungeon) => {
	let affixes = "";
	dungeon.affixes.forEach(affix => { affixes += `${affix.name}   `; });
	return affixes;
}

const getPlayers = async (url) => {
	const response = await axios.get(url)
	let characters = [];
	if (response.status === 200) {
		const html = response.data;
		const $ = cheerio.load(html);

		$('tbody').children().each((i, el) => {
			let charString = $(el).children('[data-label="Character"]').text();
			let score = $(el).children('[data-label="Score"]').text();
			if (charString.length > 0) {
				let items = charString.split(' ');
				let character = {}

				switch (items.length) {
					case 3:
						character.spec = items[0];
						character.class = items[1];
						character.name = items[2];
						break;
					case 4:
						character.spec = `${items[0]} ${items[1]}`
						character.class = items[2];
						character.name = items[3];
						break;
					default:
						break;
				}


				character.score = score;
				characters.push(character);
			}
		})
	}
	return characters;
}

const getFactionEmblem = (faction) => {
	switch (faction) {
		case 'alliancebanner1': return 'https://static.wikia.nocookie.net/wowpedia/images/6/60/AllianceLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123400'; break;
		case 'hordebanner1': return 'https://static.wikia.nocookie.net/wowpedia/images/e/e2/HordeLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123137'; break;
		default: return 'https://blogs.library.duke.edu/bitstreams/files/2016/06/indian_head.jpg'; break;
	}
}

const getDungeonImage = (dungeon) => {

//https://worldofwarcraft.com/en-us/game/pve/leaderboards

	switch (dungeon) {
		case 'NW': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blte1ed2df6958891bb/5fbc2f3c21b96a46dc51a9b1/NecroticWake_Masthead.jpg'; break;
		case 'DOS': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blte004d75bf87a697a/5fbc2f32a9e913483b74d52f/TheOtherSide_Masthead.jpg'; break;
		case 'HOA': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt4752e815a80607d4/5fbc2f3b0b0a825636795f4d/HallsOfAtonement_Masthead.jpg'; break;
		case 'MISTS': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt1cabb390531166e9/5fbc2f319fbb9857903d99b8/TirnaScitheDungeon_Masthead.jpg'; break;
		case 'PF': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltaabb8b49689b5614/5fbc2f3b46cf5a5635c5d3e6/PlagueFallDungeon_Masthead.jpg'; break;
		case 'SD': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltf5a3620c49785a38/5fbc2f3bae5aee5796129654/SanguineDepthDungeon_Masthead.jpg'; break;
		case 'SOA': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt04641bdb32cc333d/5fbc2f328acca34834e646d1/SpiresofAscension_Masthead.jpg'; break;
		case 'TOP': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt63092561516428b8/5fbc2f320100b746db953fb0/TheaterOfPain_Masthead.jpg'; break;
		case 'GMBT':
		case 'STRT': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt04b224ffd75e5344/62156466e47e3d2eff20ff48/Tazavesh_Veiled_Market_Masthead.jpg'; break;
		case 'ID': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltbff485da7157b7ed/62e85d7c9aaaf31114dc7e27/Iron_Docks.jpg'; break;
		case 'GD': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt378bceb26d1d6cda/62e85d7c1aa84c11737bcecf/Grimrail_Depot.jpg'; break;
		case 'YARD':
		case 'WORK': return 'https://bnetcmsus-a.akamaihd.net/cms/template_resource/rt/RTZQ5TECTAS61578611286324.jpg'; break;
		case 'LOWR': 
		case 'UPPR': return 'https://bnetcmsus-a.akamaihd.net/cms/template_resource/WK5UQJR8MKMG1490370283470.jpg'; break;
		default: return 'https://blogs.library.duke.edu/bitstreams/files/2016/06/indian_head.jpg'; break;
	}
}

function millisToMinutesAndSeconds(millis) {
	var minutes = Math.floor(millis / 60000);
	var seconds = ((millis % 60000) / 1000).toFixed(0);
	return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

const getAffixes = async (channel) => {
	const requestUrl = getAffixUrl();	
	axios.get(requestUrl).then(result => {
		const affixData = result.data;
		const rioEmbed = new MessageEmbed()
			.setColor('#0099ff')
			.setTitle(`Weekly Affixes`)
			.setURL(`${affixData.leaderboard_url}`)
			.setAuthor(`${pjson.name} v${pjson.version}`, logo)
			.setDescription(`${affixData.title}`)
			.setImage('https://pbs.twimg.com/media/EhLfNGQXYAUURhq.jpg')
			.setTimestamp()
			.setFooter(`${pjson.name} v${pjson.version}`, logo)

		channel.send({ embeds: [rioEmbed] });
	}).catch(err => console.log(`Error: ${err}`));
}

exports.getAffixes = getAffixes;
exports.sendRequest = sendRequest;