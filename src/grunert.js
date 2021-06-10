import quartic from '@skymaker/quartic'
import { mat4, mat3, vec3, vec4 } from 'gl-matrix'
import { GPU } from 'gpu.js'

const imageSize = [1280, 720]

// data from calibdb.net
const K = mat3.fromValues(...[
  954.0874994019651, 0,                 660.572082940535,
  0,                 949.9159862376827, 329.78814306885795,
  0,                 0,                 1,
])
mat3.transpose(K, K)

const K_inv = mat3.invert(mat3.create(), K)

// 3D object points coordinates
const [X1, X2, X3] = [
  vec4.fromValues(0, 0, -1, 1),
  vec4.fromValues(0, 1, -1, 1),
  vec4.fromValues(1, 0, -1, 1),
]

const fx = 954.0874994019651
const fy = 949.9159862376827

// 2D image points coordinates - homogenous?
const [x1, x2, x3] = [
  vec4.fromValues(660 / fx, 329 / fy, 1),
  vec4.fromValues(660 / fx, 9 / fy, 1),
  vec4.fromValues(980 / fx, 329 / fy, 1),
]

const [cx1, cx2, cx3] = [
  vec3.transformMat3(vec3.create(), x1, K_inv),
  vec3.transformMat3(vec3.create(), x2, K_inv),
  vec3.transformMat3(vec3.create(), x3, K_inv),
]

console.log('cxi', [cx1, cx2, cx3])

// TODO - check correctness, deal with fx vs fy from K
const [ray1, ray2, ray3] = [
  vec3.scale(vec3.create(), vec3.normalize(vec3.create(), cx1), -1),
  vec3.scale(vec3.create(), vec3.normalize(vec3.create(), cx2), -1),
  vec3.scale(vec3.create(), vec3.normalize(vec3.create(), cx3), -1),
  // vec3.normalize(vec3.create(), cx1),
  // vec3.normalize(vec3.create(), cx2),
  // vec3.normalize(vec3.create(), cx3),
]

const [alpha, beta, gamma] = [
  vec3.angle(cx2, cx3),
  vec3.angle(cx1, cx3),
  vec3.angle(cx1, cx2),
]

const [cosAlpha, cosBeta, cosGamma] = [
  Math.cos(alpha),
  Math.cos(beta),
  Math.cos(gamma),
]

const [a, b, c] = [
  vec3.dist(X2, X3), 
  vec3.dist(X1, X3), 
  vec3.dist(X1, X2),
]

// TODO - check for zero in denominator!

const [A4, A3, A2, A1, A0] = [
  ((a**2 - c**2) / b**2 - 1)**2 - (4*c**2/b**2) * cosAlpha**2,
  4 * (((a**2 - c**2) / b**2) * (1 - (a**2 - c**2) / b**2) * cosBeta - (1 - (a**2 + c**2) / b**2) * cosAlpha * cosGamma + 2 * (c**2/b**2) * cosAlpha**2 * cosBeta),
  2 * (((a**2 - c**2) / b**2)**2 - 1 + 2*((a**2 - c**2) / b**2)**2 * cosBeta + 2 * ((b**2 - c**2) / b**2) * cosAlpha**2 - 4*((a**2 + c**2) / b**2)*cosAlpha*cosBeta*cosGamma + 2 * ((b**2 - a**2) / b**2) * cosGamma**2),
  4 * (-((a**2 - c**2) / b**2) * (1 + (a**2 - c**2) / b**2) * cosBeta + 2*a**2/b**2 * cosGamma**2 * cosBeta - (1 - (a**2 + c**2) / b**2) * cosAlpha * cosGamma),
  ((1 + (a**2 - c**2) / b**2)**2 - 4 * a**2 / b**2 * cosGamma**2)
]


const vs = quartic.solve(A4, A3, A2, A1, A0)
  .filter(s => s.im === 0)
  .map(s => s.re)

console.log('==== vs', vs)

vs.forEach(v => {
  const u = ((-1 * (a**2 - c**2) / b**2) * v**2 - 2 * ((a**2 - c**2) / b**2) * cosBeta * v + 1 + (a**2 - c**2) / b**2) / (2 * cosGamma - v * cosAlpha)

  const s1 = Math.sqrt(a**2 / (u**2 + v**2 - 2*u*v*cosAlpha))
  const s2 = u * s1
  const s3 = v * s1

  console.log('------------------------------------------------------')
  console.log('s1, s2, s3 = ', s1, s2, s3)
  console.log('cX1', vec3.scale(vec3.create(), ray1, s1).join())
  console.log('cX2', vec3.scale(vec3.create(), ray2, s2).join())
  console.log('cX3', vec3.scale(vec3.create(), ray3, s3).join())
})

// TODO: schema prekreslit do vektorov - 4 4 mozne konfiguracie (zakladna + otocenie kazdeho z 3 bodov okolo protilahlej hrany)


// const distortion = [
//   0.036998502838994515,
//   -0.13207581435883872,
//   -0.000045055253893522236,
//   -0.007745497656725853,
//   0.11519181871308336
// ]

// camera position
// const X0 = [0, 0, 5]

// const R = mat4.identity(mat4.create())

// const T = mat4.identity(mat4.create())
// T[12] = -X0[0]
// T[13] = -X0[1]
// T[14] = -X0[2]

// // const M = mat4.multiply(mat4.create(), R, T)

// // TODO prevod zo svetovych do kamery - toto uz su kamerove
// // TODO non-linear errors (distortions)
// const points = [
//   vec4.fromValues(0, 0, -1, 1),
//   vec4.fromValues(0, 1, -1, 1),
//   vec4.fromValues(1, 0, -2, 1),
// ]

// const x_cam = [
//   vec4.transformMat4(vec4.create(), points[0], T),
//   vec4.transformMat4(vec4.create(), points[1], T),
//   vec4.transformMat4(vec4.create(), points[2], T),
// ]
// vec4.transformMat4(x_cam[0], x_cam[0], R)
// vec4.transformMat4(x_cam[1], x_cam[1], R)
// vec4.transformMat4(x_cam[2], x_cam[2], R)

// console.log('x_cam', x_cam)

// const x_img = [
//   vec3.transformMat3(vec3.create(), x_cam[0], K),
//   vec3.transformMat3(vec3.create(), x_cam[1], K),
//   vec3.transformMat3(vec3.create(), x_cam[2], K),
// ]

// x_img.forEach(x_img => {
//   vec3.scale(x_img, x_img, 1 / x_img[2])
// })

// // console.log(K_inv)
// console.log('x_img', x_img)


// // direction rays
// const eta = [
//   vec3.transformMat3(vec3.create(), x_img[0], K_inv),
//   vec3.transformMat3(vec3.create(), x_img[1], K_inv),
//   vec3.transformMat3(vec3.create(), x_img[2], K_inv),
// ]

// console.log('eta', eta)

// // real-world point distances
// const [a, b, c] = [
//   vec3.dist(points[1], points[2]),
//   vec3.dist(points[0], points[2]),
//   vec3.dist(points[0], points[1]),
// ]



// // const realSolutions = quartic.solve(...[1, 0, 0, 0, -16])
// //   .filter(s => s.im === 0)
// //   .map(s => s.re)





// // console.log(realSolutions)


// const gpu = new GPU()
// // const kernel = gpu.createKernel(function(x) {
// //   return x;
// // }).setOutput([100]);

// // console.log(kernel(42));

// const kernel = gpu.createKernel(function() {
//   // const array2 = [0.08, 2];
//   // return array2;
//   return [0.08, 2];
// }).setOutput([10]);

//  console.log(kernel());
