import quartic from '@skymaker/quartic'
import { mat3, vec3 } from 'gl-matrix'



// TODO: DLT - Mp = 0 a mam celu projekcnu maticu P, osobitne K.R,X0 ma nezaujimaju => nepotrebujem SVD?
// co ked mam viacero sestic? vypocitam viacero P a skusam, ktora ma najmenej outlierov, tzn. najmenej bodov vzdialenych od svojej pozorovanej polohy a tou mozem zobrazit body, ktore chcem zobrazovat?


const imageSize = [1280, 720]

// data from calibdb.net
const K = mat3.fromValues(
  954.0874994019651, 0,                 660.572082940535,
  0,                 949.9159862376827, 329.78814306885795,
  0,                 0,                 1,
)
mat3.transpose(K, K)
console.log('K')
console.log(`${K[0]} ${K[3]} ${K[6]}`)
console.log(`${K[1]} ${K[4]} ${K[7]}`)
console.log(`${K[2]} ${K[5]} ${K[8]}`)

const K_inv = mat3.invert(mat3.create(), K)
console.log('K_inv')
console.log(`${K_inv[0]} ${K_inv[3]} ${K_inv[6]}`)
console.log(`${K_inv[1]} ${K_inv[4]} ${K_inv[7]}`)
console.log(`${K_inv[2]} ${K_inv[5]} ${K_inv[8]}`)

// 3D object points coordinates
const [X1, X2, X3, X4] = [
  vec3.fromValues(0, 0, -10),
  vec3.fromValues(0, 2, -10),
  vec3.fromValues(2, 0, -10),
  vec3.fromValues(2, 2, -10),
]

// 2D image points coordinates
const [x1, x2, x3, x4] = [
  vec3.fromValues(640, 360, 1),
  vec3.fromValues(640, 0, 1),
  vec3.fromValues(1280, 360, 1),
  vec3.fromValues(1280, 0, 1),
]

export function solveP3P_Grunert(X1, X2, X3, x1, x2, x3, K_inv) {
  // 2D image plane coordinates - 2D image points un-projected from the sensor back to image plane
  const [cx1, cx2, cx3] = [
    vec3.transformMat3(vec3.create(), x1, K_inv),
    vec3.transformMat3(vec3.create(), x2, K_inv),
    vec3.transformMat3(vec3.create(), x3, K_inv),
  ]
  console.log('xi', [x1,x2,x3])//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))
  console.log('cxi', [cx1,cx2,cx3])//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))
    
  const [ray1, ray2, ray3] = [
    vec3.normalize(vec3.create(), cx1),
    vec3.normalize(vec3.create(), cx2),
    vec3.normalize(vec3.create(), cx3),
  ]
  console.log('rays', [ray1, ray2, ray3])

  const [a, b, c] = [
    vec3.dist(X2, X3), 
    vec3.dist(X1, X3), 
    vec3.dist(X1, X2),
  ]
  
  const [alpha, beta, gamma] = [
    vec3.angle(ray2, ray3),
    vec3.angle(ray1, ray3),
    vec3.angle(ray1, ray2),
  ]
  console.log('angles', [alpha, beta, gamma])

  const [cosAlpha, cosBeta, cosGamma] = [
    Math.cos(alpha),
    Math.cos(beta),
    Math.cos(gamma),
  ]
  
  const a2mc2b2 = (a**2 - c**2) / b**2
  const a2pc2b2 = (a**2 + c**2) / b**2
  const [A4, A3, A2, A1, A0] = [
    (a2mc2b2 - 1)**2 - (4*c**2/b**2) * cosAlpha**2,
    4 * (a2mc2b2 * (1 - a2mc2b2) * cosBeta - (1 - a2pc2b2) * cosAlpha * cosGamma + 2 * (c**2/b**2) * cosAlpha**2 * cosBeta),
    2 * (a2mc2b2**2 - 1 + 2*a2mc2b2**2 * cosBeta**2 + 2 * ((b**2 - c**2) / b**2) * cosAlpha**2 - 4*a2pc2b2*cosAlpha*cosBeta*cosGamma + 2 * ((b**2 - a**2) / b**2) * cosGamma**2),
    4 * (-a2mc2b2 * (1 + a2mc2b2) * cosBeta + 2*a**2/b**2 * cosGamma**2 * cosBeta - (1 - a2pc2b2) * cosAlpha * cosGamma),
    (1 + a2mc2b2)**2 - 4 * a**2/b**2 * cosGamma**2
  ]


  let vs = quartic.solve(A4, A3, A2, A1, A0)
    // .filter(s => s.im === 0 && +s.re !== 0) // because of s3 = v*s1 => s3 distance would be 0 => nonsense ; commenting out - image plane != camera's front wall
    .filter(s => s.im === 0) // only solutions in the domain of real numbers
    .map(s => +s.re)
  vs = [...new Set(vs).values()]

  const results = []

  console.log(`vs=${vs}`)
  if (vs.length === 0) {
    console.log('no real solutions')
  }

  vs.forEach(v => {
    const u = ((-1 * (a**2 - c**2) / b**2) * v**2 - 2 * ((a**2 - c**2) / b**2) * cosBeta * v + 1 + (a**2 - c**2) / b**2) / (2 * cosGamma - v * cosAlpha)
    
    console.log(`--- u=${u} v=${v}`)
    console.log(`a=${a} b=${b} c=${c} cosAlpha=${cosAlpha} cosBeta=${cosBeta} cosGamma=${cosGamma}`)
    
    // const s1 = Math.sqrt(a**2 / (u**2 + v**2 - 2*u*v*cosAlpha))
    const s1 = Math.sqrt(b**2 / (1 + v**2 - 2*v*cosBeta))
    const s2 = Math.abs(u * s1)
    const s3 = Math.abs(v * s1)
  
    console.log(`u=${u} v=${v} -> s1=${s1} s2=${s2} s3=${s3}`)

    const [X01, X02, X03] = [
      vec3.scaleAndAdd(vec3.create(), X1, ray1, s1),
      vec3.scaleAndAdd(vec3.create(), X2, ray2, s2),
      vec3.scaleAndAdd(vec3.create(), X3, ray3, s3),
    ]

    results.push(X01, X02, X03)

    console.log('\nSolutions:', X01, X02, X03)
    // console.log(ray1,ray2, ray3, s1, s2 ,s3)
  })

  return results
}




const X0s1 = solveP3P_Grunert(X1, X2, X3, x1, x2, x3, K_inv)
const X0s2 = solveP3P_Grunert(X1, X2, X4, x1, x2, x4, K_inv)

const X0s = [...X0s1, ...X0s2]
// console.log('!!! zapocitat ohniskovu vzdialenost kamery !!!')

console.log()
console.log()
console.log('X_i', [X1,X2,X3,X4])//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))
console.log('x_i', [x1,x2,x3,x4])//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))
// console.log([cx1,cx2,cx2])//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))
console.log('X0i', X0s.sort())//.map(x => vec3.scale(vec3.create(), x, 1/x[3])))


// group sorted origin candidates
const epsilon = 0.01
const groups = []
X0s.sort().forEach(x0 => {
  for (let i = 0; i < groups.length; i++) {
    if (vec3.dist(x0, groups[i].x0) < epsilon) {
      groups[i].candidates.push(x0);
      return;
    }
  }

  groups.push({
    x0: x0,
    candidates: [x0],
  })
})

// sort candidates by close points
groups.sort((a, b) => b.candidates.length - a.candidates.length)

// calculate average of candidate points near the most probable solution
const results = groups[0].candidates
const result = vec3.create()
for (let i = 0; i < results.length; i++) {
  vec3.add(result, result, results[i])
}
vec3.scale(result, result, 1/results.length)

console.log(`FINAL RESULT: ${result}`)


/*

TODO
- calculate rotation matrix R according to 
- calculate M/P using SVD in the DLT video - maybe even preferrably to grunert

*/



// TODO: schema prekreslit do vektorov - 4 4 mozne konfiguracie (zakladna + otocenie kazdeho z 3 bodov okolo protilahlej hrany)

// const distortion = [
//   0.036998502838994515,
//   -0.13207581435883872,
//   -0.000045055253893522236,
//   -0.007745497656725853,
//   0.11519181871308336
// ]
