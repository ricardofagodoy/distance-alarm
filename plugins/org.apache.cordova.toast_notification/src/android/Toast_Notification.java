/*
 *
 * Toasts plugin for Android
 *
 * @Author Linkpass Srl
 *
 * @licenze GPL v3
 *
 *
 */

package org.apache.cordova.toast_notification;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

//import android.util.Log;
import android.widget.Toast;


public class Toast_Notification extends CordovaPlugin {

	/**
     * Constructor.
     */
    public Toast_Notification() {
    }

	@Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
		
		if (action.equals("toasted")) {
			
			JSONObject jo = args.getJSONObject(0);
			
			this.startToast(jo.getString("message"), jo.getInt("duration"), callbackContext); 
			
        }else {
            return false;
        }
		
		callbackContext.success();
		return true;
		
    }
	
	private void startToast(String message, int duration, CallbackContext callbackContext) {
	
		int set_duration;
	
		if (message != null && message.length() > 0) {
		
			if(duration == 0) {
				set_duration = Toast.LENGTH_SHORT;
			}else{
				set_duration = Toast.LENGTH_LONG;
			}
		
			Toast.makeText(cordova.getActivity().getApplicationContext(), message, set_duration).show();
			
	        callbackContext.success(message);
		
		}
	}
	
}
