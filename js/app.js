$(function() { 
  
  // Set some variables and constants
  const DB_NAME = 'gf';
  const DB_VERSION = 1;
  const DB_STORE_NAME = 'events';
  
  var db;
  // Uncomment to drop the database before starting.
  //indexedDB.deleteDatabase('gf');

  /*
   * This function opens the database connection,
   * and adds the events to the database if needed.
   */
  function openDb(callback) {
    var req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (event) {
      db = this.result;
      // Show the list of upcoming events.
      callback();
    };
    req.onerror = function (event) {
      console.error("openDb:", event.target.errorCode);
    };

    req.onupgradeneeded = function (event) {
      var store = event.target.result.createObjectStore(DB_STORE_NAME, { keyPath: "id" });
      store.createIndex("title", "title", { unique: false });
      //store.createIndex("gratis", "gratis", { unique: false });
      //store.createIndex("prijs", "prijs", { unique: false });
      //store.createIndex("prijs_vvk", "prijs_vvk", { unique: false });
      //store.createIndex("omsch", "omsch", { unique: false });
      store.createIndex("datum", "datum", { unique: false });
      //store.createIndex("periode", "periode", { unique: false });
      store.createIndex("start", "start", { unique: false });
      store.createIndex("sort", "sort", { unique: false });
      //store.createIndex("cat", "cat", { unique: false });
      //store.createIndex("cat_id", "cat_id", { unique: false });
      //store.createIndex("url", "url", { unique: false });
      //store.createIndex("loc_id", "loc_id", { unique: false });
      //store.createIndex("loc", "loc", { unique: false });
      //store.createIndex("lat", "lat", { unique: false });
      //store.createIndex("lon", "lon", { unique: false });
      //store.createIndex("korting", "korting", { unique: false });
      //store.createIndex("festival", "festival", { unique: false });

      var events = JSON.parse(getEvents());
      // Todo: add decent sorting.
      
      for (var key in events) {
        store.add(events[key]);
      }
    };
  }

  
  /*
   * Read the events.json file and return it's content.
   */
  function getUpcomingEvents() {
    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = new Date().getTime();
    var index = store.index("datum", "start", "order");
    var range = IDBKeyRange.lowerBound(now);
    var limit = 10;
    var i = 0;
    var results = [];
    
    index.openCursor(range).onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor && i < limit) {
        results.push(cursor.value);
        i += 1;
        cursor.continue();
      }
      else {
        $('#content').html(printTeaserHTML(results));
      }
    };
  }

  /**
   * Return HTML for an event row based on a given object.
   */
  function printTeaserHTML(events) {
    var output = '';
    for (var key in events) {
      var event = events[key];
      output += '<div class="teaser">';
      output += '<div class="left">' + event.start + new Date(event.datum * 1000) + '</div>';
      output += '<div class="middle">' + event.title + '</div>';
      output += '<div class="right">*</div>';
      output += '</div>';
    }
    
    return output;
  } 
  
  /*
   * Read the events.json file and return it's content.
   */
  function getEvents() {
    // TODO: see if this can return a JSON file.
    return $.ajax({
        type: "GET",
        url: '../data/events.json',
        async: false
    }).responseText;
  }
  
  openDb(getUpcomingEvents);
});