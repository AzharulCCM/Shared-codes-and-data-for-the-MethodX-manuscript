
// #################################
//London LULC with Landsat 8 
// #################################

//GEE link to direct acces of the code with GEE API consule
https://code.earthengine.google.com/b9173dc6062a3a8eefb918f22ae95e30

// Note: Importantly, this code must need training data in geometry inports section to get LULC within the selected sample buffer sites
// -------------------- Weather Stations of London --------------------
var weatherStBL0 = ee.Geometry.Point([-0.125848, 51.522287]);
var weatherStBX2 = ee.Geometry.Point([0.158914494, 51.49061021]);
var weatherStGR4 = ee.Geometry.Point([0.070766, 51.45258]);

var bufBL0 = weatherStBL0.buffer(1000);
var bufBX2 = weatherStBX2.buffer(1000);
var bufGR4 = weatherStGR4.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufBL0, {name:"Weather Station bufBL0"}),
  ee.Feature(bufBX2, {name:"Weather Station bufBX2"}),
  ee.Feature(bufGR4, {name:"Weather Station bufGR4"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(0.1589, 51.4906, 11);

// -------------------- Landsat 8 Collection 2 (2020 summer) --------------------
var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-04-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Apply scaling factors for surface reflectance
function scaleL8SR(image) {
  var opticalBands = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
      .multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true);
}

var landsat8Scaled = landsat8.map(scaleL8SR);
var composite = landsat8Scaled.median();

// -------------------- Visualization --------------------
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'],
  min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image (2020)', false);

// -------------------- Training Data --------------------
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

var bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Train/test split
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

// -------------------- Classification --------------------
var classifier = ee.Classifier.smileRandomForest(50).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

// -------------------- Display Classified Map --------------------
var palette = ['#06d608','#ff3905','#0843d8','#ffcfc2'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification 2020');

// -------------------- Export Classified Image --------------------
Export.image.toDrive({
  image: classified,
  description: "London_L8_Classified_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// -------------------- Accuracy Assessment --------------------
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// -------------------- Area Calculation --------------------
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
    var area = ee.Number(dict.get('sum')).divide(1e4); // ha
    return ee.List([cls, area]);
  });
  var result = ee.Dictionary(classAreas.flatten());
  return ee.Feature(feature.geometry(), result.set('Weather Station ID', feature.get('name')));
};

var cityAreas = weatherStation.map(calculateClassArea);
print(cityAreas, "London city areas (2020)");

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weatherStation_London_2020',
  folder: 'London_city_LULC',
  fileNamePrefix: 'class_area_by_weatherStation_London_2020',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification (2020)',
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

var legendColors = ['#06d608','#ff3905','#0843d8','#ffcfc2'];
var legendNames = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);





// #################################
//London LULC with Landsat 5
// #################################
//GEE link to direct acces of the code with GEE API consule
https://code.earthengine.google.com/ba2758f6aa00270ca9901043ec595197


// ---------------------------
// Weather stations in London
// ---------------------------
var weatherStBL0 = ee.Geometry.Point([-0.125848 , 51.522287]);
var weatherStBX2 = ee.Geometry.Point([0.158914494 , 51.49061021]);
var weatherStGR4 = ee.Geometry.Point([0.070766 , 51.45258]);

// Create 1 km buffers
var bufBL0 = weatherStBL0.buffer(1000);
var bufBX2 = weatherStBX2.buffer(1000);
var bufGR4 = weatherStGR4.buffer(1000);

// Combine buffers into FeatureCollection
var weatherStation = ee.FeatureCollection([
  ee.Feature(bufBL0,{name:"Weather Station BL0"}),
  ee.Feature(bufBX2,{name:"Weather Station BX2"}),
  ee.Feature(bufGR4,{name:"Weather Station GR4"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(0.158914494, 51.49061021, 11);

// -------------------------------------------
// Load Landsat 5 Collection 2, Level 2 SR data
// -------------------------------------------
var landsatCollection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
  .filterDate('2000-04-01', '2000-08-31')
  .filterBounds(weatherStation);

// Scale surface reflectance
function scaleL5(image) {
  var opticalBands = image.select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'])
      .multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true);
}
var landsatScaled = landsatCollection.map(scaleL5);

// Create median composite
var composite = landsatScaled.median();

// Visualization
Map.addLayer(
  composite.clip(weatherStation),
  {bands: ['SR_B3', 'SR_B2', 'SR_B1'], min: 0, max: 0.3, gamma: 1.5},
  'Landsat 5 RGB Composite'
);

// -------------------------------------------
// Training Data
// -------------------------------------------
// Replace with your own feature sets
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'Merged training features');

var bands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn(); // Add random column for splitting

// Split 80% training, 20% testing
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

// Train Random Forest classifier
var classifier = ee.Classifier.smileRandomForest(10).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

// Classify composite
var classified = composite.select(bands).classify(classifier);

// -------------------------------------------
// Display classification
// -------------------------------------------
var palette = ['green','red','blue','yellow'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification');

// Export classified image
Export.image.toDrive({
  image: classified,
  description: "classified_L5_2000_summer",
  scale: 30,
  region: weatherStation.geometry().bounds(),
  maxPixels: 1e13
});

// -------------------------------------------
// Accuracy Assessment
// -------------------------------------------

// Training confusion matrix
var trainConfMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', trainConfMatrix);
print('Training Overall Accuracy:', trainConfMatrix.accuracy());
print('Training Kappa:', trainConfMatrix.kappa());

// Validate on testing set
var validation = testingSet.classify(classifier);
var testConfMatrix = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testConfMatrix);
print('Validation Overall Accuracy:', testConfMatrix.accuracy());
print('Validation Kappa:', testConfMatrix.kappa());

// -------------------------------------------
// Area calculation per class around each station
// -------------------------------------------
var clipCity = classified.clip(weatherStation);

var calculateClassArea = function(feature) {
  var areas = ee.Image.pixelArea().addBands(clipCity).reduceRegion({
    reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'landcover'}),
    geometry: feature.geometry(),
    scale: 30,
    maxPixels: 1e13
  });
  var classAreas = ee.List(areas.get('groups'));
  var classAreaLists = classAreas.map(function(item) {
    var areaDict = ee.Dictionary(item);
    var classNumber = ee.Number(areaDict.get('landcover')).format();
    var area = ee.Number(areaDict.get('sum')).divide(1e4); // hectares
    return ee.List([classNumber, area]);
  });
  var result = ee.Dictionary(classAreaLists.flatten());
  var city = feature.get('name');
  return ee.Feature(feature.geometry(), result.set('Weather Station ID', city));
};

var cityAreas = weatherStation.map(calculateClassArea);
print(cityAreas, "London Stations Area");

// Export class areas as CSV
var classes = ee.List.sequence(0,3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_station_L5_2000_summer',
  folder: 'London_city_LULC',
  fileNamePrefix: 'class_area_by_station_L5_2000_summer',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------------------------------
// Legend
// -------------------------------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({value: 'Classified Image', style: {fontWeight: 'bold', fontSize: '18px'}}));

var legendPalette = ['#06d608','#ff3905','#0843d8','#ffcfc2'];
var names = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < 4; i++) {
  legend.add(ui.Panel({
    widgets: [
      ui.Label({style: {backgroundColor: legendPalette[i], padding: '8px', margin: '0 0 4px 0'}}),
      ui.Label({value: names[i], style: {margin: '0 0 4px 6px'}})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  }));
}
Map.add(legend);




// #################################
// Hong Kong LULC with Landsat 8 
// #################################

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


///// Direct link to the GEE
https://code.earthengine.google.com/821a46babed5e1f50242a8665939a518

// #################################
// Hong Kong LULC with Landsat 5 
// #################################

// ---------- Weather Stations ----------
var weatherStHKCW = ee.Geometry.Point([114.143843 , 22.284873]);
var weatherStHKMK = ee.Geometry.Point([114.168657 , 22.322531]);
var weatherStHKTP = ee.Geometry.Point([114.16414  , 22.450977]);

var bufHKCW = weatherStHKCW.buffer(1000);
var bufHKMK = weatherStHKMK.buffer(1000);
var bufHKTP = weatherStHKTP.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufHKCW, {name:"bufHKCW"}),
  ee.Feature(bufHKMK, {name:"bufHKMK"}),
  ee.Feature(bufHKTP, {name:"bufHKTP"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(114.1575, 22.3611, 10);

// ---------- Landsat 5 Collection 2 L2 ----------
var landsatCollection = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
  .filterDate('2000-04-01', '2000-08-31')      
  .filterBounds(weatherStation)
  .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Scale reflectance (no SR_B6 in C2). Thermal scaled but not used in classification.
function scaleL5SR(image) {
  var optical = image.select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'])
    .multiply(0.0000275).add(-0.2)
    .copyProperties(image, image.propertyNames());
  var thermal = image.select('ST_B6')
    .multiply(0.00341802).add(149.0)
    .rename('ST_B6_scaled');
  return image.addBands(optical, null, true)
              .addBands(thermal, null, true);
}
landsatCollection = landsatCollection.map(scaleL5SR);

// Median composite
var composite = landsatCollection.median();

// True-color visualization
Map.addLayer(
  composite.clip(weatherStation),
  {bands: ['SR_B3','SR_B2','SR_B1'], min: 0, max: 0.3, gamma: 1.2},
  'L5 RGB Image', false
);


var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print('Merged training data:', mergedFeature);

// Predictor bands (reflectance only; SR_B6 does not exist in C2)
var bands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'];

// Sample, split train/test
var samples = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn('rand', 42);

var split = 0.8;
var trainingSet  = samples.filter(ee.Filter.lt('rand', split));
var testingSet   = samples.filter(ee.Filter.gte('rand', split));

// Train classifier
var classifier = ee.Classifier.smileRandomForest(200).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

// Classify composite
var classified = composite.select(bands).classify(classifier);

// ---------- Display ----------
var palette = ['green', 'red', 'blue', 'yellow'];
Map.addLayer(
  classified.clip(weatherStation),
  {min: 0, max: 3, palette: palette},
  'Land Use Classification'
);

// ---------- Export classified image (all buffers union) ----------
Export.image.toDrive({
  image: classified.clip(weatherStation),
  description: 'L5_LULC_2000_Summer_AllBuffers',
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// ---------- Accuracy Assessment ----------
var trainCM = classifier.confusionMatrix();
print('Training Confusion Matrix', trainCM);
print('Training Accuracy', trainCM.accuracy());
print('Training Kappa', trainCM.kappa());

var validation = testingSet.classify(classifier);
var testCM = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix', testCM);
print('Validation Accuracy', testCM.accuracy());
print('Validation Kappa', testCM.kappa());

// ---------- Area Calculation by Class (per buffer) ----------
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
    var area = ee.Number(dict.get('sum')).divide(1e4); // hectares
    return ee.List([cls, area]);
  });
  var result = ee.Dictionary(classAreas.flatten());
  return ee.Feature(feature.geometry(), result.set('Weather Station ID', feature.get('name')));
};

var cityAreas = weatherStation.map(calculateClassArea);
print('Class areas by weather station', cityAreas);

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'L5_class_area_by_weather_Station_2000_summer',
  folder: 'HK_city_LULC',
  fileNamePrefix: 'L5_class_area_by_weather_Station_2000_summer',
  fileFormat: 'CSV',
  selectors: outputFields
});

// ---------- Legend ----------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification',
  style: {fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0'}
}));

function makeRow(color, name) {
  return ui.Panel({
    widgets: [
      ui.Label({style: {backgroundColor: color, padding: '8px', margin: '0 0 4px 0'}}),
      ui.Label({value: name, style: {margin: '0 0 4px 6px'}})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}
var legendColors = ['green', 'red', 'blue', 'yellow'];
var legendNames  = ['Greenspace', 'Builtin', 'Water', 'Fellowland'];
for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);

// ---------- Per-buffer exports ----------
Export.image.toDrive({
  image: classified.clip(bufHKCW),
  description: 'L5_LULC_2000_Summer_CentralWestern',
  scale: 30,
  region: bufHKCW,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: classified.clip(bufHKMK),
  description: 'L5_LULC_2000_Summer_MongKok',
  scale: 30,
  region: bufHKMK,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

Export.image.toDrive({
  image: classified.clip(bufHKTP),
  description: 'L5_LULC_2000_Summer_TaiPo',
  scale: 30,
  region: bufHKTP,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});





// #############################################
// LULC Classification for Vancouver
// Using Landsat 8 Collection 
// #############################################


//GEE lnk to direct acces of the code with GEE API consule
https://code.earthengine.google.com/26b838944d48a706bfa75faa606043b4

// -------------------- Weather Stations of Vancouver --------------------
var weatherStVC4 = ee.Geometry.Point([-122.3097 , 49.0428]);
var weatherStVC5 = ee.Geometry.Point([-122.9711 , 49.2794]);
var weatherStVC6 = ee.Geometry.Point([-122.9856 , 49.2153]);

var bufVC4 = weatherStVC4.buffer(1000);
var bufVC5 = weatherStVC5.buffer(1000);
var bufVC6 = weatherStVC6.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufVC4, {name:"Weather Station VC4"}),
  ee.Feature(bufVC5, {name:"Weather Station VC5"}),
  ee.Feature(bufVC6, {name:"Weather Station VC6"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather station');
Map.setCenter(-122.8218, 49.1483, 10);

// -------------------- Landsat 8 Collection 2 (2020) --------------------
var landsat = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-04-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Apply scaling factors for reflectance and temperature
function scaleL8SR(image) {
  var opticalBands = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
      .multiply(0.0000275).add(-0.2);
  var thermal = image.select('ST_B10')
      .multiply(0.00341802).add(149.0)
      .rename('ST_B10_scaled');
  return image.addBands(opticalBands, null, true)
              .addBands(thermal, null, true);
}

var landsatScaled = landsat.map(scaleL8SR);
var composite = landsatScaled.median();

// -------------------- Visualization --------------------
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'], min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image (2020)', false);

// -------------------- Training Data --------------------
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

var bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Train/test split
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

// -------------------- Classification --------------------
var classifier = ee.Classifier.smileRandomForest(10).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

// -------------------- Display Classified Map --------------------
var palette = ['green','red','blue','yellow'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification');

// -------------------- Export Classified Image --------------------
Export.image.toDrive({
  image: classified,
  description: "Vancouver_L8_Classified_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// -------------------- Accuracy Assessment --------------------
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// -------------------- Area Calculation --------------------
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
print(cityAreas, "Vancouver City Class Areas");

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weather_Station_L8_2020',
  folder: 'Vancouver_city_LULC',
  fileNamePrefix: 'class_area_by_weather_Station_L8_2020',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------- Legend --------------------
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

var legendColors = ['green','red','blue','yellow'];
var legendNames = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);






// #############################################
// LULC Classification for Vancouver
// Using Landsat 5 Collection 
// #############################################


//GEE lnk to direct acces of the code with GEE API consule
// https://code.earthengine.google.com/a9f53eb27732b1b654692f87ac156c02

// -------------------- Weather Stations of Vancouver --------------------
var weatherStVC1 = ee.Geometry.Point([-123.1522 , 49.1864]);
var weatherStVC2 = ee.Geometry.Point([-122.8492 , 49.2808]);
var weatherStVC3 = ee.Geometry.Point([-122.5669 , 49.0956]);
var weatherStVC4 = ee.Geometry.Point([-122.3097 , 49.0428]);
var weatherStVC5 = ee.Geometry.Point([-122.9711 , 49.2794]);
var weatherStVC6 = ee.Geometry.Point([-122.9856 , 49.2153]);

var bufVC1 = weatherStVC1.buffer(1000);
var bufVC2 = weatherStVC2.buffer(1000);
var bufVC3 = weatherStVC3.buffer(1000);
var bufVC4 = weatherStVC4.buffer(1000);
var bufVC5 = weatherStVC5.buffer(1000);
var bufVC6 = weatherStVC6.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufVC1, {name:"Weather Station VC1"}),
  ee.Feature(bufVC2, {name:"Weather Station VC2"}),
  ee.Feature(bufVC3, {name:"Weather Station VC3"}),
  ee.Feature(bufVC4, {name:"Weather Station VC4"}),
  ee.Feature(bufVC5, {name:"Weather Station VC5"}),
  ee.Feature(bufVC6, {name:"Weather Station VC6"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(-122.8218, 49.1483, 10);

// -------------------- Landsat 5 Collection 2 (2000 summer) --------------------
var landsat5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2')
    .filterDate('2000-04-01', '2000-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Apply scaling factors
function scaleL5SR(image) {
  var opticalBands = image.select(['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'])
      .multiply(0.0000275).add(-0.2);
  var thermal = image.select('ST_B6')
      .multiply(0.00341802).add(149.0)
      .rename('ST_B6_scaled');
  return image.addBands(opticalBands, null, true)
              .addBands(thermal, null, true);
}

var landsat5Scaled = landsat5.map(scaleL5SR);
var composite = landsat5Scaled.median();

// -------------------- Visualization --------------------
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B3','SR_B2','SR_B1'], min: 0, max: 0.3, gamma: 1.2
}, 'L5 RGB Image (2000)', false);

// -------------------- Training Data --------------------
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

var bands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// -------------------- Classification --------------------
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

var classifier = ee.Classifier.smileRandomForest(10).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

// -------------------- Display Classified Map --------------------
var palette = ['green','red','blue','yellow'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification 2000');

// -------------------- Export Classified Image --------------------
Export.image.toDrive({
  image: classified,
  description: "Vancouver_L5_Classified_2000",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// -------------------- Accuracy Assessment --------------------
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// -------------------- Area Calculation --------------------
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
print(cityAreas, "Vancouver city areas (2000)");

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weather_Station_L5_2000',
  folder: 'Vancouver_city_LULC',
  fileNamePrefix: 'class_area_by_weather_Station_L5_2000',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification (2000)',
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

var legendColors = ['green','red','blue','yellow'];
var legendNames = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);


// #############################################
// LULC Classification for Berlin 
// Using Landsat 8 
// #############################################

// ---------- Weather Stations ----------
var weatherStDEBE010 = ee.Geometry.Point([13.349326 , 52.543041]);
var weatherStDEBE034 = ee.Geometry.Point([13.430844 , 52.489451]);
var weatherStDEBE065 = ee.Geometry.Point([13.469931 , 52.514072]);

var bufDEBE010 = weatherStDEBE010.buffer(1000);
var bufDEBE034 = weatherStDEBE034.buffer(1000);
var bufDEBE065 = weatherStDEBE065.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufDEBE010,{name:"bufDEBE010"}),
  ee.Feature(bufDEBE034,{name:"bufDEBE034"}),
  ee.Feature(bufDEBE065,{name:"bufDEBE065"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(13.3940, 52.5042, 11);

// ---------- Landsat 8 Collection 2 Level-2 ----------
var landsatCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-04-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Scale function for SR data
function scaleL8SR(image) {
  var optical = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
    .multiply(0.0000275).add(-0.2)
    .copyProperties(image, image.propertyNames());
  var thermal = image.select('ST_B10')
    .multiply(0.00341802).add(149.0)
    .rename('ST_B10_scaled');
  return image.addBands(optical, null, true)
              .addBands(thermal, null, true);
}

landsatCollection = landsatCollection.map(scaleL8SR);
var composite = landsatCollection.median();

// Visualize RGB
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'],
  min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image', false);


var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print('Merged training data', mergedFeature);

// Bands to use
var bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

// Sample training data
var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Split into training/testing
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet  = training.filter(ee.Filter.gte('random', split));

// Train classifier
var classifier = ee.Classifier.smileRandomForest(100).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

// Classify
var classified = composite.select(bands).classify(classifier);

// ---------- Visualization ----------
var palette = ['#06d608', '#ff3905', '#0843d8', '#ffcfc2'];
Map.addLayer(classified.clip(weatherStation), {
  min: 0, max: 3, palette: palette
}, 'Land Use Classification');

// ---------- Export Classified Image ----------
Export.image.toDrive({
  image: classified.clip(weatherStation),
  description: "Berlin_LULC_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// ---------- Accuracy Assessment ----------
var trainCM = classifier.confusionMatrix();
print('Training Confusion Matrix:', trainCM);
print('Training Accuracy:', trainCM.accuracy());
print('Training Kappa:', trainCM.kappa());

var validation = testingSet.classify(classifier);
var testCM = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testCM);
print('Validation Accuracy:', testCM.accuracy());
print('Validation Kappa:', testCM.kappa());

// ---------- Area Calculation per Buffer ----------
var calculateClassArea = function(feature) {
  var areas = ee.Image.pixelArea().addBands(classified).reduceRegion({
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
print('Class areas by station', cityAreas);

var classes = ee.List.sequence(0,3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'Berlin_class_area_2020_summer',
  folder: 'Berlin_city_LULC',
  fileNamePrefix: 'Berlin_class_area_2020_summer',
  fileFormat: 'CSV',
  selectors: outputFields
});

// ---------- Legend ----------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification',
  style: {fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0'}
}));

function makeRow(color, name) {
  return ui.Panel({
    widgets: [
      ui.Label({style: {backgroundColor: color, padding: '8px', margin: '0 0 4px 0'}}),
      ui.Label({value: name, style: {margin: '0 0 4px 6px'}})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

var names = ['Greenspace','Builtin','Water','Fellowland'];
for (var i = 0; i < palette.length; i++) {
  legend.add(makeRow(palette[i], names[i]));
}
Map.add(legend);






// #############################################
// LULC Classification for Melbourne 
// Using Landsat 8 Collection 
// #############################################

// ---------- Weather Stations (Example) ----------
var buf = geometry.buffer(1000);
var buf10136 = weatherSt10136.buffer(1000);
var buf10003 = weatherSt10003.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(buf, {name:"Station_10001"}),
  ee.Feature(buf10136, {name:"Station_10136"}),
  ee.Feature(buf10003, {name:"Station_10003"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(145.1854, -37.7786, 12);

// ---------- Landsat 8 Collection 2 Level-2 ----------
var landsatCollection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-01-01', '2020-12-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Scale function for SR data
function scaleL8SR(image) {
  var optical = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
    .multiply(0.0000275).add(-0.2)
    .copyProperties(image, image.propertyNames());
  var thermal = image.select('ST_B10')
    .multiply(0.00341802).add(149.0)
    .rename('ST_B10_scaled');
  return image.addBands(optical, null, true)
              .addBands(thermal, null, true);
}

landsatCollection = landsatCollection.map(scaleL8SR);
var composite = landsatCollection.median();

// Visualize RGB
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'],
  min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image', false);



var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print('Merged training data', mergedFeature);

// Bands to use
var bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

// Sample training data
var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Split into training/testing
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet  = training.filter(ee.Filter.gte('random', split));

// Train classifier
var classifier = ee.Classifier.smileRandomForest(100).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

// Classify
var classified = composite.select(bands).classify(classifier);

// ---------- Visualization ----------
var palette = ['#06d608', '#ff3905', '#0843d8', '#fffd25'];
Map.addLayer(classified.clip(weatherStation), {
  min: 0, max: 3, palette: palette
}, 'Land Use Classification');

// ---------- Export Classified Image ----------
Export.image.toDrive({
  image: classified.clip(weatherStation),
  description: "Melbourne_LULC_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// ---------- Accuracy Assessment ----------
var trainCM = classifier.confusionMatrix();
print('Training Confusion Matrix:', trainCM);
print('Training Accuracy:', trainCM.accuracy());
print('Training Kappa:', trainCM.kappa());

var validation = testingSet.classify(classifier);
var testCM = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testCM);
print('Validation Accuracy:', testCM.accuracy());
print('Validation Kappa:', testCM.kappa());

// ---------- Area Calculation per Buffer ----------
var calculateClassArea = function(feature) {
  var areas = ee.Image.pixelArea().addBands(classified).reduceRegion({
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
print('Class areas by station', cityAreas);

var classes = ee.List.sequence(0,3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'Melbourne_class_area_2020',
  folder: 'Melbourne_city_LULC',
  fileNamePrefix: 'Melbourne_class_area_2020',
  fileFormat: 'CSV',
  selectors: outputFields
});

// ---------- Legend ----------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification',
  style: {fontWeight: 'bold', fontSize: '18px', margin: '0 0 4px 0'}
}));

function makeRow(color, name) {
  return ui.Panel({
    widgets: [
      ui.Label({style: {backgroundColor: color, padding: '8px', margin: '0 0 4px 0'}}),
      ui.Label({value: name, style: {margin: '0 0 4px 6px'}})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

var names = ['Greenspace','Builtin','Water','Fellowland'];
for (var i = 0; i < palette.length; i++) {
  legend.add(makeRow(palette[i], names[i]));
}
Map.add(legend);



// #############################################
// LULC Classification for Los Angeles
// Using Landsat 8 Collection 
// #############################################

//GEE lnk to direct acces of the code with GEE API consule
//https://code.earthengine.google.com/de5c8999e21510bd8a592a5f6020bf07

// -------------------- Weather Stations of Los Angeles --------------------
var weatherStLA3 = ee.Geometry.Point([-118.43049 , 33.95507]);
var weatherStLA4 = ee.Geometry.Point([-117.93845 , 33.83062]);
var weatherStLA6 = ee.Geometry.Point([-117.92391 , 34.1365]);

var bufLA3 = weatherStLA3.buffer(1000);
var bufLA4 = weatherStLA4.buffer(1000);
var bufLA6 = weatherStLA6.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufLA3 , {name:"Weather Station LA3"}),
  ee.Feature(bufLA4 , {name:"Weather Station LA4"}),
  ee.Feature(bufLA6 , {name:"Weather Station LA6"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(-118.2359, 34.0806, 10);

// -------------------- Landsat 8 Collection 2 (2020 summer) --------------------
var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-05-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Apply scaling factors
function scaleL8SR(image) {
  var opticalBands = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7','SR_B1'])
      .multiply(0.0000275).add(-0.2);
  var thermal = image.select('ST_B10')
      .multiply(0.00341802).add(149.0)
      .rename('ST_B10_scaled');
  return image.addBands(opticalBands, null, true)
              .addBands(thermal, null, true);
}

var landsat8Scaled = landsat8.map(scaleL8SR);
var composite = landsat8Scaled.median();

// -------------------- Visualization --------------------
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'], min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image (2020)', false);

// -------------------- Training Data --------------------
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

var bands = ['SR_B1','SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Split into training/testing
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

// -------------------- Classification --------------------
var classifier = ee.Classifier.smileRandomForest(50).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

// -------------------- Display Classified Map --------------------
var palette = ['green','red','blue','yellow'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification 2020');

// -------------------- Export Classified Image --------------------
Export.image.toDrive({
  image: classified,
  description: "LosAngeles_L8_Classified_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// -------------------- Accuracy Assessment --------------------
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// -------------------- Area Calculation --------------------
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
print(cityAreas, "Los Angeles city areas (2020)");

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weatherStation_LA_2020',
  folder: 'LosAngeles_city_LULC',
  fileNamePrefix: 'class_area_by_weatherStation_LA_2020',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification (2020)',
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

var legendColors = ['green','red','blue','yellow'];
var legendNames = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);





// #############################################
// LULC Classification for Stockhlm
// Using Landsat 8 Collection 
// #############################################

//GEE lnk to direct acces of the code with GEE API consule
//https://code.earthengine.google.com/a35a1c631d25841588369bb75c2f1b67


/// -------------------- Weather Stations of Stockholm --------------------
var weatherStSTHLM8779 = ee.Geometry.Point([18.058254, 59.340828]);
var weatherStSTHLM8781 = ee.Geometry.Point([18.057808, 59.316006]);
var weatherStSTHLM18644 = ee.Geometry.Point([18.00439, 59.325527]);

var bufSTHLM8779 = weatherStSTHLM8779.buffer(1000);
var bufSTHLM8781 = weatherStSTHLM8781.buffer(1000);
var bufSTHLM18644 = weatherStSTHLM18644.buffer(1000);

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufSTHLM8779, {name:"Weather Station bufSTHLM8779"}),
  ee.Feature(bufSTHLM8781, {name:"Weather Station bufSTHLM8781"}),
  ee.Feature(bufSTHLM18644, {name:"Weather Station bufSTHLM18644"})
]);

Map.addLayer(weatherStation, {color: 'blue'}, '1 km buffer around weather stations');
Map.setCenter(18.056, 59.3288, 10);

// -------------------- Landsat 8 Collection 2 (2020 summer) --------------------
var landsat8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate('2020-04-01', '2020-08-31')
    .filterBounds(weatherStation)
    .filter(ee.Filter.lt('CLOUD_COVER', 20));

// Apply scaling factors
function scaleL8SR(image) {
  var opticalBands = image.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
      .multiply(0.0000275).add(-0.2);
  return image.addBands(opticalBands, null, true);
}

var landsat8Scaled = landsat8.map(scaleL8SR);
var composite = landsat8Scaled.median();

// -------------------- Visualization --------------------
Map.addLayer(composite.clip(weatherStation), {
  bands: ['SR_B4','SR_B3','SR_B2'],
  min: 0, max: 0.3, gamma: 1.2
}, 'L8 RGB Image (2020)', false);

// -------------------- Training Data --------------------
var mergedFeature = greenspace.merge(builtin).merge(water).merge(fellowland);
print(mergedFeature, 'All features merged');

var bands = ['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'];

var training = composite.select(bands).sampleRegions({
  collection: mergedFeature,
  properties: ['landcover'],
  scale: 30
}).randomColumn();

// Split into training/testing
var split = 0.8;
var trainingSet = training.filter(ee.Filter.lt('random', split));
var testingSet = training.filter(ee.Filter.gte('random', split));

// -------------------- Classification --------------------
var classifier = ee.Classifier.smileRandomForest(50).train({
  features: trainingSet,
  classProperty: 'landcover',
  inputProperties: bands
});

var classified = composite.select(bands).classify(classifier);

// -------------------- Display Classified Map --------------------
var palette = ['green','red','blue','yellow'];
Map.addLayer(classified.clip(weatherStation), {min: 0, max: 3, palette: palette}, 'Land Use Classification 2020');

// -------------------- Export Classified Image --------------------
Export.image.toDrive({
  image: classified,
  description: "Stockholm_L8_Classified_2020",
  scale: 30,
  region: weatherStation.geometry(),
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});

// -------------------- Accuracy Assessment --------------------
var confusionMatrix = classifier.confusionMatrix();
print('Training Confusion Matrix:', confusionMatrix);
print('Training Accuracy:', confusionMatrix.accuracy());
print('Training Kappa:', confusionMatrix.kappa());

var validation = testingSet.classify(classifier);
var testAccuracy = validation.errorMatrix('landcover', 'classification');
print('Validation Confusion Matrix:', testAccuracy);
print('Validation Accuracy:', testAccuracy.accuracy());
print('Validation Kappa:', testAccuracy.kappa());

// -------------------- Area Calculation --------------------
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
print(cityAreas, "Stockholm city areas (2020)");

var classes = ee.List.sequence(0, 3);
var outputFields = ee.List(['Weather Station ID']).cat(classes).getInfo();

Export.table.toDrive({
  collection: cityAreas,
  description: 'class_area_by_weatherStation_STHLM_2020',
  folder: 'Stockholm_city_LULC',
  fileNamePrefix: 'class_area_by_weatherStation_STHLM_2020',
  fileFormat: 'CSV',
  selectors: outputFields
});

// -------------------- Legend --------------------
var legend = ui.Panel({style: {position: 'bottom-left', padding: '8px 15px'}});
legend.add(ui.Label({
  value: 'Land Cover Classification (2020)',
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

var legendColors = ['green','red','blue','yellow'];
var legendNames = ['Greenspace','Builtin','Water','Fellowland'];

for (var i = 0; i < legendColors.length; i++) {
  legend.add(makeRow(legendColors[i], legendNames[i]));
}
Map.add(legend);





