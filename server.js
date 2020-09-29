const express = require('express');
const app = express();
const server = app.listen(3000,'0.0.0.0');

app.use(express.static('public'));

const socket = require('socket.io');
const io = socket(server);



io.sockets.on('connection', newConnection);

rooms = [];

function newConnection(socket){
    console.log('new connection: ' + socket.id);
    

    socket.on('join',function(object){
        socket.join(object.lobby);
        socket.lobby = object.lobby

        exists = addPlayer(object.lobby,object.nickname,socket.id);

        if (!exists){ // if room doesn't exist --> create a new room
            rooms.push({
                name: object.lobby,
                count: 0,
                alive: 0,
                joinable: true,
                players: []
            });
            addPlayer(object.lobby,object.nickname,socket.id);
        }


    });

    socket.on('disconnect',function(){
        console.log('lost connection: ' + socket.id);
        for( var i = 0; i < rooms.length; i++){
            if (rooms[i].name == socket.lobby){
                let index = rooms[i].players.findIndex(element => element.id == socket.id);
                if (rooms[i].joinable){
                    rooms[i].players.splice(index,1);
                } else {
                    gameover(socket.lobby,socket.id);
                }
                break;
            }
        }
    });

    socket.on("ready",function(){
        for(var i = 0; i < rooms.length; i++) {
            if (rooms[i].name == socket.lobby){
                start_game = true; // set temporary start game to true 

                rooms[i].players.forEach(player => {
                    if (player.id == socket.id){
                        player.ready = true;
                    }

                    if (!player.ready){
                        start_game = false;
                    }
                });
                if(start_game){
                    let count = Math.floor(Math.random() * rooms[i].players.length); // get a random index for clients
                    rooms[i].count = count;
                    rooms[i].alive = rooms[i].players.length; // alive is equal to number of players    
                    rooms[i].joinable = false;

                    let object = {
                        first:rooms[i].players[count], // player who will start
                        players:rooms[i].players 
                    }

                    io.to(socket.lobby).emit('start',object) // send signal to start game to all connected clients 
                }
                break;
            }
        }
    });

    socket.on("mouseclick",function(data){
        let object = {
            i: data.i,
            j: data.j,
            player:getNextPlayer(socket.lobby)
        }
        io.to(socket.lobby).emit('mouseclick',object) // send signal to start game to all connected clients 
    });

    socket.on('gameover',function(){
        gameover(socket.lobby,socket.id);
    });
        


}

function gameover(lobby,id){
    for (var r = 0; r < rooms.length; r++){
        if (rooms[r].name == lobby){
            for (var i = 0; i < rooms[r].players.length; i++){
                if (rooms[r].players[i].id == id){
                    rooms[r].players[i].dead = true;
                    break;
                }
            }

            rooms[r].alive --;

            if (rooms[r].alive <= 1){
                let winner = rooms[r].players.find(element => element.dead == false);
                io.to(lobby).emit('winner',winner) // send the winner
                rooms.splice(r,1);
            } else {
                if (rooms[r].players[rooms[r].count].dead){ 
                    let object = {
                        player:getNextPlayer(lobby)
                    }
                    io.to(lobby).emit('nextplayer',object) // send next player signal
                }
            }
    
        }   
    }
}

function addPlayer(lobby,nickname,id){
    let exists = false;
    rooms.forEach(room => {
        if (room.name == lobby){
            if (room.joinable){
                room.players.push({
                    id: id,
                    nickname: nickname,
                    color: getRandomColor(),
                    ready: false,
                    dead: false
                });
    
                
            } else {
                io.to(id).emit('nojoin');
            }
        
            exists = true;

            io.to(lobby).emit('list',room.players);
        }
    });

    return exists;
}

function getRandomColor(){
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (var i = 0; i < 6; i++){
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getNextPlayer(lobby){
    let r;
    let players;
    let count;
    for (var i = 0; i < rooms.length; i++){
        if (rooms[i].name == lobby){
            r = i;
            players = rooms[i].players;
            count = rooms[i].count;
            break;
        }
    }
    if(count == players.length - 1 ){
        count = -1;
    }
    
    count++;
    rooms[r].count = count;
    if(players[count].dead){ // if next player is dead
        return getNextPlayer(lobby); // go again to next player
    } else{
        return players[count];
    }
    
}

