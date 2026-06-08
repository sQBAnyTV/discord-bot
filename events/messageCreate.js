const Gracz = require('../models/gracz');
const { sprawdzAwans } = require('../utils/levelUtils');
const { XP_PER_MESSAGE } = require('../utils/constants');
const { EmbedBuilder } = require('discord.js');

module.exports = (client, KANAL_PROPONOWANIA, KANAL_XP, KANAL_LEVEL) => {
    client.on('messageCreate', async message => {
        if (message.author.bot) return;

        // ========== AUTOMATYCZNE USUWANIE NA KANALE EKONOMII ==========
        const KANAL_EKONOMIA = '1480329433549377810';
        if (message.channel.id === KANAL_EKONOMIA) {
            try {
                await message.delete();
                console.log(`🗑️ Usunięto wiadomość od ${message.author.tag} na kanale ekonomii`);
            } catch (error) {
                console.error('❌ Nie udało się usunąć wiadomości:', error);
            }
            return; // Nie przetwarzaj dalej
        }
        
        // SYSTEM LEVELOWANIA - TYLKO na kanale XP
        if (message.channel.id === KANAL_XP) {
            try {
                let gracz = await Gracz.findOne({ userId: message.author.id });
                
                if (!gracz) {
                    gracz = new Gracz({
                        userId: message.author.id,
                        username: message.author.username
                    });
                }
                
                gracz.xp += XP_PER_MESSAGE;
                gracz.totalMessages++;
                gracz.username = message.author.username;
                
                await sprawdzAwans(gracz, client, KANAL_LEVEL);
                await gracz.save();
                
            } catch (error) {
                console.error('Błąd systemu levelowania:', error);
            }
        }
        
        // OBSŁUGA KANAŁU PROPOZYCJI
        if (message.channel.id === KANAL_PROPONOWANIA) {
            try {
                await message.delete();
                
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
                
                const sentMessage = await message.channel.send({ embeds: [embed] });
                
                await sentMessage.react('✅');
                await sentMessage.react('❌');
                
                try {
                    const thread = await sentMessage.startThread({
                        name: `Dyskusja: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                        autoArchiveDuration: 1440,
                        reason: 'Automatyczny wątek pod propozycją',
                    });
                    
                    // TRYB POWOLNY WYŁĄCZONY – komentarz lub usunięcie linii
                    // await thread.setRateLimitPerUser(60);
                    
                    await thread.send(`👋 Witaj ${message.author}! Tutaj możecie dyskutować o podanej propozycji.`);
                    console.log(`Utworzono wątek: ${thread.name} (bez trybu powolnego)`);
                    
                } catch (threadError) {
                    console.error('Nie udało się utworzyć wątku:', threadError);
                }
                
            } catch (error) {
                console.error('Wystąpił błąd:', error);
                await message.channel.send('❌ Wystąpił błąd podczas przetwarzania propozycji.');
            }
        }
    });
};