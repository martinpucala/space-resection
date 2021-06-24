import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPU } from 'gpu.js';

import { DLT } from './dlt.mjs';


const width = 1280 / 2
const height = 720 / 2
// const width = 1280
// const height = 720

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
  // TODO only one scene will be needed probably, and this should be renamed
  scene2.add(mesh);
  
  // TODO remove me
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

  const P = DLT(X, x);

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

  // requestAnimationFrame(render);
}








// const gpu = new GPU({ mode: 'cpu' });
const gpu = new GPU();

// TODO: use pre-flattened arrays for faster upload to GPU memory

const gaussian = (function() {
  const mem = {};

  return function (radius, sigma = 1) {
    const key = `${radius}_${sigma}`
    if (mem[key]) {
      return mem[key];
    }

    const kernel = [...new Array(2 * radius + 1)].map(x => [])

    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        kernel[j + radius][i + radius] = Math.pow(Math.E, -(i**2 + j**2) / (2 * sigma**2)) / (2 * Math.PI * sigma**2);
      }
    }

    mem[key] = kernel;
    return kernel;
  }
})();



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
  const ctx = canvas.getContext('2d');

  const patchPoints = [[-4, -15], [-3, -15], [-2, -15], [-1, -15], [0, -15], [1, -15], [2, -15], [3, -15], [4, -15], [-6, -14], [-5, -14], [-4, -14], [-3, -14], [-2, -14], [-1, -14], [0, -14], [1, -14], [2, -14], [3, -14], [4, -14], [5, -14], [6, -14], [-8, -13], [-7, -13], [-6, -13], [-5, -13], [-4, -13], [-3, -13], [-2, -13], [-1, -13], [0, -13], [1, -13], [2, -13], [3, -13], [4, -13], [5, -13], [6, -13], [7, -13], [8, -13], [-9, -12], [-8, -12], [-7, -12], [-6, -12], [-5, -12], [-4, -12], [-3, -12], [-2, -12], [-1, -12], [0, -12], [1, -12], [2, -12], [3, -12], [4, -12], [5, -12], [6, -12], [7, -12], [8, -12], [9, -12], [-10, -11], [-9, -11], [-8, -11], [-7, -11], [-6, -11], [-5, -11], [-4, -11], [-3, -11], [-2, -11], [-1, -11], [0, -11], [1, -11], [2, -11], [3, -11], [4, -11], [5, -11], [6, -11], [7, -11], [8, -11], [9, -11], [10, -11], [-11, -10], [-10, -10], [-9, -10], [-8, -10], [-7, -10], [-6, -10], [-5, -10], [-4, -10], [-3, -10], [-2, -10], [-1, -10], [0, -10], [1, -10], [2, -10], [3, -10], [4, -10], [5, -10], [6, -10], [7, -10], [8, -10], [9, -10], [10, -10], [11, -10], [-12, -9], [-11, -9], [-10, -9], [-9, -9], [-8, -9], [-7, -9], [-6, -9], [-5, -9], [-4, -9], [-3, -9], [-2, -9], [-1, -9], [0, -9], [1, -9], [2, -9], [3, -9], [4, -9], [5, -9], [6, -9], [7, -9], [8, -9], [9, -9], [10, -9], [11, -9], [12, -9], [-13, -8], [-12, -8], [-11, -8], [-10, -8], [-9, -8], [-8, -8], [-7, -8], [-6, -8], [-5, -8], [-4, -8], [-3, -8], [-2, -8], [-1, -8], [0, -8], [1, -8], [2, -8], [3, -8], [4, -8], [5, -8], [6, -8], [7, -8], [8, -8], [9, -8], [10, -8], [11, -8], [12, -8], [13, -8], [-13, -7], [-12, -7], [-11, -7], [-10, -7], [-9, -7], [-8, -7], [-7, -7], [-6, -7], [-5, -7], [-4, -7], [-3, -7], [-2, -7], [-1, -7], [0, -7], [1, -7], [2, -7], [3, -7], [4, -7], [5, -7], [6, -7], [7, -7], [8, -7], [9, -7], [10, -7], [11, -7], [12, -7], [13, -7], [-14, -6], [-13, -6], [-12, -6], [-11, -6], [-10, -6], [-9, -6], [-8, -6], [-7, -6], [-6, -6], [-5, -6], [-4, -6], [-3, -6], [-2, -6], [-1, -6], [0, -6], [1, -6], [2, -6], [3, -6], [4, -6], [5, -6], [6, -6], [7, -6], [8, -6], [9, -6], [10, -6], [11, -6], [12, -6], [13, -6], [14, -6], [-14, -5], [-13, -5], [-12, -5], [-11, -5], [-10, -5], [-9, -5], [-8, -5], [-7, -5], [-6, -5], [-5, -5], [-4, -5], [-3, -5], [-2, -5], [-1, -5], [0, -5], [1, -5], [2, -5], [3, -5], [4, -5], [5, -5], [6, -5], [7, -5], [8, -5], [9, -5], [10, -5], [11, -5], [12, -5], [13, -5], [14, -5], [-15, -4], [-14, -4], [-13, -4], [-12, -4], [-11, -4], [-10, -4], [-9, -4], [-8, -4], [-7, -4], [-6, -4], [-5, -4], [-4, -4], [-3, -4], [-2, -4], [-1, -4], [0, -4], [1, -4], [2, -4], [3, -4], [4, -4], [5, -4], [6, -4], [7, -4], [8, -4], [9, -4], [10, -4], [11, -4], [12, -4], [13, -4], [14, -4], [15, -4], [-15, -3], [-14, -3], [-13, -3], [-12, -3], [-11, -3], [-10, -3], [-9, -3], [-8, -3], [-7, -3], [-6, -3], [-5, -3], [-4, -3], [-3, -3], [-2, -3], [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3], [4, -3], [5, -3], [6, -3], [7, -3], [8, -3], [9, -3], [10, -3], [11, -3], [12, -3], [13, -3], [14, -3], [15, -3], [-15, -2], [-14, -2], [-13, -2], [-12, -2], [-11, -2], [-10, -2], [-9, -2], [-8, -2], [-7, -2], [-6, -2], [-5, -2], [-4, -2], [-3, -2], [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2], [4, -2], [5, -2], [6, -2], [7, -2], [8, -2], [9, -2], [10, -2], [11, -2], [12, -2], [13, -2], [14, -2], [15, -2], [-15, -1], [-14, -1], [-13, -1], [-12, -1], [-11, -1], [-10, -1], [-9, -1], [-8, -1], [-7, -1], [-6, -1], [-5, -1], [-4, -1], [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [4, -1], [5, -1], [6, -1], [7, -1], [8, -1], [9, -1], [10, -1], [11, -1], [12, -1], [13, -1], [14, -1], [15, -1], [-15, 0], [-14, 0], [-13, 0], [-12, 0], [-11, 0], [-10, 0], [-9, 0], [-8, 0], [-7, 0], [-6, 0], [-5, 0], [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [-15, 1], [-14, 1], [-13, 1], [-12, 1], [-11, 1], [-10, 1], [-9, 1], [-8, 1], [-7, 1], [-6, 1], [-5, 1], [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [-15, 2], [-14, 2], [-13, 2], [-12, 2], [-11, 2], [-10, 2], [-9, 2], [-8, 2], [-7, 2], [-6, 2], [-5, 2], [-4, 2], [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [-15, 3], [-14, 3], [-13, 3], [-12, 3], [-11, 3], [-10, 3], [-9, 3], [-8, 3], [-7, 3], [-6, 3], [-5, 3], [-4, 3], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [12, 3], [13, 3], [14, 3], [15, 3], [-15, 4], [-14, 4], [-13, 4], [-12, 4], [-11, 4], [-10, 4], [-9, 4], [-8, 4], [-7, 4], [-6, 4], [-5, 4], [-4, 4], [-3, 4], [-2, 4], [-1, 4], [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [-14, 5], [-13, 5], [-12, 5], [-11, 5], [-10, 5], [-9, 5], [-8, 5], [-7, 5], [-6, 5], [-5, 5], [-4, 5], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [-14, 6], [-13, 6], [-12, 6], [-11, 6], [-10, 6], [-9, 6], [-8, 6], [-7, 6], [-6, 6], [-5, 6], [-4, 6], [-3, 6], [-2, 6], [-1, 6], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [-13, 7], [-12, 7], [-11, 7], [-10, 7], [-9, 7], [-8, 7], [-7, 7], [-6, 7], [-5, 7], [-4, 7], [-3, 7], [-2, 7], [-1, 7], [0, 7], [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [10, 7], [11, 7], [12, 7], [13, 7], [-13, 8], [-12, 8], [-11, 8], [-10, 8], [-9, 8], [-8, 8], [-7, 8], [-6, 8], [-5, 8], [-4, 8], [-3, 8], [-2, 8], [-1, 8], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [-12, 9], [-11, 9], [-10, 9], [-9, 9], [-8, 9], [-7, 9], [-6, 9], [-5, 9], [-4, 9], [-3, 9], [-2, 9], [-1, 9], [0, 9], [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9], [10, 9], [11, 9], [12, 9], [-11, 10], [-10, 10], [-9, 10], [-8, 10], [-7, 10], [-6, 10], [-5, 10], [-4, 10], [-3, 10], [-2, 10], [-1, 10], [0, 10], [1, 10], [2, 10], [3, 10], [4, 10], [5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10], [11, 10], [-10, 11], [-9, 11], [-8, 11], [-7, 11], [-6, 11], [-5, 11], [-4, 11], [-3, 11], [-2, 11], [-1, 11], [0, 11], [1, 11], [2, 11], [3, 11], [4, 11], [5, 11], [6, 11], [7, 11], [8, 11], [9, 11], [10, 11], [-9, 12], [-8, 12], [-7, 12], [-6, 12], [-5, 12], [-4, 12], [-3, 12], [-2, 12], [-1, 12], [0, 12], [1, 12], [2, 12], [3, 12], [4, 12], [5, 12], [6, 12], [7, 12], [8, 12], [9, 12], [-8, 13], [-7, 13], [-6, 13], [-5, 13], [-4, 13], [-3, 13], [-2, 13], [-1, 13], [0, 13], [1, 13], [2, 13], [3, 13], [4, 13], [5, 13], [6, 13], [7, 13], [8, 13], [-6, 14], [-5, 14], [-4, 14], [-3, 14], [-2, 14], [-1, 14], [0, 14], [1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [-4, 15], [-3, 15], [-2, 15], [-1, 15], [0, 15], [1, 15], [2, 15], [3, 15], [4, 15]];
  const FASTPoints = [[3, 0], [3, -1], [2, -2], [1, -3], [0, -3], [-1, -3], [-2, -2], [-3, -1], [-3, 0], [-3, 1], [-2, 2], [-1, 3], [0, 3], [1, 3], [2, 2], [3, 1]];
  const FASTStreakLength = 9;
  // const FASTRadius = 3;
  const FASTThreshold = 1 / 255;
  const gaussSigma = 3;
  const gaussColorLevels = 16;
  const gaussBlurRadius = 3;
  // const boxBlurRadius = 3;
  const harrisRadius = 3;
  const harrisSigma = 2;
  const harrisKappa = 0.15; // 0.04-0.15
  const pyramidLevels = 5;
  const keypointsCount = 500;
  const ORBPatchRadius = 15;

  const widthAtPyramidLevel = level => Math.floor(width / Math.pow(2, level))

  const heightAtPyramidLevel = level => Math.floor(height / Math.pow(2, level))

  const grayscaleKernel = gpu.createKernel(function(image) {
    const pixel = image[this.thread.y][this.thread.x];
    // return 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]; // HDTV from https://en.wikipedia.org/wiki/Grayscale
    return 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  });
  // .setPrecision('unsigned')
  // .setArgumentTypes(['HTMLVideo'])
  
  // const normalizeKernel = gpu.createKernel(function(image, min, max) {
  //   const intensity = image[this.thread.y][this.thread.x];
  //   return (intensity - min) / (max - min);
  // })
  // .setOutput([width, height])
  // .setImmutable(true)
  // .setPipeline(true)

  // const boxBlurKernel = gpu.createKernel(function(image, imageWidth, imageHeight, radius) {
  //   let value = 0.0;

  //   for (let j = -radius; j <= radius; j++) {
  //     for (let i = -radius; i <= radius; i++) {
  //       let x = Math.abs(this.thread.x + i);
  //       if (x >= imageWidth) x = imageWidth - 1 - (x - (imageWidth - 1)); // does this make sense??

  //       let y =  Math.abs(this.thread.y + j);
  //       if (y >= imageHeight) y = imageHeight - 1 - (y - (imageHeight - 1));

  //       value += image[y][x];
  //     }
  //   }

  //   return value / Math.pow(2.0 * radius + 1, 2.0);
  // }, {
  //   output: [width, height],
  //   immutable: true,
  //   pipeline: true,
  // });

  const gaussianBlurKernel = gpu.createKernel(function(image, gaussian, imageWidth, imageHeight, radius, colorLevels) {
    let value = 0.0;

    for (let j = -radius; j <= radius; j++) {
      for (let i = -radius; i <= radius; i++) {
        let x = Math.abs(this.thread.x + i);
        if (x >= imageWidth) x = imageWidth - 1 - (x - (imageWidth - 1)); // does this make sense??

        let y =  Math.abs(this.thread.y + j);
        if (y >= imageHeight) y = imageHeight - 1 - (y - (imageHeight - 1));

        value += gaussian[j + radius][i + radius] * image[y][x];
      }
    }

    return Math.round(value * colorLevels) / colorLevels;
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  });

  // const drawKernel = gpu.createKernel(function(image) {
  const drawKernel = gpu.createKernel(function(image, keypoints) {
    const i = image[this.thread.y][this.thread.x];
    const keypoint = keypoints[this.thread.y][this.thread.x];

    if (keypoint > 0) {
      this.color(1, 0, 0, 1.0);
    } else {
      this.color(i, i, i, 1.0);
    }
  }, {
    output: [width, height],
    graphical: true,
  });

  const fastKeypointsKernel = gpu.createKernel(function(image, imageWidth, imageHeight, points, pointsCount, radius, threshold, FASTStreakLength) {
    // TODO: 0, 3, 6, 9 quick-test?

    if (
      this.thread.x < radius ||
      this.thread.x >= imageWidth - radius ||
      this.thread.y < radius ||
      this.thread.y >= imageHeight - radius
    ) {
      return 0;
    }

    let x = this.thread.x;
    let y = this.thread.y;
    let ic = image[y][x];
    let ip = 0.0,
        diff = ic;
    let dx = 0,
        dy = 0;
    let streak = 0;
    let sign = 0,
        lastSign = -100;
    let result = false;

    // starts at the end, continues
    for (let i = 0; i < pointsCount + FASTStreakLength - 1; i++) {
      let index = i % pointsCount;
      dx = points[index][0];
      dy = points[index][1];

      ip = image[y + dy][x + dx];
      diff = ic - ip;
      sign = Math.sign(diff);

      if (Math.abs(diff) < threshold) {
        streak = 0;
      } else if (sign === lastSign) {
        streak += 1;
      }

      if (streak === FASTStreakLength) {
        result = true;
        break;
      }

      lastSign = sign;
    }

    return !!result ? 1 : 0;
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  });

  const gradientKernel = gpu.createKernel(function(image, imageWidth, imageHeight) {
    const x = this.thread.x;
    const y = this.thread.y;

    // gradient calculation after https://lilianweng.github.io/lil-log/2017/10/29/object-recognition-for-dummies-part-1.html
    return [
      x > 0 && x < imageWidth - 1 ? image[y][x + 1] - image[y][x - 1] : 0,
      y > 0 && y < imageHeight - 1 ? image[y + 1][x] - image[y - 1][x] : 0
    ]
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  })
  
  const rankKeypointsKernel = (function(level) {
    const kernels = [];

    kernels[level] = kernels[level] || gpu.createKernel(function(keypoints, gradients, gaussian, radius, kappa, imageWidth, imageHeight) {
      if (
        keypoints[this.thread.y][this.thread.x] === 0 ||
        this.thread.x < radius ||
        this.thread.x >= imageWidth - radius ||
        this.thread.y < radius ||
        this.thread.y >= imageHeight - radius
      ) {
        return 0;
      }

      let IxIx = 0;
      let IyIy = 0;
      let IxIy = 0;

      for (let j = -radius; j <= radius; j++) {
        for (let i = -radius; i <= radius; i++) {
          // overflows are handled above
          let x = this.thread.x + i;
          let y = this.thread.y + j;

          let I = gradients[y][x];

          // Gaussian used instead of box for weights => isotropic response (direction-independent) (https://en.wikipedia.org/wiki/Corner_detection)
          let weight = gaussian[j + radius][i + radius];
          IxIx += weight * Math.pow(I[0], 2);
          IyIy += weight * Math.pow(I[1], 2);
          IxIy += weight * I[0] * I[1];
        }
      }

      // return harrisScore(IxIx, IyIy, IxIy, kappa)
      return shiTomasi(IxIx, IyIy, IxIy)
    }, {
      output: [
        widthAtPyramidLevel(level),
        heightAtPyramidLevel(level),
      ],
      immutable: true,
      pipeline: true,
      functions: [
        function harrisScore(IxIx, IyIy, IxIy, kappa) {
          // detM - (trace(M))^2 (https://en.wikipedia.org/wiki/Corner_detection)
          return IxIx * IyIy - Math.pow(IxIy, 2) - kappa * Math.pow(IxIx + IyIy, 2);
        },
        function shiTomasi(IxIx, IyIy, IxIy) {
          // Eigenvalue algorithm from https://en.wikipedia.org/wiki/Eigenvalue_algorithm
          let traceA = IxIx + IyIy;
          let detA = IxIx * IyIy - Math.pow(IxIy, 2);
          let gap = Math.sqrt(Math.pow(traceA, 2.0) - 4 * detA);
          return 0.5 * (traceA - gap);
        }
      ]
    });

    return kernels[level];
  });

  // keep only the keypoints with maximum cornerness in each patch
  const nonmaxSuppressionKernel = (function(level) {
    const kernels = [];

    kernels[level] = kernels[level] || gpu.createKernel(function(image, imageWidth, imageHeight) {
      let y = this.thread.y;
      let x = this.thread.x;
      let ci = image[y][x];


      if (ci === 0) {
        return 0;
      }

      for (let i = 0; i < this.constants.patchPointsCount; i++) {
        let dx = this.constants.patchPoints[i][0];
        let dy = this.constants.patchPoints[i][1];

        if (image[y + dy][x + dx] > ci) {
          return 0;
        }
      }

      return ci;
    }, {
      output: [
        widthAtPyramidLevel(level),
        heightAtPyramidLevel(level),
      ],
      immutable: true,
      pipeline: true,
      constants: {
        patchPoints: patchPoints,
        patchPointsCount: patchPoints.length,
        patchRadius: ORBPatchRadius / 2,
      },
    });

    return kernels[level];
  });

  const keypointOrientationKernel = gpu.createKernel(function(image, keypointsList, patchPoints, patchPointsCount) {
    let keypointIndex = this.thread.x;
    let x = keypointsList[keypointIndex][0];
    let y = keypointsList[keypointIndex][1];
    let m01 = 0;
    let m10 = 0;

    for (let i = 0; i < patchPointsCount; i++) {
      let dx = patchPoints[i][0];
      let dy = patchPoints[i][1];

      m01 += (y + dy) * image[y + dy][x + dx];
      m10 += (x + dx) * image[y + dy][x + dx];
    }

    return Math.atan2(m01, m10);
  }, {
    output: [keypointsCount],
  });

  const downscaleKernel = (function(level) {
    const kernels = [];

    kernels[level] = kernels[level] || gpu.createKernel(function(image) {
      // TODO: better scaling algorithm
      let x = 2 * this.thread.x
      let y = 2 * this.thread.y

      return 0.25 * (
        image[y][x] +
        image[y][x + 1] +
        image[y + 1][x] +
        image[y + 1][x + 1]
      );
    }, {
      output: [
        widthAtPyramidLevel(level),
        heightAtPyramidLevel(level),
      ],
      immutable: true,
      pipeline: true,
    });

    return kernels[level];
  });

  // TODO using combined kernels should decrease the count of API calls to the GPU and speed up the computation
  //
  // const combinedDrawKernel = gpu.createKernel(grayscaleKernel, gaussianBlurKernel, function(canvas, gaussian, width, height, gaussBlurRadius, gaussColorLevels) {
  //   const image = gaussianBlurKernel(grayscaleKernel(canvas), gaussian, width, height, gaussBlurRadius, gaussColorLevels)
  //   const i = image[this.thread.y][this.thread.x]
  //   this.color(i, i, i)
  // })
  // .setOutput([width, height])
  // .setGraphical(true)

  let frameNumber = 0
  let localMaximaKeypoints = []

  const render = async function () {
    window.start = new Date()

    // FIXME combined kernel, if possible to limit calls to GPU and increase performance
    // FIXME use input() and flat arrays
    ctx.drawImage(video, 0, 0)
    
    const grayscaleImage = grayscaleKernel(canvas);
    const blurredImage = gaussianBlurKernel(grayscaleImage, gaussian(gaussBlurRadius, gaussSigma), width, height, gaussBlurRadius, gaussColorLevels);
    // grayscaleImage.delete();

    if (frameNumber > 0 && frameNumber % 20) {
      drawKernel(blurredImage, localMaximaKeypoints[0]);
    // TODO add keypoint tracking
    } else {

      const pyramidLayers = [];
      let rankedKeypoints, keypointsList;

      const allKeypointsList = []

      for (let level = 0; level < pyramidLevels; level++) {
        const layerWidth = widthAtPyramidLevel(level);
        const layerHeight = heightAtPyramidLevel(level);

        pyramidLayers[level] = level === 0
          ? blurredImage
          : downscaleKernel(level)(pyramidLayers[level - 1]);

        const keypoints = fastKeypointsKernel(pyramidLayers[level], layerWidth, layerHeight, FASTPoints, FASTPoints.length, ORBPatchRadius, FASTThreshold, FASTStreakLength);
        const gradients = gradientKernel(pyramidLayers[level], layerWidth, layerHeight);
        // TODO: non-maximum suppression? (compare each keypoint with its neighbors, keep only those with high cornerness measure value)

        rankedKeypoints = rankKeypointsKernel(level)(keypoints, gradients, gaussian(harrisRadius, harrisSigma), harrisRadius, harrisKappa, layerWidth, layerHeight);
        localMaximaKeypoints[level] = nonmaxSuppressionKernel(level)(rankedKeypoints, layerWidth, layerHeight);
        const keypointsArray = localMaximaKeypoints[level].toArray();
        // const keypointsArray = rankedKeypoints.toArray();

        keypointsList = []

        for (let j = 0; j < keypointsArray.length; j++) {
          for (let i = 0; i < keypointsArray[j].length; i++) {
            const point = keypointsArray[j][i];
            if (point > 0) {
              keypointsList.push({
                x: i,
                y: j,
                level: level,
                score: point,
              });
            }
          }
        }

        keypointsList.sort((a, b) => b.score - a.score); // desc order
        keypointsList.splice(keypointsCount);

        let arrayizedKeypoints = [
          ...keypointsList.map(kp => [kp.x, kp.y, kp.level]),
          ...new Array(keypointsCount - keypointsList.length).fill([0, 0, 0])
        ]

        let orientations = keypointOrientationKernel(pyramidLayers[level], arrayizedKeypoints, patchPoints, patchPoints.length);
        keypointsList = keypointsList.map((kp, i) => ({
          ...kp,
          orientation: orientations[i],
        }))

        allKeypointsList.push.apply(allKeypointsList, keypointsList);


        // TODO
        // - calculate descriptors for each keypoint on each pyramid level, rotated according to patch orientation
        // - instead of searching for new keypoints on every frame, do it only once in N frames and in between just track them
        // - match descriptors to those from some outside source (with 3D coordinates)
        // - calculate projection for matched keypoints
        // - use RANSAC to throw out outsiders by checking for reprojection error

        gradients.delete();
        keypoints.delete();
        rankedKeypoints.delete();
      }

      // allKeypointsList.sort((a, b) => b.score - a.score);
      // TODO top across all pyramid levels?
      allKeypointsList.splice(keypointsCount); // keep only top keypointsCount keypoints
      window.allKeypointsList = allKeypointsList;

      drawKernel(pyramidLayers[0], localMaximaKeypoints[0]);
    }

    blurredImage.delete()
    // rankedKeypoints.delete();

    // leaving 0 for the next draws
    for (let level = 1; level < pyramidLevels; level++) {
      localMaximaKeypoints[level].delete();
    }
    // localMaximaKeypoints.delete();

    // combinedDrawKernel(canvas, gaussian(gaussBlurRadius, gaussSigma), width, height, gaussBlurRadius, gaussColorLevels)
    window.end = new Date()
    window.fps = 1000 / (window.end - window.start)
    frameNumber += 1;

    requestAnimationFrame(render)
    // setTimeout(render, 33)
  }

  requestAnimationFrame(render)

  document.body.appendChild(drawKernel.canvas)
})()


main();
