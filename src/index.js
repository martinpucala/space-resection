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

  // requestAnimationFrame(render);
}








// const gpu = new GPU({ mode: 'cpu' });
const gpu = new GPU();

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

  const FASTPoints = [[3, 0], [3, -1], [2, -2], [1, -3], [0, -3], [-1, -3], [-2, -2], [-3, -1], [-3, 0], [-3, 1], [-2, 2], [-1, 3], [0, 3], [1, 3], [2, 2], [3, 1]];
  const FASTStreakLength = 9;
  const FASTRadius = 3;
  const FASTThreshold = 2 / 255;

  const grayscaleKernel = gpu.createKernel(function(image) {
    const pixel = image[this.thread.y][this.thread.x];
    // return 0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2]; // HDTV from https://en.wikipedia.org/wiki/Grayscale
    return 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
  })
  .setOutput([width, height])
  .setImmutable(true)
  .setPipeline(true)
  // .setPrecision('unsigned')
  // .setArgumentTypes(['HTMLVideo'])
  
  // const normalizeKernel = gpu.createKernel(function(image, min, max) {
  //   const intensity = image[this.thread.y][this.thread.x];
  //   return (intensity - min) / (max - min);
  // })
  // .setOutput([width, height])
  // .setImmutable(true)
  // .setPipeline(true)

  const boxBlurKernel = gpu.createKernel(function(image, imageWidth, imageHeight, radius) {
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

    return value / Math.pow(2.0 * radius + 1, 2.0);
  })
  .setOutput([width, height])
  .setImmutable(true)
  .setPipeline(true)

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

    return Math.round(value * colorLevels) / colorLevels; // / Math.pow(2.0 * radius + 1.0, 2.0);
  })
  .setOutput([width, height])
  .setImmutable(true)
  .setPipeline(true)

  const drawKernel = gpu.createKernel(function(image, keypoints) {
    const i = image[this.thread.y][this.thread.x];
    const keypoint = keypoints[this.thread.y][this.thread.x];
    if (keypoint > 0.00000001) {
      this.color(1, 0, 0, 1.0);
    } else {
      this.color(i, i, i, 1.0);
    }
  })
  .setOutput([width, height])
  .setGraphical(true)

  const fastKeypointsKernel = gpu.createKernel(function(image, imageWidth, imageHeight, points, pointsCount, radius, threshold, FASTStreakLength) {
    // TODO: 0, 3, 6, 9 quick-test

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
// debugger
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
    // return diff;
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  })

  const partialDerivativesKernel = gpu.createKernel(function(image) {    
    return [
      this.thread.x > 0 ? image[this.thread.y][this.thread.x] - image[this.thread.y][this.thread.x - 1] : 0,
      this.thread.y > 0 ? image[this.thread.y][this.thread.x] - image[this.thread.y - 1][this.thread.x] : 0
    ]
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  })
  
  const harrisKeypointsKernel = gpu.createKernel(function(keypoints, derivatives, gaussian, radius, kappa, imageWidth, imageHeight) {
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
        
        let I = derivatives[y][x];

        let weight = gaussian[j + radius][i + radius];
        IxIx += weight * Math.pow(I[0], 2);
        IyIy += weight * Math.pow(I[1], 2);
        IxIy += weight * I[0] * I[1];
      }
    }

    // detM - (trace(M))^2
    return IxIx * IyIy - Math.pow(IxIy, 2) - kappa * Math.pow(IxIx + IyIy, 2);
  }, {
    output: [width, height],
    immutable: true,
    pipeline: true,
  })





  // const combinedDrawKernel = gpu.createKernel(grayscaleKernel, gaussianBlurKernel, function(canvas, gaussian, width, height, gaussBlurRadius, gaussColorLevels) {
  //   const image = gaussianBlurKernel(grayscaleKernel(canvas), gaussian, width, height, gaussBlurRadius, gaussColorLevels)
  //   const i = image[this.thread.y][this.thread.x]
  //   this.color(i, i, i)
  // })
  // .setOutput([width, height])
  // .setGraphical(true)


  const gaussSigma = 3
  const gaussColorLevels = 32
  const gaussBlurRadius = 11
  // const boxBlurRadius = 3
  const harrisRadius = 3
  const harrisSigma = 2
  const harrisKappa = 0.06

  const render = async function () {
    ctx.drawImage(video, 0, 0)
    
    const grayscaleImage = grayscaleKernel(canvas);
    const blurredImage1 = gaussianBlurKernel(grayscaleImage, gaussian(gaussBlurRadius, gaussSigma), width, height, gaussBlurRadius, gaussColorLevels);
    const keypoints = fastKeypointsKernel(blurredImage1, width, height, FASTPoints, FASTPoints.length, FASTRadius, FASTThreshold, FASTStreakLength);
    const derivatives = partialDerivativesKernel(grayscaleImage);
    grayscaleImage.delete()
    const harrisKeypoints = harrisKeypointsKernel(keypoints, derivatives, gaussian(harrisRadius, harrisSigma), harrisRadius, harrisKappa, width, height);
    derivatives.delete()
    keypoints.delete()

    // const blurredImage2 = boxBlurKernel(blurredImage1, width, height, boxBlurRadius)
    // blurredImage1.delete()
    // const blurredImage2 = gaussianBlurKernel(blurredImage1, gaussian(blurRadius), width, height, blurRadius)
    // blurredImage1.delete()
    // drawKernel(blurredImage2)
    // blurredImage2.delete()
    // drawKernel(grayscaleImage)
    // grayscaleImage.delete()
    drawKernel(blurredImage1, harrisKeypoints)

    harrisKeypoints.delete()
    blurredImage1.delete()
    // keypoints.delete()
    // combinedDrawKernel(canvas, gaussian(gaussBlurRadius, gaussSigma), width, height, gaussBlurRadius, gaussColorLevels)
    // blurredImage1.delete()

    requestAnimationFrame(render)
    // setTimeout(render, 33)
  }

  requestAnimationFrame(render)

  document.body.appendChild(drawKernel.canvas)
})()



main();
