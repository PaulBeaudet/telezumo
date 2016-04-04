// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var control = {
    bot: null,
    init: function(id){                                   // pass id of the bot you desire to control
        control.bot = id;
        if(pages.userType === 'temp'){$('.view').hide();} // hide find bots if this is a temp user
        $('.tele.view').show();                           // show telepresence view
        sock.et.emit('own', control.bot);                 // send control command to bot
        sock.control();                                   // create socket event listeners for robot feedback
        video.init();                                     // try to get user media and start video telepresence
        $('#rvsLeft').on('mousedown touchstart', function(){control.remote('M1');});
        $('#down').on('mousedown touchstart', function(){control.remote('M2');});
        $('#rvsRight').on('mousedown touchstart', function(){control.remote('M3');});
        $('#left').on('mousedown touchstart', function(){control.remote('M4');});
        $('.tele').on('mouseup touchend', function(){control.remote('M5');});
        $('#stop').on('click', function(){control.remote('M5');});
        $('#right').on('mousedown touchstart', function(){control.remote('M6');});
        $('#fwdLeft').on('mousedown touchstart', function(){control.remote('M7');});
        $('#up').on('mousedown touchstart', function(){control.remote('M8');});
        $('#fwdRight').on('mousedown touchstart', function(){control.remote('M9');});
        // speed buttons
        $('#speed1').on('click', function(){control.remote('S1');});
        $('#speed2').on('click', function(){control.remote('S2');});
        $('#speed3').on('click', function(){control.remote('S3');});
        $('#speed4').on('click', function(){control.remote('S4');});
        $('#videoBTN').on('click', function(){signal.peerConnect(true);});
        $('#disconnect').on('click', control.remove);
    },
    remote: function(command){
        sock.et.emit('remote', {id: control.bot, cmd:command});
    },
    remove: function(id){
        var robot = id || control.bot; // refer to ourselves if no param
        if(robot === control.bot){     // we talking about robot this user is controlling?
            control.bot = null;        // remove the id
            $('.tele.view').hide();    // hide controlor view
            $('.find.view').show();    // show the ability to find more bots
        }
    }
}

// simplified adapter.js shims for webRTC browser differances
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.URL = window.URL || window.webkitURL;

var signal = {
    peer: null,
    peerConnect: function(amIfirst){
        signal.peer = new window.RTCPeerConnection({ 'iceServers': [{'url': 'stun:stun.l.google.com:19302'}] });
        signal.peer.onicecandidate = function (event) { // on address info being introspected from external "stun" server
            if (event.candidate != null) { sock.et.emit('ice', JSON.stringify(event.candidate)); }
        }; // null === finished finding info to describe ones own address, ie "canidate" address paths
        signal.peer.onaddstream = video.remoteStream;  // display remote video stream when it comes in
        signal.peer.addStream(video.stream);           // make our video stream sharable
        if(amIfirst){ signal.peer.createOffer(signal.onSession, utils.error);}
    },
    recepient: function(info, type){
        if(!signal.peer){signal.peerConnect(false);} // start peer connection if someone is calling
        if(type === 'ice'){                          // given adress info from remote is being handled
            signal.peer.addIceCandidate(new window.RTCIceCandidate(JSON.parse(info))); // add address info
        } else { // otherwise we are getting signal type data i.e. audeo video codec description
            signal.peer.setRemoteDescription(new window.RTCSessionDescription(JSON.parse(info)), function(){
                signal.peer.createAnswer(signal.onSession, utils.error);
            }, utils.error); // try to find common ground on codecs
        }
    },
    onSession: function(info){
        signal.peer.setLocalDescription(info, function(){
            sock.et.emit('sdp', JSON.stringify(signal.peer.localDescription)); // send discription of connection type
        }, utils.error);
    },
}

var video = {
    stream: null,
    init: function(){
        if(navigator.getUserMedia){
            navigator.getUserMedia({video: true, audio: true,}, function(stream){
                video.stream = stream;
            }, utils.error);
        } else {
            utils.error('telepresence not supported in this browser');
        }

    },
    remoteStream: function(event){
        document.getElementById('remoteVid').src = window.URL.createObjectURL(event.stream);
    }
}

var utils = {
    error: function(err){
        console.log(err);
        $('#err').text('error:' + err);
    }
}

var sock = {
    et: io(),
    first: null,
    control: function(){
        sock.et.on('data', function(info){$('#sensors').text(info);});
        sock.et.on('ice', function(info){signal.recepient(info, 'ice');}); // get ip info
        sock.et.on('sdp', function(info){signal.recepient(info, 'sdp');}); // get audeo video info
    }
}

var pages = {
    userType: false,
    init: function(){
        pages.userType = $('#auth').text();
        if(pages.userType === 'false'){
            $('.login.view').show();
        } else {
            $('.find.view').show();                                           // show bot list view
            sock.et.on('here', pages.list);                                   // list available bots when they call
            sock.et.emit('botFind');                                          // call for intial bot list
            $('#findBots').on('click', function(){sock.et.emit('botFind');}); // provide ability to refresh list
        }
    },
    list: function(bot){           // adds bot status to a list of buttons when they call us
        if(!$('#'.bot.id)){        // given no button exist add one
            $('#bots').append('<li><button id='+bot.id+' class="btn btn-lg btn-success></button></li>');
        }                          // add bot control button
        if(bot.status === 'open'){ // in the case robot is free to be controled
            $('#'+bot.id).text('bot available!');                         // button text: show availbility
            $('#'+bot.id).off().on('click', function(){control.init(bot.id);}); // control the bot on click
        } else if(bot.status === 'taken') {
            control.remove(bot.id);                           // offline for master? remove control
            $('#'+bot.id).off();                              // remove control click event for temp
            if(pages.userType = 'admin'){                     // if admin
                $('#'+bot.id).on('click', function(){control.init(bot.id);}); // can control bot even when taken
            }
            $('#'+bot.id).text('in use');                     // either case show robots in use
        } else if(bot.status === 'offline'){                  // case robot has disconnected
            control.remove(bot.id);                                // offline for master? remove control
            $('#'+bot.id).off().text('offline');                   // show as offline for a brief time
            setTimeout(function(){$('#'+bot.id).remove();}, 5000); // remove bot from list entirely when offline
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready
