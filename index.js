const { Client, Intents, Collection } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs');
const cron = require('node-cron');
const arq = require('./autoRequest.js');


const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.login(token);

console.log('Cron Started');
const scheduler = cron.schedule('0 */1 * * *', function () {
	//const channelId = '917932839427784757'; // test server
	const channelId = '920471658794467358'; // pogging-willow 
	const channel = client.channels.cache.get(channelId);
	arq.sendRequest(channel);
});

const schedulerTwo = cron.schedule('0 11 * * Tue', function () {
	const channelId = '920471658794467358'; // pogging-willow 
	const channel = client.channels.cache.get('920471658794467358');
	arq.getAffixes(channel);
});