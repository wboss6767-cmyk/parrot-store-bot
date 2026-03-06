const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Creates the Parrot Store Ticket Panel with dropdown'),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: "You need Administrator permissions.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 Open a Ticket')
      .setDescription(
        `Need help? Select a category from the dropdown below to open a ticket.\n\n` +
        `🏡 Buy Bases\n` +
        `💰 Buy Items From Us\n` +
        `🎧 Support\n` +
        `📦 Claim Order\n` +
        `🎁 Rewards\n\n` +
        `⚠️ Please choose the correct ticket category.`
      )
      .setColor('Blue')
      .setFooter({ text: 'Parrot Store • One ticket per category • Follow rules' })
      .setImage('https://media.discordapp.net/attachments/1477388716895895724/1479172430466388211/IMG_2937.webp');

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Select a ticket category')
      .addOptions([
        { label: '🏡 Buy Bases', value: 'buy_bases', description: 'Purchase bases' },
        { label: '💰 Buy Items From Us', value: 'buy_items', description: 'Purchase items from us' },
        { label: '🎧 Support', value: 'support', description: 'General help & questions' },
        { label: '📦 Claim Order', value: 'claim', description: 'Claim a purchased order' },
        { label: '🎁 Rewards', value: 'rewards', description: 'Reward related inquiries' }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const message = await interaction.channel.send({ embeds: [embed], components: [row] });
    await message.pin();

    await interaction.reply({ content: "Parrot Store Ticket Panel created and pinned!", ephemeral: true });
  }
};