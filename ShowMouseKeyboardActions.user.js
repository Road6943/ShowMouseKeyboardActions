// ==UserScript==
// @name         Show_Mouse_Keyboard_Actions
// @namespace    http://tampermonkey.net/
// @version      2023-12-27
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
// class added when key/button is pressed
var activeClassName = `${htmlCssPrefix}active`;
// chars to listen to on mouse or key press (0 = left mouse, 2 = right mouse)
// keep in this order to simplify layout stuff later
var charsToWatch = "0w2asd";

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

function buildVisual() {
    var containerId = `${htmlCssPrefix}container`;
    var canvasId = `canvas`;

    var visualHtml = `<div id="${containerId}">`;
    for (var char of charsToWatch) {
        // label left/right mouse differently
        var charLabel = (char === '0' ? 'L🐁' : char === '2' ? 'R🐁' : char);
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

        /* Layout as 2 rows of 3 */
        #${containerId} {
            display: grid;
            grid-template-columns: auto auto auto;
        }
    `);
}

function addEventListeners(gameWindow) { 
    // keyboard events work on the window itself
    // https://stackoverflow.com/a/32936969
    ['keydown', 'keyup'].forEach(eventName => {
        gameWindow.addEventListener(eventName, (event) => {
            console.log(event.key);
            toggleVisual(event.key, false);
        });
    });

    // mouse events work on the parent div containing the canvas
    ['mousedown', 'mouseup'].forEach(eventName => {
        gameWindow.addEventListener(eventName, (event) => {
            console.log(event.button);
            toggleVisual(event.button, true);
        });
    });
}

// build single lookup table for key/mouse identifiers -> html element
var Road_SMKA_lookup = (() => {
    var lookup = {};
    // generate html id's - 0,2 are left,right mouse clicks respectively
    for (var char of charsToWatch) {
        lookup[char] = `#${getCharHtmlElemId(char)}`;
    }
    // Make Arrow_ and uppercase equal to lowercase wasd
    lookup['ArrowUp'] = lookup['w'];
    lookup['ArrowLeft'] = lookup['a'];
    lookup['ArrowDown'] = lookup['s'];
    lookup['ArrowRight'] = lookup['d'];
    for (var key of Object.keys(lookup)) {
        lookup[key.toUpperCase()] = lookup[key];
    }

    return lookup;
})();

function toggleVisual(identifier, isMouse=false) {
    // ignore 0 & 2 when they're not mouse clicks
    if (!isMouse && (identifier == 0 || identifier == 2)) {
        return;
    }
    var htmlElemSelector = Road_SMKA_lookup[identifier];
    // ignore unimportant keys/mouse clicks
    if (!htmlElemSelector) return;

    document.querySelectorAll(htmlElemSelector).forEach(elem => {
        elem.classList.toggle(activeClassName);
    });
}
