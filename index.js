const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const Gracz = require('./models/gracz');
const Warn = require('./models/warn');
const ReactionRole = require('./models/reactionrole.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ] 
});

const token = process.env.TOKEN;
const KANAL_PROPONOWANIA = process.env.KANAL_ID;
const KANAL_LOGOW = process.env.KANAL_LOGOW;
const KANAL_LEVEL = process.env.KANAL_LEVEL;
const MONGODB_URI = process.env.MONGODB_URI;
const KANAL_KOMEND = process.env.KANAL_KOMEND;

// Kanał na którym można zdobywać XP
const KANAL_XP = '1473083672881139773';

// ID ról które mogą dawać warny (ZMIEŃ NA SWOJE!)
const ROLA_HELPER = '1472655317111410859';
const ROLA_MODERATOR = '1472655181878526194';

// Stałe levelowania
const XP_PER_MESSAGE = 10; // XP za każdą wiadomość

// Stałe voice XP
const VOICE_XP_PER_MINUTE = 10; // 10 XP za minutę
const VOICE_CHECK_INTERVAL = 60000; // 60 sekund (co minutę)
const REQUIRED_USERS_IN_CHANNEL = 2; // Minimalna liczba osób w kanale

// Mapy do śledzenia voice
const voiceTimers = new Map(); // { userId: intervalId }
const voiceJoinTime = new Map(); // { userId: timestamp }

// Funkcja do obliczania wymaganego XP na dany poziom (progresja geometryczna)
function wymaganeXp(level) {
    if (level === 1) return 100;
    return 100 * Math.pow(2, level - 1);
}

// Funkcja do sprawdzania czy gracz awansował
async function sprawdzAwans(gracz) {
    while (gracz.xp >= wymaganeXp(gracz.level + 1)) {
        gracz.level++;
        // Wyślij wiadomość o awansie na KANAŁ LEVEL
        const channel = client.channels.cache.get(KANAL_LEVEL);
        if (channel) {
            await channel.send(`🎉 Gratulacje <@${gracz.userId}>! Awansowałeś na **poziom ${gracz.level}**! 🎉`);
        }
    }
    await gracz.save();
}

// Funkcja do parsowania czasu (np. "10m", "1h", "2d")
function parseTime(timeStr) {
    const unit = timeStr.slice(-1);
    const value = parseInt(timeStr.slice(0, -1));
    
    if (isNaN(value)) return null;
    
    switch(unit) {
        case 's': return value * 1000; // sekundy
        case 'm': return value * 60 * 1000; // minuty
        case 'h': return value * 60 * 60 * 1000; // godziny
        case 'd': return value * 24 * 60 * 60 * 1000; // dni
        default: return null;
    }
}

// Połączenie z MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Połączono z MongoDB Atlas!');
    })
    .catch(err => {
        console.error('❌ Błąd połączenia z MongoDB:', err);
    });

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} jest online!`);
    console.log(`Nasłuchuję na kanale o ID: ${KANAL_PROPONOWANIA}`);
    console.log(`Kanał logów (warny): ${KANAL_LOGOW}`);
    console.log(`Kanał level (awanse): ${KANAL_LEVEL}`);
    console.log(`Kanał XP: ${KANAL_XP}`);
});

// Nasłuchiwanie na komendy slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    // Lista komend moderacyjnych które mogą być używane wszędzie
    const komendyModeracyjne = ['warn', 'mute', 'reactionrole'];
    
    // Jeśli komenda NIE jest moderacyjna, sprawdź kanał
    if (!komendyModeracyjne.includes(interaction.commandName)) {
        if (interaction.channel.id !== KANAL_KOMEND) {
            return interaction.reply({
                content: `❌ Komend można używać tylko na kanale <#${KANAL_KOMEND}>!`,
                ephemeral: true
            });
        }
    }

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong! 🏓');
    }
    
    if (interaction.commandName === 'level') {
        const gracz = await Gracz.findOne({ userId: interaction.user.id });
        
        if (!gracz) {
            return interaction.reply('📊 Jeszcze nie masz żadnego XP. Napisz coś na czacie!');
        }
        
        const aktualneXp = gracz.xp;
        const nastepnyLevel = gracz.level + 1;
        const wymagane = wymaganeXp(nastepnyLevel);
        const postep = Math.floor((aktualneXp / wymagane) * 100);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle(`📊 Poziom ${gracz.username}`)
            .addFields(
                { name: '📈 Poziom', value: gracz.level.toString(), inline: true },
                { name: '✨ XP', value: `${aktualneXp} / ${wymagane}`, inline: true },
                { name: '📝 Wiadomości', value: gracz.totalMessages.toString(), inline: true },
                { name: '📊 Postęp', value: `[${postep}%]` }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    if (interaction.commandName === 'top') {
        // Pobierz top 10 graczy (sortuj według level, potem XP)
        const topGracze = await Gracz.find({})
            .sort({ level: -1, xp: -1 })
            .limit(10);
        
        if (topGracze.length === 0) {
            return interaction.reply('📊 Jeszcze nie ma żadnych graczy w rankingu!');
        }
        
        // Stwórz listę rankingową
        let ranking = '';
        for (let i = 0; i < topGracze.length; i++) {
            const gracz = topGracze[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            ranking += `${medal} **${i + 1}.** <@${gracz.userId}> – **Poziom ${gracz.level}** (${gracz.xp} XP)\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle('🏆 TOP 10 graczy')
            .setDescription(ranking)
            .setFooter({ text: 'Gratulacje dla najlepszych!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    // -------------------- KOMENDA /WARN --------------------
    if (interaction.commandName === 'warn') {
        // Sprawdź czy użytkownik ma rolę helpera LUB moderatora
        const member = interaction.member;
        const hasHelperRole = member.roles.cache.has(ROLA_HELPER);
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasHelperRole && !hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko osoby z rolą **Helper** lub **Moderator** mogą używać tej komendy!',
                ephemeral: true
            });
        }
        
        // Pobierz dane
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;
        
        // Sprawdź czy nie ostrzega samego siebie
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz ostrzec samego siebie!',
                ephemeral: true
            });
        }
        
        // Sprawdź czy użytkownik jest na serwerze
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Nie znaleziono użytkownika na serwerze!',
                ephemeral: true
            });
        }
        
        try {
            // 1. Zapisz warn w bazie danych
            const warn = new Warn({
                userId: targetUser.id,
                moderatorId: moderator.id,
                reason: reason,
                guildId: interaction.guild.id
            });
            await warn.save();
            
            // 2. Wyślij PW do użytkownika
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000) // Czerwony
                .setTitle('⚠️ Otrzymałeś ostrzeżenie!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Ostrzeżenie zostało zapisane w bazie danych.' });
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag}`);
            });
            
            // 3. Wyślij potwierdzenie moderatorowi
            await interaction.reply({
                content: `✅ Ostrzeżenie dla ${targetUser.tag} zostało zapisane. Użytkownik został powiadomiony PW.`,
                ephemeral: true
            });
            
            // 4. Wyślij log na kanał logów (KANAL_LOGOW)
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('⚠️ Nowe ostrzeżenie')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Powód', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Błąd przy warn:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas zapisywania ostrzeżenia.',
                ephemeral: true
            });
        }
    }
        // -------------------- KOMENDA /MUTE --------------------
    if (interaction.commandName === 'mute') {
        // Sprawdź czy użytkownik ma rolę moderatora
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                ephemeral: true
            });
        }
        
        // Pobierz dane
        const targetUser = interaction.options.getUser('user');
        const timeStr = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;
        
        // Sprawdź czy nie mutuje samego siebie
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz wyciszyć samego siebie!',
                ephemeral: true
            });
        }
        
        // Pobierz członka serwera
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Nie znaleziono użytkownika na serwerze!',
                ephemeral: true
            });
        }
        
        // Parsuj czas
        const muteTimeMs = parseTime(timeStr);
        if (!muteTimeMs) {
            return interaction.reply({
                content: '❌ Nieprawidłowy format czasu. Użyj: `10m`, `1h`, `1d`, `7d` (max 28 dni)',
                ephemeral: true
            });
        }
        
        // Sprawdź czy nie przekracza 28 dni
        if (muteTimeMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: '❌ Maksymalny czas przerwy to 28 dni!',
                ephemeral: true
            });
        }
        
        try {
            // Oblicz datę zakończenia
            const endDate = new Date(Date.now() + muteTimeMs);
            
            // Ustaw timeout (wbudowana funkcja Discorda!)
            await targetMember.timeout(muteTimeMs, reason);
            
            // Wyślij PW do użytkownika
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔇 Otrzymałeś przerwę!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true },
                    { name: 'Czas', value: timeStr, inline: true },
                    { name: 'Powód', value: reason, inline: false },
                    { name: 'Koniec', value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false }
                )
                .setTimestamp();
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag}`);
            });
            
            // Wyślij potwierdzenie moderatorowi
            await interaction.reply({
                content: `✅ Użytkownik ${targetUser.tag} otrzymał przerwę na **${timeStr}**.`,
                ephemeral: true
            });
            
            // Wyślij log na kanał logów
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('🔇 Nowa przerwa (mute)')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Czas', value: timeStr, inline: true },
                        { name: 'Powód', value: reason, inline: false },
                        { name: 'Koniec', value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Błąd przy mute:', error);
            
            // Sprawdź czy błąd wynika z braku uprawnień
            if (error.code === 50013) {
                return interaction.reply({
                    content: '❌ Bot nie ma uprawnień do wyciszania! Sprawdź czy ma uprawnienie "Moderuj członków".',
                    ephemeral: true
                });
            }
            
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas wyciszania.',
                ephemeral: true
            });
        }
    }
    
    // -------------------- KOMENDA /REACTIONROLE --------------------
    if (interaction.commandName === 'reactionrole') {
        // Tylko moderatorzy mogą używać
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        // -------------------- DODAWANIE --------------------
        if (subcommand === 'add') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');
            const role = interaction.options.getRole('role');

            try {
                // Sprawdź czy wiadomość istnieje na tym kanale
                const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
                if (!message) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono wiadomości o podanym ID na tym kanale!',
                        ephemeral: true
                    });
                }

                // Sprawdź czy już istnieje takie powiązanie
                const existing = await ReactionRole.findOne({
                    messageId: messageId,
                    emoji: emoji
                });

                if (existing) {
                    return interaction.reply({
                        content: `❌ To emoji (${emoji}) jest już przypisane do roli <@&${existing.roleId}> dla tej wiadomości!`,
                        ephemeral: true
                    });
                }

                // Zapisz w bazie
                const rr = new ReactionRole({
                    messageId: messageId,
                    channelId: interaction.channel.id,
                    guildId: interaction.guild.id,
                    emoji: emoji,
                    roleId: role.id
                });
                await rr.save();

                // Dodaj reakcję do wiadomości
                await message.react(emoji);

                await interaction.reply({
                    content: `✅ Dodano reaction role: ${emoji} → ${role} dla wiadomości ${messageId}`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Błąd przy dodawaniu reaction role:', error);
                await interaction.reply({
                    content: '❌ Wystąpił błąd. Sprawdź czy emoji jest poprawne.',
                    ephemeral: true
                });
            }
        }

        // -------------------- USUWANIE --------------------
        if (subcommand === 'remove') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');

            const deleted = await ReactionRole.findOneAndDelete({
                messageId: messageId,
                emoji: emoji
            });

            if (!deleted) {
                return interaction.reply({
                    content: '❌ Nie znaleziono takiego reaction role!',
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: `✅ Usunięto reaction role dla emoji ${emoji}`,
                ephemeral: true
            });
        }

        // -------------------- LISTA --------------------
        if (subcommand === 'list') {
            const messageId = interaction.options.getString('message_id');

            const list = await ReactionRole.find({ messageId: messageId });

            if (list.length === 0) {
                return interaction.reply({
                    content: '📋 Brak reaction role dla tej wiadomości.',
                    ephemeral: true
                });
            }

            let opis = '';
            for (const item of list) {
                opis += `${item.emoji} → <@&${item.roleId}>\n`;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF8C00)
                .setTitle('📋 Reaction role dla wiadomości')
                .setDescription(opis)
                .setFooter({ text: `ID wiadomości: ${messageId}` });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
});

// Obsługa dodawania reakcji
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    try {
        // Pobierz pełną reakcję (jeśli była z cache)
        if (reaction.partial) await reaction.fetch();

        const rr = await ReactionRole.findOne({
            messageId: reaction.message.id,
            emoji: reaction.emoji.name
        });

        if (!rr) return;

        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.get(rr.roleId);

        if (role && member) {
            await member.roles.add(role);
            console.log(`Dodano rolę ${role.name} użytkownikowi ${user.tag}`);
        }
    } catch (error) {
        console.error('Błąd przy dodawaniu roli z reakcji:', error);
    }
});

// Obsługa usuwania reakcji
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;

    try {
        if (reaction.partial) await reaction.fetch();

        const rr = await ReactionRole.findOne({
            messageId: reaction.message.id,
            emoji: reaction.emoji.name
        });

        if (!rr) return;

        const member = await reaction.message.guild.members.fetch(user.id);
        const role = reaction.message.guild.roles.cache.get(rr.roleId);

        if (role && member) {
            await member.roles.remove(role);
            console.log(`Usunięto rolę ${role.name} użytkownikowi ${user.tag}`);
        }
    } catch (error) {
        console.error('Błąd przy usuwaniu roli z reakcji:', error);
    }
});

// Nasłuchiwanie na zmiany statusu voice
client.on('voiceStateUpdate', async (oldState, newState) => {
    const userId = newState.member?.id || oldState.member?.id;
    if (!userId) return;
    
    const member = newState.member || oldState.member;
    const guild = newState.guild || oldState.guild;
    
    // Sprawdź czy użytkownik jest botem
    if (member.user.bot) return;
    
    const oldChannel = oldState.channel;
    const newChannel = newState.channel;
    
    // Przypadek 1: Użytkownik DOŁĄCZYŁ do kanału voice
    if (!oldChannel && newChannel) {
        console.log(`${member.user.tag} dołączył do voice channel ${newChannel.name}`);
        
        // Sprawdź warunki do przyznawania XP
        const channelSize = newChannel.members.size;
        const isAlone = channelSize < REQUIRED_USERS_IN_CHANNEL;
        const isMuted = newState.selfMute || newState.serverMute;
        const isDeaf = newState.selfDeaf || newState.serverDeaf;
        
        // Nie przyznawaj XP jeśli: sam, wyciszony, zagłuszony
        if (isAlone || isMuted || isDeaf) {
            return;
        }
        
        // Zapisz czas dołączenia
        voiceJoinTime.set(userId, Date.now());
        
        // Ustaw timer do przyznawania XP
        const intervalId = setInterval(async () => {
            try {
                // Sprawdź aktualny stan użytkownika
                const currentMember = await guild.members.fetch(userId);
                const currentState = currentMember.voice;
                
                // Jeśli nie ma na voice, wyczyść timer
                if (!currentState.channel) {
                    const timer = voiceTimers.get(userId);
                    if (timer) {
                        clearInterval(timer);
                        voiceTimers.delete(userId);
                        voiceJoinTime.delete(userId);
                    }
                    return;
                }
                
                // Sprawdź warunki
                const currentChannel = currentState.channel;
                const currentSize = currentChannel.members.size;
                const currentIsAlone = currentSize < REQUIRED_USERS_IN_CHANNEL;
                const currentIsMuted = currentState.selfMute || currentState.serverMute;
                const currentIsDeaf = currentState.selfDeaf || currentState.serverDeaf;
                
                // Jeśli warunki niespełnione, nie przyznawaj XP
                if (currentIsAlone || currentIsMuted || currentIsDeaf) {
                    return;
                }
                
                // Znajdź gracza w bazie
                let gracz = await Gracz.findOne({ userId });
                
                if (!gracz) {
                    gracz = new Gracz({
                        userId,
                        username: member.user.username
                    });
                }
                
                // Dodaj XP za minutę na voice (10 XP)
                gracz.xp += VOICE_XP_PER_MINUTE;
                gracz.username = member.user.username;
                
                // Sprawdź awans
                await sprawdzAwans(gracz);
                await gracz.save();
                
                console.log(`Przyznano ${VOICE_XP_PER_MINUTE} XP dla ${member.user.tag} za voice`);
                
            } catch (error) {
                console.error('Błąd przy przyznawaniu voice XP:', error);
            }
        }, VOICE_CHECK_INTERVAL);
        
        voiceTimers.set(userId, intervalId);
    }
    
    // Przypadek 2: Użytkownik OPUŚCIŁ kanał voice
    if (oldChannel && !newChannel) {
        console.log(`${member.user.tag} opuścił voice channel ${oldChannel.name}`);
        
        // Wyczyść timer
        const timer = voiceTimers.get(userId);
        if (timer) {
            clearInterval(timer);
            voiceTimers.delete(userId);
            voiceJoinTime.delete(userId);
        }
    }
    
    // Przypadek 3: Użytkownik ZMIENIŁ ustawienia (mute/deaf)
    if (oldChannel && newChannel) {
        const wasMuted = oldState.selfMute || oldState.serverMute;
        const isMuted = newState.selfMute || newState.serverMute;
        
        if (wasMuted !== isMuted) {
            console.log(`${member.user.tag} zmienił mute: ${isMuted ? 'tak' : 'nie'}`);
        }
    }
});

// Nasłuchiwanie na wiadomości
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // -------------------- SYSTEM LEVELOWANIA --------------------
    // TYLKO na kanale o ID 1473083672881139773
    if (message.channel.id === KANAL_XP) {
        try {
            let gracz = await Gracz.findOne({ userId: message.author.id });
            
            // Jeśli gracz nie istnieje, stwórz nowego
            if (!gracz) {
                gracz = new Gracz({
                    userId: message.author.id,
                    username: message.author.username
                });
            }
            
            // Dodaj XP (10 za wiadomość)
            gracz.xp += XP_PER_MESSAGE;
            gracz.totalMessages++;
            gracz.username = message.author.username; // aktualizuj nick
            
            // Sprawdź awans
            await sprawdzAwans(gracz);
            await gracz.save();
            
        } catch (error) {
            console.error('Błąd systemu levelowania:', error);
        }
    }
    
    // -------------------- OBSŁUGA KANAŁU PROPOZYCJI --------------------
    if (message.channel.id === KANAL_PROPONOWANIA) {
        try {
            // 1. Usuń oryginalną wiadomość
            await message.delete();
            
            // 2. Stwórz embed
            const embed = new EmbedBuilder()
                .setColor(0xFF8C00)
                .setTitle('📝 Nowa propozycja!')
                .setDescription(message.content)
                .setAuthor({ 
                    name: message.author.username, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp()
                .setFooter({ text: 'Zagłosuj używając reakcji poniżej' });
            
            // 3. Wyślij embed
            const sentMessage = await message.channel.send({ embeds: [embed] });
            
            // 4. Dodaj reakcje
            await sentMessage.react('✅');
            await sentMessage.react('❌');
            
            // 5. Stwórz wątek do dyskusji z trybem powolnym
            try {
                const thread = await sentMessage.startThread({
                    name: `Dyskusja: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                    autoArchiveDuration: 1440,
                    reason: 'Automatyczny wątek pod propozycją',
                });
                
                // Ustaw tryb powolny na 60 sekund w tym wątku
                await thread.setRateLimitPerUser(60);
                
                await thread.send(`👋 Witaj ${message.author}! Tutaj możecie dyskutować o podanej propozycji.`);
                console.log(`Utworzono wątek: ${thread.name} z trybem powolnym 60s`);
                
            } catch (threadError) {
                console.error('Nie udało się utworzyć wątku:', threadError);
            }
            
        } catch (error) {
            console.error('Wystąpił błąd:', error);
            await message.channel.send('❌ Wystąpił błąd podczas przetwarzania propozycji.');
        }
    }
});

// Serwer HTTP dla Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord działa! 🤖');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer statusu nasłuchuje na porcie ${PORT}`);
});

// Wyczyść wszystkie timery przy wyłączeniu bota
process.on('SIGINT', () => {
    console.log('Zatrzymywanie bota, czyszczenie timerów voice...');
    for (const [userId, timer] of voiceTimers) {
        clearInterval(timer);
    }
    voiceTimers.clear();
    voiceJoinTime.clear();
    process.exit(0);
});

client.login(token);