// serve.js ~ Copyright 2016 Paul Beaudet ~ MIT License

var sock = {
    ets: require('socket.io'),
    listen: function(server){
        sock.ets = sock.ets(server);
        sock.ets.on('connection', function(socket){
            var bot = false; // is this a bot or a controlor?
            socket.on('botFind', function(){socket.broadcast.emit('botFind', socket.id);});// broadcast to available bots
            socket.on('here', function(nfo){
                bot = true; // only bots say 'here'
                if(nfo.id){sock.ets.to(nfo.id).emit('here', {id:socket.id, status: nfo.status});}
                else{socket.broadcast('here', {id:socket.id, status: nfo.status});}
            }); // show available
            socket.on('own', function(bot){sock.ets.to(bot).emit('own', socket.id);});           // take control of a bot
            socket.on('data', function(data){sock.ets.to(data.to).emit('data', data.data);});    // relay sensor data
            socket.on('remote', function(data){sock.ets.to(data.id).emit('remote', data.cmd);}); // relay control data
            socket.on('sdp', function(data){sock.ets.to(data.to).emit('sdp', data.data);});      // relay video type
            socket.on('ice', function(data){sock.ets.to(data.to).emit('ice', data.data);});      // relay ip address
            socket.on('disconnect', function(){
                if(bot){socket.broadcast.emit('here', {id:socket.id, status: 'offline'});}
            });
        });
    }
}

var routes = {
    slash: function(req, res){res.render('remote', {csrfToken: req.csrfToken(), auth: 'false'});},
    signin: function(req, res){
        if(req.body.name === process.env.NAME && req.body.password === process.env.PASSWORD){
            res.render('remote', {csrfToken: req.csrfToken(), auth: 'admin'});
        } else {
            res.render('remote', {csrfToken: req.csrfToken(), err: 'wrong!'});
        }
    },
    control: function(req, res){
        res.render('remote', {csrfToken: req.csrfToken(), auth: 'temp'});
    }
}

var cookie = { // depends on client-sessions and mongo
    session: require('client-sessions'),
    ingredients: {
        cookieName: 'session',
        secret: process.env.SESSION_SECRET,
        duration: 365 * 24 * 60 * 60 * 1000,  // cookie times out in x amount of time
    },
    meWant: function(){return cookie.session(cookie.ingredients);},
    user: function(content){return cookie.session.util.decode(cookie.ingredients, content);}, // decode cookie for socket reactions
}

var serve = {
    express: require('express'),
    parse: require('body-parser'),
    theSite: function (){
        var app = serve.express();
        var http = require('http').Server(app);              // http server for express framework
        app.set('view engine', 'jade');                      // template with jade
        app.use(require('compression')());                   // gzipping for requested pages
        app.use(serve.parse.json());                         // support JSON-encoded bodies
        app.use(serve.parse.urlencoded({extended: true}));   // support URL-encoded bodies
        app.use(cookie.meWant());                            // support for cookies
        app.use(require('csurf')());                         // Cross site request forgery tokens
        app.use(serve.express.static(__dirname + '/views')); // serve page dependancies (sockets, jquery, bootstrap)
        var router = serve.express.Router();                 // create express router object to add routing events to
        router.get('/', routes.slash);                       // main route for getting in
        router.post('/', routes.signin);                     // authenticate admin
        router.get('/control', routes.control);              // allow people to control the zumo
        app.use(router);                                     // get express to user the routes we set
        sock.listen(http);                                   // listen for socket connections
        http.listen(process.env.PORT);                       // listen on specified PORT enviornment variable
    }
}

serve.theSite(); //Initiate the site
