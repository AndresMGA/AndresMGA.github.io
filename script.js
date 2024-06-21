
let timestampMap = new Map();
let player = new mm.SoundFontPlayer("https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus");
let seq= null;
let tempo = 0;
let mainContainer = document.getElementById("buttons-container")
let buttons = document.getElementById("buttons")
let playBtn = document.getElementById("play");
let pauseBtn =document.getElementById("pause");
let stopBtn = document.getElementById("stop");
let rewindBtn =document.getElementById("rewind");
let forwardBtn = document.getElementById("forward");


function callback(note) {
  
  timestampMap.forEach((timestamp, element) => {
    if (timestamp < note.startTime) {
      element.setAttribute('fill', 'black');
      element.setAttribute('stroke', 'black');
    }
    else if (timestamp == note.startTime) {
      element.setAttribute('fill', 'red');
      element.setAttribute('stroke', 'red');
      return;
    }
  });
}

function handlePlay() {
  if (player.isPlaying) {
    player.stop();
  }
  if (player.getPlayState() === "paused") {
      player.resume();
  } else {
      player.start(seq);
  }
  playBtn.classList.add("hide");
  pauseBtn.classList.remove("hide");
}

async function fetchFiles(queryParams){
  let response = await fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.mid');
  let data = await response.blob();
  seq = await mm.blobToNoteSequence(data)
  tempo = seq.tempos[0].qpm
  response = await fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.svg');
  const svgText = await response.text();
  const svgContainer = document.getElementById("svg-container");
  svgContainer.innerHTML = svgText;
  const svgElement = svgContainer.querySelector('svg');
  svgElement.setAttribute('width', "100%");
  svgElement.setAttribute('height', window.innerHeight);
  const timestampElements = svgElement.querySelectorAll('[timestamp]');
  const microsecondsPerMinute = 60000000;
  const microsecondsPerQuarterNote = microsecondsPerMinute / tempo;
  const microsecondsPerTick = microsecondsPerQuarterNote / 480;

  timestampElements.forEach(element => {
    const timestamp = parseInt(element.getAttribute('timestamp'), 10);
    let timestamp_seconds = (timestamp * microsecondsPerTick) / 1000000;
    timestamp_seconds = Number(timestamp_seconds.toFixed(3));
    timestampMap.set(element, timestamp_seconds);
  });

  const sortedTimestampArray = Array.from(timestampMap.entries()).sort((a, b) => a[1] - b[1]);
  timestampMap = new Map(sortedTimestampArray);

  console.log('Timestamp Map:', timestampMap);



}


  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const queryString = url.search; 
  const queryParams = queryString.substring(1);

  fetchFiles(queryParams);

  
  playBtn.addEventListener("click", (e) => {
    pauseBtn.classList.add("active");
    handlePlay();
  });

  pauseBtn.addEventListener("click", (e) => {
    e.target.classList.remove("active");
    player.pause();
    playBtn.classList.remove("hide");
    pauseBtn.classList.add("hide");
  });

  stopBtn.addEventListener("click", () => {
    if (player.isPlaying) {
      player.stop();
      playBtn.classList.remove("hide");
      pauseBtn.classList.add("hide");
      pauseBtn.classList.remove("active");
    }
  });

  player.callbackObject = {
    run(note) {
      callback(note);
    },
    stop() {}
  };


