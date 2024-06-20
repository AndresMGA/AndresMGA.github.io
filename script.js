let players = []

class MidiPlayer {
  constructor(mainWrapper, container, midiFile) {
    // set up properties
    this.mainWrapper = document.querySelector(mainWrapper);
    this.container = document.querySelector(container);
    this.midiFile = midiFile;
    this.player;

    this.seq;

    // create a main container
    this.mainContainer = this.createMainContainer();

    // move the passed container into the main container
    this.mainContainer.appendChild(this.container);


    // create the buttons wrapper
    this.buttons = this.createButtonWrapper();

    // create the buttons and tempo slider
    this.playBtn = this.createButton("play");
    this.pauseBtn = this.createButton("pause");
    this.stopBtn = this.createButton("stop");

    this.rewindBtn = this.createButton("rewind");
    this.forwardBtn = this.createButton("forward");


    this.loadFile();
  }

  // magenta functions ////////////////////////////////////////
  loadFile() {
    mm.blobToNoteSequence(this.midiFile)
      .then((s) => {
        this.seq = s;

        
        this.buttons.classList.remove("hide");
        console.log(s);
        this.loadSequence();
      })
      .catch((reason) => {
        alert("Failed to load MIDI file.");
        console.error(reason);
      });
  }

  checkPlayers() {
    console.log(players);
    if (players !== undefined) {
      for (let obj of players) {
        if (obj !== this && obj.player.isPlaying) {
          obj.player.stop();
        }
      }
    }
  }
  
  callback(note) {
    console.log(this.seq.notes.indexOf(note));
  }

  loadSequence() {
    let that = this;
    
    this.player = new mm.SoundFontPlayer(
      "https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus"
    );
    this.player.callbackObject = {
      run(note) {

        that.callback(note);
      },
      stop() {}
    };

    this.setListeners();
  }




  handlePlay() {
    this.checkPlayers();
    if (mm.Player.tone.Transport.loop) {
      if (this.player.getPlayState() === "paused") {
        this.player.stop();
      }
      // start playing from the first note of the loop
      this.player.start(this.seq, null, mm.Player.tone.Transport.loopStart);
    } else {
      if (this.player.getPlayState() === "paused") {
        this.player.resume();
      } else {
        this.player.start(this.seq);
      }
    }
    
    this.playBtn.classList.add("hide");
    this.pauseBtn.classList.remove("hide");
  }

  // setListeners ////////////////////////////////////////////////////
  setListeners() {
    let that = this;

    this.playBtn.addEventListener("click", (e) => {
      this.pauseBtn.classList.add("active");
      this.handlePlay();
    });

    this.pauseBtn.addEventListener("click", (e) => {
      e.target.classList.remove("active");
      this.player.pause();
      this.playBtn.classList.remove("hide");
      this.pauseBtn.classList.add("hide");
    });

    this.stopBtn.addEventListener("click", () => {
      if (this.player.isPlaying) {
        this.player.stop();
        this.playBtn.classList.remove("hide");
        this.pauseBtn.classList.add("hide");
        this.pauseBtn.classList.remove("active");
        this.container.scrollLeft = 0;
      }
    });


  }

  // constructor UI functions ////////////////////////////////////////


  createMainContainer() {
    let mc = document.createElement("div");
    mc.className = "container d-flex flex-column bd-highlight my-4";
    let mainContainer = this.container.parentNode;
    mainContainer.insertBefore(mc, this.container);
    return mc;
  }

  createButtonWrapper() {
    let wr = document.createElement("div");
    wr.className = "buttons hide";
    this.mainContainer.appendChild(wr);
    return wr;
  }

  createButton(txt) {
    let btn = document.createElement("i");

    switch (txt) {
      case "pause":
        btn.className = `fa-solid fa-circle-pause active hide ${txt}`;
        break;
      case "play":
        btn.className = `fa-solid fa-circle-play ${txt}`;
        break;
      case "rewind":
        btn.className = `fa-solid fa-backward ${txt}`;
        break;
      case "forward":
          btn.className = `fa-solid fa-forward ${txt}`;
          break;
      case "stop":
            btn.className = `fa-solid fa-refresh ${txt}`;
            break;


    }

    this.buttons.appendChild(btn);
    return btn;
  }




  createFileSelector() {
    // file selector wrapper
    let fs = document.createElement("div");
    fs.className = "file-select-wrapper input-group mb-3";
    // inner wrapper
    let cs = document.createElement("div");
    cs.className = "custom-file";
    // input field that needs to be returned
    let gf = document.createElement("input");
    gf.setAttribute("type", "file");
    gf.setAttribute("accept", ".mid");
    // label
    let lb = document.createElement("label");
    lb.className = "custom-file-label";
    lb.setAttribute("aria-describedby", "getFileAddOn");
    lb.textContent = "Choose midi file";
    cs.appendChild(lb);
    cs.appendChild(gf);
    fs.appendChild(cs);
    this.mainContainer.appendChild(fs);

    return gf;
  }
}

async function getInitialMidiFile(){
  const currentUrl = window.location.href;

// Create a URL object
const url = new URL(currentUrl);

// Get the query string part of the URL
const queryString = url.search; // This includes the '?' character

// Remove the '?' character if you just want the parameters
const queryParams = queryString.substring(1);

console.log(queryParams);
  let response = await fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.mid');
  const svgContainer = document.getElementById('mySvg');

  fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.svg')
    .then(response => response.text())
    .then(svgText => {
      svgContainer.innerHTML = svgText;
    })
    .catch(error => console.error('Error fetching SVG: ', error));
  let data = await response.blob();
  let container = document.createElement("div");

  let id = _.random(1, 1000000000);
  container.setAttribute("id", `mid-${_.random(1, 1000000000)}`);
  document.getElementById("main-container").appendChild(container);
  let obj = new MidiPlayer(
    "#main-container",
    `#${container.id}`,
    data
  );
  players.push(obj);
}

window.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById('get-file');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if( e.target.files.length === 0 ) return;
      let container = document.createElement('div')
      let id = _.random(1, 1000000000)
      container.setAttribute('id',`mid-${_.random(1, 1000000000)}`)
      document.getElementById('main-container').appendChild(container)
      let lastIndex = e.target.files.length-1
      let obj = new MidiPlayer('#main-container',`#${container.id}`,e.target.files[lastIndex])
      players.push(obj);
    });
  }
  getInitialMidiFile()
});

