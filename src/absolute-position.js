import { solve } from 'linear-solve'


export function absolutePosition(X1, X2, X3, x1, x2, x3) {
  // points from real world space - Z coordinates don't matter
  const [wx1,wy1,wz1, wx2,wy2,wz2, wx3,wy3,wz3] = [...X1, ...X2, ...X3]
  const [cx1,cy1,cz1, cx2,cy2,cz2, cx3,cy3,cz3] = [...x1, ...x2, ...x3]

  const A = [
    [wx1,wy1, 0,  0,   0,0,     1,0,0],
    [0,  0,   wx1,wy1, 0,0,     0,1,0],
    [0,  0,   0,  0,   wx1,wy1, 0,0,1],
    [wx2,wy2, 0,  0,   0,0,     1,0,0],
    [0,  0,   wx2,wy2, 0,0,     0,1,0],
    [0,  0,   0,  0,   wx2,wy2, 0,0,1],
    [wx3,wy3, 0,  0,   0,0,     1,0,0],
    [0,  0,   wx3,wy3, 0,0,     0,1,0],
    [0,  0,   0,  0,   wx3,wy3, 0,0,1],
  ]
  const b = [cx1,cy1,cz1, cx2,cy2,cz2, cx3,cy3,cz3]  
  const [ r11, r12, r21, r22, r31, r32, tx, ty, tz ] = solve(A, b)

  // compute 3rd column
  const r13 = r21 * r32 - r22 * r31 // Haralick 1994 has mistake here and states r33 instead of r31 as it is correctly in Ganapathy 1984
  const r23 = r12 * r31 - r11 * r32
  const r33 = r11 * r22 - r12 * r21

  return [
    [r11, r12, r13, tx],
    [r21, r22, r23, ty],
    [r31, r32, r33, tz],
    [0,   0,   0,   1],
  ]
}
