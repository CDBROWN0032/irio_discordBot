const cheerio = require('cheerio');
const axios = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const userStore = require('../users.json');
const rioConfig = {
    hostName: 'https://raider.io',
    method: 'GET',
    fields: 'mythic_plus_recent_runs',
    region: 'us',
    getUser: 'api/v1/characters/profile'
};
const logo = 'https://i.imgur.com/p9YJXv4.png';
const pjson = require('../package.json');
const today = new Date();
const dateFloor = new Date(today.setDate(today.getDate()-5)); //5 days ago


module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('multi-user test'),
	async execute(interaction) {	
		interaction.reply('Running unique key and user test');

 		const toons = userStore.Users;
		const allRioData = await getAll(toons, getRioData);

		let allRecentRuns = [];
		allRioData.forEach((rioData) => {
			let recentRuns = rioData.mythic_plus_recent_runs;
			allRecentRuns.push({ runs: recentRuns });
		})

		let filteredRecentKeys = [];
		allRecentRuns.forEach((recentRun) => {
			recentRun.runs.forEach((key) => {				
				let runDate = new Date(key.completed_at);
				if (runDate > dateFloor){					
					filteredRecentKeys.push(key);
				}
			})			
		})

		const keyIdx = 'url';
		const uniqueKeys = [...new Map(filteredRecentKeys.map(item => [item[keyIdx], item])).values()];
		
		 uniqueKeys.forEach(key => {
			 sendEmbed(interaction, key);
		 })
		
	}
};

const getRequestUrl = (user) => {
    return `${rioConfig.hostName}/${rioConfig.getUser}?region=${rioConfig.region}&realm=${user.server}&name=${user.name}&fields=${rioConfig.fields}`;
}

const getAll = async(list, asyncFn) => {
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
        console.error('Error: ', err.message);
    })

    return Promise.resolve(rioData);
}

const sendEmbed = async(interaction, uniqueKeys) => {
	let dungeon = uniqueKeys;

	let playersString = '';
	let players = await getPlayers(uniqueKeys.url);

	players.forEach((player, idx) => {
		let emblem = idx === 0 ? ':shield:' : idx === 1 ? ':green_heart:' : ':crossed_swords:';
		playersString += `${emblem} ${player.name} (${player.spec} ${player.class}) - ${player.score}\n`;
	})

	let affixes = dungeon.affixes;
	const exampleEmbed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle(`${dungeon.short_name} +${dungeon.mythic_level}   -   ${millisToMinutesAndSeconds(dungeon.clear_time_ms)}/${millisToMinutesAndSeconds(dungeon.par_time_ms)} (${(dungeon.clear_time_ms / dungeon.par_time_ms).toLocaleString("en", {style: "percent"})})`)
	.setURL(`${dungeon.url}`)
	.setAuthor(`${pjson.name} ${pjson.version}`, logo)
	.setDescription(`${affixes[0].name} - ${affixes[1].name} - ${affixes[2].name} - ${affixes[3].name}`)
	.setThumbnail('https://static.wikia.nocookie.net/wowpedia/images/6/60/AllianceLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123400')
	//getFactionEmblem()
	.addFields(				
			{ name: '\u200B', value: `${playersString}` },        		
		)
	.setImage(getDungeonImage(dungeon.short_name))
	.setTimestamp()		
	.setFooter(`${pjson.name} ${pjson.version}`, logo)

	interaction.channel.send({ embeds: [exampleEmbed] });
}

const getPlayers = async(url) => {
	const response = await axios.get(url)    
	let characters = [];
	if(response.status === 200) {
		const html = response.data;
		const $ = cheerio.load(html); 

		$('tbody').children().each((i, el) => {
			let charString = $(el).children('[data-label="Character"]').text();
			let score = $(el).children('[data-label="Score"]').text();
			if(charString.length > 0){
				let items = charString.split(' ');
				let character = {}

				switch (items.length) {
					case 3:
						character.spec =  items[0];
						character.class =  items[1];
						character.name =  items[2];												
						break;
					case 4:
						character.spec =  `${items[0]} ${items[1]}`
						character.class =  items[2];
						character.name =  items[3];
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

	switch (dungeon) {
		case 'NW': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blte1ed2df6958891bb/5fbc2f3c21b96a46dc51a9b1/NecroticWake_Masthead.jpg'; break;
		case 'DOW': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blte004d75bf87a697a/5fbc2f32a9e913483b74d52f/TheOtherSide_Masthead.jpg'; break;
		case 'HOT': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt4752e815a80607d4/5fbc2f3b0b0a825636795f4d/HallsOfAtonement_Masthead.jpg'; break;
		case 'MISTS': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt1cabb390531166e9/5fbc2f319fbb9857903d99b8/TirnaScitheDungeon_Masthead.jpg'; break;
		case 'PF': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltaabb8b49689b5614/5fbc2f3b46cf5a5635c5d3e6/PlagueFallDungeon_Masthead.jpg'; break;
		case 'SD': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/bltf5a3620c49785a38/5fbc2f3bae5aee5796129654/SanguineDepthDungeon_Masthead.jpg'; break;
		case 'SOA': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt04641bdb32cc333d/5fbc2f328acca34834e646d1/SpiresofAscension_Masthead.jpg'; break;
		case 'TOP': return 'https://images.blz-contentstack.com/v3/assets/blt3452e3b114fab0cd/blt63092561516428b8/5fbc2f320100b746db953fb0/TheaterOfPain_Masthead.jpg'; break;
		default: return 'https://blogs.library.duke.edu/bitstreams/files/2016/06/indian_head.jpg'; break;			
	}
}

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}





