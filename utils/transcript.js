const { createTranscript } = require('discord-html-transcripts');
const config = require('../config.json');

module.exports = async (interaction) => {
 const file = await createTranscript(interaction.channel);
 const logChannel = interaction.guild.channels.cache.get(config.logChannel);
 logChannel.send({ content: `Ticket geschlossen von ${interaction.user}`, files: [file] });
};