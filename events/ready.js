
const cron = require('node-cron');
const userStore = require('../users.json');
const channelId = '917932839427784757';

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);		
		client.channels.cache.get(channelId).send("iRio is Alive!");
		// cron.schedule('*/1 * * * *', function() {  			// second minute hour day month year
		// 	let currentTime = new Date().toLocaleString();
		// 	console.log(`Cron Heartbeat: ${currentTime}`)
		// });
	},
};