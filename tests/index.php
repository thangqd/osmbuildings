<!DOCTYPE html>
<html>
<head>
  <title>OSM Buildings - Acid</title>
  <meta http-equiv="content-type" content="text/html; charset=utf-8">
  <style type="text/css">
  html, body {
    border: 0;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  #map {
    height: 100%;
  }
  </style>
  <link rel="stylesheet" href="leaflet-0.5.1/leaflet.css">
  <script src="leaflet-0.5.1/leaflet-src.js"></script>
  <script src="scripts.js.php?engine=Leaflet"></script>
</head>

<body>
  <div id="map"></div>

  <script>
  var map = new L.Map('map').setView([52.52179, 13.39503], 18); // Berlin Bodemuseum
  new L.TileLayer('black.png', { maxZoom: 20 }).addTo(map);
  var osmb = new OSMBuildings(map).loadData();
  L.control.layers({}, { Buildings: osmb }).addTo(map);
  </script>

</body>
</html>