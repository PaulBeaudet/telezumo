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
        // Signaling reactions
        sock.et.on('ice', function(info){signal.recepient(info, 'ice');});
        sock.et.on('sdp', function(info){signal.recepient(info, 'sdp');});
    },
}

var signal = {
    peer: null,
    peerConnect: function(amIfirst){
        signal.peer = new window.RTCPeerConnection({ 'iceServers': [{'url': 'stun:stun.l.google.com:19302'}] });
        signal.peer.onicecandidate = function (event) { // send any ice candidates to the other peer
            if (event.candidate != null) {
                sock.et.emit('ice', JSON.stringify(event.candidate));
            } // else a null means we have finished finding ice canidates in which there
        };    // in which there may be multiple of for any given client
        signal.peer.onaddstream = video.remoteStream;
        if(video.stream){signal.peer.addStream(video.stream);}
        if(amIfirst) { signal.peer.createOffer(signal.onSession, utils.error);}
    },
    recepient: function(info, type){
        if(!signal.peer){signal.peerConnect(false);} // start peer connection if someone is calling
        if(!signal.peer){signal.peerConnect(false);} // start peer connection if someone is calling
        if(type === 'ice'){
            signal.peer.addIceCandidate(new window.RTCIceCandidate(JSON.parse(info)));
        } else {
            signal.peer.setRemoteDescription(new window.RTCSessionDescription(JSON.parse(info)), function(){
                signal.peer.createAnswer(signal.onSession, utils.error);
            }, utils.error);
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
        navigator.getUserMedia({video: true, audio: false,}, function(stream){
            video.stream = stream;
            if(video.stream){document.getElementById('localVid').src = window.URL.createObjectURL(stream);}
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
