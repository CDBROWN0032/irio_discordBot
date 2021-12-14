const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const pjson = require('../package.json');
const logo = 'https://i.imgur.com/vj6aVnP.png';
const fs = require('fs');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('list of commands from bot'),
    async execute (interaction) {
       
        const result = await displayCommands();
		interaction.reply({ embeds: [result] });

    }

}

const displayCommands = async() => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
    let commandsOutput = {name: "Commands", value: ''}
    let jsfiles = commandFiles.filter(f => f.split(".").pop() === "js");
    if(jsfiles.length <= 0) {
        console.log("No commands to load!");
        return;
    } else {
        jsfiles.forEach(file => {
            let tempName = file.split('.');
            commandsOutput.value += `- ${tempName[0]}\n`
        })
    }

    const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Commands')
    .addFields(commandsOutput)
    .setTimestamp()			
    .setFooter(`${pjson.name} v${pjson.version}`, logo)	        
    return embed;
}