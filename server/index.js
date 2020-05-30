const cors = require('cors')
const app = require('express')().use(cors);
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.send('ok');
});

io.on('connection', (socket) => {
    io.emit('update', { online: getConnectionCount() });

});

io.on('disconnect', () => {
    io.emit('update', { online: getConnectionCount() });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

function getConnectionCount() {
    const count = io.sockets.clients().server.eio.clientsCount
    console.log('Online users:', count)
    return count
}