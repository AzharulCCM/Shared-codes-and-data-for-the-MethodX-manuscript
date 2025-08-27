// Mean population density extraction from the sample buffer sites

// --- Berlin --- //

// Inserting coordinate points of targeted weather station
var weatherStationDEBE10 = ee.Geometry.Point([13.34933, 52.543041]);
var weatherStationDEBE65 = ee.Geometry.Point([13.46993, 52.514072]);
var weatherStationDEBE34 = ee.Geometry.Point([13.43084, 52.489451]);

//Lets creat our targeted buffer area surrounding the weather station
var bufferDEBE10 = weatherStationDEBE10.buffer({"distance":1000});
var bufferDEBE65 = weatherStationDEBE65.buffer({"distance":1000});
var bufferDEBE34 = weatherStationDEBE34.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufferDEBE10, {name:"weather station DEBE10"}),
  ee.Feature(bufferDEBE65, {name:"weather station DEBE65"}),
  ee.Feature(bufferDEBE34, {name:"weather station DEBE34"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(13.46993, 52.514072, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_Berlin_2000',
  folder: 'Berlin_PopData',
  fileNamePrefix: 'PopulationDensity_Berlin_2000',
  fileFormat: 'CSV'
});



// --- Hong Kong --- //

// Inserting coordinate points of targeted weather station
var weatherStationHKCW = ee.Geometry.Point([114.143843, 22.28487]);
var weatherStationHKMK = ee.Geometry.Point([114.168657, 22.32253]);
var weatherStationHKTP = ee.Geometry.Point([114.231343, 22.30972]);

//Lets creat our targeted buffer area surrounding the weather station
var bufferHKCW = weatherStationHKCW.buffer({"distance":1000});
var bufferHKMK = weatherStationHKMK.buffer({"distance":1000});
var bufferHKTP = weatherStationHKTP.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufferHKCW, {name:"weather station HKCW"}),
  ee.Feature(bufferHKMK, {name:"weather station HKMK"}),
  ee.Feature(bufferHKTP, {name:"weather station HKTP"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(114.143843, 22.28487, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_HongKong_2000',
  folder: 'HongKong_PopData',
  fileNamePrefix: 'PopulationDensity_HongKong_2000',
  fileFormat: 'CSV'
});


// --- Los Angeles --- //

var weatherStLH =  /* color: #312ad6 */ /* shown true */ ee.Geometry.Point([ -118.43049 , 33.95507 ])
var weatherStAnhm =  /* color: #312ad6 */ /* shown true */ ee.Geometry.Point([ -117.93845 , 33.83062 ])
var weatherStNMS =  /* color: #312ad6 */ /* shown true */ ee.Geometry.Point([ -118.22688 , 34.06659 ])
var weatherStAzs =  /* color: #312ad6 */ /* shown true */ ee.Geometry.Point([ -117.92391 , 34.1365 ])

var bufLH = weatherStLH .buffer({"distance":1000})
var bufAnhm = weatherStAnhm .buffer({"distance":1000})
var bufNMS = weatherStNMS .buffer({"distance":1000})
var bufAzs = weatherStAzs .buffer({"distance":1000})


var weatherStation = ee.FeatureCollection([
  ee.Feature( bufLH , {name:"weather Station  bufLH "}),
  ee.Feature( bufAnhm , {name:"weather Station  bufAnhm "}),
  ee.Feature( bufNMS , {name:"weather Station  bufNMS "}),
  ee.Feature( bufAzs , {name:"weather Station  bufAzs "}),
 ])
 
Map.addLayer(weatherStation,{"color": "blue"},"weather stations buffer 1 km")
// Show your map at your targeted zoom sclae (12)
Map.setCenter(-117.9385, 33.83062, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_Los_angeles_2000',
  folder: 'Losangeles_PopData',
  fileNamePrefix: 'PopulationDensity_Losangeles_2000',
  fileFormat: 'CSV'
});


// --- Melbourne --- //

// Inserting coordinate points of targeted weather station
var weatherStation10001 = ee.Geometry.Point([145.0305939,-37.7783165]);
var weatherStation10036 = ee.Geometry.Point([145.3284607,-37.77507401]);
var weatherStation10003 = ee.Geometry.Point([145.0305939,-37.80476761]);

//Lets creat our targeted buffer area surrounding the weather station
var buffer10001 = weatherStation10001.buffer({"distance":1000});
var buffer10036 = weatherStation10036.buffer({"distance":1000});
var buffer10003 = weatherStation10003.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(buffer10001, {name:"weather station 10001"}),
  ee.Feature(buffer10036, {name:"weather station 10036"}),
  ee.Feature(buffer10003, {name:"weather station 10003"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(145.3284607,-37.77507401, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_Melbourne_2000',
  folder: 'Melbourne_PopData',
  fileNamePrefix: 'PopulationDensity_Melbourne_2000',
  fileFormat: 'CSV'
});


// --- New York --- //

//Inserting coordinate points of targeted weather station
var weatherStationNY124 = ee.Geometry.Point([-73.902, 40.816]);
var weatherStationNY79 = ee.Geometry.Point([-73.82153, 40.7361]);
var weatherStationNY110 = ee.Geometry.Point([-74.0523, 40.72541]);

Lets creat our targeted buffer area surrounding the weather station
var bufferNY124 = weatherStationNY124.buffer({"distance":1000});
var bufferNY79 = weatherStationNY79.buffer({"distance":1000});
var bufferNY110 = weatherStationNY110.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufferNY124, {name:"weather station NY124"}),
  ee.Feature(bufferNY79, {name:"weather station NY79"}),
  ee.Feature(bufferNY110, {name:"weather station NY110"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(-73.82153, 40.7361, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2020-01-01', '2020-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_NewYorkCity_2000',
  folder: 'NewYorkCity_PopData',
  fileNamePrefix: 'PopulationDensity_NewYorkCity_2000',
  fileFormat: 'CSV'
});


// --- Stockhlm --- //

// Inserting coordinate points of targeted weather station
var weatherStationSE = ee.Geometry.Point([18.0044, 59.3255]);
var weatherStationSSG = ee.Geometry.Point([18.0583, 59.34084]);
var weatherStationSTK = ee.Geometry.Point([18.0578, 59.316]);

//Lets creat our targeted buffer area surrounding the weather station
var bufferSE = weatherStationSE.buffer({"distance":1000});
var bufferSSG = weatherStationSSG.buffer({"distance":1000});
var bufferSTK = weatherStationSTK.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufferSE, {name:"weather station SE"}),
  ee.Feature(bufferSSG, {name:"weather station SSG"}),
  ee.Feature(bufferSTK, {name:"weather station STK"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(18.0044, 59.3255, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};

// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};

// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_Stockh_2000',
  folder: 'Stockholm_PopData',
  fileNamePrefix: 'PopulationDensity_Stockholm_2000',
  fileFormat: 'CSV'
});



// --- VAncouver --- //

// Inserting coordinate points of targeted weather station
var weatherStationAC = ee.Geometry.Point([-122.3097, 49.0428]);
var weatherStationBKP = ee.Geometry.Point([-122.9711, 49.2794]);
var weatherStationBS = ee.Geometry.Point([-122.9856, 49.2153]);

//Lets creat our targeted buffer area surrounding the weather station
var bufferAC = weatherStationAC.buffer({"distance":1000});
var bufferBKP = weatherStationBKP.buffer({"distance":1000});
var bufferBS = weatherStationBS.buffer({"distance": 1000});

var weatherStation = ee.FeatureCollection([
  ee.Feature(bufferAC, {name:"weather station AC"}),
  ee.Feature(bufferBKP, {name:"weather station BKP"}),
  ee.Feature(bufferBS, {name:"weather station BS"}),]);


// Show the buffer in the map with map add layer function
Map.addLayer(weatherStation,
             {'color': 'blue'},
             'Buffer area around the station');
// Show your map at your targeted zoom sclae (12)
Map.setCenter(-122.9711, 49.2794, 12)

// Inserting our population density data and select you targeted temporal duration
var PopDensityData = ee.ImageCollection('CIESIN/GPWv411/GPW_UNWPP-Adjusted_Population_Density')
.filterDate('2000-01-01', '2000-12-31')
.first();

var raster = PopDensityData.select('unwpp-adjusted_population_density');
var raster_vis = {
  'max': 1000.0,
  'palette': [
    'ffffe7',
    'FFc869',
    'ffac1d',
    'e17735',
    'f2552c',
    '9f0c21'
  ],
  'min': 0.0
};


// Clip the population density map to the buffer areas
var bufferClip = raster.clipToCollection(weatherStation);

// Add the clipped population density map to the map
Map.addLayer(bufferClip, raster_vis, 'Clipped Population Density Map');

// Function to calculate mean population density for a given feature (buffer area)
var calculateMeanPopulation = function (feature) {
  var meanPopulation = raster.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: feature.geometry(),
    scale: 1000, 
    maxPixels: 1e13 
  });
  return feature.set(meanPopulation);
};


// Map over the FeatureCollection and calculate mean population density for each buffer
var populationData = weatherStation.map(calculateMeanPopulation);

// Print the result to the console
print('Mean Population Density by Buffer Area', populationData);

// Export the result to Google Drive
Export.table.toDrive({
  collection: populationData,
  description: 'PopulationDensity_Vancouber_2000',
  folder: 'Vancouber_PopData',
  fileNamePrefix: 'PopulationDensity_Vancouber_2000',
  fileFormat: 'CSV'
});


