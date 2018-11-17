var socket = io('/users');


function test(){
    console.log("boom acalacka!");
}

function joinGame(){
    var gameIdFieldEl = document.getElementById('text-field-game-id');
    var nameFieldEl = document.getElementById('text-field-name');
    console.log("sending:"+JSON.stringify({name: nameFieldEl.value, gameId:gameIdFieldEl.value}));
    
    socket.emit("user-join-game",{name: nameFieldEl.value, gameId:gameIdFieldEl.value});
}