const PORT = 8090; // || process.env.PORT
const fs = require('fs');
const express = require('express');
const app = express();
const uuid = require('uuid');

const DB_PATH = 'chattext.json';
const chatArray = JSON.parse(fs.readFileSync(DB_PATH)); //previous: sentMsgs

app.use(express.json());

const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*' });

function saveMessage() {
    return new Promise((resolve, reject) => {
        fs.writeFile(DB_PATH, JSON.stringify(chatArray), error => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        })
    })
}

//-----------------HTTP METHODS---------------

//to find a specific channel
app.get('/channel/:id', (req, res) => {
    //find the room according to id in the json file...
})

//to to create a new channel
app.post('/', (req, res) => {
    
    let name = req.body.channelName;
    //if no channel, 400
    //logic to create a new channel: id, name, channelMessages
    //push, save the new channel in the json file
})

app.delete('/delete:id', (req, res) => {
    //find all the data, execept the specific id in the array
    //save these, but not the specific id
})

//-----------------SOCKET----------------------

io.on('connection', (socket) => {
    console.log('an user is connected');

    socket.emit('messages', chatArray); // working

    socket.on('new_message', (data) => {
        console.log('Got a new message', data);

        data.id = uuid.v4(); //adding id to the data objekt 
        chatArray.push(data);
        saveMessage();
        /*chatClient = {username: data.username, content: data.content, id: uuid.v4(),}; chatArray.push(chatClient); saveMessage();*/

        io.sockets.emit('new_message', data); //working, later: socket.to('room').emit
    });

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});