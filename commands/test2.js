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
var pjson = require('../package.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test2')
		.setDescription('test rio'),
	async execute(interaction) {	
 		const toons = userStore.Users;
		const newTest = getToonsRioData(toons, interaction);
 		//const result = await awaitAll(toons, getRioData)		
  		//playgroundEmbed(interaction, result[0]);		
	}
};

const getToonsRioData = (toons, interaction) => {
	let toonOutput = [];

	toons.forEach(toon => {
		toonOutput.push({name: toon.name, value: toon.server});
	})

	const embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Toon Test')
	.addFields(toonOutput);
	interaction.channel.send({ embeds: [embed] });
}

const getRequestUrl = (user) => {
    return `${rioConfig.hostName}/${rioConfig.getUser}?region=${rioConfig.region}&realm=${user.server}&name=${user.name}&fields=${rioConfig.fields}`;
}

function awaitAll(list, asyncFn) {
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
    .catch(err => {t
        console.error('Error: ', err.message);
    })

    return Promise.resolve(rioData);
}

const playgroundEmbed = async(interaction, result) => {
	let dungeon = result.mythic_plus_recent_runs[0];

	let playersString = '';
	let players = await getPlayers(dungeon.url);

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
				character.spec =  items[0];
				character.class =  items[1];
				character.name =  items[2];
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