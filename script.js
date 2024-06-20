let players = []

class MidiPlayer {
  constructor(  midiFile) {
    this.midiFile = midiFile;
    this.player;
    this.seq;
    this.mainContainer = document.getElementById("buttons-container")
    this.buttons = document.getElementById("buttons")
    this.playBtn = document.getElementById("play");
    this.pauseBtn =document.getElementById("pause");
    this.stopBtn = document.getElementById("stop");
    this.rewindBtn =document.getElementById("rewind");
    this.forwardBtn = document.getElementById("forward");
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
      }
    });
  }
}

async function fetchMidiFile(queryParams){
  let response = await fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.mid');
  let data = await response.blob();
  let obj = new MidiPlayer( data );
  players.push(obj);
}

async function fetchSVG(queryParams) {
 
    // Fetch the SVG file
    const response = await fetch('https://AndresMGA.github.io/scores/'+queryParams+'/file.svg');
    const svgText = await response.text();

    // Create a new SVG element
    const svgContainer = document.getElementById("svg-container");


    // Append the SVG text as a child of the container
    svgContainer.innerHTML = svgText;

    // Adjust SVG size to fit its container
    const svgElement = svgContainer.querySelector('svg');
    if (svgElement) {
      const containerWidth = svgContainer.clientWidth;
      const containerHeight = svgContainer.clientHeight;
      console.log(window.innerHeight)
      svgElement.setAttribute('width', "100%");
      svgElement.setAttribute('height', "800px");
    }
  }

  const currentUrl = window.location.href;
  const url = new URL(currentUrl);
  const queryString = url.search; 
  const queryParams = queryString.substring(1);
  fetchMidiFile(queryParams);
  fetchSVG(queryParams);


