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

var pages = {
    init: function(){
        if($('#auth').text() === 'true'){
            $('.tele.view').show();
            sock.init();
            control.init();
        } else {
            $('.login.view').show();
        }
    }
}

$(document).ready(pages.init); // fire up pages when DOM is ready
