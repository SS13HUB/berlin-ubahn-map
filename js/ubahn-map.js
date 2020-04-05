var isMobile = window.mobileAndTabletcheck()
var container = d3.select('#ubahn-map');
var currentStation;
var width = isMobile ? window.devicePixelRatio * window.screen.width : screen.width;
var height = isMobile ? window.devicePixelRatio * window.screen.height : screen.height;

function getWikiData(station) {
  var wikiStation = station.name.replace(" ", "_").concat("_(Berlin_U-Bahn)");
  var wikiTitle = '<h1>' + station.name + '</h1>';
  var wikiCached = '<p class="cached">cached: ' + station.wiki_cache + '</p>';

  if (station.wiki_cache !== false && station.wiki_cache !== undefined) {
    $.ajax({
      url: 'articles/' + station.name + '.html',
      success: function(data) {
        showSidebar(wikiTitle + data + wikiCached)
      }
    });
  }

  else {
    $.ajax({
      url: 'https://en.wikipedia.org/w/api.php',
      data: {
        action: 'query',
        titles: wikiStation,
        redirects: 1,
        pithumbsize: 800,
        exsectionformat: "raw",
        prop: 'extracts|pageimages|info',
        inprop: 'url',
        format: 'json'
      },
      dataType: 'jsonp',
      success: function(data) {
        $('#sidebar').scrollTop(0);
        var resp = data.query.pages[Object.keys(data.query.pages)];
        var wikiImage = resp.thumbnail.source
        var wikiText = resp.extract
        var wikiUrl = resp.fullurl

        var formattedWikiText = wikiText
          .split('<h2><span id="References">References</span></h2>')[0]
          .split('<h2><span id="Gallery">Gallery</span></h2>')[0]

        var wikiData = wikiTitle +
          '<img src=' + '"' + wikiImage + '">' + formattedWikiText +
          '<a href="' + wikiUrl + '">' + wikiUrl + '</a>'
        showSidebar(wikiData)
      }
    });
  }
}

var map = d3
  .tubeMap()
  .width(width)
  .height(height)
  .on('click', function(station) {
    getWikiData(station);
    $('#about-button').text('?')
  });

d3.json('./json/berlin-ubahn.json').then(function(data) {
  container.datum(data).call(map);

  var svg = container.select('svg');

  zoom = d3
    .zoom()
    .scaleExtent([0.7, 5])
    .on('zoom', zoomed);

  var zoomContainer = svg.call(zoom);
  var initialScale = 1;
  var initialTranslate = [0, height / 25];

  zoom.scaleTo(zoomContainer, initialScale);
  zoom.translateTo(
    zoomContainer,
    initialTranslate[0],
    initialTranslate[1]
  );

  function zoomed() {
    svg.select('g').attr('transform', d3.event.transform.toString());
  }
});

function showSidebar(sidebarHtml) {
  $("#draggable-side").show();
  $("#sidebar-buttons").show();
  $("#sidebar").show();
  $("#about-content").hide();
  $('#wiki-content').html(sidebarHtml)
  $("#wiki-content").show();
}

function showAbout() {
  $("#wiki-content").hide();
  $('#about-content').show();
  $.ajax({
    url: 'about.html',
    success: function(data) {
      $('#about-content').html(data)
    }
  })
}

function showWiki() {
  $("#about-content").hide();
  $('#wiki-content').show();
}

function toggleAbout() {
  var currentText = $('#about-button').text().replace(/^\s+|\s+$/g, '')

  if (currentText == '?') {
    $('#about-button').text('i')
    showAbout()
  } else {
    $('#about-button').text('?')
    showWiki()
  }
}

$(document).ready(function() {
  $('#draggable-side').resizable({
    handles: 'e',
    alsoResize: "#close-button-container,#sidebar,#about-button-container"
  });

  $("#close-button").click(function() {
    $("#sidebar").hide();
    $("#draggable-side").hide();
    $("#sidebar-buttons").hide();
  });

  $("#about-button").click(function() {
    toggleAbout()
  })
});

