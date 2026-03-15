const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'Zbanuj użytkownika (tylko moderator)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR) {
        // Pobierz ID kanału logów z env
        const KANAL_LOGOW = process.env.KANAL_LOGOW;
        
        console.log(`========== BAN DEBUG ==========`);
        console.log(`ROLA_MODERATOR: ${ROLA_MODERATOR}`);
        console.log(`KANAL_LOGOW z env: ${KANAL_LOGOW}`);
        
        // Sprawdź uprawnienia (tylko moderator)
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                flags: 64
            });
        }
        
        // Pobierz opcje
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const deleteDays = interaction.options.getInteger('delete_messages') || 0;
        const moderator = interaction.user;
        
        // Walidacje
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz zbanować samego siebie!',
                flags: 64
            });
        }
        
        // Sprawdź czy użytkownik jest na serwerze
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
        // Sprawdź hierarchię ról (nie można banować moderatorów/adminów)
        if (targetMember) {
            const targetRoles = targetMember.roles.highest;
            const moderatorRoles = member.roles.highest;
            
            if (targetRoles.position >= moderatorRoles.position && !isAdmin) {
                return interaction.reply({
                    content: '❌ Nie możesz zbanować użytkownika z wyższą lub równą rolą!',
                    flags: 64
                });
            }
        }
        
        try {
            // Wykonaj bana
            await interaction.guild.members.ban(targetUser.id, { 
                reason: `Moderator: ${moderator.tag} | Powód: ${reason}`,
                deleteMessageSeconds: deleteDays * 24 * 60 * 60
            });
            
            // Wyślij PW do użytkownika (jeśli możliwe)
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔨 Zostałeś zbanowany!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true },
                    { name: 'Powód', value: reason, inline: false },
                    { name: 'Usunięto wiadomości', value: deleteDays === 0 ? 'Nie' : `Ostatnie ${deleteDays} dni`, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Ban został wykonany przez moderatora.' });
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag} (prawdopodobnie ma zamknięte PW)`);
            });
            
            // Potwierdzenie dla moderatora
            await interaction.reply({
                content: `✅ Użytkownik ${targetUser.tag} został zbanowany. Powód: ${reason}`,
                flags: 64
            });
            
            // Log na kanał logów
            console.log(`Próba wysłania logu bana na kanał o ID: ${KANAL_LOGOW}`);
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            
            if (logChannel) {
                console.log(`✅ Znaleziono kanał logów: ${logChannel.name} (${logChannel.id})`);
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔨 Nowy ban')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Powód', value: reason, inline: false },
                        { name: 'Usunięto wiadomości', value: deleteDays === 0 ? 'Nie' : `Ostatnie ${deleteDays} dni`, inline: true }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ Wysłano log bana dla ${targetUser.tag}`);
            } else {
                console.log(`❌ NIE znaleziono kanału logów o ID: ${KANAL_LOGOW}`);
                // Wypisz dostępne kanały dla debugowania
                console.log('Dostępne kanały tekstowe:');
                client.channels.cache.forEach(ch => {
                    if (ch.isTextBased()) {
                        console.log(`- ${ch.name}: ${ch.id}`);
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Błąd przy ban:', error);
            
            let errorMessage = '❌ Wystąpił błąd podczas banowania.';
            
            if (error.code === 50013) {
                errorMessage = '❌ Bot nie ma uprawnień do banowania! Sprawdź uprawnienia.';
            } else if (error.code === 50035) {
                errorMessage = '❌ Nieprawidłowe dane - użytkownik może nie istnieć.';
            }
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: errorMessage,
                    flags: 64
                });
            }
        }
    }
};