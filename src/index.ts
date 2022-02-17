import { CacheType, Client, CommandInteraction, Intents, Interaction } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { decode } from 'html-entities';
import dotenv from 'dotenv';
import { config as dockerConfig } from './docker-secrets';
import { Configuration, OpenAIApi } from 'openai';

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
      .addStringOption((o) => o.setName('theme2').setDescription('the second theme of the story').setRequired(true))
      .addStringOption((o) => o.setName('others').setDescription('optional extra themes separated by spaces')),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    try {
      handleInteraction(interaction);
    } catch (e) {
      await interaction.reply(`There was an error. Try again.`);
    }
  });

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  await rest.put(Routes.applicationCommands(clientId), { body: commands }).catch((err) => console.error(err));

  client.login(token);
}

async function handleInteraction(interaction: CommandInteraction<CacheType>) {
  const { commandName, options } = interaction;

  if (commandName === 'story') {
    const theme1 = options.getString('theme1');
    const theme2 = options.getString('theme2');
    const otherThemes = (options.getString('others') ?? '').split(' ').join(' and ');

    const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));
    const response = await openai.createCompletion('text-davinci-001', {
      prompt: `Tell me a story about ${theme1} and ${theme2}${otherThemes.length ? ` and ${otherThemes}` : ''}`,
      max_tokens: 2000,
      temperature: 0.9,
    });

    if (!response.data?.choices?.length || response.status !== 200) {
      await interaction.reply('No response from GPT-3 received. Please try again.');
      return;
    }

    const text = response.data.choices[0].text.trim();
    await interaction.reply(decode(text));
  }
}

main();
