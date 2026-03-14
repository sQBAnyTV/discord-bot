# 🎯 Fajerkowy Bot - Discord Moderation & Leveling Bot

A powerful, modular Discord bot built with **Node.js**, **discord.js**, and **MongoDB**. Features include moderation commands, leveling system, voice XP, reaction roles, and more!

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)

---

## ✨ Features

### 🛡️ Moderation
- `/warn` - Warn a user (Helper+ roles)
- `/mute` - Timeout a user (Moderator+ roles)
- `/unmute` - Remove timeout from user
- All moderation commands work in any channel

### 📊 Leveling System
- XP gain from messages (configurable)
- Voice XP (10 XP per minute)
- Geometric progression (100, 200, 400, 800...)
- `/level` - Check your stats
- `/top` - View top 10 leaderboard

### 🎭 Reaction Roles
- `/reactionrole add` - Add reaction role to message
- `/reactionrole remove` - Remove reaction role
- `/reactionrole list` - List all reactions for message
- Persistent storage in MongoDB

### 💡 Proposals System
- Dedicated channel for suggestions
- Auto-deletes original message
- Creates beautiful embeds
- Auto-generates discussion threads with slowmode (60s)
- ✅ / ❌ voting reactions

### 🎙️ Voice XP
- 10 XP per minute in voice channels
- Requires at least 2 users in channel
- No XP if muted/deafened
- Automatic tracking

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB Atlas account
- Discord Bot Token
- YouTube API Key (for future features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/sQBAnyTV/discord-bot.git
cd discord-bot
