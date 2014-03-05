var Interaction = {

  click: function(e) {
    var target = this.getTarget(e);
    console.log(e, target);
  },

//  cylinder: function(c, r, h, mh) {
//    var
//      _c = this.project(c.x, c.y, h),
//      a1, a2;
//
//    if (mh) {
//      c = this.project(c.x, c.y, mh);
//    }
//
//    var t = getTangents(c, r, _c, r); // common tangents for ground and roof circle
//
//    // no tangents? roof overlaps everything near cam position
//    if (t) {
//      a1 = atan2(t[0].y1-c.y, t[0].x1-c.x);
//      a2 = atan2(t[1].y1-c.y, t[1].x1-c.x);
//
//      Buildings.context.moveTo(t[1].x2, t[1].y2);
//      Buildings.context.arc(_c.x, _c.y, r, a2, a1);
//      Buildings.context.arc( c.x,  c.y, r, a1, a2);
//    }
//  },

  getTarget: function(pos) {
    // show on high zoom levels only and avoid rendering during zoom
    if (zoom < minZoom || isZooming) {
      return;
    }

    var i, il, j, jl, k, kl,
      item,
      f, h, mh,
      _h, _mh,
      x, y,
      footprint,
      mode, shape,
      isVisible,
      ax, ay, bx, by,
      a, b, _a, _b,
      specialItems = [],
      dataItems = Data.items;

    Buildings.context.strokeStyle = '#ff0000';

    for (i = 0, il = dataItems.length; i < il; i++) {
      item = dataItems[i];

      isVisible = false;
      f = item.footprint;
      footprint = [];
      for (j = 0, jl = f.length - 1; j < jl; j += 2) {
        footprint[j]   = x = f[j]  -originX;
        footprint[j+1] = y = f[j+1]-originY;

        if (!isVisible) {
          isVisible = (x > 0 && x < WIDTH && y > 0 && y < HEIGHT);
        }
      }

      if (!isVisible) {
        continue;
      }

      // when fading in, use a dynamic height
      h = item.scale < 1 ? item.height*item.scale : item.height;
      // precalculating projection height factor
      _h = camZ / (camZ-h);

      mh = 0;
      _mh = 0;
      if (item.minHeight) {
        mh = item.scale < 1 ? item.minHeight*item.scale : item.minHeight;
        _mh = camZ / (camZ-mh);
      }

      if (item.shape === 'cylinder') {
        if (item.roofShape === 'cylinder') {
//          h += item.roofHeight;
        }
        specialItems.push({
          shape:item.shape,
          center:{ x:item.center.x-originX, y:item.center.y-originY },
          radius:item.radius,
          h:h, mh:mh
        });
        continue;
      }

      Buildings.context.beginPath();

      mode = null;
      shape = [];
      for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
        ax = footprint[j];
        ay = footprint[j+1];
        bx = footprint[j+2];
        by = footprint[j+3];

        _a = Buildings.project(ax, ay, _h);
        _b = Buildings.project(bx, by, _h);

        if (mh) {
          a = Buildings.project(ax, ay, _mh);
          b = Buildings.project(bx, by, _mh);
          ax = a.x;
          ay = a.y;
          bx = b.x;
          by = b.y;
        }

        // mode 0: floor edges, mode 1: roof edges
        if ((bx-ax) * (_a.y-ay) > (_a.x-ax) * (by-ay)) {
          if (mode === 1) {
            shape.push(ax, ay);
          }
          mode = 0;
          if (!j) {
            shape.push(ax, ay);
          }
          shape.push(bx, by);
        } else {
          if (mode === 0) {
            shape.push(_a.x, _a.y);
          }
          mode = 1;
          if (!j) {
            shape.push(_a.x, _a.y);
          }
          shape.push(_b.x, _b.y);
        }
      }

      if (isInside(pos, shape)) {
        return item;
      }
    }

//    for (i = 0, il = specialItems.length; i < il; i++) {
//      item = specialItems[i];
//      if (item.shape === 'cylinder') {
//        this.cylinder(item.center, item.radius, item.h, item.mh);
//      }
//    }
  }
};
