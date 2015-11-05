var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

$(document).on("deviceready", function() {
  deviceReadyDeferred.resolve();
});

$(document).on("mobileinit", function () {
  jqmReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(init);

var GPS_CONFIG = {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true},
    CLOCK_MODE = 1, // 0 for 24hours
    alarms = [],
    currentAlarm = {};

function init() { 
    
    // Sets clock to tick out
    clockHandler.showClock();
    
    // Check if we've got data connection set up
    networkStateChecker.checkInternetStatus();
    networkStateChecker.setInternetStatusListeners();
    
    // Also check how's our geolocation doin'
    gpsStateChecker.checkGpsStatus();  
    
    // The new alarm click (green circled button)
    $('#newAlarm').click(function(e) {
        
        $('#map').height($.mobile.getScreenHeight()/2);
        
        navigator.geolocation.getCurrentPosition(onGeolocationSuccess,
                                                 gpsStateChecker.onGpsError,
                                                 GPS_CONFIG);
    });
    
    // When save an alarm
    $('#saveAlarm').click(function(event) {
        
        var alarmName = $('#alarmName').val();
        
        if(!alarmName || alarmName == '')
            navigator.notification.alert (
                'Fill out a name for this alarm!',
                undefined,         
                'Woops!',           
                'Ok, I will'                  
            );
        
    });
}

function onGeolocationSuccess(position) {    
    mapHandler.loadMap(position.coords.latitude, position.coords.longitude);
};

// CLOCK HANDLER  TODO: use native callbacks
var clockHandler = {

    showClock: function() {
        var today = new Date();

        var h = today.getHours();
        var m = clockHandler.checkTime(today.getMinutes());
        
        var prefix = '';
        
        if(CLOCK_MODE) {
            
            prefix = ' AM';
            
            if(h > 12) {
                h -= 12;
                prefix = ' PM';
            }
        }
        
        h = clockHandler.checkTime(h);

        $('#clock').text(h + ":" + m + prefix);

        setTimeout(clockHandler.showClock, 1000);
    },
    
    checkTime: function(i) {
        if (i < 10) {i = "0" + i};
        return i;
    }
};

// MAP HANDLER
var mapHandler = {
    
    loadMap: function(lat, lng) {
        
        currentAlarm.lat = lat;
        currentAlarm.lng = lng;
        
        var mapOptions = {
            center: new google.maps.LatLng(lat, lng),
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    
        // Create map we see and attach to 'map' element
        var map = new google.maps.Map(document.getElementById("map"), mapOptions); 
    
        // Create and set a marker to its current position
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, lng),
            map: map,
            animation: google.maps.Animation.DROP
        });
    
        // When user click on map, change marker location
        google.maps.event.addListener(map, 'click', function(event) {
            
            marker.setPosition(event.latLng);
            
            currentAlarm.lat = event.latLng.lat();
            currentAlarm.lng = event.latLng.lng();
            
            alert(JSON.stringify(currentAlarm));
        });
    }  
};

// GPS STATE CHECKER
var gpsStateChecker = {
    
    checkGpsStatus: function() {
    
        navigator.geolocation.getCurrentPosition($.proxy(this.onGpsSuccess, this),
                                                 $.proxy(this.onGpsError, this),
                                                 GPS_CONFIG);
        
    },
    
    onGpsError: function(error) {
        
        this.setGpsStatus('OFF', 'red');
        
        navigator.notification.alert(
            'code: '    + error.code    + '\n' +
            'message: ' + error.message,
            undefined,         
            'GPS Problem!',           
            'Ok'                  
        );
    },
    
    onGpsSuccess: function(position) {
        this.setGpsStatus('ON', 'green');
    },
    
    setGpsStatus: function(value, color) {
        $('#gpsStatus').text(value);
        $('#gpsStatus').css('color', color);
    }    
};

// NETWORK STATE CHECKER
var networkStateChecker = {
    
    setInternetStatus: function(value, color) {
        $('#internetStatus').text(value);
        $('#internetStatus').css('color', color);
    },
    
    setInternetStatusOff: function() {
        this.setInternetStatus('OFF', 'red');
    },
    
    setInternetStatusOn: function() {
        this.setInternetStatus('ON', 'green');
    },
    
    checkInternetStatus: function() {
        
        var networkState = navigator.connection.type;

        if(networkState == Connection.UNKNOWN || networkState == Connection.NONE)
            this.setInternetStatusOff();
        else
            this.setInternetStatusOn();
    },
    
    setInternetStatusListeners: function() {
        document.addEventListener("offline", $.proxy(function() {
                                  this.setInternetStatusOff();
                                }, this), false);
        
        document.addEventListener("online", $.proxy(function() {
                                  this.setInternetStatusOn();
                                }, this), false);
    }
};