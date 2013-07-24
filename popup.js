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
 
// The list of all apps & extensions.
var completeList = [];
// A filtered list of apps we actually want to show.
var appList = [];
// The index of an app in |appList| that should be highlighted.
var selectedIndex = 0;

// Google Analytics code
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-4436568-7']);
_gaq.push(['_trackPageview']);
console.log("View tracked");
(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

function $(id) {
    return document.getElementById(id);
}

// Returns the largest size icon, or a default icon, for the given |app|.
function getIconURL(app) {
    if (!app || !app.icons || app.icons.length == 0) {
        return chrome.extension.getURL('icon.png');
    }
    var largest = {
        size : 0
    };
    for (var i = 0; i < app.icons.length; i++) {
        var icon = app.icons[i];
        if (icon.size > largest.size) {
            largest = icon;
        }
    }
    return largest.url;
}

function getAppByID(strID) {
    for (var i=0; i < completeList.length; i++) {
        if (completeList[i].id == strID)
            return completeList[i];
    }
    return null;
}

function launchApp(id) {
    chrome.management.launchApp(id);
    window.close();
    // Only needed on OSX because of crbug.com/63594
}

// Load the favorite applications. If there are none, then just pre-populate with the 
// first five apps that are found.
function loadFavorites() {
    var defApp = 0;
    for (var i=0; i < 5; i++) {
        var curFav = "fav" + (i+1);
        // Div IDs are the same as the localStorage keys
        var curFavDiv = $(curFav);
        var favAppID = window.localStorage[curFav];
        var app=null;
        var img = document.createElement('img');
        img.height = 76;
        img.width = 76;

        // use one of the existing apps, or a default icon
        if (!favAppID || favAppID != undefined) {
            app = getAppByID(favAppID); //completeList[defApp++];
            // if we have an appID for a favorite but the app comes back null
            // (because the user uninstalled it, probably) then we need to remove
            // that favorite ID from the list
            if (!app) {
                window.localStorage.removeItem(curFav);
            }
        }
        
        img.src = getIconURL(app); // returns default icon if app is null
        curFavDiv.appendChild(img);
        if (app) {
            curFavDiv.title = app.name;
            curFavDiv.className = "fav";
            curFavDiv.setAttribute("data-appid",app.id);
            curFavDiv.onclick = function() {
                _gaq.push(["_trackEvent", "CWSLauncher", "favLaunch"]);
                var strID = this.getAttribute("data-appid");
                launchApp(strID);
            };
        }
    }
}

// Adds DOM nodes for |app| into |appsDiv|.
function addApp(appsDiv, app, selected) {
    var div = document.createElement('div');
    div.className = 'app' + ( selected ? ' app_selected' : '');
    div.title = app.name;

    div.onclick = function() {
        _gaq.push(["_trackEvent", "CWSLauncher", "appLaunch"]);
        launchApp(app.id);
    };

    var img = document.createElement('img');
    img.src = getIconURL(app);
    div.appendChild(img);

    var title = document.createElement('span');
    title.className = 'app_title';
    title.innerText = app.name;
    div.appendChild(title);

    appsDiv.appendChild(div);
}

function reloadAppDisplay() {
    var appsDiv = $('apps');

    // Empty the current content.
    appsDiv.innerHTML = '';

    for (var i = 0; i < appList.length; i++) {
        var item = appList[i];
        addApp(appsDiv, item, i == selectedIndex);
    }
}

// Puts only enabled apps from completeList into appList.
function rebuildAppList(filter) {
    selectedIndex = 0;
    appList = [];
    for (var i = 0; i < completeList.length; i++) {
        var item = completeList[i];
        // Skip extensions and disabled apps.
        if (!item.isApp || !item.enabled) {
            continue;
        }
        if (filter && item.name.toLowerCase().search(filter) < 0) {
            continue;
        }
        appList.push(item);
    }
}

// Shows the list of apps based on the search box contents.
function onSearchInput() {
    var filter = $('search').value;
    rebuildAppList(filter);
    reloadAppDisplay();
}

function compare(a, b) {
    return (a > b) ? 1 : (a == b ? 0 : -1);
}

function compareByName(app1, app2) {
    return compare(app1.name.toLowerCase(), app2.name.toLowerCase());
}

// Changes the selected app in the list.
function changeSelection(newIndex) {
    if (newIndex >= 0 && newIndex <= appList.length - 1) {
        selectedIndex = newIndex;
        reloadAppDisplay();

        var selected = document.getElementsByClassName('app_selected')[0];
        selected.scrollIntoView(false);
    }
}

var keys = {
    ENTER : 13,
    ESCAPE : 27,
    END : 35,
    HOME : 36,
    LEFT : 37,
    UP : 38,
    RIGHT : 39,
    DOWN : 40
};

// Set up a key event handler that handles moving the selected app up/down,
// hitting enter to launch the selected app, as well as auto-focusing the
// search box as soon as you start typing.
window.onkeydown = function(event) {
    switch (event.keyCode) {
        case keys.DOWN:
        case keys.RIGHT:
            changeSelection(selectedIndex + 1);
            break;
        case keys.UP:
        case keys.LEFT:
            changeSelection(selectedIndex - 1);
            break;
        case keys.HOME:
            changeSelection(0);
            break;
        case keys.END:
            changeSelection(appList.length - 1);
            break;
        case keys.ENTER:
            if (document.activeElement == $('searchterms'))
                searchStore();
            else {
                var app = appList[selectedIndex];
                if (app) {
                    _gaq.push("CWSLauncher","appLaunch");
                    launchApp(app.id);
                }
            }
            break;
        default:
            // Focus the search box and return true so you can just start typing even
            // when the search box isn't focused.
            // $('search').focus();
            return true;
    }
    return false;
};

function searchStore() {
    var searchURL = "https://chrome.google.com/webstore/search/";
    var searchTerms = escape($('searchterms').value);
    searchURL += searchTerms;
    chrome.tabs.create({
        'url' : searchURL,
        'selected' : true
    });
    _gaq.push(["_trackEvent", "CWSLauncher", "searchStore"]);
}

// Initalize the popup window.
document.addEventListener('DOMContentLoaded', function() {
    chrome.management.getAll(function(info) {
        var appCount = 0;
        var tempAppList = [];
        for (var i = 0; i < info.length; i++) {
            if (info[i].isApp) {
                appCount++;
                tempAppList.push(info[i]);
            }
        }
        if (appCount == 0) {
            $('search').style.display = 'none';
            $('appstore_link').style.display = '';
            return;
        }
        completeList = tempAppList.sort(compareByName);
        onSearchInput();

        loadFavorites();
        $('search').focus();
    });
    
    // Opens the webstore in a new tab.
    document.querySelector('#visitstore').addEventListener('click', function() {
        chrome.tabs.create({
            'url' : 'https://chrome.google.com/webstore',
            'selected' : true
        });
        _gaq.push(["_trackEvent", "CWSLauncher", "launchStore"]);
        window.close();
    });
    // Opens the Options view.
    document.querySelector('#gotoOptions').addEventListener('click', function() {
        chrome.tabs.create({
            'url' : 'options_page.html',
            'selected' : true
        });
        window.close();
    });
    // Searches the Web store, opens in a new tab.
    document.querySelector('#searchstore').addEventListener('click', function() {
        searchStore();
        window.close();
    });

    $('search').addEventListener('input', onSearchInput);
});

