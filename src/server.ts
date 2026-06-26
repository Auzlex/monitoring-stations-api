import loadEnv from './loadEnv';
loadEnv(); // Load and process environment variables

import http from 'http';
import app from './app';

const port = process.env.PORT || 7000;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

export default server;
