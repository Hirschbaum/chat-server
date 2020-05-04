const PORT = 8090; // || process.env.PORT
const fs = require('fs');
const express = require('express');
const app = express();
const uuid = require('uuid');
const DB_PATH = 'chattext.json';

let chatMessages = [];
let chatClient = {}; //single message from an user

app.use(express.json());

const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*' });

/*const router = express.Router();

router.get('/', (req, res) => {
    res.send({response: "Server started and runing."}).status(200);
});*/

function saveMessages() {
    return new Promise((resolve, reject) => {
        fs.writeFile(DB_PATH, JSON.stringify(chatMessages), error => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        })
    })
}

function showAllMessages() {
    return new Promise((resolve, reject) => {
        fs.readFile(DB_PATH, (error, data) => {
            if (error) {
                reject(error);
            } else {
                console.log('Is it working?');
                resolve(data);
            }
        })
    })
}

io.on('connection', (socket) => {
    console.log('an user is connected');

    socket.emit('messages', data => {
        showAllMessages();
    });

    socket.on('new_message', (data) => {
        console.log('Got a new message', data);

        chatClient = {
            username: data.username,
            content: data.content,
            id: uuid.v4(),
        }
        chatMessages.push(chatClient);
        saveMessages();

        socket.broadcast.emit('new_message', chatClient);

        console.log(chatMessages);

    });

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});