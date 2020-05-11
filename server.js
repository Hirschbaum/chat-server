const PORT = 8090; // || process.env.PORT
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

app.get('/', (req, res) => {
    fs.readFile('chattext.json', (err, data) => {
        if (err) {res.status(400).end()};
        res.send({data});
    })
})

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

        DB_PATH.push(newChannel);
        fs.writeFile('./chattext.json', JSON.stringify(DB_PATH), (error, data) => {
            if (error) {
                res.status(500).end();
            }
            console.log('DATA with newChannel', newChannel); 
            res.status(201); //got it to devTools console
            res.send(data = { newChannel });

        })
    }
});

app.delete('/:id', (req, res) => {
    //find all the data, except the specific channel id in the array
    //save these data, but not the one with the specific id
})

//-----------------SOCKET----------------------

io.on('connection', (socket) => {
    console.log('an user is connected');

    socket.emit('messages', DB_PATH); // working, here was chatArray before, this sends all the messages to the app

    socket.on('new_message', (data) => { //-----TO FIX-----missing: id of the channel from the received data!!!!
        console.log('Got a new message', data);

        data.msg_id = uuid.v4(); //adding id to the data objekt (via new_message socket)  

        DB_PATH.map(channel => {
            if(channel.id === data.id) { //---not working  data.id in the headers
                channel.channelMessages.push(data); //data = the sent new message
                saveMessage();
                //earlier: socket.to(channel).emit('new_message', data); //not working
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