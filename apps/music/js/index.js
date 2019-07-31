/*

 Working version of player on http://tympanus.net/codrops/2015/03/10/creative-gooey-effects/ by Codrops.

*/

var audio = $('audio')[0],
    visualWidth = 318,
    visualHeight = 160,
    audioContext = new window.AudioContext(),
    source = audioContext.createMediaElementSource(audio),
    analyser = audioContext.createAnalyser();

source.connect(analyser);
analyser.connect(audioContext.destination);
analyser.fftSize = 2048;
analyser.minDecibels = -90;
analyser.maxDecibels = 0;

var bufferLength = analyser.frequencyBinCount,
    frequencyData = new Uint8Array(bufferLength);

var ScaleBar = {
  min: 0,
  max: visualHeight,
  sum: 0,
  get: function(fromMin, fromMax, valueIn) {
    var toMin = ScaleBar.min,
        toMax = ScaleBar.max;
    //fromMin = fromMax * .4;
    var result = ((toMax - toMin) * (valueIn - fromMin)) / (fromMax - fromMin) + toMin;
    return Math.abs(toMax - result);
  }
};

var MusicVisuals = {
  call: null,
  start: function() {
    analyser.getByteFrequencyData(frequencyData);
    
    var frequencyWidth = (visualWidth / bufferLength) * 2, frequencyHeight = 0, x = 0, scales = [], shadows = [], fd = [];
    
    var fdMin = Math.min.apply(Math,frequencyData);
    var fdMax = Math.max.apply(Math,frequencyData);
    
    var bars = 0;
    var numberOfBars = 16;
    var steps = numberOfBars;
    
    for (var increment = 0; increment < numberOfBars * 10; increment += 10) {
      frequencyHeight = ScaleBar.get(fdMin, fdMax, frequencyData[increment]);
      var y = visualHeight - frequencyHeight;
      
      bars++;
      
      if (increment < 16) {
        scales.push(frequencyHeight / 32);
      }
      
      fd.push(frequencyData[increment]);
      
      if (bars > 32) {
        bars = 1;
      }
      
      $(".player-spectrum-bar:nth-child("+bars+")").css('transform', 'translateY(-' + y + 'px');
      
    }
    
    var sc = scales.reduce(function(pv, cv) { return pv + cv; }, 0) / scales.length;
    ScaleBar.sum = fd.reduce(function(pv, cv) { return pv + cv; }, 0) / fd.length;
    sc *= 0.25;
  //document.querySelector('.player-cover').style.transform = 'scale('+ sc +')';
    MusicVisuals.call = requestAnimationFrame(MusicVisuals.start);
  },
  stop: function() {
    cancelAnimationFrame(MusicVisuals.call);
  }
};


function playSong(id) {
  WebAPI.tracks(id,function(json) {
    var url = json.preview_url;
    if (url === null) {
      alert("Preview not available for this song. :(");
      return;
    }
    document.querySelector('.player-artist').innerHTML = json.artists[0].name;
    //document.querySelector('.album').innerHTML = json.album.name;
    document.querySelector('.player-song-name').innerHTML = json.name;
    //document.querySelector('.background img').src = json.album.images[0].url;
    document.querySelector('.player-cover img').src = json.album.images[0].url;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    xhr.onload = function(e) {
      if (this.status === 200) {
        var paused = audio.paused;
        audio.src = URL.createObjectURL(this.response);
        audio.oncanplay = function() {
          if (!paused) {
            this.play();
          }
        };
        newSong = false;
      }
    };
    xhr.send();
  }, function(e) {
    console.log(e);
  });
}

$('.play-pause-button').on('click', function() {
  $('audio')[0].paused ? $('audio')[0].play() : $('audio')[0].pause();
});

$('audio').on('play', function() {
  $('.play-pause-button i').removeClass('fa-play');
  $('.play-pause-button i').addClass('fa-pause');
  MusicVisuals.start();
});

$('audio').on('pause', function() {
  $('.play-pause-button i').removeClass('fa-pause');
  $('.play-pause-button i').addClass('fa-play');
  MusicVisuals.stop();
});

$('#search-button').on('click', function() {
  WebAPI.findTrack($('#search').val(), function(json) {
    var id = json.tracks.items[0].id;
    playSong(id);
  }, function(e) {
      alert(e);
  });
});

playSong('58s6EuEYJdlb0kO7awm3Vp');

// MP3 load

$('#open-file-button').on('click', function() {
  $('#file-open').click();
});

$('#file-open').on('change', function(e) {
  var file = e.target.files[0];
  audio.src = URL.createObjectURL(file);
});