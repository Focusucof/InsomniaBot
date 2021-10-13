const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');

const { client } = require('./index.js');

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
        const server = client.guilds.cache.get('834064005311889419');
        let member = server.members.cache.get(row.discordID);
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