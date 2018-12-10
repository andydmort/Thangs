var User = require("./userMod.js");
var Answer = require("./answerMod.js");
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

function getRandInt(highVal){
    console.log()
    return Math.floor(Math.random()*highVal+1);
}
// console.log(readQuestions('questions.txt'));

function Game(gameId){

    this.users = {}; //A diction of the user Module, the key will be the socketId
    this.userOrder=[]; //Holds the order of the users for choosing who will be guessing. 
    this.numUsers = 0;
    this.turnOfUserIndex = 0; //Whos turn is it go guess. 
    //Indexed by socketit and adds user with name. 
    this.addUser = function(name,socketId){
        this.users[socketId] = new User(name,socketId);
        this.userOrder.push(socketId);
        this.numUsers++;
    }
    //Takes the socket id and deletes the user from the game.
    this.removeUser = function(socketId){
        delete this.users[socketId];
        //Take out of user order. 
        var ind = this.userOrder.indexOf(socketId);
        if (ind != -1){
            this.userOrder.splice(ind,1);
        }
        this.numUsers--;
    }

    this.gameId = gameId;
    this.questions = readQuestions('questions.txt');
    this.questionIndex = 0;
    this.getNewQuestion= function(){
        this.questionIndex=getRandInt(this.questions.length-1);
        return this.questions[this.questionIndex];
    }
    this.getCurrentQuestion = function(){
        return this.questions[this.questionIndex];
    }

    this.numberOfRecievedAnswers=0;
    this.answers = [];
    this.addAnswer = function(answer,socketId){
        this.users[socketId].lastResponce = answer;
        this.answers.push(new Answer(answer,this.users[socketId].name));
        this.numberOfRecievedAnswers++;
    }
    this.dropAnswers = function(){
        this.answers=[];
        this.numberOfRecievedAnswers = 0;
    }
}



module.exports = Game;