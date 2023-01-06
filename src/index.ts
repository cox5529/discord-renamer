import { Client } from 'discord.js';
import { REST } from '@discordjs/rest';
import dotenv from 'dotenv';
import { config as dockerConfig } from './docker-secrets';

dotenv.config();
dockerConfig();

const token = process.env.TOKEN;
const guildId = process.env.GUILD_ID;
const memberId = process.env.MEMBER_ID ?? '';

async function main() {
  const client = new Client({ intents: [] });

  client.once('ready', () => {
    console.log('Ready!');
  });

  await client.login(token);
  renameUser(client);
  setInterval(() => renameUser(client), 60 * 1000); // 60s
}

async function renameUser(client: Client) {
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(memberId);

  await member.setNickname('Average Paintball Enjoyer');
}

main();
