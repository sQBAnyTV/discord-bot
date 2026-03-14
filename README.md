# 🎯 Fajerkowy Bot - Discord Moderation & Leveling Bot

A powerful, modular Discord bot built with **Node.js**, **discord.js**, and **MongoDB**. Features include moderation commands, leveling system, voice XP, reaction roles, and more!

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)

---

## ✨ Features

### 🛡️ Moderation
The bot includes a complete moderation suite with commands like `/warn` (available for Helper+ roles), `/mute` and `/unmute` (restricted to Moderator+ roles). All moderation commands can be used in any channel for maximum flexibility.

### 📊 Leveling System
Players earn XP through both text activity and voice participation. Each message grants 10 XP on designated channels, while voice channels provide 10 XP per minute (requires at least 2 users, no XP when muted/deafened). The level progression follows a geometric curve: 100 XP for level 1, 200 for level 2, 400 for level 3, 800 for level 4, and so on. Users can check their progress with `/level` and view the top 10 leaderboard using `/top`.

### 🎭 Reaction Roles
The reaction role system allows moderators to assign roles based on emoji reactions. Using `/reactionrole add` with a message ID, emoji, and role creates a permanent association stored in MongoDB. Users can then click the emoji to receive or remove the role. The system supports multiple reactions per message and includes commands for listing and removing existing configurations.

### 💡 Proposals System
A dedicated channel for community suggestions where each message is automatically transformed into a clean embed with ✅ and ❌ voting reactions. The original message is deleted, and a discussion thread is automatically created with a 60-second slowmode to prevent spam. The thread includes a welcome message and maintains organized conversations around each proposal.

### 🎙️ Voice XP
Voice activity tracking rewards users for spending time in voice channels. The system grants 10 XP per minute, but only when at least two users are present and the participant is not muted or deafened. This encourages active voice participation while preventing AFK farming.

---

## 🚀 Getting Started

### Prerequisites
Before setting up the bot, ensure you have Node.js 16 or higher installed, a MongoDB Atlas account for database storage, and a Discord bot token from the Discord Developer Portal. A YouTube API key is optional for future features.

### Installation
Start by cloning the repository with `git clone https://github.com/sQBAnyTV/discord-bot.git` and navigating into the directory. Install all dependencies by running `npm install` in the project folder.

### Environment Configuration
Create a `.env` file or add these variables to your Render dashboard:
TOKEN=your_discord_bot_token
CLIENT_ID=your_bot_client_id
MONGODB_URI=your_mongodb_connection_string
KANAL_ID=proposals_channel_id
KANAL_LOGOW=logs_channel_id
KANAL_LEVEL=level_updates_channel_id
KANAL_KOMEND=commands_channel_id

### Role Configuration
Open `index.js` and replace the placeholder role IDs with your server's actual role IDs:
const ROLA_HELPER = 'your_helper_role_id';
const ROLA_MODERATOR = 'your_moderator_role_id';


### Command Registration
Register all slash commands with Discord by running `node deploy-commands.js`. This only needs to be done once or whenever you add new commands.

### Running the Bot
Start the bot locally with `node index.js` or deploy it to a hosting service like Render for 24/7 operation.

---

## 📁 Project Structure

The bot follows a modular architecture for easy maintenance and scalability. The `commands` folder contains individual files for each command including level.js, mute.js, ping.js, reactionrole.js, top.js, unmute.js, and warn.js. The `events` folder handles Discord events through interactionCreate.js, messageCreate.js, messageReaction.js, ready.js, and voiceStateUpdate.js. Database models reside in the `models` folder with gracz.js for player data, ReactionRole.js for reaction role mappings, and Warn.js for warning records. Utility functions are organized in the `utils` folder with constants.js, levelUtils.js, and xpUtils.js. The main bot file is index.js, while deploy-commands.js handles command registration.

---

## 🎮 Commands

The bot offers a comprehensive set of commands for different user levels. Basic commands like `/ping` (bot status check), `/level` (personal stats), and `/top` (leaderboard) are available to all users. Moderation commands include `/warn` for Helper+ roles, and `/mute` with `/unmute` for Moderator+ roles. The `/reactionrole` command with its add, remove, and list subcommands is also restricted to moderators.

---

## 📊 XP System

The XP system is designed to reward both text and voice activity. Each message on designated channels awards 10 XP without any cooldown, encouraging consistent participation. Voice channels provide 10 XP per minute, but only when at least two users are present and the participant is not muted or deafened. Level progression follows a geometric formula where each level requires double the XP of the previous level: level 1 needs 100 XP, level 2 needs 200 XP, level 3 needs 400 XP, level 4 needs 800 XP, and so on.

---

## 🚢 Deployment on Render

For 24/7 operation, deploy the bot on Render's free tier. Push your code to GitHub, then create a new Web Service on Render connected to your repository. Configure all environment variables in the Render dashboard, and the bot will automatically deploy. The included Express HTTP server keeps the bot alive on Render's free tier by responding to periodic pings.

---

## 🛠️ Built With

The bot is built using discord.js for Discord API interaction, MongoDB for persistent data storage, Mongoose as an ODM for MongoDB, and Express for the HTTP server required by Render's hosting platform.

---

## 📝 To-Do

Future plans include YouTube notification integration for content creators, custom backgrounds for the `/level` command display, an achievement system to reward specific milestones, daily and weekly leaderboards for competitive communities, and automatic role assignment when players reach certain levels.

---

## 👨‍💻 Author

**sQBAnyTV**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sQBAnyTV)

---

**Made with ❤️ for Discord communities**
