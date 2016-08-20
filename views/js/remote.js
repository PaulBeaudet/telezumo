// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var control = {
    brain: null,
    bot: null,
    baseID: null,
    init: function(botID, type, brainID){                      // pass id of the bot you desire to control
        control.bot = botID;
        if(type){                                              // if this bot has a two parts
            control.baseID = type;                             // hold id of base in case is disconnects on us
            if(brainID){
                control.brain = brainID;
                sock.et.emit('own', control.brain);            // send control command to bot
            }
        }
        sock.et.emit('own', control.bot);                      // send control command to bot
        if(pages.userType === 'temp'){$('.view.find').hide();} // hide find bots if this is a temp user
        $('.tele.view').show();                                // show telepresence view
        $('#rvsLeft' ).on('mousedown touchstart', function(){control.send('remote', 'M1');});
        $('#down'    ).on('mousedown touchstart', function(){control.send('remote', 'M2');});
        $('#rvsRight').on('mousedown touchstart', function(){control.send('remote', 'M3');});
        $('#left'    ).on('mousedown touchstart', function(){control.send('remote', 'M4');});
        $('.tele'    ).on('mouseup touchend',     function(){control.send('remote', 'M5');});
        $('#stop'    ).on('click',                function(){control.send('remote', 'M5');});
        $('#right'   ).on('mousedown touchstart', function(){control.send('remote', 'M6');});
        $('#fwdLeft' ).on('mousedown touchstart', function(){control.send('remote', 'M7');});
        $('#up'      ).on('mousedown touchstart', function(){control.send('remote', 'M8');});
        $('#fwdRight').on('mousedown touchstart', function(){control.send('remote', 'M9');});
        // speed buttons
        $('#speed1').on('click', function(){control.send('remote', 'S1');});
        $('#speed2').on('click', function(){control.send('remote', 'S2');});
        $('#speed3').on('click', function(){control.send('remote', 'S3');});
        $('#speed4').on('click', function(){control.send('remote', 'S4');});
        $('#horn'  ).on('click', function(){control.send('remote', 'C1');});
        $('#disconnect').on('click touchstart', control.disconnect);
    },
    revoke: function(id, type){
        if(type === 'phone'){
            if(id === control.bot || id === control.brain){control.disconnect();}
        } else {
            $('#baseInterupt').show();  // show base disconnected (may reconnect)
        }
    }, // externally driven disconnect event
    disconnect: function(){
        control.bot = null;         // remove the id
        control.brain = null;       // remove brain, BRAINS!!!
        control.baseID = null;      // stop tracking finicy base
        $('.tele.view').hide();     // hide controlor view
        $('.find.view').show();     // show the ability to find more bots
        signal.disconnect();        // disconnect webRTC/video signal
        sock.et.emit('relinquish'); // signal relinquished control of bot
    },
    reconnect: function(newSocketId, type){
        if(type === control.baseID){
            control.bot = newSocketId;
            $('#baseInterupt').hide();
        }
    },
    send: function(type, data){
        if(control.brian && type !== 'remote'){ // if there is a brain relay everything to brain accept remote
            sock.et.emit(type, {to:control.brain, data:data});
        } else if (control.bot) {               // other wise just make sure we have a bot to relay to and send it over
            sock.et.emit(type, {to:control.bot, data:data});
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
            if (event.candidate != null) { control.send('ice', JSON.stringify(event.candidate)); }
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
            control.send('sdp', JSON.stringify(signal.peer.localDescription)); // send discription of connection type
        }, utils.error);
    },
    disconnect: function(){
        if(signal.peer){
            signal.peer.close(); // close peer connection
            signal.peer = null;  // set connection back to null in prep for a new one
        }
    }
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
    },
    dataDisplay: function(info){
        if(info.substring(1, 2) === '$'){
            var type = info.substring(2, 3);    // grab type of data this is to know where to display it
            var data  = info.substring(3);      // get rest of string
            if(type === 'C'){                   // compass case
                $('#compass').html(data);
            } else if (type === 'A'){           // accelerometer case
                $('#accelerometer').html(data);
            } else if (type === 'R'){           // reflectence case
                $('#reflectence').html(data);
            }
        } else {                                // in all other cases print text to serial element
            $('#serial').html(info);
        }
    }
}

var sock = {
    et: io(),
    control: function(){
        sock.et.on('data', utils.dataDisplay);
        sock.et.on('ice', function(info){signal.recepient(info, 'ice');}); // get ip info
        sock.et.on('sdp', function(info){signal.recepient(info, 'sdp');}); // get audeo video info
        sock.et.on('here', pages.list);                                    // list available bots when they call
    },
}

var pages = {
    userType: false,
    bots: [],
    botTypes: [],
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
        // $('.pair').hide();                                // TODO hide pair dialog
        var index = pages.bots.indexOf(bot.id);           // see if we have a button for this bot
        var id = bot.type;                                // denotes id of bot to this user
        if(bot.type === 'phone'){id = bot.type + '_' + index;}
        if(index === -1){                                 // given no bot of this id exist yet add one
            pages.bots.push(bot.id);                      // add new bot to personal list of bots
            pages.botTypes.push(bot.type);                // make array of bot types
            index = pages.bots.indexOf(bot.id);           // find index of new bot in list
            id = bot.type;
            if(bot.type === 'phone'){id = bot.type + '_' + index;}
            var button = $('<button/>').attr({            // create a new button element with attributes
                id: index,                                // attach id of button EG bot0, bot1
                class: "btn btn-md btn-success botbtn"    // bootstrap classes for looks sake
            });
            $('#bots').append(button);                    // attach button to page
        }
        SID = $('#' + index);                             // get button element
        SID.removeClass('btn-danger').addClass('btn-success').off();  // make sure succes button / old click state removed

        if(bot.status === 'open'){                        // case robot is free to be controled
            control.reconnect(bot.id, bot.type);          // check if bot needs to be reconnected
            SID.show().text(id+': available!');           // button text: show availbility
            SID.on('click', function(){control.init(bot.id, bot.type);});     // control the bot on click
        } else if(bot.status === 'taken') {
            if(pages.userType === 'admin'){                                   // if admin
                SID.on('click', function(){control.init(bot.id, bot.type);}); // can control bot even when taken
            }
            SID.text(id+': in use');                          // either case show robots in use
        } else if (bot.status === 'noBot'){                   // case the bot is without capability
            // if(control.bot === bot.id){control.disconnect();} // disconnect bot if it is down
            SID.text(id +': no body!').on('click', function(){pages.pair(bot.id, bot.type)}); // give ability to pair w/ a bot body
        } else if(bot.status === 'offline'){                  // case robot has disconnected
            control.revoke(bot.id, pages.botTypes[index]);     // offline for master? remove control
            pages.bots.splice(index, 1);                      // remove this bot from our list of bots
            pages.botTypes.splice(index, 1);                  // also remove bot type from our list
            SID.text('offline');                              // show as offline for a brief time
            setTimeout(function(){SID.remove();}, 1000);      // remove bot from list entirely when offline
        }
    },
    pair: function(brainID, type){
        $('.pair').show();                                    // prompt pair from existing bot list
        for ( var i = 0; pages.bots[i]; i++ ){                // for all of the detected bots
            if(pages.botTypes[i] === "phone"){
                $('#' + i ).removeClass('btn-success').addClass('btn-danger').off();
            } else {
                $('#' + i ).off().on('click', function(){control.init(pages.bots[i], pages.botTypes[i], brainID);});
            }
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready

