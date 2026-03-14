const Gracz = require('../models/gracz');
const { sprawdzAwans } = require('../utils/levelUtils');
const { VOICE_XP_PER_MINUTE, VOICE_CHECK_INTERVAL, REQUIRED_USERS_IN_CHANNEL } = require('../utils/constants');

module.exports = (client, voiceTimers, voiceJoinTime, KANAL_LEVEL) => {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        const userId = newState.member?.id || oldState.member?.id;
        if (!userId) return;
        
        const member = newState.member || oldState.member;
        const guild = newState.guild || oldState.guild;
        
        if (member.user.bot) return;
        
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;
        
        // Dołączenie do voice
        if (!oldChannel && newChannel) {
            console.log(`${member.user.tag} dołączył do voice channel ${newChannel.name}`);
            
            const channelSize = newChannel.members.size;
            const isAlone = channelSize < REQUIRED_USERS_IN_CHANNEL;
            const isMuted = newState.selfMute || newState.serverMute;
            const isDeaf = newState.selfDeaf || newState.serverDeaf;
            
            if (isAlone || isMuted || isDeaf) return;
            
            voiceJoinTime.set(userId, Date.now());
            
            const intervalId = setInterval(async () => {
                try {
                    const currentMember = await guild.members.fetch(userId);
                    const currentState = currentMember.voice;
                    
                    if (!currentState.channel) {
                        const timer = voiceTimers.get(userId);
                        if (timer) {
                            clearInterval(timer);
                            voiceTimers.delete(userId);
                            voiceJoinTime.delete(userId);
                        }
                        return;
                    }
                    
                    const currentChannel = currentState.channel;
                    const currentSize = currentChannel.members.size;
                    const currentIsAlone = currentSize < REQUIRED_USERS_IN_CHANNEL;
                    const currentIsMuted = currentState.selfMute || currentState.serverMute;
                    const currentIsDeaf = currentState.selfDeaf || currentState.serverDeaf;
                    
                    if (currentIsAlone || currentIsMuted || currentIsDeaf) return;
                    
                    let gracz = await Gracz.findOne({ userId });
                    
                    if (!gracz) {
                        gracz = new Gracz({
                            userId,
                            username: member.user.username
                        });
                    }
                    
                    gracz.xp += VOICE_XP_PER_MINUTE;
                    gracz.username = member.user.username;
                    
                    await sprawdzAwans(gracz, client, KANAL_LEVEL);
                    await gracz.save();
                    
                    console.log(`Przyznano ${VOICE_XP_PER_MINUTE} XP dla ${member.user.tag} za voice`);
                    
                } catch (error) {
                    console.error('Błąd przy przyznawaniu voice XP:', error);
                }
            }, VOICE_CHECK_INTERVAL);
            
            voiceTimers.set(userId, intervalId);
        }
        
        // Opuszczenie voice
        if (oldChannel && !newChannel) {
            console.log(`${member.user.tag} opuścił voice channel ${oldChannel.name}`);
            
            const timer = voiceTimers.get(userId);
            if (timer) {
                clearInterval(timer);
                voiceTimers.delete(userId);
                voiceJoinTime.delete(userId);
            }
        }
        
        // Zmiana mute/deaf
        if (oldChannel && newChannel) {
            const wasMuted = oldState.selfMute || oldState.serverMute;
            const isMuted = newState.selfMute || newState.serverMute;
            
            if (wasMuted !== isMuted) {
                console.log(`${member.user.tag} zmienił mute: ${isMuted ? 'tak' : 'nie'}`);
            }
        }
    });
};