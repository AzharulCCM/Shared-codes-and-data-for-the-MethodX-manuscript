// Leaf Area Index (LAI) calculation from Landsat 8 and 5 via Google EArth Engine API

/// GEE link to run the code directly via GEE
https://code.earthengine.google.com/0779b8ae2afd82cbab6249232354f0ec

// -------------------- Weather Station Buffers --------------------
var weatherStBLO = ee.Geometry.Point([-0.125848, 51.522287]);
var weatherStBX = ee.Geometry.Point([0.15891449, 51.49061]);
var weatherStGR4 = ee.Geometry.Point([0.070766, 51.45258]);

var buffers = ee.FeatureCollection([
  ee.Feature(weatherStBLO.buffer(1000), {name: "W_S_bufBLO"}),
  ee.Feature(weatherStBX.buffer(1000), {name: "W_S_bufBX"}),
  ee.Feature(weatherStGR4.buffer(1000), {name: "W_S_bufGR4"})
]);

Map.addLayer(buffers, {color: 'white'}, 'Weather Station Buffers');

// -------------------- Load and Preprocess Landsat 8 C2 L2 --------------------
var applyScale = function(image) {
  return image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5'])
              .multiply(0.0000275).add(-0.2)
              .copyProperties(image, image.propertyNames());
};

var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterDate('2019-05-01', '2019-08-31')
  .filterBounds(buffers.geometry())
  .filter(ee.Filter.lt('CLOUD_COVER', 12))
  .map(applyScale);

var meanImage = l8.mean();

// -------------------- NDWI Masking --------------------
var ndwi = meanImage.normalizedDifference(['SR_B3', 'SR_B5']);
var landOnly = meanImage.updateMask(ndwi.lte(0));

// -------------------- LAI via EVI --------------------
// Calculate EVI using bands: NIR (SR_B5), RED (SR_B4), BLUE (SR_B2)
var evi = landOnly.expression(
  '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
  {
    'NIR': landOnly.select('SR_B5'),
    'RED': landOnly.select('SR_B4'),
    'BLUE': landOnly.select('SR_B2')
  }
).rename('EVI');

// Apply the empirical LAI formula from Boegh et al. (2002)
var lai = evi.multiply(3.618).subtract(0.118).rename('LAI');

// -------------------- Visualization --------------------
Map.centerObject(buffers, 20);

Map.addLayer(landOnly.clip(buffers), {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.3
}, 'Landsat RGB (Scaled)');

Map.addLayer(lai.clip(buffers), {
  min: 0, max: 3, palette: ['red', 'yellow', 'green']
}, 'LAI (EVI-based)');

// -------------------- Compute and Export Mean LAI --------------------
var laiMean = lai.reduceRegions({
  collection: buffers,
  reducer: ee.Reducer.mean(),
  scale: 30
});

// Print mean LAI values per buffer in the console
laiMean.evaluate(function(result) {
  print('Mean LAI by weather station for 2019', result.features.map(function(f) {
    return {
      name: f.properties.name,
      LAI_mean: f.properties.mean
    };
  }));
});

Export.table.toDrive({
  collection: laiMean,
  description: 'mean_LAI_by_station_EVI',
  folder: 'GEE_exports',
  fileNamePrefix: 'mean_LAI_by_station_EVI',
  fileFormat: 'CSV',
  selectors: ['name', 'mean']
});



// -------------------- Export LAI Map as GeoTIFF --------------------
/*Export.image.toDrive({
  image: lai.clip(buffers),
  description: 'LAI_Map_2020_EVIbased',
  folder: 'GEE_exports',  // Optional: change this to your desired Drive folder
  fileNamePrefix: 'LAI_2020_EVI',
  region: buffers.geometry(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'  // UTM Zone 30N — good for London
});*/


// -------------------- Export LAI TIFF for W_S_bufBLO --------------------
Export.image.toDrive({
  image: lai.clip(weatherStBLO.buffer(1000)),
  description: 'LAI_L8_EVI_2020_BLO',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2020_EVI_Landsat8_BLO',
  region: weatherStBLO.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});

// -------------------- Export LAI TIFF for W_S_bufBX --------------------
Export.image.toDrive({
  image: lai.clip(weatherStBX.buffer(1000)),
  description: 'LAI_L8_EVI_2020_BX',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2020_EVI_Landsat8_BX',
  region: weatherStBX.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});

// -------------------- Export LAI TIFF for W_S_bufGR4 --------------------
Export.image.toDrive({
  image: lai.clip(weatherStGR4.buffer(1000)),
  description: 'LAI_L8_EVI_2020_GR4',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2020_EVI_Landsat8_GR4',
  region: weatherStGR4.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});


// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px', backgroundColor: 'white'}});

legend.add(ui.Label('Leaf Area Index (EVI-based)', {fontWeight: 'bold', color: 'green'}));

var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply(3.0 / 100).add(0);
var legendImage = gradient.visualize({min: 0, max: 3, palette: ['red', 'yellow', 'green']});
var thumbnail = ui.Thumbnail({
  image: legendImage,
  params: {bbox: '0,0,10,100', dimensions: '10x200'},
  style: {position: 'bottom-center'}
});

legend.add(ui.Label('3.0'));
legend.add(thumbnail);
legend.add(ui.Label('0.0'));

Map.add(legend);


/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////
/// LAI calculation from Landsat 5

// -------------------- Weather Station Buffers --------------------
/*var weatherStBLO = ee.Geometry.Point([-0.125848, 51.522287]);
var weatherStBX = ee.Geometry.Point([0.15891449, 51.49061]);
var weatherStGR4 = ee.Geometry.Point([0.070766, 51.45258]);

var buffers = ee.FeatureCollection([
  ee.Feature(weatherStBLO.buffer(1000), {name: "W_S_bufBLO"}),
  ee.Feature(weatherStBX.buffer(1000), {name: "W_S_bufBX"}),
  ee.Feature(weatherStGR4.buffer(1000), {name: "W_S_bufGR4"})
]);

Map.addLayer(buffers, {color: 'white'}, 'Weather Station Buffers');

// -------------------- Load and Preprocess Landsat 5 C2 L2 --------------------
var applyScale = function(image) {
  return image.select(['SR_B1', 'SR_B3', 'SR_B4'])  // Blue, Red, NIR
              .multiply(0.0000275).add(-0.2)
              .copyProperties(image, image.propertyNames());
};

var l5 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2")
  .filterDate('2000-05-01', '2000-08-31')  // 
  .filterBounds(buffers.geometry())
  .filter(ee.Filter.lt('CLOUD_COVER', 10))
  .map(applyScale);

var meanImage = l5.mean();

// -------------------- NDWI Masking --------------------
var ndwi = meanImage.normalizedDifference(['SR_B3', 'SR_B4']);
var landOnly = meanImage.updateMask(ndwi.lte(0));

// -------------------- LAI via EVI --------------------
// Calculate EVI using bands: NIR (SR_B4), RED (SR_B3), BLUE (SR_B1)
var evi = landOnly.expression(
  '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
  {
    'NIR': landOnly.select('SR_B4'),
    'RED': landOnly.select('SR_B3'),
    'BLUE': landOnly.select('SR_B1')
  }
).rename('EVI');

// Apply the empirical LAI formula from Boegh et al. (2002)
var lai = evi.multiply(3.618).subtract(0.118).rename('LAI');

// -------------------- Visualization --------------------
Map.centerObject(buffers, 14);

Map.addLayer(landOnly.clip(buffers), {
  bands: ['SR_B3', 'SR_B1', 'SR_B4'], min: 0, max: 0.3
}, 'Landsat 5 RGB (Scaled)');

Map.addLayer(lai.clip(buffers), {
  min: 0, max: 3, palette: ['red', 'yellow', 'green']
}, 'LAI (EVI-based, Landsat 5, 2000)');

// -------------------- Compute and Export Mean LAI --------------------
var laiMean = lai.reduceRegions({
  collection: buffers,
  reducer: ee.Reducer.mean(),
  scale: 30
});


// Print mean LAI values per buffer in the console
laiMean.evaluate(function(result) {
  print('Mean LAI by weather station for 2000', result.features.map(function(f) {
    return {
      name: f.properties.name,
      LAI_mean: f.properties.mean
    };
  }));
});

// Export to Drive
Export.table.toDrive({
  collection: laiMean,
  description: 'mean_LAI_by_station_L5_EVI_2000',
  folder: 'GEE_exports',
  fileNamePrefix: 'mean_LAI_by_station_L5_EVI_2000',
  fileFormat: 'CSV',
  selectors: ['name', 'mean']
});


// -------------------- Export LAI GeoTIFF for 2000--------------------
//Export.image.toDrive({
 // image: lai.clip(buffers),
  //description: 'LAI_L5_EVI_2000',
  //folder: 'GEE_exports',
  //fileNamePrefix: 'LAI_2000_EVI_Landsat5',
  //region: buffers.geometry(),
  //scale: 30,
  //maxPixels: 1e13,
  //fileFormat: 'GeoTIFF',
  //crs: 'EPSG:32630'  // UTM Zone 30N — good for London
//});

// -------------------- Export LAI TIFF for each buffer separately --------------------

// Export for W_S_bufBLO
Export.image.toDrive({
  image: lai.clip(weatherStBLO.buffer(1000)),
  description: 'LAI_L5_EVI_2000_BLO',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2000_EVI_Landsat5_BLO',
  region: weatherStBLO.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});

// Export for W_S_bufBX
Export.image.toDrive({
  image: lai.clip(weatherStBX.buffer(1000)),
  description: 'LAI_L5_EVI_2000_BX',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2000_EVI_Landsat5_BX',
  region: weatherStBX.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});

// Export for W_S_bufGR4
Export.image.toDrive({
  image: lai.clip(weatherStGR4.buffer(1000)),
  description: 'LAI_L5_EVI_2000_GR4',
  folder: 'GEE_exports',
  fileNamePrefix: 'LAI_2000_EVI_Landsat5_GR4',
  region: weatherStGR4.buffer(1000).bounds(),
  scale: 30,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  crs: 'EPSG:32630'
});


// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px', backgroundColor: 'white'}});
legend.add(ui.Label('Leaf Area Index (EVI-based)', {fontWeight: 'bold', color: 'green'}));

var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply(3.0 / 100).add(0);
var legendImage = gradient.visualize({min: 0, max: 3, palette: ['red', 'yellow', 'green']});
var thumbnail = ui.Thumbnail({
  image: legendImage,
  params: {bbox: '0,0,10,100', dimensions: '10x200'},
  style: {position: 'bottom-center'}
});

legend.add(ui.Label('3.0'));
legend.add(thumbnail);
legend.add(ui.Label('0.0'));

Map.add(legend);*/