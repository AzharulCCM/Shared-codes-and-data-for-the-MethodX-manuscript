/******************************************************
 * Title: Monthly Mean NDVI Time Series Calculation
 * Description: Calculates monthly mean NDVI from Landsat 8 Surface Reflectance data
 *              for a given study area using Google Earth Engine.
 * Author: Azharul Islam
 * Date: 2025-08-10
 * Dataset: LANDSAT/LC08/C02/T1_L2 (Surface Reflectance)
 * Period: 2014-01-01 to 2020-12-31
 ******************************************************/


// Load study area shapefile
var study_area = ee.FeatureCollection("projects/ee-projectccm/assets/Berlin_shapefile_NDVI");
Map.centerObject(study_area, 12);
Map.addLayer(study_area, {}, 'Study Area');

// Select study period and use Surface Reflectance collection for Landsat 8 
var l8 = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterDate('2014-01-01', '2020-12-31')
  .filterBounds(study_area)
  .filter(ee.Filter.lt('CLOUD_COVER', 12));

// Cloud mask function for Landsat 8 SR using pixel_qa band
function maskL8sr(image) {
  var qa = image.select('QA_PIXEL');
  var cloudBitMask = 1 << 3;
  var cloudShadowBitMask = 1 << 5;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
              .and(qa.bitwiseAnd(cloudShadowBitMask).eq(0));
  return image.updateMask(mask);
}

// Apply cloud mask
var l8_cloudFree = l8.map(maskL8sr);

// NDVI calculation function
var addNDVI = function(image) {
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var withNDVI = l8_cloudFree.map(addNDVI).select('NDVI');

// Define the custom chart options with bolder line and bigger points
var options = { 
  title: 'NDVI_Melbourne', 
  titleTextStyle: {
    bold: true,
    italic: false,
    fontSize: 58
  },
  hAxis: { 
    title: 'Time',
    titleTextStyle: {
      bold: true,
      italic: false,
      fontSize: 56
    },
    textStyle: {
      bold: true,
      fontSize: 54
    }
  },
  vAxis: { 
    title: 'NDVI',
    titleTextStyle: {
      bold: true,
      italic: false,
      fontSize: 54
    },
    textStyle: {
      bold: true,
      fontSize: 52
    }
  },
  series: {
    0: { 
      color: 'green',
      lineWidth: 12,
      pointSize: 11
    }
  }
};


// Create the chart with your options and mean reducer for the study area
var chart = ui.Chart.image.series({
  imageCollection: withNDVI,
  region: study_area.geometry(),
  reducer: ee.Reducer.mean(),  // Average NDVI for the area
  scale: 30
}).setOptions(options);

print(chart);



/////////////Monthly mean NDVI /////
// Create list of months
var months = ee.List.sequence(1, 12);

// Function to get monthly mean NDVI
var monthlyNDVI = months.map(function(m) {
  var filtered = withNDVI.filter(ee.Filter.calendarRange(m, m, 'month'));
  var mean = filtered.mean().clip(study_area);
  var stat = mean.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: study_area.geometry(),
    scale: 30,
    maxPixels: 1e13
  });
  return ee.Feature(null, {
    'Month': m,
    'NDVI': stat.get('NDVI')
  });
});

// Convert to FeatureCollection
var ndvi_fc = ee.FeatureCollection(monthlyNDVI);

// Export as CSV
Export.table.toDrive({
  collection: ndvi_fc,
  description: 'NDVI_Berlin_2014_2020',
  fileFormat: 'CSV'
});
