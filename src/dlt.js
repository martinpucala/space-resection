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
    [-X1[0], -X1[1], -X1[2], -1, 0, 0, 0, 0, x1[0] * X1[0], x1[0] * X1[1], x1[0] * X1[2], x1[0]],
    [0, 0, 0, 0, -X1[0], -X1[1], -X1[2], -1, x1[1] * X1[0], x1[1] * X1[1], x1[1] * X1[2], x1[1]],

    [-X2[0], -X2[1], -X2[2], -1, 0, 0, 0, 0, x2[0] * X2[0], x2[0] * X2[1], x2[0] * X2[2], x2[0]],
    [0, 0, 0, 0, -X2[0], -X2[1], -X2[2], -1, x2[1] * X2[0], x2[1] * X2[1], x2[1] * X2[2], x2[1]],

    [-X3[0], -X3[1], -X3[2], -1, 0, 0, 0, 0, x3[0] * X3[0], x3[0] * X3[1], x3[0] * X3[2], x3[0]],
    [0, 0, 0, 0, -X3[0], -X3[1], -X3[2], -1, x3[1] * X3[0], x3[1] * X3[1], x3[1] * X3[2], x3[1]],

    [-X4[0], -X4[1], -X4[2], -1, 0, 0, 0, 0, x4[0] * X4[0], x4[0] * X4[1], x4[0] * X4[2], x4[0]],
    [0, 0, 0, 0, -X4[0], -X4[1], -X4[2], -1, x4[1] * X4[0], x4[1] * X4[1], x4[1] * X4[2], x4[1]],

    [-X5[0], -X5[1], -X5[2], -1, 0, 0, 0, 0, x5[0] * X5[0], x5[0] * X5[1], x5[0] * X5[2], x5[0]],
    [0, 0, 0, 0, -X5[0], -X5[1], -X5[2], -1, x5[1] * X5[0], x5[1] * X5[1], x5[1] * X5[2], x5[1]],

    [-X6[0], -X6[1], -X6[2], -1, 0, 0, 0, 0, x6[0] * X6[0], x6[0] * X6[1], x6[0] * X6[2], x6[0]],
    [0, 0, 0, 0, -X6[0], -X6[1], -X6[2], -1, x6[1] * X6[0], x6[1] * X6[1], x6[1] * X6[2], x6[1]],
  ]
  const M_T = transposed(M)
  
  // console.log('M', M.map(x => x.join(', ')))
  // console.log('M_T', M_T.map(x => x.join(', ')))
    
  const { q, v } = SVD(M_T, false)

  const s = 1 / (q.reduce((a, x) => a + x, 0) / q.length)
  console.log('=========================== s', s)
  const minQ = Math.min(...q) // q's are non-negative
  const index = q.lastIndexOf(minQ)

  // console.log(q[index])
  console.log(v.map(x => x.join(', ')))
  // return column corresponding to the smallest q
  return v[index].map(x => s * x)
  // return v.map(v => v[index])
}


// const X = [...new Array(6).values()]
//   .map((_, i) => i + 1)
//   .map(i => {
//     const angle = i * Math.PI / 3;
//     const r = 50;

//     return [
//       r * Math.cos(angle),
//       r * Math.sin(angle),
//       50 + i * 10,
//       1
//     ];
//   })

// const x = X.map(([X, Y, Z]) => {
//     const w = 1280
//     const h = 720
//     // const w = 0
//     // const h = 0

//     return [
//       w / 2 + X/50 * w/2,
//       h / 2 - Y/50 * h/2,
//       1,
//     ];
//   })

const X = [
  [-1, 1, -10, 1],
  [1, 1, -10, 1],
  [1, -1, -10, 1],
  [-1, -1, -10, 1],
  [-1, 1, -11, 1],
  [1, 1, -11, 1],
  [1, -1, -11, 1],
  [-1, -1, -11, 1],
]

const x = [
  [-100, 100, 1],
  [100, 100, 1],
  [100, -100, 1],
  [-100, -100, 1],
  [-80, 80, 1],
  [80, 80, 1],
  [80, -80, 1],
  [-80, -80, 1],
]

const result = DLT(...X, ...x)
console.log('result', result)

const P = new THREE.Matrix4().set(
  // ...result.map(x => x / result[11]),

  // ...result.slice(0, 3), 0,//.map(x => x / result[10]), 0,
  // ...result.slice(4, 7), 0,//.map(x => x / result[10]), 0,
  // ...result.slice(8, 11), 0,//.map(x => x / result[10]), 0,

  ...result.slice(0, 3).map(x => x / result[10]), 0,
  ...result.slice(4, 7).map(x => x / result[10]), 0,
  ...result.slice(8, 11).map(x => x / result[10]), 0,
  0, 0, 0, 0
)

console.log()
console.log('P')
console.log(`${P.elements[0]} ${P.elements[4]} ${P.elements[8]} ${P.elements[12]}`)
console.log(`${P.elements[1]} ${P.elements[5]} ${P.elements[9]} ${P.elements[13]}`)
console.log(`${P.elements[2]} ${P.elements[6]} ${P.elements[10]} ${P.elements[14]}`)
console.log(`${P.elements[3]} ${P.elements[7]} ${P.elements[11]} ${P.elements[15]}`)
console.log()

console.log('X', X)
console.log('x', x)

void X.forEach(X => {
  const v = new THREE.Vector4(...X)
  v.applyMatrix4(P)
  console.log('homogen v', v.x, v.y, v.z, v.w)
  console.log('euler   v', v.x / v.z, v.y / v.z)
})


const P2 = new THREE.Matrix3().set(
  ...result.slice(0, 3),
  ...result.slice(4, 7),
  ...result.slice(8, 11),
)

console.log(P2)

const { u, q, v } = SVD(P2.elements)
console.log(u, q, v)
const s = 1 / (q.reduce((a, x) => a + x, 0) / q.length)
console.log('s', s)
console.log(P2)
P2.multiplyScalar(s)
console.log(P2)


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