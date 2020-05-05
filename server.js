const PORT = 8090; // || process.env.PORT
const fs = require('fs');
const express = require('express');
const app = express();
const uuid = require('uuid');

const DB_PATH = 'chattext.json';
const chatArray = JSON.parse(fs.readFileSync(DB_PATH)); //previous: sentMsgs

let chatClient = {}; //single message from an user

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

io.on('connection', (socket) => {
    console.log('an user is connected');

    //socket.on('messages', () => {socket.emit('messages', chatArray)}); //not working
    socket.emit('messages', chatArray); //not working

    socket.on('new_message', (data) => {
        console.log('Got a new message', data);

        data.id = uuid.v4(); //adding id to the data objekt 
        chatArray.push(data); 
        saveMessage(); 
        /*chatClient = {
            username: data.username,
            content: data.content,
            id: uuid.v4(),
        }
        chatArray.push(chatClient) //working
        console.log('CHAT CLIENT', chatClient); //working
        saveMessage();*/

        io.sockets.emit('new_message', data); //working, later: socket.to('room').emit
    });

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});