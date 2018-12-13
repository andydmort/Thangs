var ClientCreator = require("./modules/clientCreator.js");
var Game = require("./modules/gameMod.js");
var User = require("./modules/userMod.js");//Not yet used.

var express = require("express");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const port = 3450

app.use(express.static('JS')); 
app.use(express.static('style'));

var game;//Global game variable. 

app.get('/proctor', (req, res) =>{
    res.sendFile(__dirname+'/proctorPages/template.html');
});
app.get('/', (req, res) =>{
    res.sendFile(__dirname+'/userPages/template.html');
});


var proctorIO = io.of('/proctor');
proctorIO.on('connection', function(socket){
    proctorSocketId=socket.id;
  console.log('proctor connected');
  //Create Game
  game = new Game(getRandInt(100));
  console.log("Initializing Game:");
  console.log(game);

  ClientCreator.getPageAndReplace({gameId:game.gameId},'proctorPages/landing.html').then((strn)=>{
        proctorIO.emit('send-page', strn);
    });

    //Setting sockets for Proctor. 
    socket.on('start-game',function(){
        
        ClientCreator.getPageAndReplace({quest:game.getNewQuestion()},'proctorPages/displayQuestion.html').then((strn)=>{
                proctorIO.emit('send-page', strn);
            });
        ClientCreator.getPageAndReplace({quest:game.getCurrentQuestion()},'userPages/answerQuestionPrompt.html').then((strn)=>{
            // usersIO.emit('send-page', strn);
            for (i in game.users){
                usersIO.to(i).emit('send-page', strn);
            }
        });
        
        console.log("Proctor is starting game:");
        console.log(game);
    });


    socket.on('next-question',function(){
        sendNextQuestion();
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
        if(game == null){
            socket.emit('error-user',"Error: There is no game open right now.");
            return; 
        }
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
            sendUserAnswerPage(game.userOrder[game.turnOfUserIndex]);  
            sendWaitingToGuessToEveryOneBut(game.userOrder[game.turnOfUserIndex]);
        }
        console.log(game);
    });

    socket.on('user-guess',async function(data){
        console.log(game.users[socket.id].name+" made a guess: "+ JSON.stringify(data));
        
        //if answer correct
        if(game.answers[data.answerId].userName == data.name){
            console.log(JSON.stringify(data)+" was correct!");
            //Set answer to true if guess is correct
            game.answers[data.answerId].isGuessed = true;
            //Add one to the guessers score.
            game.users[game.userOrder[game.turnOfUserIndex]].score++; //only Gives one. 
            
            if(game.allAnswersGuessed()){
                //Send new Promp to all users
                //TODO: Handle What happens after all users guess. 
                await sendProctorScoreOfAllUsers();
                for( i in game.users){
                    sendUsersTheirScore(i);
                }
                //TODO: send all new prompt to all users.
                console.log("All answers are guessed.");
            }
            //if all answers were gessed
            //else
            else{
                //resend promp to socket
                sendUserAnswerPage(game.userOrder[game.turnOfUserIndex]);   
                sendWaitingToGuessToEveryOneBut(game.userOrder[game.turnOfUserIndex]); 
                sendProctorAnswerPage(); //Showing answer on screen. 
            }
        }
        //else
        else{
            console.log(JSON.stringify(data)+" was wrong!");
            //Send guess to new answer 
            sendUserAnswerPage(game.userOrder[game.moveUsersTurn()]); 
            sendWaitingToGuessToEveryOneBut(game.userOrder[game.turnOfUserIndex]);   
        }
        
    });

    socket.on('disconnect',function(){
        console.log("User not in game Disconnected.");
        if(game == null) return; //Cause an early breakout. 
        if(socket.id in game.users){
            console.log(game.users[socket.id].name+" left the game");
            game.removeUser(socket.id);
        }
        console.log(game);
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
        console.log("Randomizing answers:")
        console.log(game.answers);
        randOrderOfAnswers = JSON.parse(JSON.stringify(game.answers));
        for (i in randOrderOfAnswers){
            randOrderOfAnswers[i].orginalIndex = i;
        }
        randOrderOfAnswers = randOrderOfAnswers.sort((a,b)=>{return .5 - Math.random()});
        console.log(randOrderOfAnswers);
        for( j in randOrderOfAnswers){
            if(!randOrderOfAnswers[j].isGuessed){
                await ClientCreator.getPageAndReplace({index:randOrderOfAnswers[j].orginalIndex ,answerIndex: randOrderOfAnswers[j].orginalIndex, name: '?',answer:randOrderOfAnswers[j].answer},"userPages/userBottomResponceTemplate.html").then((strn1)=>{
                    userAnswersHtml+= strn1;
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


function sendUserAnswerPage(sockID){
    buildUserAnswerPage().then((strn3)=>{
        // console.log("Printing the html for User answer page");
        // console.log(strn3);
        buildUserAnswerNamesPage().then((strn6)=>{
            ClientCreator.getPageAndReplace({question:game.getCurrentQuestion(),answers:strn3, nameOptions:strn6},"userPages/topResponceTemplate.html").then((strn4)=>{
                    usersIO.to(sockID).emit('send-page', strn4);
            });
        });
    });
    
}
async function sendWaitingToGuessToEveryOneBut(sockID){
    console.log("SendWaiting to everyone But "+JSON.stringify(sockID));
    ClientCreator.getPageAndReplace({name:game.users[game.userOrder[game.turnOfUserIndex]].name}, "userPages/waitingToGuess.html").then((strn7)=>{
        for(i in game.users){
            console.log("Checking i: "+JSON.stringify(i)+" is not equal to "+JSON.stringify(sockID));
            if ( i != sockID){
                usersIO.to(i).emit('send-page', strn7);
            }
        }
    });

}


async function sendUsersTheirScore(sockID){
    await ClientCreator.getPageAndReplace({score: game.users[sockID].score},"userPages/myScorePage.html").then((strn8)=>{
        usersIO.to(sockID).emit('send-page',strn8);
    });
}

async function getScoreString(){
    
    return new Promise(async function(resolve,reject){
        strnOfScores = "";
        for(i in game.users){
            await ClientCreator.getPageAndReplace({name: game.users[i].name , score:game.users[i].score },"proctorPages/scorePageBottom.html").then((strn9)=>{
                strnOfScores += strn9;
            });
        }
        resolve(strnOfScores);
    });

}
function sendProctorScoreOfAllUsers(){
    // console.log(strnOfScores);
    new Promise(async function(resolve,reject){
        getScoreString().then((data1)=>{
            ClientCreator.getPageAndReplace({scores: data1},"proctorPages/scorePageTop.html").then((strn10)=>{
                proctorIO.emit('send-page', strn10);
                resolve("Done");
            });
        });
    });
    
}


//Used to send the next question to all clients and Proctor. 
function sendNextQuestion(){
    ClientCreator.getPageAndReplace({quest:game.getNewQuestion()},'proctorPages/displayQuestion.html').then((strn)=>{
        proctorIO.emit('send-page', strn);
    });
    ClientCreator.getPageAndReplace({quest:game.getCurrentQuestion()},'userPages/answerQuestionPrompt.html').then((strn)=>{
    // usersIO.emit('send-page', strn);
        for (i in game.users){
            usersIO.to(i).emit('send-page', strn);
        }
    });
}

//This function will be a loop to go through users so they can guessed who said what. 
function GuessingLoop(){
    //TODO: Make sure the is sent to a particular user. 
    sendUserAnswerPage();
    //TODO: Add modal to users answer question. 
}

http.listen(port, () => console.log(`Server is listening on port ${port}!`));

