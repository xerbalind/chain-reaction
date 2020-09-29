class Sphere{
    constructor(move_direction){
        this.mesh;
        this.move_direction = move_direction;
    }
    show(){
        //Create geometry and material
        let geometry = new THREE.SphereGeometry(sphereWidth,15,15);
        let material = new THREE.MeshPhongMaterial({color:'red'});
        //Create sphere Mesh
        this.mesh = new THREE.Mesh(geometry,material);
        scene.add(this.mesh);


    }

    moveSphere(){
        this.mesh.position.x += this.move_direction.x;
        this.mesh.position.y += this.move_direction.y;
    }
}