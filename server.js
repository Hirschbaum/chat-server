const PORT = 8090 || process.env.PORT;
const fs = require('fs');
const express = require('express');
const app = express();
const uuid = require('uuid');

let DB_PATH = require('./chattext.json');

app.use(express.json());

const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*' });

function saveMessage() { 
    return new Promise((resolve, reject) => {
        fs.writeFile('./chattext.json', JSON.stringify(DB_PATH), error => { 
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

app.get('/', (req, res) => { //dont use it
    fs.readFile('chattext.json', (err, data) => {
        if (err) { res.status(400).end() };
        res.send({ data });
    })
})

app.get('/:id', (req, res) => { //find the channel according to channels id in the json file...
    let choosenChannel = DB_PATH.find((channel) => channel.id === (req.params.id))
    if (!choosenChannel) {
        res.status(400).end();
        return;
    }
    res.status(200);
    res.json(choosenChannel);
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

        console.log(newChannel.channelName, newChannel.id);

        DB_PATH.push(newChannel);
        fs.writeFile('./chattext.json', JSON.stringify(DB_PATH), (error, data) => {
            if (error) {
                res.status(500).end();
            }
            console.log('DATA with newChannel', newChannel);
            res.status(201);
            res.send(data = { newChannel });
        })
    }
});

app.delete('/:id', (req, res) => {
    let channelsToSave = DB_PATH.filter(channel => { return channel.id !== (req.params.id) });
   
   fs.writeFile('./chattext.json', JSON.stringify(channelsToSave), (error, data) => { 
        if (error) { res.status(500).end() };
        res.status(204).end(); 
    })
    
})

//-----------------SOCKET----------------------

io.on('connection', (socket) => {
    console.log('an user is connected');

    socket.emit('messages', DB_PATH);

    socket.on('new_message', (data) => {
        console.log('Got a new message', data);

        data.msg_id = uuid.v4();

        DB_PATH.map(channel => {
            if (channel.id === data.id) {
                channel.channelMessages.push(data);
                saveMessage(); 
            }
        })

        io.sockets.emit('new_message', data);
    });

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});