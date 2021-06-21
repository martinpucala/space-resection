import * as THREE from 'three'

import { DLT, homography_DLT } from '../dlt.mjs'


function DLT_test() {
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
  
  const x = X.map(X => new THREE.Vector4(...X)
    .applyMatrix4(true_P))
    .map(x => [x.x / x.z, x.y / x.z, 1])
    
  const P = new THREE.Matrix4().set(
    ...DLT(X, x),
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
}

function homography_DLT_test() {
  const true_P = new THREE.Matrix4().set(
    0.7072945483755065, -0.7061704379962989, 0.03252282795827704, -0.1,
    0.7061704379962989, 0.7036809008245869, -0.07846338199958876, 0.1,
    0.03252282795827704, 0.07846338199958876, 0.9963863524490802, 1.2,
    0, 0, 0, 1,
  )

  const L = 0.2
  const wX = [
    [-L, -L, 0, 1],
    [2*L, -L, 0, 1],
    [L, L, 0, 1],
    [-L, L, 0, 1],
  ]

  const oX = wX.map(wX => new THREE.Vector4(...wX)
    .applyMatrix4(true_P))

  const xo = oX.map(oX => [oX.x / oX.z, oX.y / oX.z, 1])
  const xw = wX.map(wX => new THREE.Vector4(...wX)).map(wX => [wX.x, wX.y, 1])

  const P = new THREE.Matrix4().set(
    ...homography_DLT(xw, xo),
    0, 0, 0, 1,
  );

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
}


console.log('\ntrue_P and P should be identical or at least very close\n')
console.log('=== non-planar DLT')
DLT_test()
console.log('=== planar DLT')
homography_DLT_test()
