const Discord = require('discord.js');
const client = new Discord.Client();

const prefix = ".";

client.on('ready', () => {

    console.log(`Logged in as ${client.user.tag}`);

});

client.on('message', async (message) => {

    if(!message.content.startsWith(prefix)) {
        return;
    }

    if(message.content.startsWith(prefix + 'create')) {

        const createEmbed = {
            title: "Click Here To Create A Party",
            url: "http://localhost:1337/party/v1/create",
            description: "Make sure the Insomnia Client is running",
            thumbnail: {
                url: "https://cdn.discordapp.com/embed/avatars/0.png"
            }
        }

        message.channel.send({embed: createEmbed});

    } else if (message.content.startsWith(prefix + 'host')) {

        let msg = message.content.split(' ');
        if(msg.length == 2) {
            var partyID = msg[1];
            var roomID = msg[1].slice(0, 5);

            const hostEmbed = {
                title: message.author.username + '#' + message.author.discriminator + ' is hosting a game!',
                description: ` [**Join**](http://localhost:1337/party/v1/join/${partyID})`,
                thumbnail: {
                    url: "https://cdn.discordapp.com/embed/avatars/0.png"
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
    
            message.channel.send({embed: hostEmbed});

            var categoryID
            await message.guild.channels.create(roomID, {
                type: 'category'
            }).then((category) => categoryID = category.id);

            message.guild.channels.create('match-chat', { 
                type: 'text',
                parent: categoryID
            });

            message.guild.channels.create('Team 1', { 
                type: 'voice',
                parent: categoryID,
                userLimit: 5
            });

            message.guild.channels.create('Team 2', { 
                type: 'voice',
                parent: categoryID,
                userLimit: 5
            });


        } else if(msg.length < 2) {

            message.reply("Please include your party ID");
    
        }

    } else if(message.content.startsWith(prefix + 'clear')) {

        let msg1 = message.content.split(' ');
        let catName = msg1[1];

        let category = message.guild.channels.cache.find(cat => cat.name == catName && cat.type == 'category');
        let categoryID = category.id;

        category.children.forEach(channel => channel.delete());
        category.delete();       
        

    }

});

client.login('');