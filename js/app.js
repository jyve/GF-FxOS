$(function() {

  // Set some variables and constants
  const DB_NAME = 'gf';
  const DB_VERSION = 1;
  const DB_STORE_NAME = 'events';
  const CAT_IDS = [10, 24, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25];
  const CATEGORIES = ["Bals / Dans", "Circus", "Comedy", "Concerten divers", "Jazz", "Klassieke concerten","Rock, pop, techno, blues, folk", "Kinderen", "Markten", "Sport en recreatie", "Tentoonstellingen", "Theater", "Varia", "Poezie", "Vuurwerk", "Wandelingen"];
  const LOC_IDS = [376, 390, 230, 385, 615, 382, 394, 380, 395, 379, 378, 384, 470, 392, 377, 381, 383, 386, 393, 387];
  const LOCATIONS = ["Baudelohof", "Beverhoutplein", "Bij Sint-Jacobs", "Bisdomplein", "Emile Braunplein", "Francois Laurentplein", "Gravensteen", "Groentemarkt", "Koningin Maria Hendrikaplein", "Korenlei - Graslei", "Korenmarkt", "Kouter", "Portus Ganda, Voorhoutkaai", "Sint-Bavo Humaniora - Reep 4", "St-Baafsplein", "St-Veerleplein", "Vlasmarkt", "Vrijdagmarkt", "Watersportbaan", "Woodrow Wilsonplein"];

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
      //store.createIndex("title", "title", { unique: false });
      //store.createIndex("gratis", "gratis", { unique: false });
      //store.createIndex("prijs", "prijs", { unique: false });
      //store.createIndex("prijs_vvk", "prijs_vvk", { unique: false });
      //store.createIndex("omsch", "omsch", { unique: false });
      //store.createIndex("datum", "datum", { unique: false });
      //store.createIndex("periode", "periode", { unique: false });
      //store.createIndex("start", "start", { unique: false });
      store.createIndex("sort", "sort", { unique: false});
      store.createIndex("cat_id_datum_sort", ['cat_id', 'datum', 'sort'], { unique: false});
      store.createIndex("loc_id_datum_sort", ['loc_id', 'datum', 'sort'], { unique: false});
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
            timestamp = parseInt(event.datum) + ((parseInt(sort.substr(0, 2)) * 3600) + (parseInt(sort.substr(2, 4)))) + 7200;
          }
          else {
            timestamp = parseInt(event.datum) + ((parseInt(sort.substr(0, 1)) * 3600) + (parseInt(sort.substr(1, 3)))) + 7200;
          }
        }
        event.sort = timestamp;

        // Add two hours on datum field.
        event.datum = parseInt(event.datum) + 7200;

        // Add favorite property.
        event.favorite = 0;

        store.add(event);
      }
    };
  }

  /*
   * Get the list of the 40 upcoming event teasers.
   */
  function getUpcomingEvents() {
    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = parseInt(Math.round(+new Date()/1000));
    var index = store.index("sort");
    var range = IDBKeyRange.lowerBound(now);
    var limit = 40;
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
  function getFilteredEvents(cat_id, date, free, loc_id) {
    console.log(cat_id);
    console.log(date);
    console.log(free);
    console.log(loc_id);
    var results = [];

    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = Math.round(+new Date()/1000);

    //var index = store.index("datum", "start");
    //var range = IDBKeyRange.lowerBound(now);

    // If the category_id and date are set.
    if (cat_id) {
      var index = store.index("cat_id_datum_sort");
      var lowerBound = [cat_id, parseInt(date), now];
      var upperBound = [cat_id, parseInt(date), (now * now)];
      var range = IDBKeyRange.bound(lowerBound,upperBound);
    }

    // If the category_id and date are set.
    if (loc_id) {
      var index = store.index("loc_id_datum_sort");
      var lowerBound = [loc_id, parseInt(date), now];
      var upperBound = [loc_id, parseInt(date), (now * now)];
      var range = IDBKeyRange.bound(lowerBound,upperBound);
    }


    index.openCursor(range).onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      }
      else {
        // TODO: empty before print
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
    var extraClass = "";
    for (var key in events) {
      // Add extra classes for theming.
      extraClass = "";
      if (key%2 == 1) {
        extraClass += 'even ';
      }
      else {
        extraClass += 'odd ';
      }
      if (key == 0) {
        extraClass += 'first ';
      }

      // Build the HTML.
      var event = events[key];
      output += '<div class="teaser row ' + extraClass + 'clearfix" id="event-' + event.id + '">';
      output += '<div class="left">';
      if (event.start) {
        output += event.start.replace(':', 'u');
      }
      else {
        output += 'Hele dag';
      }
      output += '</div>';
      output += '<div class="middle">' + event.title + '</div>';
      if (event.favorite) {
        output += '<div class="right favorited"><a class="un-favorite" id=' + event.id + ' href="#">fav</a></div>';
      }
      else {
        output += '<div class="right not-favorited"><a class="favorite" id=' + event.id + ' href="#">not fav</a></div>';
      }
      output += '</div>';
    }

    return output;
  }

  /**
   * Return HTML for an event detail based on the id.
   */
  function printDetailHTML(event) {
    var output = '';
    var extraClass = "";

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
      var date = new Date(event.sort * 1000);
      var days = ["Zondag","Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag"];
      var day = days[date.getDay()];
      var months = ["januari","februari","maart","april","mei","juni","juli", "augustus", "september", "oktober", "november", "december"];
      var month = months[date.getMonth()];
      var dayNumeric = date.getUTCDate();
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
    if (event.omsch || event.url) {
      labels.push('');
      var omsch = "";
      if (event.omsch) {
        omsch += event.omsch;
      }
      if (event.url) {
        omsch += '<br /><a href="' + event.url + '">' + event.url + '</a>';
      }
      info.push(omsch);
    }


    for (var key in info) {
      // Add extra classes for theming.
      extraClass = "";
      if (key%2 == 1) {
        extraClass += 'even ';
      }
      else {
        extraClass += 'odd ';
      }
      if (key == 0) {
        extraClass += 'first ';
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

  /**
   * Populate the categories and date popups based on the const arrays.
   */
  function populatePopups() {
    // Categories popup
    for (var key in CAT_IDS) {
      $('#categories-popup menu').append('<button value="' + CAT_IDS[key] + '">' + CATEGORIES[key] + '</button>');
    }
    $('#categories-popup menu').append('<button id="cancel">Annuleren</button>');

    // Locations popup
    for (var key in LOC_IDS) {
      $('#locations-popup menu').append('<button value="' + LOC_IDS[key] + '">' + LOCATIONS[key] + '</button>');
    }
    $('#locations-popup menu').append('<button id="cancel">Annuleren</button>');
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

    /* Favorite an event */
    $('.content').on('click', 'a.favorite', function() {
      var event;
      var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
      var range = IDBKeyRange.only($(this).attr('id'));

      store.openCursor(range).onsuccess = function(e) {
        var cursor = e.target.result;
        event = cursor.value;
        event.favorite = 1;
        store.put(event);
      };

      $(this).html('fav');
      $(this).attr('class', 'unfavorite');

      return false;
    });

    /* Unfavorite an event */
    $('.content').on('click', 'a.un-favorite', function() {
      var event;
      var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
      var range = IDBKeyRange.only($(this).attr('id'));

      store.openCursor(range).onsuccess = function(e) {
        var cursor = e.target.result;
        event = cursor.value;
        event.favorite = 0;
        store.put(event);
      };

      $(this).html('not fav');
      $(this).attr('class', 'favorite');

      return false;
    });

    /* Resize content area if screen is resized */
    $(window).resize(function() {
      setScreenHeight();
    });

    /* Drawer navigation */
    $('#categories-link').click(function() {
      $('#categories-popup').show();
    });
    $('#locations-link').click(function() {
      $('#locations-popup').show();
    });

    /* Cancel popup forms */
    $('button#cancel').click(function(event) {
      $(this).parents('.page').hide();
      event.preventDefault();
    });

    /* Category navigation */
    $('#categories-popup button').not('#cancel').click(function() {
      var cat_id = $(this).attr('value');
      $(this).parents('.page').hide();
      $('#date-popup').show();
      $('#date-popup input[name=cat_id]').val(cat_id);
      return false;
    });

    /* Location navigation */
    $('#locations-popup button').not('#cancel').click(function() {
      var loc_id = $(this).attr('value');
      $(this).parents('.page').hide();
      $('#date-popup').show();
      $('#date-popup input[name=loc_id]').val(loc_id);
      return false;
    });

    /* Date navigation */
    $('#date-popup button').not('#cancel').click(function() {
      var cat_id = $('input[name=cat_id]').attr('value');
      var date = $(this).attr('value');
      var free = $('input[name=free]').attr('value');
      var loc_id = $('input[name=loc_id]').attr('value');

      $('.page').hide();
      $('#filtered-events').show();
      getFilteredEvents(cat_id, date, free, loc_id);
      return false;
    });
  }

  setScreenHeight();
  populatePopups();
  openDb(getUpcomingEvents);
  addEventListeners();
});