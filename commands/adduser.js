const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const userStore = require('../users.json');
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
				option.setName('realm')
				.setDescription('realm of character')
				.setRequired(true)),								
	async execute(interaction, data) {	

		const currentUsers = userStore.Users;

		console.log('interaction: ', interaction.options._hoistedOptions);

		// console.log({interaction});

		// interaction.reply('add users');
	}
};