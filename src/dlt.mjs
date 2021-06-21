import { SVD } from 'svd-js'


// based on https://visp-doc.inria.fr/doxygen/camera_localization/tutorial-pose-dlt-opencv.html
export function DLT(X, x) {
  // console.assert(X.length = x.length);

  const M = new Array(12)
    .fill(null)
    .map(_ => new Array(X.length).fill(0));

  X.forEach((_, i) => {
    M[0][2 * i] = X[i][0];
    M[1][2 * i] = X[i][1];
    M[2][2 * i] = X[i][2];
    M[3][2 * i] = 1;
    M[4][2 * i] = 0
    M[5][2 * i] = 0
    M[6][2 * i] = 0
    M[7][2 * i] = 0
    M[8][2 * i] = -x[i][0] * X[i][0];
    M[9][2 * i] = -x[i][0] * X[i][1];
    M[10][2 * i] = -x[i][0] * X[i][2];
    M[11][2 * i] = -x[i][0];
    
    M[0][2 * i + 1] = 0
    M[1][2 * i + 1] = 0
    M[2][2 * i + 1] = 0
    M[3][2 * i + 1] = 0
    M[4][2 * i + 1] = X[i][0];
    M[5][2 * i + 1] = X[i][1];
    M[6][2 * i + 1] = X[i][2];
    M[7][2 * i + 1] = 1;
    M[8][2 * i + 1] = -x[i][1] * X[i][0];
    M[9][2 * i + 1] = -x[i][1] * X[i][1];
    M[10][2 * i + 1] = -x[i][1] * X[i][2];
    M[11][2 * i + 1] = -x[i][1];
  })
  
  // for some reason it seems u and v are switched(?)
  const { u, q } = SVD(M, true, false);

  const minQ = Math.min(...q); // q's are non-negative
  const index = q.lastIndexOf(minQ);

  const h = u.map(u => u[index]);

  // tz < 0? => flip
  if (h[11] < 0) {
    h.forEach((_, i) => h[i] *= -1);
  }

  const norm = Math.sqrt(h[8]**2 + h[9]**2 + h[10]**2);

  return h.map(x => x / norm);
}

// based on https://visp-doc.inria.fr/doxygen/camera_localization/tutorial-pose-dlt-planar-opencv.html
export function homography_DLT(x1, x2) {
  // console.assert(x1.length = x2.length);
  const n = x1.length;

  const M = new Array(9)
    .fill(null)
    .map(_ => new Array(2 * n + 1).fill(0));

  // 3rd line of M is a linear combination of the first two => no need to implement the 3rd line
  x1.forEach((_, i) => {
    M[3][2 * i] = -x1[i][0];
    M[4][2 * i] = -x1[i][1];
    M[5][2 * i] = -1
    M[6][2 * i] = x2[i][1] * x1[i][0];
    M[7][2 * i] = x2[i][1] * x1[i][1];
    M[8][2 * i] = x2[i][1];
    
    M[0][2 * i + 1] = x1[i][0];
    M[1][2 * i + 1] = x1[i][1];
    M[2][2 * i + 1] = 1;
    M[6][2 * i + 1] = -x2[i][0] * x1[i][0];
    M[7][2 * i + 1] = -x2[i][0] * x1[i][1];
    M[8][2 * i + 1] = -x2[i][0];
  });
  
  // for some reason it seems u and v are switched(?)
  const { u, q } = SVD(M, true, false);

  const minQ = Math.min(...q) // q's are non-negative
  const index = q.lastIndexOf(minQ);

  let h = u.map(u => u[index]);

  // tz < 0? => flip
  if (h[11] < 0) {
    h.map(x => x *= -1);
  }
  
  const _2H1 = [
    h[0], h[1], h[2],
    h[3], h[4], h[5],
    h[6], h[7], h[8],
  ]

  const norm = Math.sqrt(h[0]**2 + h[3]**2 + h[6]**2);

  h = h.map(x => x / norm);

  const c1 = [h[0], h[3], h[6]]
  const c2 = [h[1], h[4], h[7]]
  // c1 x c2
  const c3 = [
    c1[1] * c2[2] - c1[2] * c2[1],
    c1[2] * c2[0] - c1[0] * c2[2],
    c1[0] * c2[1] - c1[1] * c2[0],
  ]

  return [
    c1[0], c2[0], c3[0], h[2],
    c1[1], c2[1], c3[1], h[5],
    c1[2], c2[2], c3[2], h[8],
  ]
}
