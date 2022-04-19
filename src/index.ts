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
      .addStringOption((o) => o.setName('theme').setDescription('"Tell me a story about: "').setRequired(true)),
    new SlashCommandBuilder()
      .setName('poem')
      .setDescription('Writes a poem')
      .addStringOption((o) => o.setName('theme').setDescription('"Write me a poem about: "').setRequired(true)),
    new SlashCommandBuilder()
      .setName('prompt')
      .setDescription('Asks an AI to respond to your prompt')
      .addStringOption((o) =>
        o
          .setName('prompt')
          .setDescription('The prompt for the AI to respond to. Ask it to do anything!')
          .setRequired(true)
      ),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: '9' }).setToken(token);

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    try {
      await interaction.reply('Generating story...');
      handleInteraction(interaction);
    } catch (e) {
      await interaction.editReply(`There was an error. Try again.`);
    }
  });

  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });

  await rest.put(Routes.applicationCommands(clientId), { body: commands }).catch((err) => console.error(err));

  client.login(token);
}

async function handleInteraction(interaction: CommandInteraction<CacheType>) {
  const { commandName, options } = interaction;

  let prompt = '';
  if (commandName === 'story') {
    prompt = 'Tell me a story about ';
  } else if (commandName === 'poem') {
    prompt = 'Write a poem about ';
  } else {
    prompt = '';
  }

  const theme = options.getString('theme');

  const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_KEY }));
  const response = await openai.createCompletion('text-davinci-001', {
    prompt: `${prompt}${theme}`,
    max_tokens: 2000,
    temperature: 0.9,
  });

  if (!response.data?.choices?.length || response.status !== 200) {
    await interaction.editReply('No response from GPT-3 received. Please try again.');
    return;
  }

  const maxLen = 1500;
  let text = response.data.choices[0].text.trim();

  if (text.length < maxLen) {
    await interaction.editReply(decode(text));
  } else {
    let len = text.length / maxLen;
    await interaction.editReply(decode(text.substring(0, maxLen)));
    for (let i = 1; i < len + 1; i++) {
      const start = i * maxLen;
      const message = text.substring(start, start + maxLen);
      await interaction.followUp(decode(message));
    }
  }
}

main();
