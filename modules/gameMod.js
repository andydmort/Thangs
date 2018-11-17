

function Game(gameId){
    this.users = []; //A list of the user Module;
    this.turnOfUserIndex = 0;
    this.gameId = gameId;
}

module.exports = Game;