var h = window.screen.height;
var w = window.screen.width;

if(h>w){
     w = window.screen.height;
     h = window.screen.width;
}


vw = Math.round((h/9)*16);
var left = Math.round((w-vw)/2)+'px';

var containerDiv = document.createElement('div');
containerDiv.id = 'container';
containerDiv.style.position = 'fixed';
containerDiv.style.top = '0px';
containerDiv.style.left = '0px';
containerDiv.style.width = w+'px';
containerDiv.style.height = h+'px';
document.body.appendChild(containerDiv);

var playerDiv = document.createElement('div');
playerDiv.id = 'player';
playerDiv.style.position = 'fixed';
playerDiv.style.top = '0px';
playerDiv.style.left = left;
playerDiv.style.width = vw+'px';
playerDiv.style.height = h+'px';
containerDiv.appendChild(playerDiv);

var overlayDiv = document.createElement('div');
overlayDiv.id = 'overlay';
overlayDiv.style.position = 'fixed';
overlayDiv.style.top = '0px';
overlayDiv.style.left = left;
overlayDiv.style.width = vw+'px';
overlayDiv.style.height = h+'px';
overlayDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.0)'; // Semi-transparent black overlay
containerDiv.appendChild(overlayDiv);

var buttons_top = Math.round(h*0.78)+'px';
var settingsBut = document.createElement('i');
settingsBut.id = 'fs';
settingsBut.className = "buttons fa-solid fa-gear fs"
settingsBut.style.fontSize = "64px"
settingsBut.style.position = 'fixed';
settingsBut.style.top = buttons_top
settingsBut.style.left = Math.round(w*0.87)+'px';
containerDiv.appendChild(settingsBut);

var playBut = document.createElement('i');
playBut.id = 'play';
playBut.className = "buttons fa-solid fa-circle-play play"
playBut.style.fontSize = "64px"
playBut.style.position = 'fixed';
playBut.style.top = buttons_top
playBut.style.left = Math.round(w*0.03)+'px';
containerDiv.appendChild(playBut);

var pauseBut = document.createElement('i');
pauseBut.id = 'pause';
pauseBut.className = "buttons fa-solid fa-circle-pause active hide pause"
pauseBut.style.fontSize = "64px"
pauseBut.style.position = 'fixed';
pauseBut.style.top = buttons_top
pauseBut.style.left = Math.round(w*0.03)+'px';
containerDiv.appendChild(pauseBut);





// Create a variable to hold the YouTube player
var player, player2;
var lock=0;
var pauseTime=0
var userRate = 1
var userMute = 0
// This function creates an <iframe> (and YouTube player) after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: h,
        width: vw,
        videoId: 'pGX93MOvHps', // Replace with your YouTube video ID
        playerVars: {
            'controls': 0, // Hide YouTube controls
            'modestbranding': 1, // Hide YouTube logo
            'rel':0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    
}

function userSettings(){
    lock=0;
    player.setPlaybackRate(userRate);
 
    if(!userMute){
         player.unMute();
       
    }
    else{
        player.mute();
       
    }

}
// The API will call this function when the video player is ready.
function onPlayerReady(event) {w
    
    
        player.setPlaybackRate(0);
     
        player.mute();
      
        player.seekTo(5, true);
     
        pauseTime = 3;
        lock=1;
        logTime();

    settingsBut.addEventListener('click', function() {
       
            
       
        
    //toggleFullscreen();
});
    // Event listeners for custom controls
    document.getElementById('play').addEventListener('click', function() {
        userSettings();
        player.playVideo();
        playBut.classList.add("hide");
        pauseBut.classList.remove("hide");
     
    });

    document.getElementById('pause').addEventListener('click', function() {
        player.setPlaybackRate(0);
        
        player.mute();
       
        pauseTime = player.getCurrentTime();
        lock=1;
        playBut.classList.remove("hide");
        pauseBut.classList.add("hide");
    });

    document.getElementById('stop').addEventListener('click', function() {
        
        player.setPlaybackRate(0);
       
        player.mute();
       
        pauseTime = 3;
        lock=1;


    });

    document.getElementById('mute').addEventListener('click', function() {
        userMute = 1
        player.mute();
        
    });

    document.getElementById('unmute').addEventListener('click', function() {
        userMute = 0
        player.unMute();
        
    });

    document.getElementById('seek').addEventListener('click', function() {
        userSettings();
        player.seekTo(30, true);
      
    });

    document.getElementById('slow').addEventListener('click', function() {
        userRate = 0.5
        player.setPlaybackRate(userRate);
     
    });

    document.getElementById('normal').addEventListener('click', function() {
        userRate = 1
        player.setPlaybackRate(userRate);
       
        logSubtitles();
    });

    document.getElementById('fast').addEventListener('click', function() {
        userRate = 2
        player.setPlaybackRate(userRate);
       
    });

    document.getElementById('volume').addEventListener('input', function() {
        player.setVolume(this.value);
        
    });

    // Start logging time once the player is ready and playing
    
}

// The API calls this function when the player's state changes.
function onPlayerStateChange(event) {
 
    // You can handle different player states here if needed
}

// Log the current time of the video every 100 milliseconds
function logTime() {
    setInterval(function() {
        if (lock){
                player.seekTo(pauseTime,true);
               
                return;
            }
        if (player && player.getPlayerState() == YT.PlayerState.PLAYING) {
            currTime=player.getCurrentTime();
            //console.log('Current time: ' + player.getCurrentTime() + ' seconds');

        }
    }, 40);
}

function logSubtitles() {
    var captions = player2.getVideoEmbedCode()
    console.log(captions);
    // if (captions) {
    //     captions.tracklist.forEach(function(track) {
    //         console.log('Track ID:', track.trackId);
    //         console.log('Language:', track.language);
    //         console.log('Kind:', track.kind);
    //         console.log('Label:', track.label);
    //         console.log('Mode:', track.mode);
    //         console.log('Cues:', track.cues);
    //     });
    // } else {
    //     console.log('No captions or subtitles available.');
    // }
}

document.addEventListener('click', function(event) {
    var x = event.clientX;
    var y = event.clientY;

    console.log('Clicked at coordinates: X = ' + x + ', Y = ' + y);

    var clickInfoElement = document.getElementById('clickInfo');
    if (clickInfoElement) {
        clickInfoElement.textContent = 'Clicked at coordinates: X = ' + x + ', Y = ' + y;
    }
});



function toggleFullscreen() {
   
    if (!document.fullscreenElement) {
        if (player.requestFullscreen) {
            player.requestFullscreen();
        } else if (player.mozRequestFullScreen) { // Firefox
            player.mozRequestFullScreen();
        } else if (player.webkitRequestFullscreen) { // Chrome, Safari, Opera
            player.webkitRequestFullscreen();
        } else if (player.msRequestFullscreen) { // IE/Edge
            player.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { // Chrome, Safari, Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { // IE/Edge
            document.msExitFullscreen();
        }
    }
}

containerDiv.webkitRequestFullscreen();
// function updateOrientationStatus() {
//     var orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
    
    
//     if (orientation) {
//         statusElement.innerText = 'Orientation: ' + orientation.type;
//     } else if (window.orientation !== undefined) {
//         var orientationType;
//         switch (window.orientation) {
//             case 0:
//                 orientationType = 'portrait-primary';
//                 break;
//             case 90:
//                 orientationType = 'landscape-primary';
//                 break;
//             case 180:
//                 orientationType = 'portrait-secondary';
//                 break;
//             case -90:
//                 orientationType = 'landscape-secondary';
//                 break;
//             default:
//                 orientationType = 'unknown';
//         }
//         playBut.innerText =  orientationType;
//     } else {
//         playBut.innerText = 'Orientation not supported';
//     }
// }

// // Update the orientation status on page load
// updateOrientationStatus();

// Add event listener for orientation changes
// if (screen.orientation) {
//     screen.orientation.addEventListener('change', updateOrientationStatus);
// } else {
//     window.addEventListener('orientationchange', updateOrientationStatus);
// }