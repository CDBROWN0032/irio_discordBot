const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('../config.json');
const fs = require('fs');
const cron = require('node-cron');
const userStore = require('../users.json');
const channelId = '917932839427784757';

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);		
		client.channels.cache.get(channelId).send("iRio is Alive!");
		cron.schedule('* 1 * * *', function() {  			// minute hour day month year
			// client.channels.cache.get(channelId).send("Cron Ping");
			let currentTime = new Date().toLocaleString();
			console.log(`Cron Heartbeat: ${currentTime}`)
		});

		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
		const commands = [];
		for (const file of commandFiles){
    		const command = require(`../commands/${file}`);
    		commands.push(command.data.toJSON());
		}

		const rest = new REST({ version: '9' }).setToken(token);
		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
		.then(() => console.log('Successfully registered application commands.'))
		.catch(console.error);
	},
};