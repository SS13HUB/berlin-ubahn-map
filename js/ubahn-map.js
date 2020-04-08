//naive way of assuming mobile
var isMobile = window.screen.width < window.screen.height ? true : false

var container = d3.select('#ubahn-map');
var currentStation;
var width = isMobile ? window.devicePixelRatio * window.screen.width : screen.width;
var height = isMobile ? window.devicePixelRatio * window.screen.height : screen.height;
var meta;

d3.json('./json/meta.json').then(function(data) {
  meta = data;
})

function imageName(str) {
  var umlautMap = {
    '\u00dc': 'UE',
    '\u00c4': 'AE',
    '\u00d6': 'OE',
    '\u00fc': 'ue',
    '\u00e4': 'ae',
    '\u00f6': 'oe',
    '\u00df': 'ss',
  }

  return str
    .replace(' ', '_')
    .replace(/[\u00dc|\u00c4|\u00d6][a-z]/g, function(a) {
      var big = umlautMap[a.slice(0, 1)];
      return big.charAt(0) + big.charAt(1).toLowerCase() + a.slice(1);
    })
    .replace(new RegExp('['+Object.keys(umlautMap).join('|')+']','g'),
      function(a) { return umlautMap[a] }
    );
}

function getWikiData(station) {
  var wikiStation = station.name.replace(" ", "_").concat("_(Berlin_U-Bahn)");
  var wikiTitle = '<h1>' + station.name + '</h1>';
  var wikiCached = meta[station.name].wiki_cache
  var note = meta[station.name].note ? '<br/>Note: ' + meta[station.name].note : ''

  if (wikiCached !== false && wikiCached !== undefined) {
    preloadImage('articles/images/' + imageName(station.name) + '.jpg')

    var addendum = '<p class="addendum">Cached: ' + wikiCached + note + '</p>';

    $.ajax({
      url: 'articles/html/' + station.name + '.html',
      success: function(data) {
        showSidebar(wikiTitle + data + addendum)
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

        function saveData(data, fileName) {
            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";

            var json = JSON.stringify(data),
                blob = new Blob([data], {type: "text/html;charset=utf-8"}),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        saveData(
          '<img src=' + '"' + wikiImage + '">' + formattedWikiText +
          '<a href="' + wikiUrl + '">' + wikiUrl + '</a>', station.name + '.html'
        )

        showSidebar(wikiData)
      }
    });
  }
}

function preloadImage(url) {
  var img = new Image();
  img.src = url;
  return img.src
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

