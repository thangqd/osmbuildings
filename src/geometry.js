function getDistance(p1, p2) {
  var dx = p1.x-p2.x,
    dy = p1.y-p2.y;
  return dx*dx + dy*dy;
}

function getSquareSegmentDistance(px, py, p1x, p1y, p2x, p2y) {
  var dx = p2x-p1x, dy = p2y-p1y,
    t;
  if (dx !== 0 || dy !== 0) {
    t = ((px-p1x) * dx + (py-p1y) * dy) / (dx*dx + dy*dy);
    if (t > 1) {
      p1x = p2x;
      p1y = p2y;
    } else if (t > 0) {
      p1x += dx*t;
      p1y += dy*t;
    }
  }
  dx = px-p1x;
  dy = py-p1y;
  return dx*dx + dy*dy;
}

function simplifyPolygon(buffer) {
  var sqTolerance = 2,
    len = buffer.length/2,
    markers = new Uint8Array(len),

    first = 0, last = len-1,

    i,
    maxSqDist,
    sqDist,
    index,
    firstStack = [], lastStack  = [],
    newBuffer  = [];

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;
    for (i = first+1; i < last; i++) {
      sqDist = getSquareSegmentDistance(
        buffer[i    *2], buffer[i    *2 + 1],
        buffer[first*2], buffer[first*2 + 1],
        buffer[last *2], buffer[last *2 + 1]
      );
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;

      firstStack.push(first);
      lastStack.push(index);

      firstStack.push(index);
      lastStack.push(last);
    }

    first = firstStack.pop();
    last = lastStack.pop();
  }

  for (i = 0; i < len; i++) {
    if (markers[i]) {
      newBuffer.push(buffer[i*2], buffer[i*2 + 1]);
    }
  }

  return newBuffer;
}

function getCenter(poly) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0, il = poly.length-3; i < il; i += 2) {
    minX = min(minX, poly[i]);
    maxX = max(maxX, poly[i]);
    minY = min(minY, poly[i+1]);
    maxY = max(maxY, poly[i+1]);
  }
  return { x:minX+(maxX-minX)/2 <<0, y:minY+(maxY-minY)/2 <<0 };
}

// http://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Tangents_between_two_circles
function getTangents(c1, r1, c2, r2) {
  var dx = c1.x-c2.x,
    dy = c1.y-c2.y,
    dr = r1-r2,
    sqdist = (dx*dx) + (dy*dy);

  if (sqdist <= dr*dr) {
    return;
  }

  var dist = sqrt(sqdist),
    vx = -dx/dist,
    vy = -dy/dist,
    c  =  dr/dist,
    res = [],
    h, nx, ny;

  // Let A, B be the centers, and C, D be points at which the tangent
  // touches first and second circle, and n be the normal vector to it.
  //
  // We have the system:
  //   n * n = 1    (n is a unit vector)
  //   C = A + r1 * n
  //   D = B + r2 * n
  //   n * CD = 0   (common orthogonality)
  //
  // n * CD = n * (AB + r2*n - r1*n) = AB*n - (r1 -/+ r2) = 0,  <=>
  // AB * n = (r1 -/+ r2), <=>
  // v * n = (r1 -/+ r2) / d,  where v = AB/|AB| = AB/d
  // This is a linear equation in unknown vector n.
  // Now we're just intersecting a line with a circle: v*n=c, n*n=1

  h = sqrt(max(0, 1 - c*c));
  for (var sign = 1; sign >= -1; sign -= 2) {
    nx = vx*c - sign*h*vy;
    ny = vy*c + sign*h*vx;
    res.push({
      x1: c1.x + r1*nx <<0,
      y1: c1.y + r1*ny <<0,
      x2: c2.x + r2*nx <<0,
      y2: c2.y + r2*ny <<0
    });
  }

  return res;
}

function getCenterAndBbox(buffer) {
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0, il = buffer.length-3; i < il; i += 2) {
    minX = min(minX, buffer[i]);
    maxX = max(maxX, buffer[i]);
    minY = min(minY, buffer[i+1]);
    maxY = max(maxY, buffer[i+1]);
  }
  return {
    center:{ x:minX+(maxX-minX)/2 <<0, y:minY+(maxY-minY)/2 <<0 },
    bbox:{ minX:minX, maxX:maxX, minY:minY, maxY:maxY }
  }
}

function bboxIntersects(a, b) {
  return (a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY);
}

function unionClose(a, b, tolerance) {
  var bufferA = a.footprint.slice(0,-2),
    bufferB = b.footprint.slice(0,-2);

  // TODO: adjust small differences
  if (a.wallColor !== b.wallColor || a.roofColor !== b.roofColor) {
//    return;
  }

  // TODO: adjust small differences
  if (Math.abs(a.height-b.height) > 3 || a.minHeight !== b.minHeight) {
    return;
  }

  var i, il, j, jl,
    dx, dy,
    offA, offB,
    endA, endB;

  for (i = 0, il = bufferA.length; i < il; i+=2) {
    for (j = 0, jl = bufferB.length; j < jl; j+=2) {
      dx = bufferA[i]  -bufferB[j];
      dy = bufferA[i+1]-bufferB[j+1];
      if (dx*dx + dy*dy <= tolerance) {
        if (endA === undefined) {
          endA = i;
          offB = j;
          break; // do not allow further connections from this point A
        }
        if (endB === undefined || endB !== j) {
          endB = j;
          offA = i;
        }
      }
    }
  }

  if (endA === undefined || endB === undefined) {
    return;
  }

  var resBuffer = [];
  for (i = 0; i <= bufferA.length - (offA-endA); i+=2) {
    j = (i+offA) % bufferA.length;
    resBuffer.push(bufferA[j], bufferA[j+1]);
  }
  for (i = 0; i <= bufferB.length - (offB-endB); i+=2) {
    j = (i+offB) % bufferB.length;
    resBuffer.push(bufferB[j], bufferB[j+1]);
  }

  resBuffer.push(resBuffer[0], resBuffer[1]);
//  a.footprint = simplifyPolygon(resBuffer);
  a.footprint = resBuffer;

  // TODO: holes need to be merged too!
//  if (b.holes) {
//    a.holes = a.holes ? a.holes.concat(b.holes) : b.holes;
//  }

delete a.holes;

  var cb = getCenterAndBbox(a.footprint);
  a.center = cb.center;
  a.bbox   = cb.bbox;

  b = null;

  a.roofColor = '#ffcc00';
  return true;
}

/*
var fpA = [
   0, 0,
   0,10,
  10,10,
  10, 0,
   0, 0
];

var fpB = [
  20, 0,
  20,10,
  30,10,
  30, 0,
  20, 0
];

var a = {
  footprint: fpA,
  wallColor: '#ffffff',
  roofColor: '#ff0000',
  height: 10,
  minHeight: 0
};

var b = {
  footprint: fpB,
  wallColor: '#ffffff',
  roofColor: '#ff0000',
  height: 10,
  minHeight: 0
};

unionClose(a, b, 150);

10,0
0,0
0,10
10,10
20,10
30,10
30,0
20,0
10,0
*/
