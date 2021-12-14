const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const userStore = require('../users.json');
var pjson = require('../package.json');
// const logo = 'https://i.imgur.com/p9YJXv4.png';
const logo = 'https://i.imgur.com/vj6aVnP.png';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('users')
		.setDescription('users registered to bot'),
	async execute(interaction) {	
		console.log(`${interaction.user.tag} requested users`);
 		const toons = userStore.Users;
		const result = await displayToonsOwnerData(toons, interaction);
		interaction.reply({ embeds: [result] });
	}
};

const displayToonsOwnerData = async(toons) => {
	let owners = [];
	let toonOutput = [];

	toons.forEach(toon => {
		let owner = toon.owner;
		let ownerExists = toonOutput.some((selectedOutput) => {
			return owner === selectedOutput.name;
		});
		if(!ownerExists){
			toonOutput.push({ name: `${owner}`, value: '' })
		}
	})

	toons.forEach(toon => {		
		let owner = toon.owner;
		let ownerIdx = toonOutput.findIndex(x => x.name === owner);
		toonOutput[ownerIdx].value += `${toon.name} ${toon.server}\n`;
	})

	return embed = new MessageEmbed()
	.setColor('#0099ff')
	.setTitle('Registered Users')
	.addFields(toonOutput)
	.setTimestamp()			
	.setFooter(`${pjson.name} v${pjson.version}`, logo)	
}