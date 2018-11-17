
var fs = require('fs');

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) =>{
    res.sendFile(__dirname+'/index.html');
});


function getPage(path){
    fs.readFile(path,'utf8', function(err, data) {
        if(err){
            console.log("here1");
            console.log("File Read recieved an error: "+err);
        }
        else{
            console.log("here2");
            console.log(data);
            return data;
        }
    });
}





app.listen(port, () => console.log(`Sever is listening on port ${port}!`))