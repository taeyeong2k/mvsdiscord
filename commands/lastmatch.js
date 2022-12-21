const { SlashCommandBuilder } = require('discord.js');
const Search = require('../mvs/search.js')
const fs = require("fs");
const Characters = require("../mvs/characters");
const Discord = require("discord.js");
require('dotenv').config();
module.exports = {
    data: new SlashCommandBuilder()
        .setName('lastmatch')
        .setDescription('Retrieves information about the last match played by a user')
        .addStringOption(option => option.setName('user').setDescription('WB Username').setRequired(false))
        .addStringOption(option => option.setName('gamemode').setDescription('Gamemode').setRequired(false).setChoices({ name: '1v1', value: '1v1' }, { name: '2v2', value: '2v2' })),
    async execute(interaction) {
        // Get the username from the command options
        await interaction.deferReply();
        const user_info = await Search.getUserInfo(interaction);
        const username = user_info.username;
        const user_id = user_info.user_id;
        const game_mode = interaction.options.getString('gamemode') ?? 'any';
        // Retrieve the last match
        const last_match = await Search.getLastMatch(user_id, game_mode);
        // Get information about the last match
        const server_data = last_match.server_data;
        const map = server_data.MapName;
        const players = server_data.PlayerData;
        const character_rating_changes = last_match.data.ratingUpdates.player_rating_changes;
        const player_rating_changes = last_match.data.ratingUpdates.general_rating_changes;
        const winners = server_data.WinningTeamId;
        const mode = last_match.template.name;
        const team_scores = server_data.TeamScores;
        const isCustomMatch = server_data.IsCustomMatch;
        const set_id = server_data.set_id;

        // Create an array to hold the player information for each team
        const teamPlayers = [[], []];

        // Organize the player information by team
        for (let i = 0; i < players.length; i++) {
            const teamIndex = players[i].TeamIndex;
            const playerName = players[i].Username;
            const characterSlug = players[i].CharacterSlug;
            const character = Characters.getEmote(Characters.slugToDisplay(characterSlug));
            const damageDone = players[i].DamageDone;
            const ringouts = players[i].Ringouts;
            const deaths = players[i].Deaths;
            const ratingChange = character_rating_changes[i].post_match_rating.mean - character_rating_changes[i].pre_match_rating.mean;
            const playerRatingChange = player_rating_changes[i].post_match_rating.mean - player_rating_changes[i].pre_match_rating.mean;
            const characterRating = character_rating_changes[i].post_match_rating.mean;
            const playerRating = player_rating_changes[i].post_match_rating.mean;
            teamPlayers[teamIndex].push({ playerName, playerRating, playerRatingChange, character, characterSlug, characterRating, ratingChange, damageDone, ringouts, deaths });
        }

        // Create a new Discord embed
        const embed = new Discord.EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Last Match: ${map} - ${mode}`)
            .addFields(
                { name: "Match Results", value: `${winners === 0 ? "Blue Team" : "Red Team"} won ${team_scores[0]} - ${team_scores[1]}`},
                { name: "Blue Team", value: teamPlayers[0].map(p => `**${p.playerName}** ${p.character}\nPlayer Rating: ${parseInt(p.playerRating, 10)}${p.playerRatingChange.toFixed(1) > 0 ? " (+" : p.playerRatingChange.toFixed(1) < 0 ? " (-" : ""}${Math.abs(p.playerRatingChange.toFixed(1))})\nCharacter Rating: ${parseInt(p.characterRating, 10)}${p.ratingChange.toFixed(1) > 0 ? " (+" : p.ratingChange.toFixed(1) < 0 ? " (-" : ""}${Math.abs(p.ratingChange.toFixed(1))})\nDamage Done: ${p.damageDone}\nRingouts: ${p.ringouts}\nDeaths: ${p.deaths}`).join("\n\n"), inline: true, color: 0x0000ff },
                { name: "Red Team", value: teamPlayers[1].map(p => `**${p.playerName}** ${p.character}\nPlayer Rating: ${parseInt(p.playerRating, 10)}${p.playerRatingChange.toFixed(1) > 0 ? " (+" : p.playerRatingChange.toFixed(1) < 0 ? " (-" : ""}${Math.abs(p.playerRatingChange.toFixed(1))})\nCharacter Rating: ${parseInt(p.characterRating, 10)}${p.ratingChange.toFixed(1) > 0 ? " (+" : p.ratingChange.toFixed(1) < 0 ? " (-" : ""}${Math.abs(p.ratingChange.toFixed(1))})\nDamage Done: ${p.damageDone}\nRingouts: ${p.ringouts}\nDeaths: ${p.deaths}`).join("\n\n"), inline: true, color: 0xff0000 }
            );


        // Reply to the user to confirm that their username has been registered
        await interaction.editReply({ embeds: [embed]});
    }};
