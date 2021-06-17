import { SVD } from 'svd-js'


import * as THREE from 'three'


function transposed(M) {
  let M_T = M[0].map(row => [])
  for (let j = 0; j < M.length; j++) {
    for (let i = 0; i < M[0].length; i++) {
      M_T[i][j] = M[j][i]
    }
  }
  return M_T
}

export function DLT(X1, X2, X3, X4, X5, X6, x1, x2, x3, x4, x5, x6) {
  const M = [
    [X1[0], X1[1], X1[2], 1, 0, 0, 0, 0, -x1[0] * X1[0], -x1[0] * X1[1], -x1[0] * X1[2], -x1[0]],
    [0, 0, 0, 0, X1[0], X1[1], X1[2], 1, -x1[1] * X1[0], -x1[1] * X1[1], -x1[1] * X1[2], -x1[1]],
    [X2[0], X2[1], X2[2], 1, 0, 0, 0, 0, -x2[0] * X2[0], -x2[0] * X2[1], -x2[0] * X2[2], -x2[0]],
    [0, 0, 0, 0, X2[0], X2[1], X2[2], 1, -x2[1] * X2[0], -x2[1] * X2[1], -x2[1] * X2[2], -x2[1]],
    [X3[0], X3[1], X3[2], 1, 0, 0, 0, 0, -x3[0] * X3[0], -x3[0] * X3[1], -x3[0] * X3[2], -x3[0]],
    [0, 0, 0, 0, X3[0], X3[1], X3[2], 1, -x3[1] * X3[0], -x3[1] * X3[1], -x3[1] * X3[2], -x3[1]],
    [X4[0], X4[1], X4[2], 1, 0, 0, 0, 0, -x4[0] * X4[0], -x4[0] * X4[1], -x4[0] * X4[2], -x4[0]],
    [0, 0, 0, 0, X4[0], X4[1], X4[2], 1, -x4[1] * X4[0], -x4[1] * X4[1], -x4[1] * X4[2], -x4[1]],
    [X5[0], X5[1], X5[2], 1, 0, 0, 0, 0, -x5[0] * X5[0], -x5[0] * X5[1], -x5[0] * X5[2], -x5[0]],
    [0, 0, 0, 0, X5[0], X5[1], X5[2], 1, -x5[1] * X5[0], -x5[1] * X5[1], -x5[1] * X5[2], -x5[1]],
    [X6[0], X6[1], X6[2], 1, 0, 0, 0, 0, -x6[0] * X6[0], -x6[0] * X6[1], -x6[0] * X6[2], -x6[0]],
    [0, 0, 0, 0, X6[0], X6[1], X6[2], 1, -x6[1] * X6[0], -x6[1] * X6[1], -x6[1] * X6[2], -x6[1]],
  ]
  const M_T = transposed(M)
  
  // console.log('M', M.map(x => x.join(', ')))
  // console.log('M_T', M_T.map(x => x.join(', ')))

  // for some reason it seems u and v are switched(?)
  const { u, q } = SVD(M_T, true, false)
  // console.log(u, q, v)
  // console.log(u.map(u => u.join(', ')))

  const minQ = Math.min(...q) // q's are non-negative
  const index = q.lastIndexOf(minQ)

  // const h = v[index]
  const h = u.map(u => u[index])
console.log('q', q)
console.log('h', h)
  // tz < 0? => flip
  if (h[11] < 0) {
    h.forEach((_, i) => h[i] *= -1)
  }

  // return h
  const norm = Math.sqrt(h[8]**2 + h[9]**2 + h[10]**2)

  return h.map(x => x / norm)
}


// const X = [
//   [-1, 1, -10, 1],
//   [1, 1, -10, 1],
//   [1, -1, -10, 1],
//   [-1, -1, -10, 1],
//   [-1, 1, -11, 1],
//   [1, 1, -11, 1],
//   [1, -1, -11, 1],
//   [-1, -1, -11, 1],
// ]

// const x = [
//   [-100, 100, 1],
//   [100, 100, 1],
//   [100, -100, 1],
//   [-100, -100, 1],
//   [-80, 80, 1],
//   [80, 80, 1],
//   [80, -80, 1],
//   [-80, -80, 1],
// ]

const true_P = new THREE.Matrix4().set(
  0.7072945483755065, -0.7061704379962989, 0.03252282795827704, -0.1,
  0.7061704379962989, 0.7036809008245869, -0.07846338199958876, 0.1,
  0.03252282795827704, 0.07846338199958876, 0.9963863524490802, 1.2,
  0, 0, 0, 1,
)

const L = 0.2
const X = [
  [-L, -L, 0, 1],
  [2*L, -L, 0.2, 1],
  [L, L, 0.2, 1],
  [-L, L, 0, 1],
  [-2*L, L, 0, 1],
  [0, 0, 0.5, 1],
]

// console.log(new THREE.Vector4(...X[0]).applyMatrix4(true_P).toArray())

const x = X.map(X => new THREE.Vector4(...X)
  .applyMatrix4(true_P))
  .map(x => [x.x / x.z, x.y / x.z, 1])

// console.log(x)

console.time('aaaa')
const result = DLT(...X, ...x)
// console.log('result', result)
console.timeEnd('aaaa')


const P = new THREE.Matrix4().set(
  ...result,
  0, 0, 0, 1
)

console.log()
console.log('true_P')
console.log(`${true_P.elements[0]} ${true_P.elements[4]} ${true_P.elements[8]} ${true_P.elements[12]}`)
console.log(`${true_P.elements[1]} ${true_P.elements[5]} ${true_P.elements[9]} ${true_P.elements[13]}`)
console.log(`${true_P.elements[2]} ${true_P.elements[6]} ${true_P.elements[10]} ${true_P.elements[14]}`)
console.log(`${true_P.elements[3]} ${true_P.elements[7]} ${true_P.elements[11]} ${true_P.elements[15]}`)
console.log()
console.log('P')
console.log(`${P.elements[0]} ${P.elements[4]} ${P.elements[8]} ${P.elements[12]}`)
console.log(`${P.elements[1]} ${P.elements[5]} ${P.elements[9]} ${P.elements[13]}`)
console.log(`${P.elements[2]} ${P.elements[6]} ${P.elements[10]} ${P.elements[14]}`)
console.log(`${P.elements[3]} ${P.elements[7]} ${P.elements[11]} ${P.elements[15]}`)
console.log()

console.log('X', X)
console.log('x', x)
console.log('x_', X.map(X => new THREE.Vector4(...X)
  .applyMatrix4(P))
  .map(x => [x.x / x.z, x.y / x.z, 1]))

// void X.forEach(X => {
//   const v = new THREE.Vector4(...X)
//   v.applyMatrix4(P)
//   console.log('homogen v', v.x, v.y, v.z, v.w)
//   console.log('euler   v', v.x / v.z, v.y / v.z)
// })


// const P2 = new THREE.Matrix3().set(
//   ...result.slice(0, 3),
//   ...result.slice(4, 7),
//   ...result.slice(8, 11),
// )

// console.log(P2)

// const { u, q, v } = SVD(P2.elements)
// console.log(u, q, v)
// const s = 1 / (q.reduce((a, x) => a + x, 0) / q.length)
// console.log('s', s)
// console.log(P2)
// P2.multiplyScalar(s)
// console.log(P2)


// testing from wiki - revealed that the library expects array of columns...
// const M = [
//   [1, 0, 0, 0],
//   [0, 0, 0, 2],
//   [0, 3, 0, 0,],
//   [0, 0, 0, 0],
//   [2, 0, 0, 0],
// ]

// console.log(SVD(M))



// const test = new THREE.Matrix3().set(
//   1, 1, 1,
//   0, 0, 0,
//   0, 0, 0,
// )
// const v = new THREE.Vector3(1, 2, 3)
// console.log(v)
// v.applyMatrix3(test)
// console.log(v)
// => Vector3 { x: 6, y: 0, z: 0 } => matice sa zadavaju po riadkoch, ale ukladaju po stlpcoch