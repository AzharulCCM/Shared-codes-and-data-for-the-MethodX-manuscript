//LULC in sample sites in Hong Kong

// Weather Stations of Hong Kong
var weatherStHKCW = ee.Geometry.Point([114.143843 , 22.284873]);
var weatherStHKMK = ee.Geometry.Point([114.168657 , 22.322531]);
var weatherStHKTP = ee.Geometry.Point([114.16414 , 22.450977]);

var bufHKCW = weatherStHKCW.buffer({"distance":1000});
var bufHKMK = weatherStHKMK.buffer({"distance":1000});
var bufHKTP = weatherStHKTP.buffer({"distance":1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufHKCW , {name:"bufHKCW"}),
  ee.Feature(bufHKMK , {name:"bufHKMK"}),
  ee.Feature(bufHKTP , {name:"bufHKTP"})
]);

Map.addLayer(weatherStation, {'color': 'blue'}, '1 km buffer around weather stations');
Map.setCenter(114.1575, 22.3611, 10);

// Load Landsat 8 Collection 2 Level-2 SR data
var landsatCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-04-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Scale function
var scaleL8SR = function(image) {
  var optical = image.select(['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'])
      .multiply(0.0000275).add(-0.2)
      .copyProperties(image, image.propertyNames());
  return image.addBands(optical, null, true);
};

landsatCollection = landsatCollection.map(scaleL8SR);
var composite = landsatCollection.median();

Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0.0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image', false);

// Assuming you already have the `greenspace`, `builtin`, `water`, and `fellowland` FeatureCollections
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

// Training setup
var bands = ['SR_B2', 'SR_B3', 'SR_B4', 'SR_B5', 'SR_B6', 'SR_B7'];
var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

var classifier = ee.Classifier.smileRandomForest(10).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

var palette = ['green', 'red', 'blue', 'yellow'];
Map.addLayer(classified.clip(weatherStation), {
  min: 0, max: 3, palette: palette
}, 'Land Use Classification');

Export.image.toDrive({
  image: classified,
  description: "classified_image",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF'
});

// Accuracy Assessment
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// Area Calculation by Class
var clipCity = classified.clip(weatherStation);
var calculateClassArea = function(feature) {
  var areas = ee.Image.pixelArea().addBands(clipCity).reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'landcover'}),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e10
  });
  var classAreas = ee.List(areas.get('groups')).map(function(item) {
    var dict = ee.Dictionary(item);
    var cls = ee.Number(dict.get('landcover')).format();
    var area = ee.Number(dict.get('sum')).divide(1e4);
    return ee.List([cls, area]);
  });
  var result = ee.Dictionary(classAreas.flatten());
  return ee.Feature(feature.geometry(), result.set('Weather Station ID', feature.get('name')));
};

var cityAreas = weatherStation.map(calculateClassArea);
var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weather_Station_2020_summer',
  folder: 'HK_city_LULC',
  fileNamePrefix: 'class_area_by_weather_Station_2020_summer',
  fileFormat: 'CSV',
  selectors: outputFields
});

// Legend UI
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification',
  style: {fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0'}
}));

var makeRow = function(color, name) {
  return ui.Panel({
    widgets: [
      ui.Label({style: {backgroundColor: color, padding: '8px', margin: '0 0 4px 0'}}),
      ui.Label({value: name, style: {margin: '0 0 4px 6px'}})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
};

var legendColors = ['green', 'red', 'blue', 'yellow'];
var legendNames = ['Greenspace', 'Builtin', 'Water', 'Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);



// Export for Central and Western
Export.image.toDrive({
  image: classified.clip(bufHKCW),
  description: "LULC_CentralWestern",
  scale: 30,
  region: bufHKCW,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// Export for Mong Kok
Export.image.toDrive({
  image: classified.clip(bufHKMK),
  description: "LULC_MongKok",
  scale: 30,
  region: bufHKMK,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// Export for Tai Po
Export.image.toDrive({
  image: classified.clip(bufHKTP),
  description: "LULC_TaiPo",
  scale: 30,
  region: bufHKTP,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});


//////// For graphical abstract

// RGB image
Export.image.toDrive({
  image: composite.clip(weatherStation),
  description: "Landsat8_RGB_Composite_2020_Summer",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

///// polygons

Map.addLayer(greenspace, {color: 'green'}, 'Greenspace Training');
Map.addLayer(builtin, {color: 'red'}, 'Builtin Training');
Map.addLayer(water, {color: 'blue'}, 'Water Training');
Map.addLayer(fellowland, {color: 'yellow'}, 'Fellowland Training');


//////
Export.image.toDrive({
  image: composite.visualize({bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0.0, max: 0.3}),
  description: 'Training_Overlay_RGB',
  scale: 30,
  region: weatherStation.geometry(),
  maxPixels: 1e13
});



//////Buffer zone overlay

Export.image.toDrive({
  image: composite.visualize({bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0, max: 0.3})
         .blend(ee.Image().paint(weatherStation, 1, 2)), // overlay buffer boundaries
  description: 'Buffer_Zones_Overlay',
  region: weatherStation.geometry(),
  scale: 30,
  maxPixels: 1e13
});


///// Direct link to the GEE
https://code.earthengine.google.com/821a46babed5e1f50242a8665939a518

