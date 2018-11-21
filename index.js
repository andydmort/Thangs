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
        // game.users[socket.id].lastResponce = data.responce;
        // game.numberOfRecievedAnswers++;
        game.addAnswer(data.responce,socket.id);
        //This is where everone has answered and we can start the user Guessing Loop.
        if(game.numberOfRecievedAnswers >= game.numUsers){
            console.log("Everyone Has answered");
            //Send the answers to procotor. 
            sendProctorAnswerPage();
            // GuessingLoop(); //Bypassing the GuessingLoop. Guessing loop probably wont work. 
            sendUserAnswerPage();    
        }
        console.log(game);
    });

    socket.on('user-guess',function(data){
        console.log(game.users[socket.id].name+" made a guess: "+data);
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

async function buildProctorAnswerPage(){
    return new Promise( async function(resolve,reject){
        answersHtml='';
        for( i in game.answers){
            if(!game.answers[i].isGuessed){
                await ClientCreator.getPageAndReplace({name: '?',answer:game.answers[i].answer},"proctorPages/bottomResponceTemplate.html").then((data)=>{
                    answersHtml+= data;
                });
            }
            else{
                await ClientCreator.getPageAndReplace({name: game.answers[i].userName,answer:game.answers[i].answer},"proctorPages/bottomResponceTemplate.html").then((data)=>{
                    answersHtml+= data;
                });
            }
        }
        resolve(answersHtml);

    });
}

function sendProctorAnswerPage(){
    buildProctorAnswerPage().then((data)=>{
        ClientCreator.getPageAndReplace({question:game.getCurrentQuestion(),answers:data},"proctorPages/topResponceTemplate.html").then((strn)=>{
            proctorIO.emit('send-page', strn);
        });
    });
}

async function buildUserAnswerPage(){
    return new Promise( async function(resolve,reject){
        userAnswersHtml='';
        for( i in game.answers){
            if(!game.answers[i].isGuessed){
                await ClientCreator.getPageAndReplace({index:i ,answerIndex: i, name: '?',answer:game.answers[i].answer},"userPages/userBottomResponceTemplate.html").then((strn1)=>{
                    userAnswersHtml+= strn1;
                });
            }
            else{
                await ClientCreator.getPageAndReplace({index:i ,answerIndex: i, name: game.answers[i].userName, answer:game.answers[i].answer},"userPages/userBottomResponceTemplate.html").then((strn2)=>{
                    userAnswersHtml+= strn2;
                });
            }
        }
        resolve(userAnswersHtml);
    });
}

async function buildUserAnswerNamesPage(){
    return new Promise( async function(resolve,reject){
        userAnswersHtml='';
        //Todo: randomize names. Grab the names and mix them up to a random order. Then place them in the function below. 
        for( i in game.answers){
            if(!game.answers[i].isGuessed){
                await ClientCreator.getPageAndReplace({name: game.answers[i].userName, name1: game.answers[i].userName},"userPages/userBottomResponceNamesTemplate.html").then((strn5)=>{
                    userAnswersHtml+= strn5;
                });
            }
        }
        resolve(userAnswersHtml);
    });
}

function sendUserAnswerPage(){
    buildUserAnswerPage().then((strn3)=>{
        console.log("Printing the html for User answer page");
        console.log(strn3);
        buildUserAnswerNamesPage().then((strn6)=>{
            ClientCreator.getPageAndReplace({question:game.getCurrentQuestion(),answers:strn3, nameOptions:strn6},"userPages/topResponceTemplate.html").then((strn4)=>{
                usersIO.emit('send-page', strn4);
            });
        });
    });
    
}

//This function will be a loop to go through users so they can guessed who said what. 
function GuessingLoop(){
    //TODO: Make sure the is sent to a particular user. 
    sendUserAnswerPage();
    //TODO: Add modal to users answer question. 
}

http.listen(port, () => console.log(`Server is listening on port ${port}!`));

