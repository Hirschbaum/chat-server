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

//-----------------HTTP METHODS-----------------------------------------------
app.use((req, res, next) => {
    let start = Date.now();
    res.once('finish', () => {
        let end = Date.now();
        let time = end - start;
        console.log(req.method, req.path, res.statusCode, time + ' ms');
    });
    next();
});

//----- channels ----((chatrooms))----------------------------------------------
//-------------------------------------------------------------------------------

app.get('/:id', (req, res) => {
    //find the channel according to channels id in the json file...
    let choosenChannel = DB_PATH.find((channel) => channel.id === (req.params.id)) 
    if (!choosenChannel) {
        res.status(400).end();
        return;
    }
    res.status(200);
    res.json(choosenChannel);

    //and display the messages from that Channel: in the socket part

})

//to to create a new channel and save it in the json file
// curl -XPOST localhost:8090/ -H 'Content-Type: application/json' -d '{"name": "abcde"}' -v         

app.post('/', (req, res) => {

    let name = req.body.channelName;
    if (!name) {
        res.status(400).end();
    } else {
        let newChannel = {
            "channelName": name,
            "id": uuid.v4(),
            "channelMessages": [],
        }

        console.log(newChannel.channelName, newChannel.id); //working

        chatArray.push(newChannel);
        fs.writeFile(DB_PATH, JSON.stringify(chatArray), (error, data) => {
            if (error) {
                res.status(500).end();
            }
            console.log('DATA with newChannel', data); //UNDEFINED....
            res.status(201); //got it to devTools console
            res.send(data = { newChannel });

        })
    }
});

app.delete('/:id', (req, res) => {
    //find all the data, except the specific id in the array
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
        //mapp through the json file for channels, if channel.channelName === data.channel?, then what?! push and save the messages there

        io.sockets.emit('new_message', data); //working, later: socket.to('room').emit
    });

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});