var socket = io('/proctor');


socket.on('to-proctor-name-joined',function(data){
    console.log(data);
})