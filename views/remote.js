// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var control = {
    init: function(){
        $('#rvsLeft').mousedown(function(){sock.et.emit('remote', 'M1');});
        $('#down').mousedown(function(){sock.et.emit('remote', 'M2');});
        $('#rvsRight').mousedown(function(){sock.et.emit('remote', 'M3');});
        $('#left').mousedown(function(){sock.et.emit('remote', 'M4');});
        $('.tele').mouseup(function(){sock.et.emit('remote', 'M5');})
        $('#stop').on('click', function(){sock.et.emit('remote', 'M5');});
        $('#right').mousedown(function(){sock.et.emit('remote', 'M6');});
        $('#fwdLeft').mousedown(function(){sock.et.emit('remote', 'M7');});
        $('#up').mousedown(function(){sock.et.emit('remote', 'M8');});
        $('#fwdRight').mousedown(function(){sock.et.emit('remote', 'M9');});
        // speed buttons
        $('#speed1').on('click', function(){sock.et.emit('remote', 'S1');});
        $('#speed2').on('click', function(){sock.et.emit('remote', 'S2');});
        $('#speed3').on('click', function(){sock.et.emit('remote', 'S3');});
        $('#speed4').on('click', function(){sock.et.emit('remote', 'S4');});
    }
}

var sock = {
    et: io(),
    init: function(){
        sock.et.on('data', function(info){console.log(info);});
    }
}

var video = {
    init: function(){
        var vendorUrl = window.URL || window.webkitURL;
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        navigator.getMedia({video: true, audio: false,}, function(stream){
            document.getElementById('localVid').src = vendorUrl.createObjectURL(stream);
        }, function(err){
            $('#textEntry').val(err);
        });
    }
}

var pages = {
    init: function(){
        if($('#auth').text() === 'true'){
            $('.tele.view').show();
            sock.init();
            control.init();
            video.init();
        } else {
            $('.login.view').show();
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready
