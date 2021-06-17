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

import { DLT } from './dlt.js';
import { MeshNormalMaterial } from 'three';


const width = 1280
const height = 720

function main() {
  const canvas = document.querySelector('#c');
  canvas.width = width;
  canvas.height = height;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    // premultipliedAlpha: true,
  });

  const fov = 60;
  // const aspect = 2;  // the canvas default
  const aspect = canvas.clientWidth / canvas.clientHeight
  const near = 0.1;
  const far = 10;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 0, 1);
  camera.lookAt(0, 0, -1);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0, -1);
  controls.update();

  const scene = new THREE.Scene();
  const scene2 = new THREE.Scene();

  const geometry = new THREE.WireframeGeometry(new THREE.BoxGeometry(1, 1, 1))
  const referenceCube = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x00ff00 }));
  referenceCube.position.set(-0.5, 0, -1);

  const mesh = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xff0000 }));
  mesh.position.set(0.5, 0, -2);

  scene.add(referenceCube); 
  scene2.add(mesh);
  
  const L = 0.5
  const DZ = -2
  const X = [
    [-L, -L, -L + DZ, 1],
    [L, -L, -L + DZ, 1],
    [L, L, -L + DZ, 1],
    [-L, L, L + DZ, 1],
    [L, -L, L + DZ, 1],
    [L, L, L + DZ, 1],
  ]
  
  const x = X.map(X => new THREE.Vector4(...X)
    .applyMatrix4(camera.projectionMatrix))
    .map(x => [x.x / x.z, x.y / x.z, 1])

  const P = DLT(...X, ...x);

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
    }

    camera.updateProjectionMatrix();
    renderer.render(scene, camera);

    // replace camera's projection matrix with the one calculated by DLT
    camera.projectionMatrix.set(
      ...P.map(x => x * (camera.projectionMatrix.elements[5] / P[5])), // match scaling
      0, 0, -1, 0
    );

    // render scene2 with the projection matrix calculated by DLT
    renderer.autoClear = false;
    renderer.render(scene2, camera);

    setTimeout(render, 33)
  }

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

    // requestAnimationFrame(render)
    setTimeout(render, 33)
  }

  requestAnimationFrame(render)
  document.body.appendChild(kernel.canvas)
})()



main();
