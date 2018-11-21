var socket = io('/users');

function joinGame(){
    var gameIdFieldEl = document.getElementById('text-field-game-id');
    var nameFieldEl = document.getElementById('text-field-name');
    console.log("sending:"+JSON.stringify({name: nameFieldEl.value, gameId:gameIdFieldEl.value}));
    
    socket.emit("user-join-game",{name: nameFieldEl.value, gameId:gameIdFieldEl.value});
}

function sendQuestionResponce(){
    responceEl = document.getElementById('text-field-responce');
    socket.emit("user-responce",{responce:responceEl.value});
    responceEl.setAttribute('disabled',null);
}

var chosenQuestionID= null;
function guessAnswer(id){

    enableAnswerButtons();

    console.log("You chose Question: "+id);
    chosenQuestionID = id;

    var answerButt = document.getElementById(id);
    console.log(answerButt);
    answerButt.disabled = true;

    var modelEl = document.getElementById("name-modal");
    modelEl.setAttribute("style","display:block;");
}

function pickName(strName){
    socket.emit('user-guess',{name: strName, questionId:chosenQuestionID});
}

function enableAnswerButtons(){
    var answerButtonsEl = document.getElementById("answer-buttons");
    for ( i in answerButtonsEl.childNodes){
        answerButtonsEl.childNodes[i].disabled = false;
    }
}

function closeModal(){
    var modelEl = document.getElementById("name-modal");
    modelEl.setAttribute("style","display:none;");
    enableAnswerButtons();
}