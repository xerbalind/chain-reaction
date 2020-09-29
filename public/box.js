class Box{
    constructor(x,y,width,maxspheres){
        this.position = new THREE.Vector3(x,y,0);
        this.mesh;

        this.neighbors;
        this.width = width;

        this.rotation = new THREE.Vector3();
        this.spheres = [];

        this.move_spheres = []
        this.move_counter = 0;

        this.color;

        this.maxspheres = maxspheres;
        this.shaking = {
            '0':0,
            '1':0
        }
        this.pivot;
    }
    show(){
        let material = new THREE.LineBasicMaterial({color: 0xffffff, linewidth:2});
        let geometry = new THREE.BoxGeometry(this.width,this.width,this.width / 2);
        let geo = new THREE.EdgesGeometry(geometry);
        this.mesh = new THREE.LineSegments(geo,material)
        this.mesh.position.set(this.position.x,this.position.y,this.position.z);
        scene.add(this.mesh);

        let geometryInvisible = new THREE.BoxGeometry(this.width,this.width,this.width / 3);
        let materialInvisible = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent:true,opacity:0} );
        let cubeInvisible = new THREE.Mesh( geometryInvisible, materialInvisible );
        cubeInvisible.position.set(this.position.x,this.position.y,this.position.z);
        scene.add( cubeInvisible );
        InvisibleCubes.push(cubeInvisible);

        //Create pivot mesh where the spheres rotate around
        this.pivot = new THREE.Group();
        scene.add(this.pivot);
        this.pivot.position.set(this.position.x,this.position.y,this.position.z);

    }
    addSphere(sphere_color){
        // Asign the color to every sphere
        this.color = sphere_color;
        if (this.spheres.length < this.maxspheres){
            if (this.spheres.length == 0){
                
                //Rotation
                let rand_number = Math.floor(calculateRandom(0,2));
                let rand_corner = calculateRandomPi(-Math.PI/80,Math.PI/80);
                switch(rand_number){
                    case 0:
                        this.rotation.x = rand_corner;
                        break;
                    case 1:
                        this.rotation.y = rand_corner;
                        break;
                    case 2:
                        this.rotation.z = rand_corner;
                        break;
                }
                
                let new_sphere = new Sphere();
                new_sphere.show();
                new_sphere.mesh.position.set(0,0,0);
                this.pivot.add(new_sphere.mesh);

                this.spheres.push(new_sphere);


            }else  if (this.spheres.length == 1){
                let new_sphere = new Sphere();
                new_sphere.show();
                let rand_position = {
                    '0':0,
                    '1':1
                }
                let rand_pos_number = Math.floor(calculateRandom(0,1));
                rand_position[rand_pos_number] = randomChoice([sphereWidth,-sphereWidth]); 
                new_sphere.mesh.position.set(rand_position[0],rand_position[1],0);
                this.pivot.add(new_sphere.mesh);

                this.spheres.push(new_sphere);
            }else if(this.spheres.length == 2){
                let new_sphere = new Sphere();
                new_sphere.show();
                new_sphere.mesh.position.x = this.spheres[1].mesh.position.x + Math.cos(Math.PI/4) * sphereWidth;
                new_sphere.mesh.position.y = this.spheres[1].mesh.position.y + Math.sin(Math.PI/4) * sphereWidth;
                new_sphere.mesh.position.z = this.spheres[1].mesh.position.z;
                this.pivot.add(new_sphere.mesh);

                this.spheres.push(new_sphere);
            }

            
            this.spheres.forEach(element => {
                element.mesh.material.color.set(this.color);
            });
            
            //Make rotation go faster if maximum spheres are get
            if (this.spheres.length == this.maxspheres){
                let rand_corner = calculateRandomPi(Math.PI/70,Math.PI/50);
                if (this.rotation.x != 0){
                    if(this.rotation.x >= 0){
                        this.rotation.x += rand_corner;
                    } else {
                        this.rotation.x -= rand_corner;
                    }
                    
                }else if (this.rotation.y != 0){
                    if(this.rotation.y >= 0){
                        this.rotation.y += rand_corner;
                    } else {
                        this.rotation.y -= rand_corner;
                    }
                }else if (this.rotation.z != 0){
                    if(this.rotation.z >= 0){
                        this.rotation.z += rand_corner;
                    } else {
                        this.rotation.z -= rand_corner;
                    }
                }
            }

            
            click_legal = true;

            if (!gameover && clicks > 0){
                checkGameOver();
            }
            

        } else {
            popSound.play();

            for (var i = 0; i < this.spheres.length; i++){
                this.pivot.remove(this.spheres[i].mesh);
                scene.remove(this.spheres[i].mesh);
                this.spheres[i].mesh.geometry.dispose();
                this.spheres[i].mesh.material.dispose();
            }
            this.spheres.splice(0,this.spheres.length); 
            this.neighbors.forEach(element => {
                if (typeof element !== 'undefined'){
                    let move_direction = new THREE.Vector3();
                    move_direction.subVectors(element.position,this.position).normalize();
                    move_direction.multiplyScalar(speed);
                    let new_sphere = new Sphere(move_direction);
                    
                    new_sphere.show();
                    new_sphere.mesh.material.color.set(this.color); // set the sphere color to the box color

                    new_sphere.mesh.position.x = this.position.x;
                    new_sphere.mesh.position.y = this.position.y;
                    new_sphere.mesh.position.z = this.position.z;

                    this.move_spheres.push(new_sphere);

                }
            });
        }
    }
    rotateSphere(){
        this.pivot.rotation.x += this.rotation.x
        this.pivot.rotation.y += this.rotation.y
        this.pivot.rotation.z += this.rotation.z
        
    }

    shakeSphere(){
        if (this.spheres.length == this.maxspheres){
            //Begin Shaking if maximum sphere are get 
            let shaking_choices = [-sphereWidth/30,0,sphereWidth/30];
            if (this.shaking[0] == 0 && this.shaking[1] == 0){
                this.shaking[0] = randomChoice(shaking_choices);
                this.shaking[1] = randomChoice(shaking_choices);

                this.pivot.position.x += this.shaking[0];
                this.pivot.position.y += this.shaking[1];
            } else{
                this.pivot.position.x -= this.shaking[0];
                this.pivot.position.y -= this.shaking[1];

                this.shaking[0] = 0;
                this.shaking[1] = 0;
            }
        }
        
    }

    moveSpheres(){
        if(this.move_spheres.length > 0){
            if (this.move_counter < boxWidth/speed){
                this.move_spheres.forEach(element => {
                    element.moveSphere();
                });
                this.move_counter ++;
            } else {
                this.move_spheres.forEach(element => {
                    scene.remove(element.mesh);
                    element.mesh.geometry.dispose();
                    element.mesh.material.dispose();
                });
                this.move_spheres.splice(0,this.move_spheres.length);
                this.move_counter = 0;

                this.neighbors.forEach(element => {
                    if (typeof element != 'undefined'){
                        element.addSphere(this.color);
                    }
                });

                this.color = undefined;
            }
        }
    }
}