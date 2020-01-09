import * as express from 'express';
import * as http from 'http';
import * as socket from 'socket.io';
import * as serveIndex from 'serve-index';

const app : express.Application = express();
const server : http.Server = new http.Server(app);
const io : socket.Server = socket(server);
const port : number = 3000;

server.listen(port, () => {
	console.log("Listening on port " + port);
});

app.get('/', (req : express.Request, res : express.Response) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.use(express.static(__dirname + '/public/'));
app.use('/resources', serveIndex(__dirname + '/public/resources'));