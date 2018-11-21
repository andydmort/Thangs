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


function guessAnswer(id){
    var modelEl = document.getElementById("name-modal");
    modelEl.setAttribute("style","display:block;");
}

function closeModal(){
    var modelEl = document.getElementById("name-modal");
    modelEl.setAttribute("style","display:none;");
}