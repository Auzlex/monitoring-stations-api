// require the http module
const http = require('http');
const app = require('./app');

// grab the port from an enviroment variable if not default to 7000
const port = process.env.PORT || 7000;

// create a server
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
