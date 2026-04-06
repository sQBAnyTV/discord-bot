// Wczytaj wszystkie komendy
const pingCommand = require('../commands/ping');
const levelCommand = require('../commands/level');
const topCommand = require('../commands/top');
const warnCommand = require('../commands/warn');
const muteCommand = require('../commands/mute');
const unmuteCommand = require('../commands/unmute');
const banCommand = require('../commands/ban');
const unbanCommand = require('../commands/unban');
const reactionroleCommand = require('../commands/reactionrole');
const ticketCommand = require('../commands/ticket');
const portfelCommand = require('../commands/ekonomia/portfel');
const dailyCommand = require('../commands/ekonomia/daily');
const napadCommand = require('../commands/ekonomia/napad');
const ekwipunekCommand = require('../commands/ekonomia/ekwipunek');
const sklepCommand = require('../commands/ekonomia/sklep');
const sklep = require('../commands/ekonomia/sklep');
const kupCommand = require('../commands/ekonomia/kup');
const gwiazdkiCommand = require('../commands/ekonomia/gwiazdki');
const ukryjSieCommand = require('../commands/ekonomia/ukryj_sie');
// Mapa komend
const commands = new Map();
commands.set(pingCommand.name, pingCommand);
commands.set(levelCommand.name, levelCommand);
commands.set(topCommand.name, topCommand);
commands.set(warnCommand.name, warnCommand);
commands.set(muteCommand.name, muteCommand);
commands.set(unmuteCommand.name, unmuteCommand);
commands.set(banCommand.name, banCommand);
commands.set(unbanCommand.name, unbanCommand);
commands.set(reactionroleCommand.name, reactionroleCommand);
commands.set(ticketCommand.name, ticketCommand);
commands.set(portfelCommand.name, portfelCommand);
commands.set(dailyCommand.name, dailyCommand);
commands.set(napadCommand.name, napadCommand);
commands.set(ekwipunekCommand.name, ekwipunekCommand);
commands.set(sklepCommand.name, sklepCommand);
commands.set(kupCommand.name, kupCommand);
commands.set(gwiazdkiCommand.name, gwiazdkiCommand);
commands.set(ukryjSieCommand.name, ukryjSieCommand);


// Lista komend moderacyjnych (dostępne wszędzie)
const komendyModeracyjne = ['warn', 'mute', 'unmute', 'ban', 'unban', 'reactionrole', 'setup-ticket'];

// Lista komend ekonomii (tylko na kanale ekonomii)
const komendyEkonomii = ['portfel', 'daily', 'napad', 'ekwipunek', 'sklep', 'kup', 'gwiazdki', 'ukryj-sie'];

module.exports = (client, KANAL_KOMEND, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW) => {
    client.on('interactionCreate', async interaction => {
        
        // ========== OBSŁUGA PRZYCISKU REKRUTACJA (MODAL) ==========
        if (interaction.isButton() && interaction.customId === 'ticket_rekrutacja') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            const modal = new ModalBuilder()
                .setCustomId('rekrutacja_modal')
                .setTitle('📋 Formularz rekrutacyjny');

            const nickInput = new TextInputBuilder()
                .setCustomId('nick_mc')
                .setLabel('Jaki masz nick w Minecraft?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(16)
                .setPlaceholder('np. Steve_123');

            const ageInput = new TextInputBuilder()
                .setCustomId('wiek')
                .setLabel('Ile masz lat?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(1)
                .setMaxLength(2)
                .setPlaceholder('np. 18');

            const ytInput = new TextInputBuilder()
                .setCustomId('yt_link')
                .setLabel('Link do Twojego YouTube (opcjonalne)')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
                .setPlaceholder('https://youtube.com/@...');

            const firstRow = new ActionRowBuilder().addComponents(nickInput);
            const secondRow = new ActionRowBuilder().addComponents(ageInput);
            const thirdRow = new ActionRowBuilder().addComponents(ytInput);

            modal.addComponents(firstRow, secondRow, thirdRow);

            await interaction.showModal(modal);
            return;
        }
        
        // ========== OBSŁUGA PRZYCISKU INNE (MODAL) ==========
        if (interaction.isButton() && interaction.customId === 'ticket_inne') {
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            const modal = new ModalBuilder()
                .setCustomId('inne_modal')
                .setTitle('❓ Inne – zgłoszenie');

            const nickInput = new TextInputBuilder()
                .setCustomId('nick_mc_inne')
                .setLabel('Jaki masz nick w Minecraft?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMinLength(3)
                .setMaxLength(16)
                .setPlaceholder('np. Steve_123');

            const opisInput = new TextInputBuilder()
                .setCustomId('opis')
                .setLabel('Opisz swoją sprawę')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000)
                .setPlaceholder('Tutaj napisz, z czym masz problem...');

            const firstRow = new ActionRowBuilder().addComponents(nickInput);
            const secondRow = new ActionRowBuilder().addComponents(opisInput);

            modal.addComponents(firstRow, secondRow);

            await interaction.showModal(modal);
            return;
        }
        
        // ========== OBSŁUGA MODALA REKRUTACYJNEGO ==========
        if (interaction.isModalSubmit() && interaction.customId === 'rekrutacja_modal') {
            const Ticket = require('../models/ticket');
            
            await interaction.deferReply({ flags: 64 });
            
            const nick = interaction.fields.getTextInputValue('nick_mc');
            const wiek = interaction.fields.getTextInputValue('wiek');
            const ytLink = interaction.fields.getTextInputValue('yt_link') || 'Brak';
            
            const userId = interaction.user.id;
            const guild = interaction.guild;
            
            // Sprawdź czy użytkownik ma już otwarty ticket
            const existingTicket = await Ticket.findOne({ userId, status: 'open' });
            if (existingTicket) {
                const channel = guild.channels.cache.get(existingTicket.channelId);
                if (channel) {
                    return interaction.editReply(`❌ Masz już otwarty ticket: ${channel}`);
                }
            }
            
            // Kategoria rekrutacyjna
            const categoryName = '╭─・📋 Rekrutacja';
            let categoryChannel = guild.channels.cache.find(c => 
                c.type === 4 && c.name === categoryName
            );
            
            if (!categoryChannel) {
                try {
                    categoryChannel = await guild.channels.create({
                        name: categoryName,
                        type: 4,
                        permissionOverwrites: [
                            { id: guild.id, allow: ['ViewChannel'] }
                        ]
                    });
                    console.log(`✅ Utworzono kategorię: ${categoryName}`);
                } catch (error) {
                    console.error('❌ Błąd tworzenia kategorii:', error);
                    return interaction.editReply('❌ Wystąpił błąd podczas tworzenia kategorii.');
                }
            }
            
            // Generuj ID ticketa
            const ticketCount = await Ticket.countDocuments();
            const ticketId = String(ticketCount + 1).padStart(4, '0');
            
            try {
                const channel = await guild.channels.create({
                    name: `rekrutacja-${ticketId}`,
                    type: 0,
                    parent: categoryChannel.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['ViewChannel'] },
                        { id: userId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                        { id: process.env.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                    ]
                });
                
                const ticket = new Ticket({
                    ticketId,
                    channelId: channel.id,
                    userId,
                    userName: interaction.user.tag,
                    category: 'rekrutacja'
                });
                await ticket.save();
                
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`📋 Rekrutacja #${ticketId}`)
                    .setDescription(`Nowa rekrutacja od ${interaction.user}`)
                    .addFields(
                        { name: '🎮 Nick w MC', value: nick, inline: true },
                        { name: '📅 Wiek', value: wiek, inline: true },
                        { name: '📺 YouTube', value: ytLink, inline: false }
                    )
                    .setTimestamp();
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close_no_reason_${ticketId}`)
                        .setLabel('🔒 Zamknij bez powodu')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`close_with_reason_${ticketId}`)
                        .setLabel('📝 Zamknij z powodem')
                        .setStyle(ButtonStyle.Secondary)
                );
                
                await channel.send({ 
                    content: `<@${userId}> | <@&${process.env.STAFF_ROLE_ID}>`, 
                    embeds: [embed], 
                    components: [row] 
                });
                
                await interaction.editReply(`✅ Utworzono rekrutację: ${channel}`);
                
            } catch (error) {
                console.error('❌ Błąd przy tworzeniu rekrutacji:', error);
                await interaction.editReply('❌ Wystąpił błąd podczas tworzenia rekrutacji.');
            }
            
            return;
        }
        
        // ========== OBSŁUGA MODALA "INNE" ==========
        if (interaction.isModalSubmit() && interaction.customId === 'inne_modal') {
            const Ticket = require('../models/ticket');
            
            await interaction.deferReply({ flags: 64 });
            
            const nick = interaction.fields.getTextInputValue('nick_mc_inne');
            const opis = interaction.fields.getTextInputValue('opis');
            
            const userId = interaction.user.id;
            const guild = interaction.guild;
            
            // Sprawdź czy użytkownik ma już otwarty ticket
            const existingTicket = await Ticket.findOne({ userId, status: 'open' });
            if (existingTicket) {
                const channel = guild.channels.cache.get(existingTicket.channelId);
                if (channel) {
                    return interaction.editReply(`❌ Masz już otwarty ticket: ${channel}`);
                }
            }
            
            // Kategoria "Inne"
            const categoryName = '╭─・❓ Inne';
            let categoryChannel = guild.channels.cache.find(c => 
                c.type === 4 && c.name === categoryName
            );
            
            if (!categoryChannel) {
                try {
                    categoryChannel = await guild.channels.create({
                        name: categoryName,
                        type: 4,
                        permissionOverwrites: [
                            { id: guild.id, allow: ['ViewChannel'] }
                        ]
                    });
                    console.log(`✅ Utworzono kategorię: ${categoryName}`);
                } catch (error) {
                    console.error('❌ Błąd tworzenia kategorii:', error);
                    return interaction.editReply('❌ Wystąpił błąd podczas tworzenia kategorii.');
                }
            }
            
            // Generuj ID ticketa
            const ticketCount = await Ticket.countDocuments();
            const ticketId = String(ticketCount + 1).padStart(4, '0');
            
            try {
                const channel = await guild.channels.create({
                    name: `ticket-${ticketId}`,
                    type: 0,
                    parent: categoryChannel.id,
                    permissionOverwrites: [
                        { id: guild.id, deny: ['ViewChannel'] },
                        { id: userId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
                        { id: process.env.STAFF_ROLE_ID, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }
                    ]
                });
                
                const ticket = new Ticket({
                    ticketId,
                    channelId: channel.id,
                    userId,
                    userName: interaction.user.tag,
                    category: 'inne'
                });
                await ticket.save();
                
                const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`❓ Ticket #${ticketId}`)
                    .setDescription(`Zgłoszenie od ${interaction.user}`)
                    .addFields(
                        { name: '🎮 Nick w MC', value: nick, inline: true },
                        { name: '📝 Opis sprawy', value: opis, inline: false }
                    )
                    .setTimestamp();
                
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`close_no_reason_${ticketId}`)
                        .setLabel('🔒 Zamknij bez powodu')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`close_with_reason_${ticketId}`)
                        .setLabel('📝 Zamknij z powodem')
                        .setStyle(ButtonStyle.Secondary)
                );
                
                await channel.send({ 
                    content: `<@${userId}> | <@&${process.env.STAFF_ROLE_ID}>`, 
                    embeds: [embed], 
                    components: [row] 
                });
                
                await interaction.editReply(`✅ Utworzono ticket: ${channel}`);
                
            } catch (error) {
                console.error('❌ Błąd przy tworzeniu ticketa:', error);
                await interaction.editReply('❌ Wystąpił błąd podczas tworzenia ticketa.');
            }
            
            return;
        }
        
        // ========== OBSŁUGA ZAMYKANIA BEZ POWODU ==========
        if (interaction.isButton() && interaction.customId.startsWith('close_no_reason_')) {
            const Ticket = require('../models/ticket');
            
            // Sprawdź uprawnienia (tylko staff)
            const hasStaffRole = interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
            const isAdmin = interaction.member.permissions.has('Administrator');
            
            if (!hasStaffRole && !isAdmin) {
                return interaction.reply({
                    content: '❌ Tylko staff może zamykać tickety!',
                    flags: 64
                });
            }
            
            await interaction.deferReply();
            
            const ticketId = interaction.customId.replace('close_no_reason_', '');
            const channel = interaction.channel;
            
            const ticket = await Ticket.findOne({ ticketId });
            if (!ticket) {
                return interaction.editReply('❌ Nie znaleziono ticketa w bazie!');
            }
            
            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = interaction.user.tag;
            await ticket.save();
            
            // Pobierz wiadomości
            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesArray = Array.from(messages.values()).reverse();
            
            // Przygotuj podgląd (pierwsze 5 wiadomości)
            const previewMessages = messagesArray.slice(0, 5).map(msg => {
                const author = msg.author.tag;
                const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
                return `**${author}:** ${content}`;
            }).join('\n') || 'Brak wiadomości';
            
            // Wyślij embed na kanał transkrypcji (1482856089644040192)
            const transcriptChannel = client.channels.cache.get('1482856089644040192');
            if (transcriptChannel) {
                const { EmbedBuilder } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setColor(ticket.category === 'rekrutacja' ? 0x00FF00 : 0x0099FF)
                    .setTitle(`📝 Transkrypt ticketa #${ticketId}`)
                    .setDescription(`Ticket został zamknięty przez **${interaction.user.tag}**`)
                    .addFields(
                        { name: '👤 Użytkownik', value: ticket.userName, inline: true },
                        { name: '📂 Kategoria', value: ticket.category === 'rekrutacja' ? '📋 Rekrutacja' : '❓ Inne', inline: true },
                        { name: '📅 Utworzono', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
                        { name: '🔒 Zamknięto', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '📝 Powód zamknięcia', value: 'Brak', inline: false },
                        { name: '💬 Pierwsze wiadomości', value: previewMessages, inline: false },
                        { name: '📊 Statystyki', value: `Łącznie wiadomości: **${messagesArray.length}**`, inline: false }
                    )
                    .setTimestamp();
                
                await transcriptChannel.send({ embeds: [embed] });
            }
            
            await interaction.editReply('🔒 Ticket zostanie zamknięty za 5 sekund...');
            
            setTimeout(() => {
                channel.delete().catch(console.error);
            }, 5000);
            
            return;
        }
        
        // ========== OBSŁUGA ZAMYKANIA Z POWODEM (MODAL) ==========
        if (interaction.isButton() && interaction.customId.startsWith('close_with_reason_')) {
            // Sprawdź uprawnienia (tylko staff)
            const hasStaffRole = interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
            const isAdmin = interaction.member.permissions.has('Administrator');
            
            if (!hasStaffRole && !isAdmin) {
                return interaction.reply({
                    content: '❌ Tylko staff może zamykać tickety!',
                    flags: 64
                });
            }
            
            const ticketId = interaction.customId.replace('close_with_reason_', '');
            
            const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
            
            const modal = new ModalBuilder()
                .setCustomId(`close_reason_modal_${ticketId}`)
                .setTitle('📝 Podaj powód zamknięcia');

            const reasonInput = new TextInputBuilder()
                .setCustomId('close_reason')
                .setLabel('Powód zamknięcia ticketa')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(500)
                .setPlaceholder('Dlaczego zamykasz ten ticket?');

            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
            return;
        }
        
        // ========== OBSŁUGA MODALA Z POWODEM ==========
        if (interaction.isModalSubmit() && interaction.customId.startsWith('close_reason_modal_')) {
            const Ticket = require('../models/ticket');
            
            // Sprawdź uprawnienia (jeszcze raz dla bezpieczeństwa)
            const hasStaffRole = interaction.member.roles.cache.has(process.env.STAFF_ROLE_ID);
            const isAdmin = interaction.member.permissions.has('Administrator');
            
            if (!hasStaffRole && !isAdmin) {
                return interaction.reply({
                    content: '❌ Tylko staff może zamykać tickety!',
                    flags: 64
                });
            }
            
            await interaction.deferReply();
            
            const ticketId = interaction.customId.replace('close_reason_modal_', '');
            const reason = interaction.fields.getTextInputValue('close_reason');
            const channel = interaction.channel;
            
            const ticket = await Ticket.findOne({ ticketId });
            if (!ticket) {
                return interaction.editReply('❌ Nie znaleziono ticketa w bazie!');
            }
            
            ticket.status = 'closed';
            ticket.closedAt = new Date();
            ticket.closedBy = interaction.user.tag;
            ticket.closeReason = reason;
            await ticket.save();
            
            // Wyślij PW do autora ticketa
            try {
                const author = await client.users.fetch(ticket.userId);
                if (author) {
                    const { EmbedBuilder } = require('discord.js');
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle('📝 Twój ticket został zamknięty')
                        .setDescription(`Ticket #${ticketId} został zamknięty przez staff.`)
                        .addFields(
                            { name: 'Powód zamknięcia', value: reason, inline: false }
                        )
                        .setTimestamp();
                    
                    await author.send({ embeds: [dmEmbed] });
                    console.log(`✅ Wysłano PW o zamknięciu do ${author.tag}`);
                }
            } catch (error) {
                console.log(`❌ Nie udało się wysłać PW do autora ticketa: ${error.message}`);
            }
            
            // Pobierz wiadomości
            const messages = await channel.messages.fetch({ limit: 100 });
            const messagesArray = Array.from(messages.values()).reverse();
            
            // Przygotuj podgląd (pierwsze 5 wiadomości)
            const previewMessages = messagesArray.slice(0, 5).map(msg => {
                const author = msg.author.tag;
                const content = msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content;
                return `**${author}:** ${content}`;
            }).join('\n') || 'Brak wiadomości';
            
            // Wyślij embed na kanał transkrypcji (1482856089644040192)
            const transcriptChannel = client.channels.cache.get('1482856089644040192');
            if (transcriptChannel) {
                const { EmbedBuilder } = require('discord.js');
                
                const embed = new EmbedBuilder()
                    .setColor(ticket.category === 'rekrutacja' ? 0x00FF00 : 0x0099FF)
                    .setTitle(`📝 Transkrypt ticketa #${ticketId}`)
                    .setDescription(`Ticket został zamknięty przez **${interaction.user.tag}**`)
                    .addFields(
                        { name: '👤 Użytkownik', value: ticket.userName, inline: true },
                        { name: '📂 Kategoria', value: ticket.category === 'rekrutacja' ? '📋 Rekrutacja' : '❓ Inne', inline: true },
                        { name: '📅 Utworzono', value: `<t:${Math.floor(ticket.createdAt.getTime() / 1000)}:F>`, inline: true },
                        { name: '🔒 Zamknięto', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: '📝 Powód zamknięcia', value: reason, inline: false },
                        { name: '💬 Pierwsze wiadomości', value: previewMessages, inline: false },
                        { name: '📊 Statystyki', value: `Łącznie wiadomości: **${messagesArray.length}**`, inline: false }
                    )
                    .setTimestamp();
                
                await transcriptChannel.send({ embeds: [embed] });
            }
            
            await interaction.editReply('🔒 Ticket zostanie zamknięty za 5 sekund...');
            
            setTimeout(() => {
                channel.delete().catch(console.error);
            }, 5000);
            
            return;
        }
        
        // ========== OBSŁUGA KOMEND SLASH ==========
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        console.log(`Wykonuję komendę: ${interaction.commandName}`);
        console.log(`KANAL_LOGOW w interactionCreate: ${KANAL_LOGOW}`);

        // ========== OGRANICZENIA KANAŁÓW ==========
        // Jeśli to komenda ekonomii
        if (komendyEkonomii.includes(interaction.commandName)) {
            if (interaction.channel.id !== '1480329433549377810') {
                return interaction.reply({
                    content: '❌ Komendy ekonomii można używać tylko na kanale <#1480329433549377810>!',
                    flags: 64
                });
            }
        }
        // Jeśli to komenda moderacyjna – bez ograniczeń
        else if (!komendyModeracyjne.includes(interaction.commandName)) {
            if (interaction.channel.id !== KANAL_KOMEND) {
                return interaction.reply({
                    content: `❌ Komendy ogólne można używać tylko na kanale <#${KANAL_KOMEND}>!`,
                    flags: 64
                });
            }
        }

        try {
            await command.execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW);
        } catch (error) {
            console.error(`Błąd w komendzie ${interaction.commandName}:`, error);
            
            if (interaction.replied || interaction.deferred) {
                try {
                    await interaction.followUp({
                        content: '❌ Wystąpił błąd podczas wykonywania komendy.',
                        flags: 64
                    });
                } catch (e) {
                    console.error('Nie udało się wysłać followUp:', e);
                }
            } else {
                try {
                    await interaction.reply({
                        content: '❌ Wystąpił błąd podczas wykonywania komendy.',
                        flags: 64
                    });
                } catch (e) {
                    console.error('Nie udało się wysłać reply:', e);
                }
            }
        }
    });
};