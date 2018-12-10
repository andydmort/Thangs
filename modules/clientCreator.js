var fs = require('fs');

function getPage(path){
    return new Promise(function(resolve,reject){
        fs.readFile(path,'utf8', function(err, data) {
            if(err){
                // console.log("here1");
                // console.log("File Read recieved an error: "+err);
            }
            else{
                resolve(data);
            }
        });
    })
}

//patter Obj ex. {name: 'Johnathan'}
function replaceInString(patternObj,fullString){
    for( i in patternObj){
        // console.log("here: "+i);
        pat = '\/\$'+ i +'\$\/'; //This is for the pattern /$ <Your pattern> $/ 
        // console.log(pat);
        fullString = fullString.replace(pat,patternObj[i]);
    }
    return fullString;
}

//patter Obj ex. {name: 'Johnathan'}
function getPageAndReplace(patternObj,path){
    return new Promise(function(resolve,reject){
        getPage(path).then((page)=>{
            resolve(replaceInString(patternObj,page));
        });
    })
}

module.exports = {'getPage':getPage, 'replaceInString':replaceInString, 'getPageAndReplace':getPageAndReplace};