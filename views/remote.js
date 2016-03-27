// remote.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var control = {
    init: function(){
        $('#up').on('click', function(){sock.et.emit('remote', 'M8');});
        $('#down').on('click', function(){sock.et.emit('remote', 'M2');});
        $('#left').on('click', function(){sock.et.emit('remote', 'M4');});
        $('#right').on('click', function(){sock.et.emit('remote', 'M6');});
        $('#stop').on('click', function(){sock.et.emit('remote', 'M5');});
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
            document.getElementById('video').src = vendorUrl.createObjectURL(stream);
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
