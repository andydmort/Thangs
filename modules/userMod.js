function User(name,socketid){
    this.name = name;
    this.socketid = socketid;
    this.score = 0;
    this.lastResponce = null;
}

module.exports = User;