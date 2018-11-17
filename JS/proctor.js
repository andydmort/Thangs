var socket = io('/proctor');


socket.on('to-proctor-name-joined',function(data){
    var usersEl = document.getElementById('joined-users');
    var newUserEl = document.createElement('h4');
    newUserEl.innerHTML = data.name;
    usersEl.appendChild(newUserEl);
    console.log(data);
});

function startGame(){
    console.log("Button clicked for starting game.");
}