# Toast plugin for Android/(Phonegap/Cordova) >= 3.0.0
By Linkpass Srl



## Plugin Installation

### Phonegap/Cordova vers 3.x.x 


* Run terminal

```text
cordova plugins add https://github.com/Linkpass/Toast.git
```

* Call the plugin, set the variable with message to view in Toast

```javascript
var toasted_message = 'Your message to view in Toast';
var duration = 1; // 1 = LONG duration ~ 0 SHORT duration
Toast_Notification.Toasted(toasted_message, duration);
```

* That's all Folks!! ;)



## CHANGELOG

### 14/01/2014 (vers 0.2.0)
* Add duration parameter
* FIX description into files

### 10/01/2014 (vers 0.1.0)
* Initial release (Tested with Cordova 3.3.0, platform android v4.3.1)



Thanks for the attention ;)