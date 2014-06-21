<?php

// This converts the events from the open data website of Gent.

// http://datatank.gent.be/Toerisme/GentseFeestenEvents.json
// http://datatank.gent.be/Cultuur-Sport-VrijeTijd/GentseFeestenLocaties.json
// http://datatank.gent.be/Toerisme/GentseFeestenCategorie%C3%ABn.json
// http://datatank.gent.be/Cultuur-Sport-VrijeTijd/GentseFeestenData.json

// Download the events file locally in a file called 'events-to-parse.json'.
// You can ignore the other files, their data is small and defined in the
// arrays in the app.

// Get content.
if (!file_exists('events-to-parse.json')) {
  print "'events-to-parse.json' file not found.\n";
  exit;
}

$json = file_get_contents('events-to-parse.json');

// Decode.
$decode = json_decode($json);

$number = 0;
$events = array();
$unique_dates = array();
foreach ($decode->GentseFeestenEvents as $key => $event) {

  //print_r($event);
  //echo "\n --------------------------------------------------- \n";
  //continue;

  // The data contains too much info
  if ($event->datum < (1405641600 - 7200) || $event->datum > 1406584800) {
    continue;
  }

  // We build a new event object.
  $event_cleaned = new stdclass();

  // Basic properties.
  $event_cleaned->id = $event->id;
  // For some reason, using 'title' this whole thing breaks ...
  $event_cleaned->titel = $event->titel;
  $event_cleaned->prijs_vvk = $event->prijs_vvk;
  $event_cleaned->lat = $event->latitude;
  $event_cleaned->lon = $event->longitude;
  $event_cleaned->gratis = $event->gratis;
  $event_cleaned->url = $event->url;
  $event_cleaned->cat = $event->categorie_naam;
  $event_cleaned->cat_id = $event->categorie_id;
  $event_cleaned->loc_id = $event->locatie_id;
  $event_cleaned->omsch = $event->omschrijving;

  // Location.
  $loc = trim($event->locatie);
  if (!empty($event->straat)) {
    $street = trim($event->straat);
    if (!empty($event->huisnummer)) {
      $street .= " " . $event->huisnummer;
    }
    $street = trim($street);
    if ($street != $loc) {
      $loc .= "\n" . $street;
    }
  }
  $event_cleaned->loc = $loc;

  // Dates.
  $event_cleaned->datum  = $event->datum + 7200;
  $hour_string = "";
  if (!empty($event->startuur)) {
    $hour_string = $event->startuur . " - " . $event->einduur;
  }
  $event_cleaned->periode = $hour_string;
  $event_cleaned->start = $event->startuur;

  $sort = $event->tijdstip_sortering;
  $timestamp = 0;
  $hours = 0;
  if (!empty($sort)) {
    $minutes = substr($sort, -2);
    if (strlen($sort) == 3) {
      $hours = substr($sort, 0, 1);
      echo "$hours - $sort\n";
    }
    else {
      $hours = substr($sort, 0, 2);
      echo "$hours - $sort\n";
    }
    $total = ($hours * 3600) + $minutes;
    $timestamp = $event_cleaned->datum + $total + 7200; // + two hours because datum is in GMT.
  }
  $event_cleaned->sort = $timestamp;

  // Prijs.
  if (!empty($event->prijs)) {
    $event_cleaned->prijs = "€ " . $event->prijs;
  }

  // Keep an array of unique dates.
  $udate = $event_cleaned->datum;
  if (!isset($unique_dates[$udate])) {
    $unique_dates[$udate] = date('d m Y', $udate);
  }

  // Add to array list.
  $events[] = $event_cleaned;

}

//krsort($unique_dates);
//print_r($unique_dates);

// Write to file.
file_put_contents('data/events.json', json_encode($events));
