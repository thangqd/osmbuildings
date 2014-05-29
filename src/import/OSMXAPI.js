var importOSM = (function() {

  function isBuilding(data) {
    var tags = data.tags;
    return (tags && !tags.landuse &&
      (tags.building || tags['building:part']) && (!tags.layer || tags.layer >= 0));
  }

//  living:'bricks',
//  nonliving:'tar_paper',
//  worship:'copper'

//  function getBuildingType(tags) {
//    if (tags.amenity === 'place_of_worship') {
//      return 'worship';
//    }
//
//    var type = tags.building;
//    if (type === 'yes' || type === 'roof') {
//      type = tags['building:use'];
//    }
//    if (!type) {
//      type = tags.amenity;
//    }
//
//    switch (type) {
//      case 'apartments':
//      case 'house':
//      case 'residential':
//      case 'hut':
//        return 'living';
//      case 'church':
//        return 'worship';
//    }
//
//    return 'nonliving';
//  }

  function getRelationWays(members) {
    var m, outer, inner = [];
    for (var i = 0, il = members.length; i < il; i++) {
      m = members[i];
      if (m.type !== 'way' || !_ways[m.ref]) {
        continue;
      }
      if (!m.role || m.role === 'outer') {
        outer = _ways[m.ref];
        continue;
      }
      if (m.role === 'inner' || m.role === 'enclave') {
        inner.push(_ways[m.ref]);
        continue;
      }
    }

//  if (outer && outer.tags) {
    if (outer) { // allows tags to be attached to relation - instead of outer way
      return { outer:outer, inner:inner };
    }
  }

  function getFootprint(points) {
    if (!points) {
      return;
    }

    var footprint = [], p;
    for (var i = 0, il = points.length; i < il; i++) {
      p = _nodes[ points[i] ];
      footprint.push(p[0], p[1]);
    }

    // do not close polygon yet
    if (footprint[footprint.length-2] !== footprint[0] && footprint[footprint.length-1] !== footprint[1]) {
      footprint.push(footprint[0], footprint[1]);
    }

    // can't span a polygon with just 2 points (+ start & end)
    if (footprint.length < 8) {
      return;
    }

    return footprint;
  }

  function mergeItems(dst, src) {
    for (var p in src) {
      if (src.hasOwnProperty(p)) {
        dst[p] = src[p];
      }
    }
    return dst;
  }

  function filterItem(item, footprint) {
    var res = Import.alignProperties(item.tags);

    if (item.id) {
      res.id = item.id;
    }

    if (footprint) {
      res.footprint = Import.makeWinding(footprint, Import.clockwise);
    }

    if (res.shape === 'cone' || res.shape === 'cylinder') {
      res.radius = Import.getRadius(res.footprint);
    }

    return res;
  }

  function processNode(node) {
    _nodes[node.id] = [node.lat, node.lon];
  }

  function processWay(way) {
    if (isBuilding(way)) {
      var item, footprint;
      if ((footprint = getFootprint(way.nodes)) && _callback(way) !== false) {
        item = filterItem(way, footprint);
        _res.push(item);
      }
      return;
    }

    var tags = way.tags;
    if (!tags || (!tags.highway && !tags.railway && !tags.landuse)) { // TODO: add more filters
      _ways[way.id] = way;
    }
  }

  function processRelation(relation) {
    var relationWays, outerWay, holes = [],
      item, relItem, outerFootprint, innerFootprint;
    if (!isBuilding(relation) ||
      (relation.tags.type !== 'multipolygon' && relation.tags.type !== 'building') ||
      _callback(relation) === false) {
      return;
    }

    if ((relationWays = getRelationWays(relation.members))) {
      relItem = filterItem(relation);
      if ((outerWay = relationWays.outer)) {
        if ((outerFootprint = getFootprint(outerWay.nodes)) && _callback(outerWay) !== false) {
          item = filterItem(outerWay, outerFootprint);
          for (var i = 0, il = relationWays.inner.length; i < il; i++) {
            if ((innerFootprint = getFootprint(relationWays.inner[i].nodes))) {
              holes.push(Import.makeWinding(innerFootprint, Import.counterClockwise));
            }
          }
          if (holes.length) {
            item.holes = holes;
          }
          _res.push(mergeItems(item, relItem));
        }
      }
    }
  }

  var _nodes, _ways, _res, _callback;

  return function(data, callback) {
    _nodes = {};
    _ways = {};
    _res = [];
    _callback = callback;

    var item;
    for (var i = 0, il = data.length; i < il; i++) {
      item = data[i];
      switch(item.type ) {
        case 'node':     processNode(item);     break;
        case 'way':      processWay(item);      break;
        case 'relation': processRelation(item); break;
      }
    }
    return _res;
  };
})();
