var socket = io('/users');


function test(){
    console.log("boom acalacka!");
}

function joinGame(){
    console.log("sending: {name: 'Sarah', gameId:'1'}");
    socket.emit("user-join-game",{name: "Sarah", gameId:"1"});
}