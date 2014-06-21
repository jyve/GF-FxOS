$(function() {

  // Set some variables and constants
  const DB_NAME = 'gf';
  const DB_VERSION = 2;
  const DB_STORE_NAME = 'events';
  const CAT_IDS = [10, 24, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25];
  const CATEGORIES = ["Bals / Dans", "Circus", "Comedy", "Concerten divers", "Jazz", "Klassieke concerten","Rock, pop, techno, blues, folk", "Kinderen", "Markten", "Sport en recreatie", "Tentoonstellingen", "Theater", "Varia", "Poezie", "Vuurwerk", "Wandelingen"];
  const LOC_IDS = [376, 390, 230, 385, 615, 382, 394, 380, 395, 379, 378, 384, 470, 392, 377, 381, 383, 386, 393, 387];
  const LOCATIONS = ["Baudelohof", "Beverhoutplein", "Bij Sint-Jacobs", "Bisdomplein", "Emile Braunplein", "Francois Laurentplein", "Gravensteen", "Groentemarkt", "Koningin Maria Hendrikaplein", "Korenlei - Graslei", "Korenmarkt", "Kouter", "Portus Ganda, Voorhoutkaai", "Sint-Bavo Humaniora - Reep 4", "St-Baafsplein", "St-Veerleplein", "Vlasmarkt", "Vrijdagmarkt", "Watersportbaan", "Woodrow Wilsonplein"];
  const DATES_INT = [1405641600, 1405728000, 1405814400, 1405900800, 1405987200, 1406073600, 1406160000, 1406246400, 1406332800, 1406419200];
  const DATES_FULL = ["Vrijdag 18 juli", "Zaterdag 19 juli", "Zondag 20 juli", "Maandag 21 juli", "Dinsdag 22 juli", "Woensdag 23 juli", "Donderdag 24 juli", "Vrijdag 25 juli", "Zaterdag 26 juli", "Zondag 27 juli"];

  const NO_RESULTS = '<div class="row clearfix">Er werden geen activiteiten gevonden.</div>';

  var db;
  // Uncomment to drop the database before starting.
  indexedDB.deleteDatabase('gf');

  /*
   * This function opens the database connection,
   * and adds the events to the database if needed.
   */
  function openDb(callback) {
    // Todo: add loading screen.

    var req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function (event) {
      db = event.target.result;
      // Show the list of upcoming events.
      callback();
    };
    req.onerror = function (event) {
      console.error("openDb:", event.target.errorCode);
    };

    req.onupgradeneeded = function (event) {

      db = event.target.result;
      var store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id"});
      store.createIndex("sort", "sort", { unique: false});
      store.createIndex("cat_id_datum_sort_title", ['cat_id', 'datum', 'sort', 'title'], { unique: false});
      store.createIndex("loc_id_datum_sort_title", ['loc_id', 'datum', 'sort', 'title'], { unique: false});
      store.createIndex("gratis_datum_sort_title", ['gratis', 'datum', 'sort', 'title'], { unique: false});
      store.createIndex("favorite_sort_title", ['favorite', 'sort', 'title'], { unique: false});

      var events = JSON.parse(getEvents());

      // Store events.
      for (var key in events) {
        var event = events[key];

        // Add favorite property.
        event.favorite = 0;

        console.log(event);

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
        $('#home .content .progress-wrapper').remove();
        var header = '<h2>' + $('#home .content h2').html() + '</h2>';
        $('#home .content').html(header + printTeaserHTML(results));
      }
    };
  }

  /*
   * Get the list of favorites.
   */
  function getFavoriteEvents() {
    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
    var now = parseInt(Math.round(+new Date()/1000));
    var index = store.index("favorite_sort_title");
    var lowerBound = [1, now];
    var upperBound = [1, (now * now)];
    var range = IDBKeyRange.bound(lowerBound, upperBound);
    var results = [];

    index.openCursor(range).onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      }
      else {
        // Todo: add days as subheaders.
        $('#favorites .content .progress-wrapper').remove();
        var header = '<h2>' + $('#favorites .content h2').html() + '</h2>';
        if (results.length > 0) {
          $('#favorites .content').html(header + printTeaserHTML(results));
        }
        else {
          $('#favorites .content').html(header + NO_RESULTS);
        }
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
    //console.log(cat_id);
    //console.log(date);
    //console.log(free);
    //console.log(loc_id);
    var results = [];
    var title;
    var index;
    var lowerBound;
    var upperBound;

    var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);

    //var index = store.index("datum", "start");
    //var range = IDBKeyRange.lowerBound(now);
    var date = parseInt(date);
    // If the category and date are set.
    if (cat_id) {
      index = store.index("cat_id_datum_sort_title");
      lowerBound = [cat_id, date, 0];
      upperBound = [cat_id, date, (date * date)];
      for (var key in CAT_IDS) {
        if (CAT_IDS[key] == cat_id) {
          title = CATEGORIES[key];
          break;
        }
      }
    }

    // If the location and date are set.
    if (loc_id) {
      index = store.index("loc_id_datum_sort_title");
      lowerBound = [loc_id, date, 0];
      upperBound = [loc_id, date, (date * date)];
      for (var key in LOC_IDS) {
        if (LOC_IDS[key] == loc_id) {
          title = LOCATIONS[key];
          break;
        }
      }
    }

    // If the free boolean and date are set.
    if (free) {
      index = store.index("gratis_datum_sort_title");
      lowerBound = [free, date, 0];
      upperBound = [free, date, (date * date)];
      title = "Gratis";
    }

    var range = IDBKeyRange.bound(lowerBound,upperBound);
    index.openCursor(range).onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      }
      else {
        // Add the headers.
        var header = '<h2>' + title + '</h2>';
        for (var key in DATES_INT) {
          if (DATES_INT[key] == date) {
            var niceDate = DATES_FULL[key];
            break;
          }
        }
        header += '<h2>' + niceDate + '</h2>';
        // Print the html.
        if (results.length > 0) {
          $('#filtered-events .content').html(header + printTeaserHTML(results));
        }
        else {
          $('#filtered-events .content').html(header + NO_RESULTS);
        }

      }
    };
  }

  /*
   * Read the events.json file and return it's content.
   */
  function getEvents() {
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
      output += '<div class="middle">' + event.titel + '</div>';
      if (event.favorite) {
        output += '<div class="right favorited"><a class="unfavorite" id=' + event.id + ' href="#">fav</a></div>';
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

    output += '<h2>' + event.titel + '</h2>';
    output += '<div class="content">';
    if (event.loc) {
      labels.push('Locatie');
      if (event.lat && event.lon) {
        info.push(event.loc + '<br /><a target="_blank" href="http://maps.google.com/?q=' + event.lat + ',' + event.lon + '">Toon op kaart</a>');
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
      info.push(day + ' ' + dayNumeric + ' ' + month + '<br />' + event.periode.split(':').join('u'));
    }
    if (event.prijs) {
      labels.push('Prijs');
      info.push(event.prijs);
    }
    if (event.prijs_vvk) {
      labels.push('Prijs (voorverkoop)');
      info.push(event.prijs_vvk);
    }
    if (event.gratis) {
      labels.push('Prijs');
      info.push('Gratis');
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
        omsch += '<br /><a target="_blank" href="' + event.url + '">' + event.url + '</a>';
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
   * Populate the categories and date popups based on the const arrays.
   */
  function populatePopups() {
    // Categories popup
    for (var key in CAT_IDS) {
      $('#categories-popup menu .scrollable').append('<button value="' + CAT_IDS[key] + '">' + CATEGORIES[key] + '</button>');
    }

    // Locations popup
    for (var key in LOC_IDS) {
      $('#locations-popup menu .scrollable').append('<button value="' + LOC_IDS[key] + '">' + LOCATIONS[key] + '</button>');
    }

    // Date popup
    for (var key in DATES_INT) {
      $('#dates-popup menu .scrollable').append('<button value="' + DATES_INT[key] + '">' + DATES_FULL[key] + '</button>');
    }
  }

  /*
   * Add event listeners for the navigation elements.
   */
  function addEventListeners () {

    /* Favorite an event */
    $('.content').on('click', 'a.favorite', function(event) {
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

      event.preventDefault();
      return false;
    });

    /* Unfavorite an event */
    $('.content').on('click', 'a.unfavorite', function(event) {
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

      event.preventDefault();
      return false;
    });

    /* Go to event detail page onclick */
    $('.content').on('click', '.teaser', function(event){
      $this = $(this);

      // Get the event id
      id = $this.attr('id').replace("event-","");

      // Query the database
      var store = db.transaction(DB_STORE_NAME, "readwrite").objectStore(DB_STORE_NAME);
      var range = IDBKeyRange.only(id);

      store.openCursor(range).onsuccess = function(event) {
        var cursor = event.target.result;
        $('#event-detail .content-wrapper').html(printDetailHTML(cursor.value));
        $('.page:visible').addClass('back').hide();
        $('#event-detail').show();
      };
    });

    /* Go back from the detail page */
    $('a.icon-back').click(function() {
      $('.page.back').show();
      $('#event-detail').hide();
    });

    /* Drawer navigation */
    $('#home-link').click(function() {
      $('.page').hide();
      getUpcomingEvents();
      $('#home').show();
    });
    $('#favorites-link, header .favorites').click(function() {
      $('.page').hide();
      getFavoriteEvents();
      $('#favorites').show();
    });
    $('#categories-link').click(function() {
      $('#categories-popup').show();
    });
    $('#locations-link').click(function() {
      $('#locations-popup').show();
    });
    $('#free-link').click(function() {
      $('#dates-popup').show();
      clearFilters();
      $('#dates-popup input[name=free]').val(1);
    });

    /* Cancel popup forms */
    $('button#cancel').click(function(event) {
      $(this).parents('.page').hide();
      event.preventDefault();
    });

    /* Category flow to filtered events*/
    $('#categories-popup button').not('#cancel').click(function() {
      var cat_id = $(this).attr('value');
      $(this).parents('.page').hide();
      $('#dates-popup').show();
      clearFilters();
      $('#dates-popup input[name=cat_id]').val(cat_id);
      return false;
    });

    /* Location flow to filtered events */
    $('#locations-popup button').not('#cancel').click(function() {
      var loc_id = $(this).attr('value');
      $(this).parents('.page').hide();
      $('#dates-popup').show();
      clearFilters();
      $('#dates-popup input[name=loc_id]').val(loc_id);
      return false;
    });

    /* Date navigation */
    $('#dates-popup button').not('#cancel').click(function() {
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

  // Clear the filter selections.
  function clearFilters() {
    $('#dates-popup input[name=cat_id], #dates-popup input[name=date], #dates-popup input[name=free], #dates-popup input[name=loc_id]').val('');
  }

  populatePopups();
  openDb(getUpcomingEvents);
  addEventListeners();
});
