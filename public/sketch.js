const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(78,window.innerWidth / window.innerHeight,0.1,100);
const renderer = new THREE.WebGLRenderer();
const raycaster = new THREE.Raycaster();

var colls = 6;
var rows = 8;
var grid = [];
var boxWidth = 5;
var sphereWidth = boxWidth/5;
var speed = .3;
var players;
var current_player;
var color;
var click_legal = true;
var clicks = 0;
var gameover = false;
var nickname;
var popSound;

mouse = new THREE.Vector2();

var current_body = document.getElementById("mycurrent-body");

var InvisibleCubes = [];

function run(){
    socket = io.connect('https://chain1reaction.herokuapp.com');

    socket.on("nojoin",function(){
        alert("game already started --> not joinable");
    });

    socket.on("list",function(clients){
        console.log("got list");
        $(".list-body").empty();
        clients.forEach(client => {
            let client_element = document.createElement("li");
            client_element.id = client.id;
            client_element.innerHTML = client.nickname;
            $(".list-body").append(client_element);
        });
    });

    socket.on("start",function(data){
        console.log(data.first);

        players = data.players;
        current_player = data.first;
        current.style.display = "block";
        current_body.innerHTML = current_player.nickname;
        if (current_player.id == socket.id){
            current_body.innerHTML += "(You)"
        }
        current_body.style.color = current_player.color;



        players.forEach(player => {
            if (player.id == socket.id){
                color = player.color;
            }
            let player_el = document.getElementById(player.id);
            player_el.style.color = player.color;
        });

        for (var i = 0; i < grid.length; i++){
            for (var j = 0; j < rows; j++){
                grid[i][j].mesh.material.color.set(color);
            }
        }

    });

    socket.on("mouseclick",function(data){
        grid[data.i][data.j].addSphere(current_player.color);
        current_player = data.player;
        current_body.innerHTML = current_player.nickname;
        if (current_player.id == socket.id){
            current_body.innerHTML += "(You)"
        }
        current_body.style.color = current_player.color;
    });

    socket.on("nextplayer",function(data){
        current_player = data.player;
    });

    socket.on("winner",function(winner){
        if (winner.id == socket.id){
            alert("You Won");
        } else {
            alert("You Lost");
        }
        location.reload();
    });

    renderer.setSize(window.innerWidth,window.innerHeight);
    document.body.appendChild(renderer.domElement);

    camera.position.set(12.5,17,35);

    //Sound
    popSound = new sound("pop.mp3");


    //Light
    let ambientLight = new THREE.AmbientLight(0xffffff,0.3);
    scene.add(ambientLight);

    let pointLight = new THREE.PointLight(0xffffff,0.7);
    pointLight.position.set(12.5,17,35);
    pointLight.castShadow = true;
    pointLight.shadow.near = 0.1;
    pointLight.shadow.far = camera.position.z;
    scene.add(pointLight);


    for (var i = 0; i < colls; i++){
        grid.push(new Array(rows));
    }


    for(var i = 0; i < grid.length; i++){
        for(var j = 0; j < rows; j++){
            let x = ToScreenCoordinates(i);
            let y = ToScreenCoordinates(j);
            let maxspheres = 3;
            if (i == colls - 1 && j == rows - 1){
                maxspheres = 1;
            } else if (i == 0 && j == rows - 1){
                maxspheres = 1;
            } else if (i == 0 && j == 0){
                maxspheres = 1;
            } else if (i == colls - 1 && j == 0){
                maxspheres = 1;
            }else if (i == colls - 1){
                maxspheres = 2;
            }else if (j == rows - 1){
                maxspheres = 2;
            }else if (i == 0){
                maxspheres = 2;
            }else if (j == 0){
                maxspheres = 2;
            }
            
            grid[i][j] = new Box(x,y,boxWidth,maxspheres);
            grid[i][j].show();
        }
    }

    for(var i = 0; i < grid.length; i++){
        for(j = 0; j < rows; j++){
            let neighbors = [];
            neighbors.push(checkArrayDefined(grid,i,j+1));
            neighbors.push(checkArrayDefined(grid,i,j-1));
            neighbors.push(checkArrayDefined(grid,i+1,j));
            neighbors.push(checkArrayDefined(grid,i-1,j));

            grid[i][j].neighbors = neighbors;
        }
    }

    // All events
    document.addEventListener('mousedown',mouseClicked);
    window.addEventListener('resize', windowResize)

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    Sphereloop();

    renderer.render(scene,camera);
}

function ToScreenCoordinates(value){
    return value * boxWidth;
}

function Sphereloop(){
    click_legal = true;
    for(var i = 0; i < grid.length; i++){
        for(var j = 0; j < rows; j++){
            if (grid[i][j].move_spheres.length > 0){
                click_legal = false; // disables ability for players to add sphere
            }
            grid[i][j].rotateSphere();
            grid[i][j].shakeSphere();
            grid[i][j].moveSpheres();
        }
    }
}


function mouseClicked(e){
    if (current_player.id == socket.id && click_legal && !gameover){
        if (e.buttons == 1){
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            camera.updateMatrixWorld();
            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(InvisibleCubes);
            if(intersects.length > 0){
                let i = Math.round(intersects[0].point.x / boxWidth);
                let j = Math.round(intersects[0].point.y / boxWidth);
                if (grid[i][j].color == color || grid[i][j].color == undefined){
                    let data = {
                        i:i,
                        j:j
                    }
                    socket.emit("mouseclick",data);
                    clicks++;
                }   
            }
        
        }
    }
        
}

function windowResize(){
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width,height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function calculateRandomPi(min,max){
    if (min < 0){
        random_number = Math.random() * max;
        if (Math.random < 0.5){
            return -random_number;
        } else {
            return random_number; 
        }
    } else {
        return Math.random() * (max - min) + min;
    }
}

function calculateRandom(min,max){
    return Math.random() * (max - min + 1) + min;
}

function randomChoice(arr){
    return arr[Math.floor(arr.length * Math.random())];
}

function checkArrayDefined(arr,i,j){
    let object;
    try {
        object = arr[i][j];
    } catch(TypeError){
        object = undefined;
    }

    return object;
}

function checkGameOver(){
    let temp_gameover = true;
    for (var i = 0; i < grid.length; i++){
        for (var j = 0; j < rows; j++){
            if (grid[i][j].color == color){
                temp_gameover = false;
                i = j = 1000
            }
        }
    }

    if (temp_gameover){
        socket.emit('gameover');
        gameover = true;
    } 
}

// Sound----------------------------------
function sound(src){
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload","auto");
    this.sound.setAttribute("controls","none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}






$(document).ready(run);




// Element scripting-------------------------------------------------------------------------

const modal = document.getElementById("myModal");
const lobby_el = document.getElementById("mylobby");
const list = document.getElementById("myList");
const current = document.getElementById("myCurrent");
const ready = document.getElementById("ready");

modal.style.display = "block";

$("#ready").click(function(){
    socket.emit("ready");
    ready.style.display = "none";
});

$("#myButton").click(function(){
    let nickname = document.getElementById("myName").value;
    let lobby = document.getElementById("myLobby").value;

    document.getElementById("mylobby-body").innerHTML = lobby;

    modal.style.display = "none";
    lobby_el.style.display = "block";
    list.style.display = "block";

    let object = {
        nickname:nickname,
        lobby:lobby
    }

    socket.emit("join",object);
});