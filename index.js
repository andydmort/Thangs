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


var proctorIO = io.of('/proctor');
proctorIO.on('connection', function(socket){
    proctorSocketId=socket.id;
  console.log('proctor connected');
  //Create Game
  game = new Game(getRandInt(100));
  console.log("Initializing Game:")
  console.log(game);

  ClientCreator.getPageAndReplace({gameId:game.gameId},'proctorPages/landing.html').then((strn)=>{
        proctorIO.emit('send-page', strn);
    });

    //Setting sockets for Proctor. 
    socket.on('start-game',function(){
        
        // game.questionIndex=getRandInt(game.questions.length-1);
        // ClientCreator.getPageAndReplace({quest:game.questions[game.questionIndex]},'proctorPages/displayQuestion.html').then((strn)=>{
        //     proctorIO.emit('send-page', strn);
        // });
        ClientCreator.getPageAndReplace({quest:game.getNewQuestion()},'proctorPages/displayQuestion.html').then((strn)=>{
                proctorIO.emit('send-page', strn);
            });
        // ClientCreator.getPageAndReplace({quest:game.questions[game.questionIndex]},'userPages/answerQuestionPrompt.html').then((strn)=>{
        //     usersIO.emit('send-page', strn);
        // });
        ClientCreator.getPageAndReplace({quest:game.getCurrentQuestion()},'userPages/answerQuestionPrompt.html').then((strn)=>{
            usersIO.emit('send-page', strn);
        });
        
        console.log("Proctor is starting game:");
        console.log(game);
    });

    socket.on('disconnect',function(){
        console.log("Proctor has left game is over.");
        game=null;
    });
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
            //adding user to game
            // game.users[socket.id]=new User(data.name,socket.id);
            game.addUser(data.name,socket.id);
            //sending name to proctor
            proctorIO.emit('to-proctor-name-joined',data);
            //Giving responce to User
            ClientCreator.getPageAndReplace({name:data.name},'userPages/waitingGameStart.html').then((strn)=>{
                socket.emit('send-page', strn);
            });
            console.log(data.name+" Joined quiz:");
            console.log(game);
        }
        // console.log("sending: "+data+" to proctor");
        // proctorIO.sockets.emit('to-proctor-name-joined',data);
    });

    socket.on('user-responce',function(data){
        console.log(game.users[socket.id].name+ " resonded question with "+data.responce);
        game.users[socket.id].lastResponce = data.responce;
        game.numberOfRecievedAnswers++;
        if(game.numberOfRecievedAnswers >= game.numUsers){
            //TODO: This is where everone has answered and we can start the user Guessing Loop.
            console.log("Everyone Has answered")
        }
        console.log(game);
    });

    socket.on('disconnect',function(){
        console.log(game.users[socket.id].name+" left the game");
        game.removeUser(socket.id);
    });
    
});

//low bound is 0 and high is highVal
function getRandInt(highVal){
    console.log()
    return Math.floor(Math.random()*highVal+1);
}

http.listen(port, () => console.log(`Server is listening on port ${port}!`));

