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
		.setName('test2')
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

function arrayRemove(arr, value) { 
    
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }

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
	// console.log('Called: ', toon);
    let rioData = axios.get(requestUrl).then(res => {
        return res.data;
    })
    .catch(err => {t
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
	.setThumbnail('https://static.wikia.nocookie.net/wowpedia/images/6/60/AllianceLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123400')  // - find alliance and horde emblem ffs
	.addFields(				
			{ name: '\u200B', value: `${playersString}` },        		
		)
	.setImage('https://tanknotes.com/storage/uploads/2020/11/15/5fb17b8270aadMoTS.png')
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

function millisToMinutesAndSeconds(millis) {
  var minutes = Math.floor(millis / 60000);
  var seconds = ((millis % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}