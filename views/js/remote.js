// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var control = {
    bot: null,
    init: function(id){                                   // pass id of the bot you desire to control
        control.bot = id;
        if(pages.userType === 'temp'){$('.view.find').hide();} // hide find bots if this is a temp user
        $('.tele.view').show();                           // show telepresence view
        sock.et.emit('own', control.bot);                 // send control command to bot
        $('#rvsLeft').on('mousedown touchstart', function(){sock.send('remote', 'M1');});
        $('#down').on('mousedown touchstart', function(){sock.send('remote', 'M2');});
        $('#rvsRight').on('mousedown touchstart', function(){sock.send('remote', 'M3');});
        $('#left').on('mousedown touchstart', function(){sock.send('remote', 'M4');});
        $('.tele').on('mouseup touchend', function(){sock.send('remote', 'M5');});
        $('#stop').on('click', function(){sock.send('remote', 'M5');});
        $('#right').on('mousedown touchstart', function(){sock.send('remote', 'M6');});
        $('#fwdLeft').on('mousedown touchstart', function(){sock.send('remote', 'M7');});
        $('#up').on('mousedown touchstart', function(){sock.send('remote', 'M8');});
        $('#fwdRight').on('mousedown touchstart', function(){sock.send('remote', 'M9');});
        // speed buttons
        $('#speed1').on('click', function(){sock.send('remote', 'S1');});
        $('#speed2').on('click', function(){sock.send('remote', 'S2');});
        $('#speed3').on('click', function(){sock.send('remote', 'S3');});
        $('#speed4').on('click', function(){sock.send('remote', 'S4');});
        $('#horn').on('click', function(){sock.send('remote', 'C1');});
        $('#disconnect').on('click touchstart', control.disconnect);
    },
    revoke: function(id){          // externally driven disconnect event
        if(id === control.bot){control.disconnect();}
    },
    disconnect: function(){
        control.bot = null;         // remove the id
        $('.tele.view').hide();     // hide controlor view
        $('.find.view').show();     // show the ability to find more bots
        sock.et.emit('relinquish'); // signal relinquished control of bot
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
            if (event.candidate != null) { sock.send('ice', JSON.stringify(event.candidate)); }
        }; // null === finished finding info to describe ones own address, ie "canidate" address paths
        signal.peer.onaddstream = video.remoteStream;          // display remote video stream when it comes in
        if(video.stream){signal.peer.addStream(video.stream);} // make our video stream sharable
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
            sock.send('sdp', JSON.stringify(signal.peer.localDescription)); // send discription of connection type
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
        } else { utils.error('telepresence not supported in this browser'); }
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
    control: function(){
        sock.et.on('data', function(info){$('#sensors').text(info);});
        sock.et.on('ice', function(info){signal.recepient(info, 'ice');}); // get ip info
        sock.et.on('sdp', function(info){signal.recepient(info, 'sdp');}); // get audeo video info
        sock.et.on('here', pages.list);                                    // list available bots when they call
    },
    send: function(type, data){
        if(control.bot){sock.et.emit(type, {to:control.bot, data:data});}
    }
}

var pages = {
    userType: false,
    bots: [],
    init: function(){
        pages.userType = $('#auth').text();
        if(pages.userType === 'false'){
            $('.login.view').show();
        } else {
            sock.control();                               // create socket on listen events
            video.init();                                 // potentially get video stream
            $('.find.view').show();                       // show bot list view
            sock.et.emit('botFind');                      // call for intial bot list
        }
    },
    list: function(bot){                                  // makes bot button list as they call us
        var index = pages.bots.indexOf(bot.id);           // see if we have a button for this bot
        var id = 0;                                       // denotes id of bot to this user
        if(index === -1){                                 // given no bot of this id exist yet add one
            pages.bots.push(bot.id);                      // add new bot to personal list of bots
            index = pages.bots.indexOf(bot.id);           // find index of new bot in list
            id = 'bot' + index;                           // create bot id based on list number
            var button = $('<button/>').attr({            // create a new button element with attributes
                id: id,                                   // attach id of button EG bot0, bot1
                class: "btn btn-md btn-success"           // bootstrap classes for looks sake
            });
            $('#bots').append(button);                    // attach button to page
        }
        id = '#bot' + index;
        if(bot.status === 'open'){                        // case robot is free to be controled
            $(id).show().text(id+': available!');         // button text: show availbility
            $(id).off().on('click', function(){control.init(bot.id);}); // control the bot on click
        } else if(bot.status === 'taken') {
            $(id).off();                                   // remove control click event for temp
            if(pages.userType === 'admin'){                // if admin
                $(id).on('click', function(){control.init(bot.id);}); // can control bot even when taken
            }
            $(id).text(id+':in use');                      // either case show robots in use
        } else if (bot.status === 'down'){                 // case the bot is without capability
            if(control.bot === bot.id){control.disconnect();} // disconnect bot if it is down
            $(id).off().text(id +': inoperrable');         // show bot is not able to be controled
        } else if(bot.status === 'offline'){               // case robot has disconnected
            control.revoke(bot.id);                        // offline for master? remove control
            pages.bots.splice(index, 1);                   // remove this bot from our list of bots
            $(id).off().text('offline');                   // show as offline for a brief time
            setTimeout(function(){$(id).remove();}, 5000); // remove bot from list entirely when offline
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready
