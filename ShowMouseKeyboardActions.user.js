// ==UserScript==
// @name         Show_Mouse_Keyboard_Actions
// @namespace    http://tampermonkey.net/
// @version      2023-12-27-1533
// @description  Show your mouse/keyboard actions on-screen. Useful for streaming/yt vids.
// @author       Road
// @match        *://arras.io/*
// @match        *://arras.netlify.app/*
// @run-at       document-end
// @grant        GM_addStyle
// @grant        unsafeWindow
// ==/UserScript==

// Avoid clashing with other scripts or the game itself
var htmlCssPrefix = 'Road_SMKA_';
// Id of container holding visual
var containerId = `${htmlCssPrefix}container`;
// chars to listen to on mouse or key press (0 = left mouse, 2 = right mouse)
// keep in this order to simplify layout stuff later (0w2 in top row, asd in bottom row)
var charsToWatch = "0W2ASD";
// default visual key/mouse elem bg color
var defaultVisualBgColor = 'transparent';

(function main() {
    var checkIfInGameInterval = setInterval(() => {
        // themeColor only gains a value once in-game
        // this only works with unsafeWindow not window and idc enough to figure out a better way to do this
        if (unsafeWindow?.Arras?.()?.themeColor === undefined) return;

        // select the game iframe's inner contentWindow 
        var gameWindow = document.querySelector('#game')?.contentWindow;
        if (!gameWindow) return;

        // only run main functions when in-game and when iframe's content window exists
        clearInterval(checkIfInGameInterval);
        buildVisual();
        addEventListeners(gameWindow);
    }, 1*1000);
})();

// returns id itself, without a # at the start
function getCharHtmlElemId(char) {
    return `${htmlCssPrefix}${char}`;
}

var colorNamesInOrder = ["teal","lgreen","orange","yellow","lavender","pink","vlgrey","lgrey","guiwhite","black","blue","green","red","gold","purple","magenta","grey","dgrey","white","guiblack"];
function getColor(name) {
    var colorVals = unsafeWindow.Arras().themeColor.table;
    var index = colorNamesInOrder.indexOf(name);
    return colorVals[index];
}

function buildVisual() {
    var canvasId = `canvas`;

    var visualHtml = `<div id="${containerId}">`;
    for (var char of charsToWatch) {
        // label left/right mouse differently
        var charLabel = (char === '0' ? '🐁L🐁' : char === '2' ? '🐁R🐁' : char);
        visualHtml += `<div id="${getCharHtmlElemId(char)}">${charLabel}</div>`;
    }
    visualHtml += `</div>`

    // getting overlay to work based on this - https://stackoverflow.com/a/26793302
    var canvas = document.getElementById(canvasId);
    canvas.insertAdjacentHTML('afterend', visualHtml);

    GM_addStyle(`
        /* Overlay visual over game like so - https://stackoverflow.com/a/26793302 */
        .gameAreaWrapper { position: relative; }
        #${canvasId}, #${containerId} { position: absolute; }

        #${containerId} {
            /* Layout as 2 rows of 3 */
            display: grid;
            grid-template-columns: 33.333% 33.333% 33.333%;

            /* Make it look nice */
            margin: 10px;
            width: 180px;
            height: 120px;
        }

        /* Make key/mouse cells look nice */
        #${containerId} * {
            /* align text in center of elem */
            display: flex;
            justify-content: center; /* Align horizontal */
            align-items: center; /* Align vertical */

            padding: 5px;
            border-radius: 5px;
            border: 1px solid ${getColor('black')}; /* in-game border color */
            background-color: ${defaultVisualBgColor};
            opacity: 0.65;

            /* From Tiger: */
            /* adds outline to text so its visible against any background color, # of repeated shadows determines strength of outline */
            /* from https://stackoverflow.com/a/57465026 */
            /* also making all text bold and Ubuntu, so its easier to see */
            text-shadow: 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black, 0 0 1px black;
            color: white;
            font-weight: bold;
        }
    `);
}

function addEventListeners(gameIframeContentWindow) { 
    // attach to content window bc of https://stackoverflow.com/a/32936969
    // content window is what lets it work once game starts
    // unsafeWindow lets it work after you open/close Tiger/RoadRayge
    // both are needed, idk why but it be like that
    
    [gameIframeContentWindow, unsafeWindow].forEach(elem => {
        elem.addEventListener('keydown', e => {
            toggleVisual(e.key, true, false);
        });
        elem.addEventListener('keyup', e => {
            toggleVisual(e.key, false, false);
        });
        elem.addEventListener('mousedown', e => {
            toggleVisual(e.button, true, true);
        });
        elem.addEventListener('mouseup', e => {
            toggleVisual(e.button, false, true);
        });
    });

    // Need to do this or otherwise wasd won't light up until player clicks screen
    gameIframeContentWindow.focus();
}

// build single lookup table for key/mouse identifiers -> html element
var Road_SMKA_lookup = (() => {
    var _ = {};
    // generate html id's - 0,2 are left,right mouse clicks respectively
    for (var char of charsToWatch) {
        _[char] = `#${getCharHtmlElemId(char)}`;
    }
    // Make Arrow_ and lowercase equal to uppercase WASD
    for (var key of Object.keys(_)) {
        _[key.toLowerCase()] = _[key];
    }
    _.ArrowUp = _.W;
    _.ArrowLeft = _.A;
    _.ArrowDown = _.S;
    _.ArrowRight = _.D;

    return _;
})();

function toggleVisual(identifier, makeActive, isMouse=false) {
    // ignore 0 & 2 when they're not mouse clicks
    if (!isMouse && (identifier == 0 || identifier == 2)) {
        return;
    }
    var htmlElemSelector = Road_SMKA_lookup[identifier];
    // ignore unimportant keys/mouse clicks
    if (!htmlElemSelector) return;

    console.log(htmlCssPrefix + ': Pressed ' + identifier);

    // also, in case user switched themes at some point, 
    // change to border color for ALL visual elems to match new theme
    var newBorderColor = getColor('black');
    document.querySelectorAll(`#${containerId} *`).forEach(keyMouseElem => {
        keyMouseElem.style.borderColor = newBorderColor; // in-game border color
    });

    // don't reset all cell bg colors bc user might be pressing multiple (move diagonally)

    document.querySelectorAll(htmlElemSelector).forEach(elem => {
        // I can't use a css class to do this because I need to make sure the colors
        // match the current theme, so I need js for that
        
        if (makeActive) {
            // to activate, change one elem's bg color
            elem.style.backgroundColor = getColor('guiwhite'); // in-game text color
        } else {
            // to un-activate, make the bg default again
            elem.style.backgroundColor = defaultVisualBgColor;
        }
    });
}
