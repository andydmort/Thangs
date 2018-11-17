var ClientCreator = require("./clientCreator.js");

var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 3450

app.use(express.static('JS')); 


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

proctorSocketId=0;
var proctorIO = io.of('/proctor');
proctorIO.on('connection', function(socket){
    proctorSocketId=socket.id;
  console.log('proctor connected');
  ClientCreator.getPageAndReplace({gameId:'1'},'proctorPages/landing.html').then((strn)=>{
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
        console.log(data);
        console.log("sending: "+data+" to proctor");
        // for( i in proctorIO.sockets.connected){
        //     proctorIO.sockets.connected[i].emit('to-proctor-name-joined',data);
        // }
        console.log(proctorSocketId);
        proctorIO.emit('to-proctor-name-joined',data);
        // proctorIO.sockets.emit('to-proctor-name-joined',data);
    });
});


http.listen(port, () => console.log(`Server is listening on port ${port}!`));

// console.log(ClientCreator.replaceInString({name:'Sarah',name2:'Andrew'},"The most buetiful person in the whole world is /$name$/ and she is married to /$name2$/"));