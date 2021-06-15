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


import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPU } from 'gpu.js';

import { absolutePosition } from './absolute-position.js';


const width = 1280
const height = 720

function main() {
  const canvas = document.querySelector('#c');
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
  const camera2 = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera2.position.set(0, 0, 0);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  const scene2 = new THREE.Scene();

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

  // {
  //   const skyColor = 0xB1E1FF;  // light blue
  //   const groundColor = 0xB97A20;  // brownish orange
  //   const intensity = 1;
  //   // const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
  //   // scene.add(light);
  // }

  // {
  //   const color = 0xFFFFFF;
  //   const intensity = 1;
  //   // const light = new THREE.DirectionalLight(color, intensity);
  //   // light.position.set(5, 10, 2);
  //   // scene.add(light);
  //   // scene.add(light.target);
  // }

  // // cube
  {
    const referenceCubeGeometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1))
    const referenceCube = new THREE.LineSegments(referenceCubeGeometry, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
    referenceCube.position.z = 1.99;

    const geometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1))
    const mesh = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
    mesh.position.z = 3;

    scene2.add(mesh);
    scene.add(referenceCube);

    // mesh.applyMatrix4(new THREE.Matrix4().set(
    //   1, 0, 0, 0,
    //   0, 1, 0, 0,
    //   0, 0, 1, 2,
    //   0, 0, 0, 1,
    // ))
    const P = absolutePosition(
      [-1,0,-7], [1,0,-8], [1,1,-8],
      [-0.9,0,0], [0.9,0,0],  [0.9,0.9,0],
    )
        
    const M = new THREE.Matrix4().set(...P[0], ...P[1], ...P[2])
    console.log('P:')
    console.log(...P[0])
    console.log(...P[1])
    console.log(...P[2])
    // console.log(...P[3])
    // M.invert()
    M.multiplyScalar(1 / P[2][2])
    console.log('M:')
    console.log(...M.toArray().slice(0, 4))
    console.log(...M.toArray().slice(4, 8))
    console.log(...M.toArray().slice(8, 12))
    // mesh.applyMatrix4(camera.projectionMatrixInverse)
    mesh.applyMatrix4(M)

    console.log('position', mesh.position)
    const box = new THREE.Box3().setFromObject(referenceCube);
    // console.log(box)
    const boxSize = box.getSize(new THREE.Vector3()).length();
    const boxCenter = box.getCenter(new THREE.Vector3());

    console.log(box, boxCenter)

    frameArea(boxSize * 0.5, boxSize, boxCenter, camera);
    frameArea(boxSize * 0.5, boxSize, boxCenter, camera2);

    // update the Trackball controls to handle the new size
    controls.maxDistance = boxSize * 10;
    controls.target.copy(boxCenter);
    controls.update();
  }
  
  function frameArea(sizeToFitOnScreen, boxSize, boxCenter, camera) {
    const halfSizeToFitOnScreen = sizeToFitOnScreen * 0.5;
    const halfFovY = THREE.MathUtils.degToRad(camera.fov * .5);
    // const distance = halfSizeToFitOnScreen / Math.tan(halfFovY);
    // compute a unit vector that points in the direction the camera is now
    // in the xz plane from the center of the box
    // const direction = (new THREE.Vector3())
    //     .subVectors(camera.position, boxCenter)
    //     .multiply(new THREE.Vector3(1, 0, 1))
    //     .normalize();

    // move the camera to a position distance units way from the center
    // in whatever direction the camera was from the center already
    // camera.position.copy(direction.multiplyScalar(distance).add(boxCenter));

    // pick some near and far values for the frustum that
    // will contain the box.
    camera.near = boxSize / 100;
    camera.far = boxSize * 100;

    camera.updateProjectionMatrix();
    console.log('projection matrix:', camera.projectionMatrix.elements)

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

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      // camera2.aspect = canvas.clientWidth / canvas.clientHeight;
      // camera2.updateProjectionMatrix();
    }

    // if (cars) {
    //   for (const car of cars.children) {
    //     car.rotation.y = time;
    //   }
    // }
    renderer.render(scene, camera);
    camera2.projectionMatrix.set( // matrix column one after another
      1, 0, 0, 0,
      0, camera.aspect, 0, 0,
      0, 0,  -1, 0,
      0, 0,  -2, 0,
    )
    renderer.autoClear = false;
    renderer.render(scene2, camera2);

    requestAnimationFrame(render);
  }
  window.camera = camera
  window.camera2 = camera2

  requestAnimationFrame(render);
}








const gpu = new GPU();

(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video : {
      width: width,
      height: height,
    }
  });

  const video = document.createElement('video')
  video.srcObject = stream
  const play = () => video.play()
  video.addEventListener('loadedmetadata', play)
  document.body.addEventListener('click', play)
  document.body.addEventListener('touchup', play)
  document.body.addEventListener('keyup', play)

  // const canvas = document.querySelector('#mirror')
  const canvas = document.createElement('canvas')
  canvas.id = 'camera';
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')




  const kernel = gpu.createKernel(function(frame) {
    let value = 0
    let pixel = [0,0,0,0]
    // const c = Math.floor((pixel[1] * 100) / 32) / 100 * 32
    for (const j = -2; j <= 2; j++) {
      for (const i = -2; i <= 2; i++) {
        let x = Math.abs(this.thread.x + i);
        if (x >= 1280) x = 1279 - (x - 1279);

        let y =  Math.abs(this.thread.y + j);
        if (y >= 720) x = 719 - (x - 719);

        pixel = frame[y][x];
        value += pixel[1];
        // just to slow down the computation
        // for (const k = 0; k < 200; k++) {
        //   value += Math.sqrt(k) / 20000;
        // }
      }
    }

    // TODO normalize color
    const c = Math.round(value / 25 * 100 / 32) / 100 * 32  
    this.color(c, c, c, 1)
  })
  .setGraphical(true)
  .setOutput([width, height])
  // .setDebug(true)

  
  

  const render = async function () {
    ctx.drawImage(video, 0, 0)
    kernel(canvas)

    requestAnimationFrame(render)
    // setTimeout(render, 33)
  }

  // requestAnimationFrame(render)
  document.body.appendChild(kernel.canvas)
})()



main();
