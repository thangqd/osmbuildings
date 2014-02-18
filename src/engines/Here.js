var osmb = function(map) {
  addLayer(map);
};

var proto = osmb.prototype;

var offset = { x:0, y:0 };
var po = { x:0, y:0 };
var canvas;
var map;

function addLayer(_map) {
  map = _map;

  var layer = new nokia.maps.map.provider.Provider({
    min: 0,
    max: 20,
    opacity: 1.0,
    label: 'OSM Buildings',
    getCopyrights: function() {
      return [{ label: ATTRIBUTION }];
    },
    getBoundingBox: function() {
      return new nokia.maps.geo.BoundingBox([90, -180], [-90, 180]);
    }
  });

  map.overlays.add(layer);

  Layers.appendTo(document.querySelector('.nma_p2d_0MapLayer'));
  maxZoom = map.maxZoomLevel;

  var off = _getOffset();
//  po = map.getPixelOrigin();

  setSize({ w:map.width, h:map.height });
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  setZoom(map.zoomLevel);

//  Layers.setPosition(-off.x, -off.y);

  map.addObserver('center', _onMove);
  map.addListener('mapviewchangeend', function(e) {
    _onMoveEnd(e);
    _onZoomEnd(e);
  });

  map.addListener('resizeend', _onResize);

//  map.addListener('zoomstart', _onZoomStart);
//  map.addListener('resize',    _onResize);
//  map.addListener('viewreset', _onViewReset);

  Data.update();
}

function _onMove(e) {
  if (!canvas) {
    return;
  }
//  var context = canvas.getContext('2d');
//  canvas.width = 500;
//  canvas.height = 500;
//  context.fillStyle = 'rgb(240,200,0)';
//  context.fillRect (0, 0, canvas.width, canvas.height);

  var off = _getOffset();
  setCamOffset({ x:offset.x-off.x, y:offset.y-off.y });
  Buildings.render();
}

function _onMoveEnd(e) {
  var off = _getOffset();
//  po = map.getPixelOrigin();
  offset = off;
  Layers.setPosition(-off.x, -off.y);
  setCamOffset({ x:0, y:0 });

  setSize({ w:map.width, h:map.height }); // in case this is triggered by resize
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onMoveEnd(e);
}

function _onZoomEnd(e) {
  var off = _getOffset();
//  po = map.getPixelOrigin();
  setOrigin({ x:po.x-off.x, y:po.y-off.y });
  onZoomEnd({ zoom:map.zoomLevel });
}

function _onResize() {}

function _onViewReset() {
  var off = _getOffset();
  offset = off;
  Layers.setPosition(-off.x, -off.y);
  setCamOffset({ x:0, y:0 });
}

function _getOffset() {
//  return L.DomUtil.getPosition(map._mapPane);
return offset;
}

// map.addListener('displayready', function() {});
// map.addObserver('zoomLevel', function(type, args) {});




function Adapter(map) {
  var ATTRIBUTION = 'TEST';

  var layer = new nokia.maps.map.provider.Provider({
    min: 14,
    max: 20,
    opacity: 1.0,
    label: ATTRIBUTION,
    getCopyrights: function() {
      return [{ label: ATTRIBUTION }];
    },
    getBoundingBox: function() {
      var bbox = new nokia.maps.geo.BoundingBox([90, -180], [-90, 180]);
      return bbox;
    }
  });
  map.overlays.add(layer);

//! map.maxZoomLevel
//! map.width
//! map.height
//! map.zoomLevel
//! map.addListener('resizeend', function() {})

  document.querySelector('.nma_p2d_0MapLayer').appendChild(canvas);

  map.addListener('mapviewchangestart', function() {
    console.log('START');
    onMoveStart();
  });

  //map.addListener('mapviewchange', eventLog); // MOVE + ZOOM

  var isZoom = false;
  map.addObserver('center', function(e, type, newValue, oldValue) {
    if (!isZoom && (newValue.latitude !== oldValue.latitude ||
newValue.longitude !== oldValue.longitude)) {
      console.log('MOVE', newValue, oldValue);
      onMove();
    }
  });

  map.addObserver('zoomLevel', function(e, type, newValue, oldValue) {
    if (!isZoom) {
      isZoom = true;
      onZoomStart();
    }
    console.log('ZOOM', newValue, oldValue);
  });

  map.addListener('mapviewchangeend', function() {
    console.log('END');
    if (isZoom) {
      isZoom = false;
      onZoomEnd();
    } else {
      onMoveEnd();
    }
  });

  map.addListener('resizeend', eventLog);
}

