const axios = require('axios');
const fs = require('fs');
const Discord = require('discord.io');
const logger = require('winston');
const auth = require('./auth.json');
const userStore = require('./users.json');
const { kill } = require('process');
const { MessageEmbed } = require('discord.js');

const rioConfig = {
    hostName: 'https://raider.io',
    method: 'GET',
    fields: 'mythic_plus_recent_runs',
    region: 'us',
    getUser: 'api/v1/characters/profile'
};



// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var bot = new Discord.Client({
    token: auth.token,
    autorun: true,
});

bot.on('ready', function (evt) {
    logger.info('Connected');    
    logger.info(bot.username + ' started');
});

class User {
    constructor(name, server){
        this.name = name;
        this.server = server;
    }
}

/* const getUsers = () => {    
    fs.readFile('./users.json', (err, data)=> {
        if(err){
            logger.error('user store read error', err);
            return;
        }
        try{
            const users = JSON.parse(data);
            return users;
        } catch(err){
            logger.error('user store parse error', err);
        }
    });
}
 */
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
        logger.error('Error: ', err.message);
    })

    return Promise.resolve(rioData);
}

const playground = (result) => {
    let currentTime = Date.now();
    var foo = new Date(Date.parse(result.last_crawled_at));
    let rioResult = result;
    
    var recentKey = rioResult.mythic_plus_recent_runs;
    console.log('Date Completed', new Date(recentKey[0].completed_at))
}

bot.on('message', function (user, userID, channelID, message, evt) {
    const toons = userStore.Users;
    const timeNow = new Date().toISOString();

    awaitAll(toons, getRioData)
        .then(results => playground(results[0]))
        
        
        .catch(e => console.error(e));
         
      if (message.startsWith('!')) {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
                break;
            case 'zulu':
                bot.sendMessage({
                    to: channelID,
                    message: new Date().toISOString()
                });
                break;
            case 'test':
                const embed = new MessageEmbed().setTitle('test title').setDescription('test description');
                embed.message.channel.send({embed: {
                    color: 3447003,
                    title: "Test:",
                    fields: [
                        { name: "Test 1", value: "Line1\nLine2\nLine3", inline: true},
                        { name: "Test 2", value: "AlsoLine1\nAlsoLine2\nAndLine3", inline: true}
                    ]
                }
            });
            case 'addUser':
            break;        
        }
    }  
});