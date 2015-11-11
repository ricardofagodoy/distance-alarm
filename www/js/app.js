var deviceReadyDeferred = $.Deferred();
var jqmReadyDeferred = $.Deferred();

$(document).on("deviceready", function() {
  deviceReadyDeferred.resolve();
});

$(document).on("mobileinit", function () {
  jqmReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(init);

var GPS_CONFIG = {maximumAge: 1, timeout: 5000, enableHighAccuracy: true},
    CLOCK_MODE = 1, // 0 for 24hours
    currentPosition = {},
    alarms = {},
    currentAlarm = {status: 1};

function onall(success) {
    console.log('Success: ' + success);
}

function init() { 
    
    // Sets clock to tick out
    clockHandler.showClock();
    
    // When clicking on clock
    $('#clock').click(function(event) {
        navigator.notification.confirm(
            '12 or 24 hours clock?',
            function(button) {
                CLOCK_MODE = button == 1 ? button : 0;
            },
            'Choose your clock format',
            ['12 hours','24 hours']
        );
    });
    
    // Check if we've got data connection set up
    networkStateChecker.checkInternetStatus();
    networkStateChecker.setInternetStatusListeners();
    
    // Click on Internet status viewer
    $('#internetStatusWrapper').click(function(event) {
        networkStateChecker.setInternetStatus('Checking...', 'black');
        networkStateChecker.checkInternetStatus();
    });
    
    // Start watching whenever user moves
    gpsStateChecker.setGpsListener(); 
    
    // Click on GPS status viewer
    $('#gpsStatusWrapper').click(function(event) {
        gpsStateChecker.setGpsStatus('Checking...', 'black');
        gpsStateChecker.checkGpsStatus();
    });
    
    // Adjust map height to screen size
    $('#map').height($.mobile.getScreenHeight()/2); 
    
    // Load all alarms
    alarmHandler.loadAlarms();
    
    // The new alarm click (green circled button)
    $('#newAlarm').click(function(e) { 
        
        if($('#internetStatus').html() == 'OFF') {
            
            event.preventDefault();
            
            navigator.notification.alert (
                'You need internet connection prior to that!',
                undefined,         
                'Internet needed!',            
                'Internet, got it!'                  
            );  
            
            return;
        }
        
        $('#alarmName').val('');
        
        setTimeout(function() {
            mapHandler.loadMap(currentPosition.lat, currentPosition.lng)
        }, 1000); 
    }); 
    
    // When save an alarm
    $('#saveAlarm').click(function(event) {
        
        var alarmName = $('#alarmName').val();
        
        if(!alarmName || alarmName == '') {
            
            event.preventDefault();
            
            navigator.notification.alert (
                'Fill out a name for this alarm!',
                undefined,         
                'Woops!',            
                'Ok, I will'                  
            );
        } else { 
            currentAlarm.name = alarmName;
            
            // IF IT IS EDITING
            if(currentAlarm.id) {
                
                alarms[currentAlarm.id] = currentAlarm;
                $('#alarmNameLabel-'+ currentAlarm.id).html(currentAlarm.name);
                
            } else {
                currentAlarm.id = alarmHandler.getNextId();
                alarms[currentAlarm.id] = currentAlarm; 
                
                alarmHandler.addAlarmToList(currentAlarm);
            }

            alarmHandler.saveAlarms();
            
            currentAlarm = {status: 1};
            $.mobile.back();
        }        
    });
    
    document.addEventListener("pause", alarmHandler.saveAlarms, false);
    
    document.addEventListener("backbutton", function() {
        alarmHandler.saveAlarms();
        $.mobile.back();
    }, false);
    
    document.addEventListener("menubutton", alarmHandler.saveAlarms, false);
}

// ALARM HANDLER
var alarmHandler = {
     
    verifyStatus: function() {
    },
    
    getNextId: function() {
        
        var nextId = localStorage.getItem('nextId');
        
        if(nextId === null || nextId.length === 0)
            nextId = 1;
        
        nextId = parseInt(nextId);
        
        localStorage.setItem('nextId', nextId+1);
        
        return nextId;
    },
    
    saveAlarms: function() {
        
        var stringAlarms = JSON.stringify(alarms);
        
        localStorage.setItem('alarms', stringAlarms);
        
        console.log('Alarms saved: ' + stringAlarms);
    },
    
    addAlarmToList: function(alarm) {
        
        $('#activeAlarms').after(
                
        '<li id="alarm-'+ alarm.id +'">' +
            '<a href="#"><span id="alarmNameLabel-'+ alarm.id +'">' + alarm.name + '</span>' +
            '<span id="flipperWrapper" class="fliper">' +
                '<select name="flip" id="flip" data-role="flipswitch">' +
                    '<option value="0">Off</option>' +
                    '<option value="1">On</option>' +
                '</select>' +
            '</span></a>' +
            '</li>');
                                         
        $('#alarmsList').listview('refresh');
        $('#alarmsList').trigger("create");
        
        $('#alarm-' + alarm.id + ' #flip').val(alarm.status).flipswitch('refresh');            
        
        // EVENTS TO EACH LIST ITEM
        
        $('#alarm-' + alarm.id).bind('taphold', function(e) {
            delete alarms[alarm.id]; 
            $('#alarm-' + alarm.id).remove();
        });
        
        $('#alarm-' + alarm.id).on('vclick', function(event) {
            
            currentAlarm = alarm;
            
            $('#alarmName').val(alarm.name);
            $.mobile.changePage('#newAlarmDialog');
            
            setTimeout(function() {
                mapHandler.loadMap(alarm.lat, alarm.lng)
            }, 1000);
        });
        
        $('#alarm-' + alarm.id + ' #flip').on("change", function(event, ui) {
            alarm.status = $(this).val();
        });
    },
    
    loadAlarms: function() {
        
        var stringAlarms = localStorage.getItem('alarms');
        
        if(stringAlarms === null || stringAlarms.length === 0)
            return;
        
        console.log('Alarms loaded: ' + stringAlarms);
        
        alarms = JSON.parse(stringAlarms);   
        
        $.each(alarms, function(i, v) {
            alarmHandler.addAlarmToList(v);           
        }); 
    }
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
    
    setGpsListener: function() {
    
        navigator.geolocation.watchPosition($.proxy(this.onGpsSuccess, this),
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
        
        currentPosition.lat = position.coords.latitude;
        currentPosition.lng = position.coords.longitude;
        
        alarmHandler.verifyStatus();
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