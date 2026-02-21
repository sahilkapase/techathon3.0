require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 8000;
const socketport = process.env.SOCKET_PORT || 7000;
const cookieparser = require('cookie-parser');
var cors = require('cors');
var bodyParser = require('body-parser');

// Fix BigInt JSON serialization (needed for Prisma BigInt fields like Mobilenum, Adharnum, Accountnum)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
const path = require('path');

// ==================== PostgreSQL (Neon) Database Connection ====================
const { connectDB, prisma } = require('./config/prisma');
connectDB(); // Connect to PostgreSQL via Prisma

// Make Prisma available globally
global.prisma = prisma;




app.use(express.json());
app.use(express.urlencoded({ extended: true }));// always write first as a middle ware
app.use(cors());
app.use(cookieparser());// this both middleware is needed to run before router

// socket

const server = require('http').createServer(app);

const chatSockets = require('./config/chat_sockets').chatSockets(server);

server.listen(socketport, function (err) {
    if (err) {
        console.log("Error to start socket!!!");
        return;
    }

    console.log("socket is running on the port: ", socketport);
})

app.use('/', require('./routes/index_route'));
app.use('/api/financial', require('./routes/financial'));
app.use(express.static('static'));
// app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.set('views', './views');


app.listen(port, function (err) {
    if (err) {
        console.log("Error to start server!!!");
        return;
    }

    console.log("Server is running on the port: ", port);
})