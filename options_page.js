/**
   Copyright 2012 Google Inc

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 *
 * @author Joe Marini
 */

var appsList = [];

// Initialize the favorites lists with the currently selected favorite apps
function initFavorites() {
    var oSelList = null, favID = "";
    
    for (var i=1; i <= 5; i++) {
        favID = window.localStorage["fav"+i];
        oSelList = document.getElementById('fav'+i);
        if (favID != undefined) {
            for (var j=0; j < oSelList.options.length; j++) {
                if (oSelList.options[j].value == favID) {
                    oSelList.options.selectedIndex = j;
                    break;
                }
            }
        }        
    }
}

// When the user selects a favorite app, update the selection
function updateFavorite(evt) {
    var favID = this.id; // the id of the select element is the same as the id for the favorite in localStorage. Clever, huh?
    var appID = this.options[this.selectedIndex].value;
    if (appID != "---") {
        window.localStorage[favID] = appID;
    }
    else
        window.localStorage.removeItem(favID);
}

function compare(a, b) {
    return (a > b) ? 1 : (a == b ? 0 : -1);
}

function compareByName(app1, app2) {
    return compare(app1.name.toLowerCase(), app2.name.toLowerCase());
}


// Initialize the lists and set up the event listeners
document.addEventListener('DOMContentLoaded', function() {
    chrome.management.getAll(function(allAppData) {
        // filter out items that are not apps
        for (var i=0; i < allAppData.length; i++) {
            if (allAppData[i].isApp) 
                appsList.push(allAppData[i]);
        }
        appsList.sort(compareByName);
        
        // add the apps to the select lists
        for (var i=1; i<=5; i++) {
            var oSelList = document.getElementById('fav'+i);
            var selOptions = "";
            for (var j=0; j<appsList.length; j++) {
                selOptions += "<option value=" + "'" + appsList[j].id + "'>" + appsList[j].name + "</option>";
            }
            oSelList.innerHTML += selOptions;
        }
        
        // set the initial selections based on current favorites
        initFavorites();
        
        // add the event listeners to the select lists
        document.getElementById('fav1').addEventListener('change', updateFavorite);
        document.getElementById('fav2').addEventListener('change', updateFavorite);
        document.getElementById('fav3').addEventListener('change', updateFavorite);
        document.getElementById('fav4').addEventListener('change', updateFavorite);
        document.getElementById('fav5').addEventListener('change', updateFavorite);

        document.getElementById('btnFinished').addEventListener('click', function() { window.close(); });
    });
});
