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

    // setTimeout(render, 33)
    requestAnimationFrame(render);

  }

  requestAnimationFrame(render);
}








// const gpu = new GPU({ mode: 'cpu' });
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



  const grayscaleKernel = gpu.createKernel(function(image) {
    const pixel = image[this.thread.y][this.thread.x];
    return 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2];
  })
  .setOutput([width, height])
  .setImmutable(true)
  .setPipeline(true)

  const gaussianBlurKernel = gpu.createKernel(function(image, imageWidth, imageHeight, radius) {
    let value = 0.0;

    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        let x = Math.abs(this.thread.x + i);
        if (x >= imageWidth) x = imageWidth - 1 - (x - (imageWidth - 1)); // does this make sense??

        let y =  Math.abs(this.thread.y + j);
        if (y >= imageHeight) y = imageHeight - 1 - (y - (imageHeight - 1));

        value += image[y][x];
      }
    }

    return value / Math.pow(2.0 * radius + 1.0, 2.0);
    // TODO normalize color
    // const c = 255.0 * Math.round(value / 25 * 100 / 32) / 100 * 32
    // this.color(c, c, c, 1.0);
    // const c = 255.0 * value;

    // this.color(c / 255.0, c / 255.0, c / 255.0, 1.0);
  })
  .setOutput([width, height])
  .setImmutable(true)
  .setPipeline(true)

  const drawKernel = gpu.createKernel(function(image) {
    const i = image[this.thread.y][this.thread.x];
    this.color(i, i, i, 1.0);
  })
  .setOutput([width, height])
  .setGraphical(true)


  const render = async function () {
    ctx.drawImage(video, 0, 0)
    
    const blurRadius = 15
    const grayscaleImage = grayscaleKernel(canvas);
    const blurredImage1 = gaussianBlurKernel(grayscaleImage, imageWidth, imageHeight, blurRadius)
    grayscaleImage.delete()
    const blurredImage2 = gaussianBlurKernel(blurredImage1, imageWidth, imageHeight, blurRadius)
    blurredImage1.delete()
    drawKernel(blurredImage2)
    blurredImage2.delete()
    
    requestAnimationFrame(render)
    // setTimeout(render, 33)
  }

  requestAnimationFrame(render)

  document.body.appendChild(drawKernel.canvas)
})()



main();
