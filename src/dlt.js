import { SVD } from 'svd-js'


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
  const { u, q } = SVD(M, true, false)

  const minQ = Math.min(...q) // q's are non-negative
  const index = q.lastIndexOf(minQ)

  const h = u.map(u => u[index])

  // tz < 0? => flip
  if (h[11] < 0) {
    h.forEach((_, i) => h[i] *= -1)
  }

  const norm = Math.sqrt(h[8]**2 + h[9]**2 + h[10]**2)
  return h.map(x => x / norm)
}
