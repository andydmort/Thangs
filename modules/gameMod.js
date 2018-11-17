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
    this.users = []; //A list of the user Module;
    this.turnOfUserIndex = 0;
    this.gameId = gameId;
    this.questions = readQuestions('questions.txt');
    this.questionIndex = 0;
}



module.exports = Game;