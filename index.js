var ClientCreator = require("./modules/clientCreator.js");
var Game = require("./modules/gameMod.js");
var User = require("./modules/userMod.js");

var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 3450

app.use(express.static('JS')); 

var game;//Global game variable. 

app.get('/', (req, res) =>{
    res.sendFile(__dirname+'/proctorPages/template.html');
});
app.get('/user', (req, res) =>{
    res.sendFile(__dirname+'/userPages/template.html');
});


//TODO: Upgrade to socket rooms to tell differencs between user and client.
// io.on('connection', function(socket){
//     console.log('a user connected');
    
//     ClientCreator.getPageAndReplace({1:'<p>You passed another test<p>'},'userPages/testClient1.html').then((strn)=>{
//         console.log("here3");
//         io.emit('send-page', strn);
//     }) 
// });

var proctorIO = io.of('/proctor');
proctorIO.on('connection', function(socket){
    proctorSocketId=socket.id;
  console.log('proctor connected');
  //Create Game
  game = new Game(Math.floor(Math.random()*101));

  ClientCreator.getPageAndReplace({gameId:game.gameId},'proctorPages/landing.html').then((strn)=>{
        proctorIO.emit('send-page', strn);
    });

    //Setting sockets for Proctor. 


});
// procotrIO.emit('hi', 'everyone!');

var usersIO = io.of('/users');
usersIO.on('connection', function(socket){
    console.log('user connected');
    ClientCreator.getPage('userPages/landing.html').then((strn)=>{
        usersIO.emit('send-page', strn);
    });

    //Setting socket for User
    socket.on('user-join-game',function(data){
        if(game.gameId != data.gameId || data.name == ''){
            console.log("Someone tried an incorrect ID");
            ClientCreator.getPage('userPages/loginError.html').then((strn)=>{
                socket.emit('send-page', strn);
            });
        }
        else{
            console.log(data.name+" is joining quiz "+data.gameId);
            proctorIO.emit('to-proctor-name-joined',data);
            ClientCreator.getPageAndReplace({name:data.name},'userPages/waitingGameStart.html').then((strn)=>{
                socket.emit('send-page', strn);
            });
        }
        // console.log("sending: "+data+" to proctor");
        // proctorIO.sockets.emit('to-proctor-name-joined',data);
    });
});


http.listen(port, () => console.log(`Server is listening on port ${port}!`));

// console.log(ClientCreator.replaceInString({name:'Sarah',name2:'Andrew'},"The most buetiful person in the whole world is /$name$/ and she is married to /$name2$/"));