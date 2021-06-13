/*
TODO
- vykreslit objekt
- dat si napevno nejake body do priestoru a pocitat P3P podla ich priemetu
- pridat otacanie a pohyb v priestore
- pri kazdom pohybe vypocitat presnu polohu podla ovladania a P3P polohu vypocitanu z priemetov

- add dependencies to package.json
- webpack bundling
- use one canvas
- refactor
*/


import { solve } from '../node_modules/better-rref/better-rref.js'

import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';
import {OrbitControls} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js';
// import {GLTFLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js';


console.log(solve)

const width = 1280;
const height = 720;

function main() {
  const canvas = document.querySelector('#c');
  // FIXME width and height are globals from index.html
  canvas.width = width;
  canvas.height = height;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: true,
  });

  const fov = 45;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  // scene.background = new THREE.Color('black');

  // {
  //   const planeSize = 40;

  //   const loader = new THREE.TextureLoader();
  //   const texture = loader.load('/Kropatschka/');
  //   texture.wrapS = THREE.RepeatWrapping;
  //   texture.wrapT = THREE.RepeatWrapping;
  //   texture.magFilter = THREE.NearestFilter;
  //   const repeats = planeSize / 2;
  //   texture.repeat.set(repeats, repeats);

  //   const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
  //   const planeMat = new THREE.MeshPhongMaterial({
  //     map: texture,
  //     side: THREE.DoubleSide,
  //   });
  //   const mesh = new THREE.Mesh(planeGeo, planeMat);
  //   mesh.rotation.x = Math.PI * -.5;
  //   scene.add(mesh);
  // }

  {
    const skyColor = 0xB1E1FF;  // light blue
    const groundColor = 0xB97A20;  // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    const direction = (new THREE.Vector3())
        .subVectors(camera.position, boxCenter)
        .multiply(new THREE.Vector3(1, 0, 1))
        .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    // camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();

    // point the camera to look at the center of the box
    camera.lookAt(boxCenter.x, boxCenter.y, boxCenter.z);
  }

  // let cars;
  // {
  //   const gltfLoader = new GLTFLoader();
  //   gltfLoader.load('https://threejsfundamentals.org/threejs/resources/models/cartoon_lowpoly_small_city_free_pack/scene.gltf', (gltf) => {
  //     const root = gltf.scene;
  //     scene.add(root);
  //     // cars = root.getObjectByName('Cars');

  //     // compute the box that contains all the stuff
  //     // from root and below
  //     const box = new THREE.Box3().setFromObject(root);

  //     const boxSize = box.getSize(new THREE.Vector3()).length();
  //     const boxCenter = box.getCenter(new THREE.Vector3());

  //     // set the camera to frame the box
  //     frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

  //     // update the Trackball controls to handle the new size
  //     controls.maxDistance = boxSize * 10;
  //     controls.target.copy(boxCenter);
  //     controls.update();
  //   });
  // }


  // cube
  {
    const referenceCubeGeometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1))
    const referenceCube = new THREE.LineSegments(referenceCubeGeometry, new THREE.LineBasicMaterial({color: 0x00ff00}));
    referenceCube.position.z = 1.99;

    const geometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1))
    const mesh = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({color: 0xff0000}));
    // mesh.position.z = 3;
    scene.add(mesh);
    scene.add(referenceCube);

    // mesh.applyMatrix4(new THREE.Matrix4().set(
    //   1, 0, 0, 0,
    //   0, 1, 0, 0,
    //   0, 0, 1, 2,
    //   0, 0, 0, 1,
    // ))

    console.log('position', mesh.position)
    const box = new THREE.Box3().setFromObject(referenceCube);
    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    console.log(box, boxCenter)

    frameArea(boxSize * 0.5, boxSize, boxCenter, camera);

    // update the Trackball controls to handle the new size
    controls.maxDistance = boxSize * 10;
    controls.target.copy(boxCenter);
    controls.update();
}


  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render(time) {
    time *= 0.001;  // convert to seconds

    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // if (cars) {
    //   for (const car of cars.children) {
    //     car.rotation.y = time;
    //   }
    // }

    renderer.render(scene, camera);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

main();
