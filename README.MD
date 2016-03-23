This is a test web app for controling an Arduino/Polulu Zumo driven, Android enabled telepresence robot


In order to test this application locally you will need


* Node.js and NPM (grab complete dependencies with "npm install")
Note "postinstall" may fail locally because of the differance in how it points to directories between local and Heroku
Given thats the case run "bower install" in the views directory to get Bootstrap, Socket.io and JQuery
* A startup script to set the following enviornment variables
* PORT
* SESSION_SECRET
* NAME
* PASSWORD


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

 Zumo code can be found in my zumoTesting repo

