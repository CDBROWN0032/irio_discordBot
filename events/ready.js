
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		client.user.setAvatar('./images/logo.png');
		client.user.setActivity("/help -cmd list", {
  			type: "PLAYING"
		});
		console.log(`Ready! Logged in as ${client.user.tag}`);		
	},
};