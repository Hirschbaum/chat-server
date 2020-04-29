const PORT = 8090; // || process.env.PORT
const express = require('express');
const app = express();
const uuid = require('uuid');

const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*' });

/*const router = express.Router();

router.get('/', (req, res) => {
    res.send({response: "Server started and runing."}).status(200);
});*/

io.on('connection', (socket) => {
    console.log('an user is connected');

    socket.on('new_message', (data) => {
        console.log('Got a new message', data);

        socket.broadcast.emit('new_message', {
            username: data.username,
            content: data.content,
            id: uuid.v4(),
        });
    })

    socket.on('disconnect', () => {
        console.log('an user is disconnected');
    });
});



http.listen(PORT, () => {
    console.log(`Started server on ${PORT}`);
});