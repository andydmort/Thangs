var User = require("./userMod.js");
const csv = require('csv-parser');
// csv({ separator: '\t' });
const fs = require('fs');
const results = [];

function readQuestions(fileName){
    questions =[];
    fs.readFileSync(__dirname+'/'+fileName).toString().split('\n').forEach(function(question){
        console.log(question);
        questions.push(question);
    });
    return questions;
}

// console.log(readQuestions('questions.txt'));

function Game(gameId){
    this.users = {}; //A diction of the user Module, the key will be the socketId
    this.numUsers = 0;
    //Indexed by socketit and adds user with name. 
    this.addUser = function(name,socketId){
        this.users[socketId] = new User(name,socketId);
        this.numUsers++;
    }
    //Takes the socket id and deletes the user from the game.
    this.removeUser = function(socketId){
        delete this.users[socketId];
        this.numUsers--;
    }
    this.turnOfUserIndex = 0;
    this.gameId = gameId;
    this.questions = readQuestions('questions.txt');
    this.questionIndex = 0;
    this.numberOfRecievedAnswers=0;
}



module.exports = Game;