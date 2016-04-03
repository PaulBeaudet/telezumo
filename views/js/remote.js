// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

// simplified adapter.js shims for webRTC browser differances
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.URL = window.URL || window.webkitURL;

var control = {
    init: function(){
        $('#rvsLeft').on('mousedown touchstart', function(){sock.et.emit('remote', 'M1');});
        $('#down').on('mousedown touchstart', function(){sock.et.emit('remote', 'M2');});
        $('#rvsRight').on('mousedown touchstart', function(){sock.et.emit('remote', 'M3');});
        $('#left').on('mousedown touchstart', function(){sock.et.emit('remote', 'M4');});
        $('.tele').on('mouseup touchend', function(){sock.et.emit('remote', 'M5');})
        $('#stop').on('click', function(){sock.et.emit('remote', 'M5');});
        $('#right').on('mousedown touchstart', function(){sock.et.emit('remote', 'M6');});
        $('#fwdLeft').on('mousedown touchstart', function(){sock.et.emit('remote', 'M7');});
        $('#up').on('mousedown touchstart', function(){sock.et.emit('remote', 'M8');});
        $('#fwdRight').on('mousedown touchstart', function(){sock.et.emit('remote', 'M9');});
        // speed buttons
        $('#speed1').on('click', function(){sock.et.emit('remote', 'S1');});
        $('#speed2').on('click', function(){sock.et.emit('remote', 'S2');});
        $('#speed3').on('click', function(){sock.et.emit('remote', 'S3');});
        $('#speed4').on('click', function(){sock.et.emit('remote', 'S4');});
        $('#videoBTN').on('click', function(){signal.peerConnect(true);});
    }
}

var sock = {
    et: io(),
    first: null,
    init: function(){
        sock.et.on('data', function(info){$('#sensors').text(info);});
        sock.et.on('ice', function(info){signal.recepient(info, 'ice');}); // get ip info
        sock.et.on('sdp', function(info){signal.recepient(info, 'sdp');}); // get audeo video info
    },
}

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
        navigator.getUserMedia({video: true, audio: true,}, function(stream){
            video.stream = stream;
        }, utils.error);
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

var pages = {
    init: function(){
        if($('#auth').text() === 'true'){
            $('.tele.view').show();
            sock.init();    // start socket connections
            control.init();
            video.init();
        } else {
            $('.login.view').show();
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready
