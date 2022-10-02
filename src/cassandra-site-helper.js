// ==UserScript==
// @name         Cassandra Site Helper
// @namespace    http://tampermonkey.net/
// @version      0.5.3
// @description  Implements a button that allows a user to copy an IP address with one click and a bunch of other stuff.
// @author       github.com/heyjames
// @match        http://cassandra.confluvium.net/
// @match        http://cassandra3.confluvium.net/general.html
// @match        http://cassandra0.confluvium.net/cassandra0.html
// @match        http://cassandra1.confluvium.net/cassandra.html
// @match        http://cassandra2.confluvium.net/cassandra.html
// @match        http://cassandra3.confluvium.net/cassandra.html
// @match        http://cassandra4.confluvium.net/cassandra.html
// @match        http://cassandra-m.confluvium.net/cassandra.html
// @match        http://cassandra5.confluvium.net/cassandra.html
// @match        http://hub.confluvium.net/cassandra.html
// @match        http://cassandra6.confluvium.net/cassandra.html
// @grant        none
// ==/UserScript==

// Main Configuration ///////////////////////////////////////////////////////////////
const DISABLE_PAGE_REFRESH = false; // Default: true
const FAMILIAR_ALIAS = true; // Default: false. Only affects players found in PLAYERS variable.
const DARK_MODE = true; // Default: true. Applies a dark theme.
const EXTEND_SERVER_SLOT_WARNING = true; // Default: false. Used to highlight server occupancy background color.
const FAVORITE_SERVER = false; // Default: true. Sets the server background to a muted red-brown color.
const FAVORITE_SERVER_URL = /^http:\/\/cassandra3.confluvium.net\/cassandra.html$/; // Default: ""
const INCREASE_IFRAME_HEIGHT = true; // Default: true. Useful if font-family/size enables scrollbar.

const HIGHLIGHTED_STEAM_IDS = ["76561190000000000"];

// Gamedig
const SHOW_CIRCLEUS_SERVER_INFO = false; // Default: false
const CIRCLEUS_SERVER_INFO_ALLOW_EMPTY = false;
const CIRCLEUS_SERVER_INFO_ALLOW_LIST = [5];
const SERVER_MAP = {
    0: "http://cassandra0.confluvium.net/cassandra0.html",
    1: "http://cassandra1.confluvium.net/cassandra.html",
    2: "http://cassandra2.confluvium.net/cassandra.html",
    3: "http://cassandra3.confluvium.net/cassandra.html",
    4: "http://cassandra4.confluvium.net/cassandra.html",
    5: "http://hub.confluvium.net/cassandra.html"
};
const CIRCLEUS_API = "http://192.168.1.70:3000/api/server/";

// Font Configuration
const FONT_FAMILY_SERVER_TEXT = "Verdana"; // Default: "Verdana"

// Site Intro Page (Legend)
const FONT_SIZE_LEGEND = "12px"; // Default: "12px"
const FONT_SIZE_LEGEND_PILL = "14px"; // Default: "14px"

// Sandstorm Server
const FONT_FAMILY_PILL = "Verdana"; // Default: "Verdana"
const FONT_SIZE_SERVER = "12px"; // Default: "12px"
const FONT_SIZE_SERVER_PILL = "14px"; // Default: "14px"
const FONT_SIZE_SERVER_TITLE = "16px"; // Default: "16px"

const HIGHLIGHT_BG_COLOR = "rgb(0, 122, 211)"; // rgb(0, 122, 211), rgb(189, 0, 0)
const HIGHLIGHT_TXT_COLOR = "rgb(231, 231, 231)"; // rgb(231, 231, 231)
const HIGHLIGHT_FONT_SIZE = "14px"; // Default: "14px"

// Insurgency 2014 Server
const FONT_SIZE_SERVER_2014 = "12px"; // Default: "12px"

// Replace outdated IP
const OVERRIDE_IP = false;
const OVERRIDE_IP_URL = "";

// Censor Configuration (For developer use)
const CENSOR = false; // Default: false. Used by developer for screenshots.

// Document Style Sheet
const DOCUMENT_CSS = `
::-moz-progress-bar {
    background-color: rgb(49,79,99);
}
`;
////////////////////////////////////////////////////////////////////////////////

// 2020-11-08: Deprecated. Owner implemented UTF-8 encoding on web interface.
// Dictionary to convert garbled text strings to UTF-8 symbols.
const GARBLED_TO_SYMBOL_DICTIONARY = {
    "â„¢": "™",
    "Î»": "λ",
    "ï´¾ï´¾Û£Ûœ": "﴾﴾ۣۜ",
    "âœª": "✪",
    "â˜": "☠",
    "Â©": "©",
    "â™¢": "♢",
    "âˆž": "∞",
    "â›§": "⛧",
    "Ã«": "ë",
    "Ä™": "ę",
    "âœ¾": "✾",
    "âœ¹": "✹",
    "Ã³": "ó",
    "Å›": "ś",
    "Ã¥": "å",
    "ãƒ„": "ツ",
    "Ã‰": "É",
    "â™¤": "♤",
    "ç¦»å¸è½½å°±å·®äº¿æŠŠ": "离卸载就差亿把"
};

// Start script
(async function () {
    'use strict';

    // Create the style elements in the head element with CSS
    // (used for setting browser specific progress bar color).
    setDocumentStyleSheet(DOCUMENT_CSS);

    const bodyEl = document.querySelector("html body");
    const url = bodyEl.baseURI;

    // Handle child iFrame dimensions
    if (isSiteMainPage(url)) return handleMainPage(bodyEl, url);

    // Handle site intro page like creating a legend
    // explaining classification styles.
    if (isSiteIntroPage(url)) return handleIntroPage(bodyEl);

    // Disable auto-page refresh.
    disableAutoPageRefresh(DISABLE_PAGE_REFRESH, url);

    // Handle Insurgency 2014 server.
    if (isSiteIns2014Page(url)) return styleIns2014Page(bodyEl);

    // Handle Insurgency: Sandstorm servers.
    try {
        styleFavoriteServerPage(bodyEl, url);
        styleDefaultServerPage(bodyEl, url);

        // Handle broken URL; will usually error at getIp function.
        isUrlWorking(bodyEl, url)

        // Get IP and SID (Replay ID).
        const serverNumber = getServerNumber(url);
        let ip = getIp(bodyEl, OVERRIDE_IP);
        let sid = getSid(bodyEl);
        const numPlayers = getNumPlayers(bodyEl);

        // Style player count, uptime, admin link, and Steam names.
        await styleServerPageElements(bodyEl, sid, ip, numPlayers, serverNumber);

        // Render countdown indicators
        renderAutoRefreshProgressBar(bodyEl);
        renderAutoRefreshCountdown(bodyEl, url);
        startTimer(13, "progressBar", "myTimer");

        // Render a Copy IP button
        renderIpInput(bodyEl, ip);
        renderCopyIpButton(bodyEl, ip);

        // Render a Copy SID button
        //renderSidInput(bodyEl, sid);
        //renderCopySidButton(bodyEl, sid);

        isPlayerInServer(HIGHLIGHTED_STEAM_IDS, url);
    } catch (ex) {
        console.error(ex);
        return console.error(`Invalid Server: ${url}`);
    }
})();

/**
 * Append loading indicator.
 *
 * @param  {HTML Node} bodyEl
 * @param  {String}    id
 * @param  {String}    position
 */
function appendLoadingIndicator(bodyEl, id, position) {
    const loadingSpan = createLoadingIndicator(bodyEl, id, position);

    bodyEl.appendChild(loadingSpan);
}

/**
 * Create a loading indicator.
 *
 * @param  {HTML Node} bodyEl
 * @param  {String}    id
 * @param  {String}    position
 * @return {HTML Node}
 */
function createLoadingIndicator(bodyEl, id, position) {
    let loadingSpan = document.createElement("span");
    loadingSpan.setAttribute("id", id);
    loadingSpan.innerHTML = "Loading...";

    const style = `padding-top: 8px;
                   background-color: rgb(207, 205, 65);
                   color: rgb(50, 50, 50);
                   font-weight: bold;
                   cursor: wait;
                   padding-bottom: 8px;
                   padding-left: 30px;
                   padding-right: 30px;
                   bottom: 10px;
                   ${position}: 10px;
                   border: none;
                   white-space: nowrap;
                   overflow: hidden
                   text-align: center;
                   text-decoration: none;
                   display: inline-block;
                   font-size: 16px;
                   position: absolute;
                   border-radius: 4px;
                   border: 1px solid black;
                  `;

    loadingSpan.style.cssText = style;

    return loadingSpan;
}

/**
 * Get server number from title.
 *
 * @param  {String} url
 * @return {Integer}
 */
function getServerNumber(url) {
    for (key in SERVER_MAP) {
        if (url === SERVER_MAP[key]) {
            return parseInt(key);
        }
    }
}

/**
 * Get a random integer or double.
 *
 * @param  {Integer} precision
 * @param  {Integer} limit
 * @return {Number}
 */
function getRandomNumber(precision = 10, limit = 3) {
    return Math.floor(Math.random() * (3 * precision - 1 * precision) + 1 * precision) / (1 * precision);
}

/**
 * Get number of players on server.
 *
 * @param  {HTML Node} bodyEl
 * @return {Integer}
 */
function getNumPlayers(bodyEl) {
    // Get player count line from bodyEl's inner HTML.
    const rawLine = "<br>" + getTextByLine(bodyEl.innerHTML, 4, "<br>");

    // Sanitize raw HTML line to get number.
    return getNumPlayersFromHtml(rawLine);
}

/**
 * Get a double to define a delay for each API access based on the server.
 * This is because simultaneous API calls increase the chance of failing.
 *
 * @param  {String} serverNumber
 * @return {Number}
 */
function getServerDelayTime(serverNumber) {
    const delayTable = {
        //0: 2,
        2: 1,
        3: 0,
        //4: 0.0
    };

    // If server number is found, get value. Otherwise, generate random number.
    if (delayTable.hasOwnProperty(serverNumber) === true) {
        return delayTable[serverNumber];
    } else {
        console.error("Server number not found. Random number generated.");

        return getRandomNumber(10, 3);
    }
}

/**
 * Allows user to see more server information. E.g. map type: night,
 * non-checkpoint game mode: Outpost, current mutator: "Pistols Only".
 *
 * @param  {HTML Node}  bodyEl
 * @param  {String}     ip
 * @param  {Integer}    numPlayers
 * @param  {Integer}    serverNumber
 */
async function circleusServerInfoController(bodyEl, ip, numPlayers, serverNumber) {
    if (SHOW_CIRCLEUS_SERVER_INFO === false) return;
    if (!CIRCLEUS_SERVER_INFO_ALLOW_EMPTY && numPlayers < 1) return {};
    if (!CIRCLEUS_SERVER_INFO_ALLOW_LIST.includes(serverNumber)) return {};

    // Add loading indicators.
    appendLoadingIndicator(bodyEl, "loading-left", "left");
    //appendLoadingIndicator(bodyEl, "loading-right", "right");

    const result = {};

    try {
        // Get API data.
        //const seconds = getServerDelayTime(serverNumber);
        const seconds = false;
        //setTimeout(() => {
        //    throw new Error("Error").message;
        //}, 7000);
        const apiData = await getCircleusServerInfo(serverNumber, ip, seconds);
        //const { raw: { rules: { Mutated_b, Mutators_s, Night_b, GameMode_s } } } = apiData;
        const { Mutated_b, Mutators_s, Night_b, GameMode_s } = apiData.raw.rules;

        const hasMutator = (Mutated_b === "true");
        const isNight = (Night_b === "true");
        const isCheckpoint = (GameMode_s === "Checkpoint");
        const mutator = Mutators_s;
        const gameMode = GameMode_s;

        // Add object properties.
        if (hasMutator === true) result.mutator = mutator;
        if (isNight === true) result.night = "Night";
        if (isCheckpoint === false) result.gameMode = gameMode;

        const serverProps = { isNight, hasMutator, mutator, isCheckpoint, gameMode };

        outputCircleusServerInfo(serverProps, seconds, serverNumber);
        appendCircleusServerInfo(bodyEl, result);
    } catch (error) {
        console.error(error + ` - Cass #${serverNumber}`);
        result.error = "error";
        appendCircleusServerInfo(bodyEl, result);
    }

    // Remove loading indicators.
    document.getElementById("loading-left").remove();
    //document.getElementById("loading-right").remove();
}

/**
 * Console output for debugging.
 * Allows user to see more server information. E.g. map type: night,
 * non-checkpoint game mode: Outpost, current mutator: "Pistols Only".
 *
 * @param  {Object}   serverProps
 * @param  {Integer}  seconds
 * @param  {Integer}  serverNumber
 */
function outputCircleusServerInfo(serverProps, seconds, serverNumber) {
    const { isNight, hasMutator, mutator, isCheckpoint, gameMode } = serverProps;
    const arr = [];

    // Add to an array if condition is satisfied.
    const displayNight = (isNight === true) && arr.push("Night");
    const displayMutator = (hasMutator === true) && arr.push(mutator);
    const displayGameMode = (isCheckpoint === false) && arr.push(gameMode);

    const prefix = (seconds !== false) && `${seconds.toFixed(1)}s - `;
    const root = `Cass #${serverNumber}: `;
    const suffix = arr.join(", ");

    if (arr.length > 0) console.log(`${prefix}${root}${suffix}`);
}

/**
 * Retrieve Circleus API info.
 *
 * @param  {Integer}  serverNumber
 * @param  {String}   ip
 * @param  {Integer}  seconds
 * @return {Object}
 */
async function getCircleusServerInfo(serverNumber, ip, seconds = false) {
    if (seconds !== false) await pause(seconds);

    try {
        //const response = await fetch(CIRCLEUS_API);
        //const data = await response.json();
        //return data[serverNumber];

        const apiUrl = CIRCLEUS_API + serverNumber;
        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log(`Cass #${serverNumber} - Circleus API requested.`);

        return data;
    } catch (error) {
        console.error(`Failed to get Circleus's API info: ${error}`);
    }
}

/**
 * Checks if URL is valid, but not enough error conditions
 * to test for efficacy.
 *
 * @param  {HTML Node} bodyEl
 * @param  {String}    url
 */
async function isUrlWorking(bodyEl, url) {
    const response = await fetch(url);

    // Check HTML status code.
    if (response.status !== 200) {
        const errorMsg = `response.status: ${response.status}`;
        console.error(errorMsg);
    }

    /*
    let innerHtml = bodyEl.innerHTML;
    innerHtml = innerHtml.trim();
    const isUrlEmpty = (innerHtml === "<br><br>");
    if (isUrlEmpty) console.error(`Empty Server: ${url}`);
    */
}

/**
 * Prevents automatic page refresh for development or help report a
 * player by not removing them from the page.
 *
 * @param {Boolean} toggle
 * @param {String}  url
 */
function disableAutoPageRefresh(toggle, url) {
    if (isSiteIntroPage(url)) return;
    if (DISABLE_PAGE_REFRESH === false) return;

    if (isSiteMainPage(url)) {
        setTimeout(() => {
            window.stop();
        }, 10000);
    } else {
        window.stop();
    }
}

/**
 * Manages the main page style and child iFrames.
 *
 * @param {HTML Node} bodyEl
 */
function handleMainPage(bodyEl, url) {
    disableAutoPageRefresh(DISABLE_PAGE_REFRESH, url)
    styleMainPage(bodyEl);

    if (INCREASE_IFRAME_HEIGHT) handleMainPageIframes(bodyEl);
}

/**
 * Style the main page (http://cassandra.confluvium.info).
 *
 * @param {HTML Node} bodyEl
 */
function styleMainPage(bodyEl) {
    const color = (DARK_MODE) ? "rgb(41, 49, 60)" : "rgb(208, 208, 208)";

    bodyEl.style.cssText = `background-color: ${color};`;
}

/**
 * Adjusts the iFrame dimensions and styling of the main page's child iFrames.
 *
 * @param {HTML Node} bodyEl
 */
function handleMainPageIframes(bodyEl) {
    let nodes = bodyEl.childNodes;
    let borderColor = "";

    // Set inline frame dimensions
    let i = 0;
    while (i < nodes.length) {
        if (nodes[i].tagName === "IFRAME") {
            //nodes[i].height = (i === 0 || i === 2) ? 310 : 300;
            nodes[i].height = 301;
            //nodes[i].width = 420;

            /*
            borderColor = (isFavoriteServer(nodes[i].src))
                        ? "rgb(207, 205, 65);"
                        : "rgb(128, 128, 128)";
            */
            borderColor = "rgb(128, 128, 128)";

            nodes[i].style.cssText += `border-radius: 4px;
                                       border: 2px solid ${borderColor};
                                       margin-bottom: 4px;
                                       margin-right: 4px;
                                      `;
        }
        i++;
    }
}

/**
 * Check if iFrame URL matches a specific site.
 *
 * @param  {String}  url
 * @return {Boolean}
 */
function isSiteMainPage(url) {
    const mainPageUrl = /^http:\/\/cassandra.confluvium.net\/$/;
    const isMainPageUrl = mainPageUrl.test(url);

    return isMainPageUrl;
}

/**
 * Check if iFrame URL matches a specific site.
 *
 * @param  {String}  url
 * @return {Boolean}
 */
function isSiteIntroPage(url) {
    const legendIframe = /^http:\/\/cassandra3.confluvium.net\/general.html$/;
    const isLegendIframe = legendIframe.test(url);

    return isLegendIframe;
}

/**
 * Check if iFrame URL matches a specific site.
 *
 * @param  {String}  url
 * @return {Boolean}
 */
function isSiteIns2014Page(url) {
    const ins2014Url = /^http:\/\/cassandra.confluvium.net\/tt.php$/;
    const isIns2014Url = ins2014Url.test(url);

    return isIns2014Url;
}

/**
 * Handle the first iFrame on the main page.
 *
 * @param {HTML Node} bodyEl
 */
function handleIntroPage(bodyEl) {
    styleSiteIntroPage(bodyEl);

    //if (REFRESH_BUTTON) renderRefreshButton(bodyEl);

    let msg = "Auto-Refresh";
    let priority = "";
    if (SHOW_CIRCLEUS_SERVER_INFO === false) {
        msg += ", Circleus API";
        priority = "high";
    }
    msg += " Disabled";

    if (DISABLE_PAGE_REFRESH) renderNotification(bodyEl, msg, priority);
}

/**
 * Show a notification.
 *
 * @param {HTML Node} bodyEl
 * @param {String}    msg
 */
function renderNotification(bodyEl, msg, priority) {
    let bgColor = "", additionalStyle = "", width = "20px";

    if (msg === "" || msg === null || msg === undefined) {
        msg = "Error: No message provided.";
    }

    let divEl = document.createElement("div");

    bgColor = (DARK_MODE) ? "rgb(135, 134, 40)" : "rgb(255, 251, 0)";
    if (priority === "high") bgColor = "rgb(216, 104, 104)";

    if (!DARK_MODE) {
        additionalStyle = `border-top: 1px solid rgb(0, 0, 0);
                           border-left: 1px solid rgb(0, 0, 0);
                           border-right: 1px solid rgb(0, 0, 0);
                           border-bottom: 1px solid rgb(0, 0, 0);
                          `;
        width = "22px";
    }

    const style = `color: rgb(0, 0, 0);
                   background-color: ${bgColor};
                   position: absolute;
                   padding-top: 4px;
                   padding-bottom: 4px;
                   border-radius: 4px;
                   bottom: 10px;
                   width: calc(100% - ${width});
                   font-size: 12px;
                   font-weight: bold;
                   text-align: center;
                   ${additionalStyle}
                  `;

    divEl.style.cssText = style;
    divEl.innerHTML = msg;
    bodyEl.appendChild(divEl);
}

/**
 * Style the first iFrame on the main page.
 *
 * @param {HTML Node} bodyEl
 */
function styleSiteIntroPage(bodyEl) {
    let style = `font-family: ${FONT_FAMILY_SERVER_TEXT};
                 font-size: ${FONT_SIZE_LEGEND};
                 padding: 0px 2px 0px 2px;
                 margin-top: 8px;
                `;

    if (DARK_MODE) {
        style += `background-color: rgb(41, 49, 60);
                  color: rgb(200, 200, 200);
                 `;
    }

    bodyEl.style.cssText = style;

    if (DARK_MODE) styleLinks();
}

/**
 * Style all hyperlinks on a page.
 */
function styleLinks() {
    const linkEl = document.querySelectorAll("html body a");

    linkEl.forEach(link => {
        link.style.cssText = "color: rgb(240, 128, 128);";
    });
}

/**
 * Handle the refresh button.
 *
 * @param {String} myString
 */
function handleRefreshButton(myString) {
    //console.log(`handleRefreshButton function with argument ${myString} clicked.`);
    parent.location.reload();
}

/**
 * Render the refresh button.
 *
 * @param {HTML Node} bodyEl
 */
function renderRefreshButton(bodyEl) {
    // Set objects to pass as arguments to create a button.
    const labels = { name: "Refresh", onName: "Pressed!" };
    const colors = {
        normalBgColor: "rgb(81, 135, 204)",
        mouseUpBgColor: "rgb(45, 78, 121)",
        mouseUpTextColor: "rgb(255, 0, 0)",
        normalTextColor: "rgb(245, 245, 245)",
    };
    const btnOffset = "20";
    const additionalStyle = `bottom: ${btnOffset}px; left: ${btnOffset}px`;

    const style = {};
    style.colors = colors;
    style.additionalStyle = additionalStyle;

    const refreshBtnEl = createButton(labels, () => handleRefreshButton("Poughkeepsie"), style);

    bodyEl.appendChild(refreshBtnEl);
}

/**
 * Checks if the number of players obtained from HTML is a valid integer.
 *
 * @param  {Integer} number
 * @return {Boolean}
 */
function isValidServerOccupancyNumber(number) {
    if (!Number.isInteger(number)) return false;

    const min = 0;
    const max = 12;

    if (number < min || number > max) return false;

    return true;
}

/**
 * Extract the number of players from HTML and convert it to an integer.
 *
 * @param  {String} html
 * @return {Integer}
 */
function getNumPlayersFromHtml(html) {
    html = removeNonBreakingSpace(html).slice(0, 16);
    html = html.replace("<br>Players:", "").trim();
    const numPlayers = parseInt(html);

    if (!isValidServerOccupancyNumber(numPlayers)) {
        const errorMsg = "Failed to get valid number of players.";
        return console.error(errorMsg);
    }

    return numPlayers;
}

/**
 * Style the uptime timer to indicate different colors when it reaches
 * certain thresholds as it approaches the server restart time.
 *
 * @param  {Node}    bodyEl
 */
function styleUptime(bodyEl) {
    const rawLine = "<br>" + getTextByLine(bodyEl.innerHTML, 5, "<br>");

    // Get the uptime label. E.g. 2:41:08.
    const regex = /\d\:\d\d\:\d\d/g;
    const uptime = rawLine.match(regex)[0];

    // Extract period of time (hr, min, sec) string from uptime.
    let hours = uptime.charAt(0);
    let minutes = uptime.charAt(2) + uptime.charAt(3);
    let seconds = uptime.charAt(5) + uptime.charAt(6);

    // Convert hr, min, sec string to integers.
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    seconds = parseInt(seconds);

    // Get original HTML content flanking the uptime timer.
    const leftSlice = rawLine.slice(0, 19);
    const rightSlice = rawLine.slice(26, rawLine.length);

    // Set uptime color conditions.
    const uptimeImmediate = ((hours > 4) || ((hours === 4) && (minutes >= 40))); // red text on black background
    const uptimeHigh = ((hours === 4) && (minutes < 45)); // red
    const uptimeModerate = (hours === 3); // orange
    const uptimeNeutral = (hours < 3); // light blue

    // Set colors according to current uptime.
    let additionalStyle = null;
    if (uptimeImmediate) {
        additionalStyle = `color: rgb(255, 0, 0);
                           background-color: rgb(0, 0, 0);
                           padding: 0px 3px 1px 3px;
                          `; // red text on black background
    }
    if (uptimeHigh) additionalStyle = "color: rgb(255, 0, 0)"; // red
    if (uptimeModerate) additionalStyle = "color: rgb(255, 143, 0)"; // orange
    if (uptimeNeutral) additionalStyle = "color: rgb(105, 213, 255)"; // light blue

    const style = `text-shadow: 1px 1px 0px rgb(0, 0, 0);
                   font-family: Verdana;
                   font-size: 16px;
                   font-weight: bold;
                   ${additionalStyle};
                  `;

    // Set new HTML styled uptime.
    const uptimeLineStyled = `<span style="${style}">${uptime}</span>`;

    // Format the new line.
    const newLine = leftSlice + uptimeLineStyled + rightSlice;

    // Replace the old raw line with the new line containing the
    // uptime wrapped in a styled span element.
    bodyEl.innerHTML = bodyEl.innerHTML.replace(rawLine, newLine);
}

/**
 * Style the number of players in a server label.
 *
 * @param  {Node} bodyEl
 */
function styleNumPlayers(bodyEl, numPlayers) {
    // Get player count line from bodyEl's inner HTML.
    const rawLine = "<br>" + getTextByLine(bodyEl.innerHTML, 4, "<br>");

    // Don't style if server is empty.
    if (numPlayers === 0) return;

    let padCircle = "";
    if (numPlayers === 12) padCircle = "padding-right: 1px;";

    // Set the default background color.
    let bgColor = getNumPlayersBgColor(bodyEl, numPlayers);

    let style = `text-shadow: 1px 1px 0px rgb(0, 0, 0);
                 display: inline-block;
                 width: 24px;
                 ${padCircle}
                 font-weight: bold;
                 line-height: 22px;
                 border-radius: 50%;
                 text-align: center;
                 font-size: 14px;
                 color: rgb(255, 255, 255);
                 background: ${bgColor};
               `;

    // Set new HTML styled number.
    const numPlayersSpanEl = `<span style="${style}">${numPlayers}</span>`;

    // Get original HTML content flanking the player number.
    const leftSlice = rawLine.slice(0, 20);
    const rightSlice = rawLine.slice(22, rawLine.length);

    // Format the new raw HTML line.
    const newLine = leftSlice + numPlayersSpanEl + rightSlice;

    // Replace the old raw line with the new line containing the number
    // of players wrapped in a styled span element.
    bodyEl.innerHTML = bodyEl.innerHTML.replace(rawLine, newLine);
}

/**
 * Get the background color based on the number of players on the server.
 *
 * @param  {Node}    bodyEl
 * @param  {Integer} numPlayers Current number of players in the server.
 * @return {String}
 */
function getNumPlayersBgColor(bodyEl, numPlayers) {
    let bgColor = (DARK_MODE) ? "rgb(54, 172, 0)" : "rgb(0, 206, 22)"; // Green

    // Get max server player slots HTML line.
    let playerSlots = "<br>" + getTextByLine(bodyEl.innerHTML, 1, "<br>");

    // Get string inside parenthesis. E.g. 8+2.
    playerSlots = playerSlots.match(/\(([^)]+)\)/)[1];

    // Separate the string by the plus operator into an array.
    const playerSlotsArray = playerSlots.split("+");

    // TODO: Verify that each item in array is a valid integer.
    // Then remove parseInt() in next few lines.

    // Get the max player slots for non-Moderators.
    const nonModMaxPlayerSlots = parseInt(playerSlotsArray[0]);

    // Add the two items in the array.
    let modMaxPlayerSlots = playerSlotsArray.reduce((a, b) => parseInt(a) + parseInt(b));

    // Get the max player slots based on whether the player is
    // a moderator. Moderators can have priority slots.
    const maxPlayerSlots = (EXTEND_SERVER_SLOT_WARNING)
        ? modMaxPlayerSlots
        : nonModMaxPlayerSlots;

    // Player slot specification (Moderators). One remaining slot
    // will show an orange background
    const onePlayerSlotOpen = maxPlayerSlots - 1;

    /*
    numPlayers = 7;
    console.log(`numPlayers: ${numPlayers}`);
    console.log(`playerSlotsHigh: ${playerSlotsHigh}`);
    console.log(`onePlayerSlotOpen: ${onePlayerSlotOpen}`);
    console.log(`nonModMaxPlayerSlots: ${nonModMaxPlayerSlots}`);
    */

    // Determine background color by comparing current number of
    // players to the defined specification.
    // One slot open.
    if (numPlayers === onePlayerSlotOpen) {
        bgColor = (DARK_MODE) ? "rgb(172, 121, 0)" : "rgb(255, 120, 0)";
    }
    // Full server.
    if (numPlayers >= maxPlayerSlots) {
        bgColor = (DARK_MODE) ? "rgb(172, 0, 0)" : "rgb(255, 0, 0)";
    }
    // Write to console error if the number reads higher than what is
    // parsed from the server title. Player count should never exceed
    // this number.
    if (numPlayers > modMaxPlayerSlots) {
        bgColor = "rgb(0, 0, 0)";
        const errorMsg = `The max player slots available for server URL: ${bodyEl.baseURI} may be malfunctioning.`;
        console.error(errorMsg);
    }

    return bgColor;
}

/**
 * Remove non-breaking spaces from a string.
 *
 * @param  {String} str
 * @return {String}
 */
function removeNonBreakingSpace(str) {
    str = str.replace(/&nbsp;/g, "");
    str = str.replace(/&nbsp/g, "");

    return str;
}

/**
 * Extract an IP address from HTML. Also handles IP overriding in the
 * event the owner changed a server IP and hasn't updated it on the
 * web interface.
 *
 * @param  {Node}    bodyEl
 * @param  {String}  newIp
 * @return {String}
 */
function getIp(bodyEl, newIp) {
    const rawLine = getTextByLine(bodyEl.innerHTML, 6, "<br>").trim().substring(9);

    const ip = (newIp) ? handleIpOverride(bodyEl, ip) : rawLine;

    return ip;
}

/**
 * Extract a replay ID from HTML.
 *
 * @param  {Node}    bodyEl
 * @return {String}
 */
function getSid(bodyEl) {
    return getTextByLine(bodyEl.innerHTML, 3, "<br>").trim().substring(5);
}

/**
 * Remove a line break from the end of an inner HTML.
 *
 * @param {Node} bodyEl
 */
function trimLineBreakElement(bodyEl) {
    bodyEl.innerHTML = bodyEl.innerHTML.trim().slice(0, -4);
}

/**
 * Add a style element and inserts CSS. Specifically used to
 * set the progress bar's color.
 *
 * @param {String} DOCUMENT_CSS
 */
function setDocumentStyleSheet(DOCUMENT_CSS) {
    if (!DARK_MODE) return;

    // Create style element
    const styleEl = document.createElement('style');

    // Set style sheet contents
    styleEl.innerHTML = DOCUMENT_CSS;

    // Get head element
    const headEl = document.head;

    // Insert style sheet inside head element
    headEl.appendChild(styleEl, headEl);
}

/**
 * Render a Copy SID button.
 *
 * @param {Node}   bodyEl
 * @param {String} sid
 */
function renderCopySidButton(bodyEl, sid) {
    if (sid === "") return;

    // Set theme colors.
    let colorBg = (DARK_MODE) ? "rgb(35, 35, 35)" : "rgb(76, 105, 175)";
    let colorBgActive = (DARK_MODE) ? "rgb(104, 33, 122)" : "rgb(114, 0, 0)";
    let colorText = (DARK_MODE) ? "rgb(138, 188, 255)" : "rgb(255,255,255)";

    // Set objects to pass as arguments to create a button.
    const labels = { name: "Copy SID", onName: "Copied!" };
    const colors = {
        normalBgColor: colorBg,
        mouseUpBgColor: colorBgActive,
        mouseUpTextColor: colorText,
        normalTextColor: colorText,
    };

    const btnOffset = "10";
    const additionalStyle = `padding-top: 8px;
                             padding-bottom: 8px;
                             padding-left: 30px;
                             padding-right: 30px;
                             bottom: ${btnOffset}px;
                             right: ${btnOffset}px
                            `;

    const style = {};
    style.colors = colors;
    style.additionalStyle = additionalStyle;

    const sidCopyBtnEl = createButton(labels, () => handleCopy("sidInput"), style);
    bodyEl.appendChild(sidCopyBtnEl);
}

/**
 * Render a Copy IP button.
 *
 * @param {Node}   bodyEl
 * @param {String} ip
 */
function renderCopyIpButton(bodyEl, ip) {
    if (ip === "") return;

    let colorBg = (DARK_MODE) ? "rgb(49, 79, 99)" : "rgb(76, 175, 80)";
    let colorBgActive = (DARK_MODE) ? "rgb(168, 132, 22)" : "rgb(114, 0, 0)";
    let colorText = (DARK_MODE) ? "rgb(138, 188, 255)" : "rgb(255, 255, 255)";
    let colorTextMouseUp = (DARK_MODE) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";

    const labels = { name: "Copy IP", onName: "Copied!" };
    const colors = {
        normalBgColor: colorBg,
        mouseUpBgColor: colorBgActive,
        mouseUpTextColor: colorTextMouseUp,
        normalTextColor: colorText,
    };

    const btnOffset = "10";
    const additionalStyle = `padding-top: 8px;
                             padding-bottom: 8px;
                             padding-left: 30px;
                             padding-right: 30px;
                             bottom: ${btnOffset}px;
                             left: ${btnOffset}px;
                             opacity: 0.8;
                             cursor: pointer;
                            `;

    const style = {};
    style.colors = colors;
    style.additionalStyle = additionalStyle;

    const ipCopyBtnEl = createButton(labels, () => handleCopy("ipInput"), style);
    bodyEl.appendChild(ipCopyBtnEl);
}

/**
 * Render a SID input element to allow its contents to be selected
 * and copied to the clipboard. Currently doesn't support Chrome.
 *
 * @param {Node}   bodyEl
 * @param {String} sid
 */
function renderSidInput(bodyEl, sid) {
    let bgColor = "";

    if (DARK_MODE) {
        if (FAVORITE_SERVER && FAVORITE_SERVER_URL !== "") {
            bgColor = "rgb(61, 49, 57)"; // 61, 49, 57
        } else {
            bgColor = "rgb(50, 50, 50)";
        }
    } else {
        bgColor = "rgb(204, 255, 255)";
    }

    const sidInputStyle = `width: 0px;
                           height: 0px;
                           border: none;
                           position: absolute;
                           z-index: -1;
                           top: -4000px;
                           background-color: ${bgColor};
                          `;

    const sidInputEl = createInput(sid, "sidInput", "readonly", sidInputStyle);
    bodyEl.appendChild(sidInputEl);
}

/**
 * Render a IP input element to allow its contents to be selected
 * and copied to the clipboard. Currently doesn't support Chrome.
 *
 * @param {Node}   bodyEl
 * @param {String} ip
 */
function renderIpInput(bodyEl, ip) {
    let bgColor = "";

    if (DARK_MODE) {
        if (FAVORITE_SERVER && FAVORITE_SERVER_URL !== "") {
            bgColor = "rgb(61, 49, 57)"; // 61, 49, 57
        } else {
            bgColor = "rgb(50, 50, 50)";
        }
    } else {
        bgColor = "rgb(204, 255, 255)";
    }

    const ipInputStyle = `width: 0px;
                          height: 0px;
                          border: none;
                          position: absolute;
                          z-index: -1;
                          top: -4000px;
                          background-color: ${bgColor};
                         `;

    const ipInputEl = createInput(ip, "ipInput", "readonly", ipInputStyle);
    bodyEl.appendChild(ipInputEl);
}

/**
 * Render the auto refresh countdown timer.
 *
 * @param {Node} bodyEl
 */
function renderAutoRefreshCountdown(bodyEl, url) {
    if (DISABLE_PAGE_REFRESH) return;

    let timerInputStyle = "";
    let bgColor = "";

    if (DARK_MODE) {
        timerInputStyle += "color: rgb(245, 245, 245);";

        bgColor = (FAVORITE_SERVER && isFavoriteServer(url))
            ? "rgb(61, 49, 57);"
            : "rgb(50, 50, 50);";
    } else {
        bgColor = (FAVORITE_SERVER && isFavoriteServer(url))
            ? "rgb(255, 255, 255);"
            : "rgb(204, 255, 255);";
    }

    timerInputStyle += `width: 22px;
                        height: 18px;
                        text-align: center;
                        border: none;
                        position: absolute;
                        bottom: 17px;
                        left: 242px;
                        background-color: ${bgColor};
                       `;

    const timerInputEl = createInput(13, "myTimer", "readonly", timerInputStyle);
    bodyEl.appendChild(timerInputEl);
}

/**
 * Render a progress bar, which displays the progress until the
 * iFrame/page automatically refreshes.
 *
 * @param {Node} bodyEl
 */
function renderAutoRefreshProgressBar(bodyEl) {
    if (DISABLE_PAGE_REFRESH) return;

    const progressBarEl = createProgressBar("0", "13", "progressBar");

    const style = `position: absolute;
                   bottom: 19px;
                   left: 160px;
                   width: 74px;
                   border: 1px solid rgb(0, 0, 0);
                  `;

    progressBarEl.style.cssText = style;
    bodyEl.appendChild(progressBarEl);
}

/**
 * Highlight admin link if the first instance of link element
 * found contains an "admin" string in the URL.
 */
function styleAdminLink() {
    const linkEl = document.querySelectorAll("html body a")[0];
    const isAdminLink = /admin/.test(linkEl);

    if (!isAdminLink) return;

    const darkTheme = `font-family: Helvetica;
                       font-size: 14px;
                       font-weight: bold;
                       color: rgb(245, 245, 245);
                      `;

    if (DARK_MODE) linkEl.style.cssText = darkTheme;
}

/**
 * Check if the current page is a favorite server specified
 * by the user in the configuration section.
 *
 * @param {Node} bodyEl
 */
function isFavoriteServer(url) {
    if (FAVORITE_SERVER_URL === "") return;

    return FAVORITE_SERVER_URL.test(url);
}

/**
 * Style the favorite server page.
 *
 * TODO: DRY? Refactor with styleDefaultServerPage function.
 * Make a Class from getServerUrl -> favorite and default?
 *
 * @param {Node}   bodyEl
 * @param {String} url
 */
function styleFavoriteServerPage(bodyEl, url) {
    if (!FAVORITE_SERVER) return;
    if (!isFavoriteServer(url)) return;

    let style = `font-family: ${FONT_FAMILY_SERVER_TEXT};
                 font-size: ${FONT_SIZE_SERVER};
                 padding: 0px 2px 0px 2px;
                 margin-top: 7px;
                `;

    if (DARK_MODE) {
        style += `background-color: rgb(0, 40, 82);
                  color: rgb(200, 200, 200);
                  padding: 0px 2px 0px 2px;
                 `;
    } else {
        style += `background-color: rgb(255, 255, 255);
                  color: rgb(0, 0, 0);
                 `
    }

    bodyEl.style.cssText = style;
}

/**
 * Style the default server page.
 *
 * @param {Node}   bodyEl
 * @param {String} url
 */
function styleDefaultServerPage(bodyEl, url) {
    if (FAVORITE_SERVER && isFavoriteServer(url)) return;

    let style = `font-family: ${FONT_FAMILY_SERVER_TEXT};
                 font-size: ${FONT_SIZE_SERVER};
                 padding: 0px 2px 0px 2px;
                 margin-top: 7px;
                `;

    if (DARK_MODE) {
        style += `background-color: rgb(50, 50, 50);
                  color: rgb(200, 200, 200);
                 `
    }

    bodyEl.style.cssText = style;
}

/**
 * Wrap a HTML string in a span element with a style argument.
 *
 * @param {String} htmlString
 * @param {String} style
 * @return {String}
 */
function wrapStringWithSpan(htmlString, style, title) {
    return `<span title="${title}" style="${style}">${htmlString}</span>`;
}

/**
 * Append a HTML link string.
 *
 * @param {String} title
 * @param {String} style
 * @param {String} content
 * @return {String}
 */
function appendNewTabLink(title, style, content) {
    return `<a title="${title}" style="${style}" target="_blank" href="${content}">→</a>`;
}

/**
 * Styles the title of the server.
 *
 * @param {Node}   bodyEl
 * @param {String} titleStyle
 */
function styleTitle(bodyEl, titleStyle) {
    const rawLine = getTextByLine(bodyEl.innerHTML, 1, "<br>").trim();
    let newLine = wrapStringWithSpan(rawLine, titleStyle);

    const style = `text-decoration: none; color: rgb(200, 200, 200);`;
    const title = "Open in new tab";
    newLine += " " + appendNewTabLink(title, style, bodyEl.baseURI);

    bodyEl.innerHTML = bodyEl.innerHTML.replace(rawLine, newLine);
}

/**
 * Style elements on a server page, such as number of players
 * on server, uptime, admin link, and the easily readable Steam
 * names.
 *
 * @param {Node}   bodyEl
 * @param {String} sid
 */
async function styleServerPageElements(bodyEl, sid, ip, numPlayers, serverNumber) {
    const titleStyle = `font-size: ${FONT_SIZE_SERVER_TITLE};`;
    styleTitle(bodyEl, titleStyle);

    styleNumPlayers(bodyEl, numPlayers);
    styleUptime(bodyEl);
    styleAdminLink();
    trimLineBreakElement(bodyEl);
    styleSteamNames();

    await circleusServerInfoController(bodyEl, ip, numPlayers, serverNumber);

    // Rewrites bodyEl.innerHTML
    if (CENSOR) censorSid(bodyEl, sid);
}

function appendCircleusServerInfo(bodyEl, data) {
    //if (Object.keys(data).length === 0) return;
    if (Object.keys(data).length === 0) data = { status: "success" };

    const rawLine = "<br>" + getTextByLine(bodyEl.innerHTML, 4, "<br>");

    const newData = mapToCircleusServerViewModel(data);
    const newLine = `${rawLine}${newData}`;

    bodyEl.innerHTML = bodyEl.innerHTML.replace(rawLine, newLine);
}

function mapToCircleusServerViewModel(data) {
    const properties = Object.keys(data);
    const success = (properties.length === 1 && properties[0] === "status");
    const failure = (properties.length === 1 && properties[0] === "error");

    if (success) {
        const style = `color: rgb(0, 255, 0); font-size: 1.6em; line-height: 0.5; font-weight: bold;`;

        return wrapStringWithSpan("&check;", style, "Gamedig API success");
    } else if (failure) {
        const style = `color: rgb(255, 0, 0); font-size: 1.6em; line-height: 0.5; font-weight: bold;`;

        return wrapStringWithSpan("&#10005;", style, "Gamedig API failed");
    } else {
        const arr = [];

        if (data.night !== undefined) arr.push(data.night);
        if (data.mutator !== undefined) arr.push(data.mutator);
        if (data.gameMode !== undefined) arr.push(data.gameMode);
        if (data.error !== undefined) arr.push(data.error);

        const innerHTML = arr.join(', ');
        const style = `color: rgb(255, 0, 0); font-weight: bold`;

        return wrapStringWithSpan(innerHTML, style, "Gamedig API");
    }

}

/**
 * Style the single Insurgency 2014 server.
 *
 * @param  {HTML Node} bodyEl
 */
function styleIns2014Page(bodyEl) {
    let style = `font-family: ${FONT_FAMILY_SERVER_TEXT};
                 font-size: ${FONT_SIZE_SERVER_2014};
                 padding: 0px 2px 0px 2px;
                 margin-top: 8px;
                `;

    if (DARK_MODE) {
        style += `background-color: rgb(21, 21, 21);
                  color: rgb(237, 237, 237);
                 `;
    }

    bodyEl.style.cssText = style;
}

/**
 * Censor SID.
 *
 * @param  {Object} element Entirety of iFrame innerHTML content.
 * @param  {String} sid     SID (In-game replay ID).
 */
function censorSid(bodyEl, sid) {
    const regExp = new RegExp(sid);
    const randomizedSid = createRandomString(sid.length);

    bodyEl.innerHTML = bodyEl.innerHTML.replace(regExp, randomizedSid);
}

/**
 * Resolves copying the new IP address since owner has not updated Cassandra
 * 0's IP address by reading the whole body of the iFrame's innerHTML.
 * Update: Owner has updated IP address.
 *
 * @param  {String} element
 * @param  {String} ip
 * @return {String}
 */
function setCass0ToNewIp(bodyEl, ip) {
    const oldIp = "104.238.133.74:27122";
    const newIp = "144.202.2.75:27122";
    const regExp = new RegExp(oldIp);
    const isOldIp = doesArg1ExistInArg2(oldIp, ip);

    if (isOldIp) {
        bodyEl.innerHTML = bodyEl.innerHTML.replace(regExp, newIp);
        ip = newIp;
    }

    return ip;
}

/**
 * Override an IP if owner hasn't updated the web
 * interface with a new server IP.
 */
function handleIpOverride() {
    // Do something...
}

/**
 * Apply Regex to check if argument is a Steam ID.
 *
 * @param  {String} str
 * @return {Boolean}
 */
function hasSteamNum(str) {
    return /765/.test(str);
}

/**
 * Apply Regex to check if a "arg1" pattern exists in the given "arg2".
 *
 * @param  {String}
 * @param  {String}
 * @return {Boolean}
 */
function doesArg1ExistInArg2(arg1, arg2) {
    let regExp = new RegExp(arg1);
    return regExp.test(arg2);
}

/**
 * Style names.
 *
 * @return {String} CSS
 */
function styleNames() {
    let bgColor = (DARK_MODE) ? "rgb(180, 180, 180)" : "rgb(138, 138, 138)";
    let color = (DARK_MODE) ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)";

    let style = `background-color: ${bgColor};
                 display: inline-block;
                 color: ${color};
                 font-size: ${FONT_SIZE_SERVER_PILL};
                 font-family: ${FONT_FAMILY_PILL};
                 text-decoration: none;
                 padding: 0px 6px 1px 6px;
                 margin-top: 4px;
                 margin-bottom: 0px;
                 margin-right: 1px;
                 margin-left: 0px;
                 border-radius: 8px;
                `;

    return style;
}

/**
 * Get a Date object from an MongoDB Object ID.
 * Source: https://steveridout.github.io/mongo-object-time/
 *
 * @param  {String} objectId MongoDB Object ID.
 * @return {Object} Date
 */
function getDateFromObjectId(objectId) {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}

/**
 * Format a Date object to YYYY-MM-DD.
 * Source: https://stackoverflow.com/a/23593099
 *
 * @param  {Object} Date
 * @return {String}
 */
function formatDate(d) {
    let month = "" + (d.getMonth() + 1);
    let day = "" + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }

    return [year, month, day].join('-');
}

function isPlayerInServer(highlightedSteamIDs, url) {
    const nodes = document.querySelector("html body").childNodes;
    let highlightedSteamIDsFound = false;

    let i = 0;
    while (i < nodes.length) {
        // If the hyperlink child has a Steam ID, continue.
        if (hasSteamNum(nodes[i].href)) {
            const steamId = nodes[i].href.trim().split("/")[4];

            // if the array of Steam IDs contain the current Steam ID in HTML node
            if (highlightedSteamIDs.includes(steamId)) {
                highlightedSteamIDsFound = true;

                // Override colors
                nodes[i].style.cssText = nodes[i].style.cssText + `font-size: ${HIGHLIGHT_FONT_SIZE} !important;
                                                                   border-radius: 12px !important;
                                                                   background-color: ${HIGHLIGHT_BG_COLOR} !important;
                                                                   color: ${HIGHLIGHT_TXT_COLOR} !important;
                                                                  `;
            }
        }

        i++;
    }
}

/**
 * Apply style to names.
 */
function styleSteamNames() {
    // Grab all hyperlinks
    const hyperlinks = document.querySelectorAll("a");

    hyperlinks.forEach((hyperlink, index) => {
        if (hyperlink.host === "steamcommunity.com") {
            hyperlink.style.cssText = styleNames();

            if (CENSOR) {
                hyperlink.innerText = createRandomString(hyperlink.innerText.length);
            }

            // Handle garbled (windows-1252?) characters. E.g. trademark symbol
            // hyperlink.innerText = handleGarbledSymbols(hyperlink.innerText);
        }
    });
}

/**
 * Fix garbled symbols by dictionary lookup.
 * 2020-11-08: Deprecated. Owner implemented UTF-8 encoding on web interface.
 *
 * @param  {String} steamName
 * @return {String}
 */
function handleGarbledSymbols(steamName) {
    for (let key in GARBLED_TO_SYMBOL_DICTIONARY) {
        const regex = new RegExp(key, "g");
        // Get regex matches for a key in dictionary.
        const matches = steamName.match(regex);

        // If not found, skip to the next dictionary key.
        if (matches === null || matches.length < 1) continue;

        // Replace the garbled text with the value found from the
        // associated key in dictionary
        steamName = steamName.replace(regex, GARBLED_TO_SYMBOL_DICTIONARY[key]);
    }

    return steamName;
}

/**
 * Create a randomized string of any length using a range of specified characters.
 * Source: stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
 *
 * @param  {String} charLen Length of desired random string.
 * @return {String} Random string.
 */
function createRandomString(charLen) {
    let result = "";
    const chars = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-[]_ `;

    for (let i = 0; i < charLen; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
}

/**
 * Create a progress bar element.
 *
 * @param  {String} value Set value of progress bar.
 * @param  {String} max   Set max value of progress bar.
 * @param  {String} id    Set id of progress bar.
 * @return {HtmlElement}
 */
function createProgressBar(value, max, id) {
    let progressBar = document.createElement("progress");

    progressBar.setAttribute("value", value);
    progressBar.setAttribute("max", max);
    progressBar.setAttribute("id", id);

    return progressBar;
}

/**
 * Create an HTML button element.
 *
 * @param  {Object}      labels
 * @param  {Function}    handleClick      Callback.
 * @param  {Object}      colors
 *
 * @param  {String}      name             Set button label.
 * @param  {String}      onName           Set button label on mouse up.
 * @param  {String}      normalBgColor    Set normal button background color.
 * @param  {String}      mouseUpBgColor   Set button background color on mouse up.
 * @param  {String}      normalTextColor  Set normal button text color.
 * @param  {String}      mouseUpTextColor Set button text color on mouse up.
 * @return {htmlElement}
 */
function createButton(labels, handleClick, style) {
    const { name, onName } = labels;
    const { colors: { normalBgColor,
        normalTextColor,
        mouseUpBgColor,
        mouseUpTextColor
    },
        additionalStyle
    } = style;

    // Format CSS based on user mouse action
    const getStyle = arg => {
        let bgColor = "";
        let textColor = "";

        if (arg === "onmouseup") {
            bgColor = mouseUpBgColor;
            textColor = mouseUpTextColor;
        }
        if (arg === "default") {
            bgColor = normalBgColor;
            textColor = normalTextColor;
        }

        let style = `background-color: ${bgColor};
                     border: none;
                     color: ${textColor};
                     width: 140px;
                     white-space: nowrap;
                     overflow: hidden
                     text-align: center;
                     text-decoration: none;
                     display: inline-block;
                     font-size: 16px;
                     position: absolute;
                     border-radius: 4px;
                     border: 1px solid black;
                     ${additionalStyle};
                    `;

        return style;
    };

    let button = document.createElement("button");

    button.innerHTML = name;

    // Apply default style
    button.style.cssText = getStyle("default");

    // On user mouseup, apply new button name and style.
    button.onmouseup = ({ target: el }) => {
        el.innerHTML = onName;
        el.style.cssText = getStyle("onmouseup");

        // Reset name and style back to default after specified time.
        setTimeout(() => {
            el.innerHTML = name;
            el.style.cssText = getStyle("default");
        }, 500);

    }

    // Callback
    button.onclick = handleClick;

    return button;
}

/**
 * Create an HTML input element.
 *
 * @param  {String} value    Set value of input.
 * @param  {String} id       Set id of input.
 * @param  {String} readonly Set whether input is readonly.
 * @param  {String} style    Set CSS of input.
 * @return {HtmlElement}
 */
function createInput(value, id, readonly = null, style) {
    let input = document.createElement("input");

    input.setAttribute("id", id);
    input.style.cssText = style;
    input.value = value;

    /*
     * Replace IP.
     */
    /*
    const oldIp = "104.238.133.74:27122";
    const newIp = "144.202.2.75:27122";
    // If IP is old, set to new IP.
    if (value === oldIp) input.value = newIp;
    */

    if (readonly) input.setAttribute("readonly", true);

    return input;
}

/**
 * Increments a progress bar element and decrements a countdown element.
 *
 * @param  {Number} max                Seconds to count down/up from.
 * @param  {String} incrementElementId Element ID to increment.
 * @param  {String} decrementElementId Element ID to decrement.
 */
function startTimer(max, incrementElement, decrementElement) {
    if (DISABLE_PAGE_REFRESH) return;

    let timeleft = max;

    const refreshTimer = setInterval(() => {
        if (timeleft <= 0) clearInterval(refreshTimer);

        // Increment progress bar
        if (incrementElement) {
            document.getElementById(incrementElement).value = max - timeleft;
        }

        // Decrement countdown
        if (decrementElement) {
            document.getElementById(decrementElement).value = timeleft;
        }

        timeleft -= 1;
    }, 1000);
}

/**
 * Copy text value from a given input element.
 *
 * @param  {String} id
 */
function handleCopy(id) {
    let el = document.getElementById(id);

    el.select();
    document.execCommand("copy");
}

/**
 * Extract a line from markup (e.g. innerHTML separated by line breaks).
 *
 * @param  {String} arg
 * @return {String}
 */
function getTextByLine(target, lineIndex, separator) {
    let lines = target.trim().split(separator).filter(str => str !== separator);

    return lines[lineIndex - 1];
}

/**
 * Pause code execution to simulate a slow API call.
 * Example: await pause(1);
 *
 * @param  {String}  seconds Time in seconds to pause code execution.
 * @return {Promise}
 */
function pause(seconds) {
    return new Promise(resolve => {
        setTimeout(() => { resolve() }, seconds * 1000);
    });
}
