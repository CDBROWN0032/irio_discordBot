const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, IntegrationApplication } = require('discord.js');
const userStore = require('../users.json');
const userStorePath = './users.json';
var pjson = require('../package.json');
const logo = 'https://i.imgur.com/vj6aVnP.png';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('adduser')
		.setDescription('register new users to bot')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('name of character')
				.setRequired(true))
		.addStringOption(option =>
				option.setName('server')
				.setDescription('server of character')
				.setRequired(true)),								
	async execute(interaction) {	

		const savedUsers = userStore.Users;
		let currentUsers = savedUsers.map(item => item.owner).filter((value, index, self) => self.indexOf(value) === index)

		let newCharacter = {};
		interaction.options._hoistedOptions.forEach((option) => {
			let category = option.name;
			newCharacter[category] = option.value;
		})
		newCharacter.owner = interaction.user.tag;
		savedUsers.push(newCharacter);

		const currentUsersFile = fs.readFileSync(userStorePath);
		const currentUsersData = JSON.parse(currentUsersFile);
		currentUsersData.Users.push(newCharacter);
		var updatedUsers = JSON.stringify(currentUsersData);
		await fs.writeFileSync(userStorePath, updatedUsers, (err) => {
			if(err) throw err;
		})

		console.log(`${interaction.user.tag} registered ${newCharacter.name} ${newCharacter.server} `);
		interaction.reply(`Registered Character:  ${newCharacter.name} ${newCharacter.server}`);
	}
};