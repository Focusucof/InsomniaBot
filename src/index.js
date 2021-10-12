const { Client, Intents } = require('discord.js');
//const { db } = require('./main.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
exports.client = client;
const prefix = '.';

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {

    if(!message.content.startsWith(prefix)) {
        return;
    }

    if(message.content.startsWith(prefix + 'create')) {

        const createEmbed = {
            title: "Click Here To Create A Party",
            url: "http://localhost:1337/party/v1/create",
            description: "Make sure the Insomnia Client is running",
            thumbnail: {
                url: "https://cdn.discordapp.com/attachments/526150916814929990/839488210244993105/INS.png"
            }
        }

        message.channel.send({embeds: [createEmbed]});

    } else if (message.content.startsWith(prefix + 'host')) {

        let msg = message.content.split(' ');
        if(msg.length == 2) {
            var partyID = msg[1];
            var roomID = msg[1].slice(0, 5);

            const hostEmbed = {
                title: message.author.username + '#' + message.author.discriminator + ' is hosting a game!',
                description: ` [**Join**](http://localhost:1337/party/v1/join/${partyID})`,
                thumbnail: {
                    url: "https://cdn.discordapp.com/attachments/526150916814929990/839488210244993105/INS.png"
                },
                timestamp: new Date(),
                fields: [
                    {
                        name: 'Party ID',
                        value: partyID,
                    },
                    {
                        name: 'Room ID',
                        value: roomID
                    }
                    
                ]
                
            }
    
            message.channel.send({embeds: [hostEmbed]});

            var categoryID
            await message.guild.channels.create(roomID, {
                type: 'GUILD_CATEGORY'
            }).then((category) => categoryID = category.id);

            message.guild.channels.create('match-chat', { 
                type: 'GUILD_TEXT',
                parent: categoryID
            });

            message.guild.channels.create('Team 1', { 
                type: 'GUILD_VOICE',
                parent: categoryID,
                userLimit: 5
            });

            message.guild.channels.create('Team 2', { 
                type: 'GUILD_VOICE',
                parent: categoryID,
                userLimit: 5
            });


        } else if(msg.length < 2) {

            message.reply("Please include your party ID");
    
        }

    } else if(message.content.startsWith(prefix + 'clear')) {

        let msg1 = message.content.split(' ');
        let catName = msg1[1];

        let category = message.guild.channels.cache.find(cat => cat.name == catName && cat.type == 'GUILD_CATEGORY');

        category.children.forEach(channel => channel.delete());
        category.delete();       
        

    } else if(message.content.startsWith(prefix + 'link')) {

        // If .link command is used with an argument
        if(message.content.split(' ').length > 1) {
            let msg = message.content.split(' ');
            let puuid = msg[1];
            let discordID = message.author.id;
            
            db.run('UPDATE users SET discordID = ? WHERE puuid = ?', [discordID, puuid], function(err) {
              if (err) {
                return console.error(err.message);
              }
              console.log(`Row(s) updated: ${this.changes}`);
            
            });

            db.all('SELECT * FROM users', (err, rows) => {
                if (err) {
                    throw err;
                }
                rows.forEach((row) => {
                    console.log(row.puuid, row.name, row.rank, row.discordID);
                });
            });

            db.get('SELECT rank FROM users WHERE puuid = ?', puuid, (err, row) => {
                let rank = row.rank.split(' ')[0];
                let role = message.guild.roles.cache.find(role => role.name == rank);
                message.member.roles.add(role);
            });

        } else {
            const linkEmbed = {
                title: "Link your VALORANT account!",
                url: "http://localhost:1337/stats/v1/link",
                description: "Make sure the Insomnia Client is running",
                thumbnail: {
                    url: "https://cdn.discordapp.com/attachments/526150916814929990/839488210244993105/INS.png"
                }
            }
            message.channel.send({embeds: [linkEmbed]});
        }

    }

});

client.login(process.env.BOT_TOKEN);

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');

//const { client } = require('./index.js');

const app = express();

app.use(bodyParser.json());

const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the database.');
    }
});
exports.db = db;

db.run('CREATE TABLE IF NOT EXISTS users (puuid TEXT PRIMARY KEY, name TEXT NOT NULL, rank TEXT NOT NULL, discordID TEXT)');

/*
 * 
 * Expected payload:
 * 
 * {
 *     "puuid": string,
 *     "name": string,
 *     "rankid": number,
 *     "rank": string,
 *     "elo": number
 * }
 * 
 */

app.post('/', async function(req, res) {
    let data = {
        puuid: req.body.puuid,
        name: req.body.name,
        rankID: req.body.rankID,
    }

    let rank = await getRank(data.rankID);

    db.run('INSERT OR IGNORE INTO users(puuid, name, rank, discordID) VALUES (?, ?, ?, ?)', [data.puuid, data.name, rank]);
    db.run('UPDATE users SET rank = ? WHERE puuid = ?', [rank, data.puuid]);
    // output database contents
    /* db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            console.log(row.puuid, row.name, row.rank, row.discordID);
        });
    }); */
    db.get('SELECT rank, discordID FROM users WHERE puuid = ?', data.puuid, (err, row) => {
        const server = client.guilds.cache.get(process.env.SERVER_ID);
        let member = server.members.cache.get(row.discordID);
        let role = server.roles.cache.find(role => role.name == row.rank);
        if (member) {
            member.roles.add(row.rank.split(' ')[0]);
        }
    });
    res.send('OK');
});

app.listen(3000, () => console.log('Server running on port 3000'));


async function getRank(rankID) {
    const rankInfo = {
        "Ranks": {
          "0": "Unrated",
          "1": "Unknown 1",
          "2": "Unknown 2",
          "3": "Iron 1",
          "4": "Iron 2",
          "5": "Iron 3",
          "6": "Bronze 1",
          "7": "Bronze 2",
          "8": "Bronze 3",
          "9": "Silver 1",
          "10": "Silver 2",
          "11": "Silver 3",
          "12": "Gold 1",
          "13": "Gold 2",
          "14": "Gold 3",
          "15": "Platinum 1",
          "16": "Platinum 2",
          "17": "Platinum 3",
          "18": "Diamond 1",
          "19": "Diamond 2",
          "20": "Diamond 3",
          "21": "Immortal",
          "22": "Immortal",
          "23": "Immortal",
          "24": "Radiant"
        }
    }

    return rankInfo.Ranks[rankID];
}