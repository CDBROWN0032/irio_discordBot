const cron = require('node-cron');
const userStore = require('../users.json');
const channelId = '917932839427784757';

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);
		// client.channels.cache.get(channelId).send("Bot Started");
		// cron.schedule('* * * * * *', function() {  			
			//client.channels.cache.get(channelId).send("Cron Ping");
		// });

		//cron timer
		//multi character logic 

		const allUsers = userStore.Users;

	},
};