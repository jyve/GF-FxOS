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
    // Todo: add loading screen.
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

      // Add extra sorting for the homepage.
      for (var key in events) {
        var event = events[key];
        var timestamp = 0;

        // Convert sort to real timestamp.
        var sort = event.sort;
        if (sort.length > 1) {
          if (sort.length == 4) {
            timestamp = parseInt(event.datum) + ((parseInt(sort.substr(0, 2)) * 3600) + (parseInt(sort.substr(2, 4))));
          }
          else {
            timestamp = parseInt(event.datum) + ((parseInt(sort.substr(0, 1)) * 3600) + (parseInt(sort.substr(1, 3))));
          }
        }

        event.sort = timestamp;
        store.add(event);
      }
    };
  }
  
  /*
   * Get the list of the 20 upcoming event teasers.
   */
  function getUpcomingEvents() {
    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = new Date().getTime();
    // Todo: sort by 'sort' field, and keep 0 out.
    var index = store.index("datum", "start");
    var range = IDBKeyRange.lowerBound(now);
    var limit = 20;
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
        $('#front .content h2').after(printTeaserHTML(results));
      }
    };
  }
  
  /*
   * Return a filtered list of event teasers.
   * Params:
   *  category
   *  date
   *  free
   *  location
   */
  function getFilteredEvents(category, date, free, location) {
    // TODO: make this work with optional filters, given by the popup forms.
    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = new Date().getTime();
    var index = store.index("datum", "start");
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
        $('#filtered-events .content h2').html('naam van filter').after(printTeaserHTML(results));
      }
    };
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

  /**
   * Return HTML for an event row based on a given object.
   */
  function printTeaserHTML(events) {
    var output = '';
    var extraClass="odd";
    for (var key in events) {
      if (key%2 == 1) {
        extraClass = 'even ';
      }
      else {
        extraClass = 'odd ';
      }
      var event = events[key];
      output += '<div class="teaser row ' + extraClass + 'clearfix" id="event-' + event.id + '">';
      output += '<div class="left">'
      if (event.start) {
        output += event.start.replace(':', 'u');
      }
      else {
        output += 'Volledige dag';
      }
      output += '</div>';
      output += '<div class="middle">' + event.title + '</div>';
      output += '<div class="right">*</div>';
      output += '</div>';
    }

    return output;
  }
  
  /**
   * Return HTML for an event detail based on the id.
   */
  function printDetailHTML(event) {
    var output = '';

    var info = [];
    var labels = [];
    
    output += '<h2>' + event.title + '</h2>';
    output += '<div class="content">';
    if (event.loc) {
      labels.push('Locatie');
      if (event.lat && event.lon) {
        info.push(event.loc + '<br /><a href="http://maps.google.com/?q=' + event.lat + ',' + event.lon + '">Toon op kaart</a>');      
      }
      else {
        info.push(event.loc);  
      }
    }
    if (event.datum) {
      labels.push('Datum');
      var date = new Date(event.datum * 1000);
      var days = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];
      var day = days[date.getDay()];
      var months = ["januari","februari","maart","april","mei","juni","juli", "augustus", "september", "oktober", "november", "december"];
      var month = months[date.getMonth()];
      // TODO: why is this wrong by one day?
      var dayNumeric = date.getUTCDate() + 1;
      info.push(day + ' ' + dayNumeric + ' ' + month + '<br />' + event.periode);      
    }
    if (event.prijs) {
      labels.push('Prijs');
      info.push(event.prijs);      
    }
    if (event.prijs_vvk) {
      labels.push('Prijs (voorverkoop)');
      info.push(event.prijs_vvk);      
    }
    if (event.cat) {
      labels.push('Categorie');
      info.push(event.cat);      
    }
    if (event.omsch) {
      labels.push('');
      info.push(event.omsch);      
    }
    if (event.url) {
      labels.push('');
      info.push(event.url);      
    }
    
    
    // Print with odd/even striping.
    for (var key in info) {
      if (key%2 == 1) {
        extraClass = 'even ';
      }
      else {
        extraClass = 'odd ';
      }
      output += '<div class="row detail clearfix ' + extraClass + '">';
      if (labels[key]) {
        output += '<div class="left">' + labels[key] + '</div>';
        output += '<div class="middle">' + info[key] + '</div>'; 
      }
      else {
        output += info[key];
      }
      output += '</div>';
      key += 1;
    }
    output += '</div>';


    return output;
  }
  
  /**
   * Return HTML for an event detail based on the id.
   */
  function setScreenHeight() {
    var contentHeight = $('body').height() - $('header:visible').outerHeight() - $('#subheader:visible').outerHeight();
    $('.content-wrapper').height(contentHeight);
  }

  /*
   * Add event listeners for the navigation elements.
   */
  function addEventListeners () {

    /* Go to event detail page onclick */
    $('.content').on('click', '.teaser', function(){
      // Get the event id
      $this = $(this);
      id = $this.attr('id').replace("event-","");
      
      // Query the database
      var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
      var range = IDBKeyRange.only(id);
      var results = [];
      
      store.openCursor(range).onsuccess = function(event) {
        var cursor = event.target.result;
        $('#event-detail .content-wrapper').html(printDetailHTML(cursor.value));
        $('.page:visible').addClass('back').hide();
        $('#event-detail').show();
        setScreenHeight();
      };
    });
    
    /* Go back from the detail page */
    $('a.icon-back').click(function() {
      $('.page.back').show();
      setScreenHeight();        
      $('#event-detail').hide();
    });
    
    /* Resize content area if screen is resized */
    $(window).resize(function() {
      setScreenHeight();
    });
    
    /* Drawer navigation */
    $('#categories-link').click(function() {
      $('#categories-popup').show();
    });
    
    /* Cancel popup forms */
    $('button#cancel').click(function() {
      $(this).parents('.page').hide();
    });
    
    /* Category navigation */
    $('#categories-popup button').click(function() {
      var category = $(this).attr('value');
      // TODO: store this value in a filter.
      $(this).parents('.page').hide();
      $('#date-popup').show();
      return false;
    });
    
    /* Date navigation */
    $('#date-popup button').click(function() {
      var date = $(this).attr('value');
      // TODO: store this value in a filter.
      $('.page').hide();
      $('#filtered-events').show();
      getFilteredEvents();
      return false;
    });
  }
  
  setScreenHeight();
  openDb(getUpcomingEvents);
  addEventListeners();
});