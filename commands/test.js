const cheerio = require('cheerio');
const axios = require('axios');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, IntegrationApplication } = require('discord.js');
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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('test')
		.setDescription('parse tester'),
	async execute(interaction) {	
		console.log('running');
		await getParses();
		console.log('ran');
		// const result = await getEmbed(parses);
		// interaction.reply({ embeds: [result]});
	}
};

const getEmbed = async (parses) => {
	
	const parseString = '';
	parses.forEach((parse, idx) => {
		// parseString += `${idx} ${parse}\n`;
		console.log(parse);
	});

	console.log('parseString', parseString);



	return embed = new MessageEmbed()
		.setColor('#0099ff')
		.setTitle('Parse Test')
		.setAuthor(`iRio v${pjson.version}`)
		.setDescription("Parse Test")
		.setThumbnail('https://static.wikia.nocookie.net/wowpedia/images/6/60/AllianceLogo.png/revision/latest/scale-to-width-down/250?cb=20180419123400')		
		// .addFields(
		// 	{ name: '\u200B', value: `${parseString}` }
		// )
		.setImage('https://tanknotes.com/storage/uploads/2021/06/28/60da1ded23a5bsanctum_zone.webp')
		.setTimestamp(new Date())
		.setFooter('TEST TEST TEST', logo)
}

const getParses = async () => {
	console.log('getting');
	const response = await axios.get("https://www.warcraftlogs.com/character/us/tichondrius/oktobrr#difficulty=1");
	// let parses = [];
	if (response.status === 200) {		
		const html = response.data;
		const $ = cheerio.load(html);
		// console.log(response.data);

		// const container = $('div.zone-table-and-loading-container').first('.zone-table-container').html();
		const container = $('.zone-table-container');
		console.log(container);

		// $(".raids-and-zones-container").find('#boss-table-28').children('tbody').children().each((i, el) => {
		// 	console.log(el);
		// 	console.log(i);
		// 	//all table rows
		// 	let parse = $(el).find('.hist-cell').text().trim();
		// 	parses.push(parse);
		// })
	}
	console.log('got');
	// return parses;
}