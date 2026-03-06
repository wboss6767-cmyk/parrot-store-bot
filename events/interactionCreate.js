const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = (client) => {
  client.on('interactionCreate', async interaction => {

    // Slash commands
    if(interaction.isChatInputCommand()){
      const command = client.commands.get(interaction.commandName);
      if(!command) return;
      try { await command.execute(interaction); } 
      catch(err) { console.error(err); await interaction.reply({ content: "An error occurred.", ephemeral:true }); }
    }

    // Dropdown menu
    if(interaction.isStringSelectMenu() && interaction.customId === 'ticket_select'){
      try {
        const category = interaction.values[0];

        // Anti-Spam
        const existing = interaction.guild.channels.cache.find(c => c.permissionOverwrites.cache.has(interaction.user.id) && !c.name.startsWith('closed-'));
        if(existing) return interaction.reply({ content: "You already have an open ticket!", ephemeral:true });

        // Ticket Nummer
        let data;
        try { data = JSON.parse(fs.readFileSync('./utils/ticketCounter.json','utf8')); } 
        catch { data = { count:{} }; }
        if(!data.count[category]) data.count[category] = 0;
        data.count[category]++;
        fs.writeFileSync('./utils/ticketCounter.json', JSON.stringify(data,null,2));
        const ticketNumber = String(data.count[category]).padStart(4,'0');

        // Kanal erstellen
        const channel = await interaction.guild.channels.create({
          name: `${category}-${ticketNumber}`,
          type: ChannelType.GuildText,
          permissionOverwrites:[
            { id: interaction.guild.id, deny:[PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
            { id: config.staffRole, allow:[PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
          ]
        });

        await interaction.reply({ content:`Ticket created: ${channel}`, ephemeral:true });

        // Nachricht für IGN fragen
        await channel.send(`Hello <@${interaction.user.id}>, please enter your **IGN**:`);

        const filter = m => m.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({ filter, max: 1, time: 300000 }); // 5 Minuten

        collector.on('collect', async m => {
          await channel.send(`**IGN:** ${m.content}`);
          await channel.send(`A staff member <@&${config.staffRole}> will assist you shortly.`);

          // Buttons: Close
          const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);
          const row = new ActionRowBuilder().addComponents(closeBtn);
          await channel.send({ content: "Ticket Controls:", components: [row] });
        });

      } catch(err){
        console.error(err);
        if(!interaction.replied) await interaction.reply({ content:"Failed to create ticket.", ephemeral:true });
      }
    }

    // Buttons
    if(interaction.isButton()){
      const ch = interaction.channel;
      try{
        if(interaction.customId==='close_ticket'){
          await ch.setName(`closed-${ch.name}`);
          const deleteBtn = new ButtonBuilder().setCustomId('delete_ticket').setLabel('🗑 Delete Ticket').setStyle(ButtonStyle.Danger);
          const reopenBtn = new ButtonBuilder().setCustomId('reopen_ticket').setLabel('🔓 Reopen Ticket').setStyle(ButtonStyle.Success);
          const row = new ActionRowBuilder().addComponents(reopenBtn, deleteBtn);

          // Transcript
          const messages = await ch.messages.fetch({ limit:100 });
          const transcript = messages.map(m => `[${m.author.tag}]: ${m.content}`).reverse().join('\n');
          if(!fs.existsSync('./transcripts')) fs.mkdirSync('./transcripts');
          const filePath = `./transcripts/${ch.name}.txt`;
          fs.writeFileSync(filePath, transcript);

          const logChannel = interaction.guild.channels.cache.get(config.logChannel);
          if(logChannel) await logChannel.send({ content:`Transcript for ${ch.name}`, files:[filePath] });

          await interaction.update({ content:'Ticket closed.', components:[row] });

        } else if(interaction.customId==='reopen_ticket'){
          const originalName = ch.name.replace(/^closed-/,'');
          await ch.setName(originalName);
          const closeBtn = new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger);
          const row = new ActionRowBuilder().addComponents(closeBtn);
          await interaction.update({ content:'Ticket reopened. You can close it again.', components:[row] });

        } else if(interaction.customId==='delete_ticket'){
          await ch.delete();
        }
      }catch(err){
        console.error(err);
        if(!interaction.replied) await interaction.reply({ content:"Failed to process interaction.", ephemeral:true });
      }
    }

  });
};