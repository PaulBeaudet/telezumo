This is a test web app for controling an Arduino/Polulu Zumo driven, Android enabled telepresence robot


Important parts to building out this project, besides this server remote control app
* An Android phone, put it in debugging mode
* Cordova (/phonegap/ionic/w.e.) with the Android SDK put in its build path
* Cordova Android application- [zumobrain](https://github.com/PaulBeaudet/zumobrain)
* Cordova plugin for communicating with Arduinos- [cordovarduino](https://github.com/xseignard/cordovarduino)
* An Arduino powered robot like the [Zumo](https://www.pololu.com/category/129/zumo-robots-and-accessories)
* Code for your Arduino powered robot [zumoTesting](https://github.com/PaulBeaudet/zumoTesting)

Setting up the server

* Node.js and NPM (grab complete dependencies with "npm install")
Note "postinstall" may fail locally because of the differance in how it points to directories between local and Heroku
Given thats the case run "bower install" in the views directory to get Bootstrap, Socket.io and JQuery
* A startup script to set the following enviornment variables
* PORT
* SESSION_SECRET
* NAME
* PASSWORD

To start the web server locally

The following is an example script (start.sh) to start this web app locally with needed enviornment variables

    #!/bin/bash

    # Script for starting our service locally
    PORT="3000"
    export PORT
    # session secret for client side cookies on the service
    SESSION_SECRET="putyoursecretheremakeitgood"
    export SESSION_SECRET
    # export and user name and password, will probably provide a way to hash in a future update
    NAME="yourname"
    export NAME
    PASSWORD="lameplaintextpassword"
    export PASSWORD
    node serve.js



 MIT license Copyright 2016 Paul Beaudet
