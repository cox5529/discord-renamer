import { Client, Intents } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import { decode } from 'html-entities';
import dotenv from 'dotenv';
import { config as dockerConfig } from './docker-secrets';

dotenv.config();
dockerConfig();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

async function main() {
  const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

  client.once('ready', () => {
    console.log('Ready!');
  });

  const commands = [
    new SlashCommandBuilder()
      .setName('story')
      .setDescription('Tells a story')
      .addStringOption((o) => o.setName('theme1').setDescription('the first theme of the story').setRequired(true))
      .addStringOption((o) => o.setName('theme2').setDescription('the second theme of the story').setRequired(true)),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'story') {
      const theme1 = options.getString('theme1');
      const theme2 = options.getString('theme2');

      const uri = `theme1=${encodeURIComponent(theme1)}&theme2=${encodeURIComponent(theme2)}&createstory=`;

      const response = await fetch('https://narrative-device.herokuapp.com/createstory', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        method: 'POST',
        body: uri,
      });

      const html = await response.text();
      const document = parse(html);
      const data = document.querySelector('#preprompt1 ~ p').innerText;

      await interaction.reply(decode(data));
    }
  });

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  await rest.put(Routes.applicationCommands(clientId), { body: commands }).catch((err) => console.error(err));

  client.login(token);
}

main();
