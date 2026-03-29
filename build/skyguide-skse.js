/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/actions/executor.ts"
/*!*********************************!*\
  !*** ./src/actions/executor.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   executeAction: () => (/* binding */ executeAction)
/* harmony export */ });
Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


function logDebug(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())("[actions/executor] ".concat(message));
    }
}
function isValidForm(form) {
    if (form === null || form === undefined || typeof form !== "object") {
        return false;
    }
    var candidate = form;
    var deleted = typeof candidate.isDeleted === "function" ? candidate.isDeleted() : false;
    var disabled = typeof candidate.isDisabled === "function" ? candidate.isDisabled() : false;
    return !deleted && !disabled;
}
function getReferenceFormId(ref) {
    if (ref === null || ref === undefined || typeof ref !== "object") {
        return null;
    }
    var candidate = ref;
    if (typeof candidate.getFormID === "function") {
        var id = candidate.getFormID();
        return typeof id === "number" ? id : null;
    }
    if (typeof candidate.getFormId === "function") {
        var id = candidate.getFormId();
        return typeof id === "number" ? id : null;
    }
    return null;
}
function isValidReference(ref) {
    if (ref === null || ref === undefined || typeof ref !== "object") {
        return false;
    }
    var candidate = ref;
    if (typeof candidate.activate !== "function") {
        return false;
    }
    var formId = getReferenceFormId(ref);
    if (formId === null) {
        return false;
    }
    var form = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).getFormEx(formId);
    return isValidForm(form);
}
function getPlayerPosition(player) {
    return {
        x: player.getPositionX(),
        y: player.getPositionY(),
        z: player.getPositionZ(),
    };
}
function isActionBlockedByUi() {
    if (Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).isMenuOpen("Loading Menu")) {
        logDebug("Action blocked: Loading Menu is open");
        return true;
    }
    if (Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).isMenuOpen("MessageBoxMenu")) {
        logDebug("Action blocked: MessageBoxMenu is open");
        return true;
    }
    return false;
}
function getClosestReference(x, y, z, radius) {
    var _a, _b;
    var gameWithClosestReference = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());
    return (_b = (_a = gameWithClosestReference.findClosestReference) === null || _a === void 0 ? void 0 : _a.call(gameWithClosestReference, x, y, z, radius)) !== null && _b !== void 0 ? _b : null;
}
function executeSafely(actionType, operation) {
    try {
        operation();
        logDebug("Executed action: ".concat(actionType));
        return true;
    }
    catch (error) {
        logDebug("Action failed: ".concat(actionType, " (").concat(String(error), ")"));
        return false;
    }
}
function releaseBlockAfterDelay(delayMs) {
    var runtimeTimers = globalThis;
    if (typeof runtimeTimers.setTimeout === "function") {
        runtimeTimers.setTimeout(function () {
            // @ts-ignore
            Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).releaseKey(42 /* DxScanCode.LeftShift */);
        }, delayMs);
        return;
    }
    // @ts-ignore
    Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).releaseKey(42 /* DxScanCode.LeftShift */);
}
function executeAction(action) {
    var player = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).getPlayer();
    if (!player) {
        logDebug("Action blocked: player is null");
        return false;
    }
    var playerForm = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).getFormEx(_config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID);
    if (!isValidForm(playerForm)) {
        logDebug("Action blocked: player form invalid/deleted/disabled");
        return false;
    }
    if (isActionBlockedByUi()) {
        return false;
    }
    switch (action.type) {
        case "move": {
            return executeSafely(action.type, function () {
                player.setPosition(action.x, action.y, action.z);
            });
        }
        case "face": {
            return executeSafely(action.type, function () {
                player.setAngle(0, 0, action.angle);
            });
        }
        case "activate": {
            var _a = getPlayerPosition(player), x = _a.x, y = _a.y, z = _a.z;
            if (action.target === "crosshair") {
                var crosshairRef_1 = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).getCurrentCrosshairRef();
                if (!isValidReference(crosshairRef_1)) {
                    logDebug("Activate blocked: invalid crosshair reference");
                    return false;
                }
                return executeSafely(action.type, function () {
                    crosshairRef_1.activate(player);
                });
            }
            if (action.target === "nearestNPC") {
                var nearestNpc_1 = Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).findClosestActor(x, y, z, 2000);
                if (!isValidReference(nearestNpc_1)) {
                    logDebug("Activate blocked: no valid nearest NPC");
                    return false;
                }
                return executeSafely(action.type, function () {
                    nearestNpc_1.activate(player);
                });
            }
            if (action.target === "nearestDoor") {
                var nearestDoor_1 = getClosestReference(x, y, z, 2000);
                if (!isValidReference(nearestDoor_1)) {
                    logDebug("Activate blocked: no valid nearest door");
                    return false;
                }
                return executeSafely(action.type, function () {
                    nearestDoor_1.activate(player);
                });
            }
            var nearestContainer_1 = getClosestReference(x, y, z, 2000);
            if (!isValidReference(nearestContainer_1)) {
                logDebug("Activate blocked: no valid nearest container");
                return false;
            }
            return executeSafely(action.type, function () {
                nearestContainer_1.activate(player);
            });
        }
        case "fastTravel": {
            Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).notification("Fast travel not supported via API");
            logDebug("Fast travel blocked for location: ".concat(action.location));
            return false;
        }
        case "drawWeapon": {
            return executeSafely(action.type, function () {
                player.drawWeapon();
            });
        }
        case "sheatheWeapon": {
            return executeSafely(action.type, function () {
                player.sheatheWeapon();
            });
        }
        case "attack": {
            return executeSafely(action.type, function () {
                // @ts-ignore
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).tapKey(57);
            });
        }
        case "block": {
            return executeSafely(action.type, function () {
                // @ts-ignore
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).holdKey(42);
                releaseBlockAfterDelay(500);
            });
        }
        case "equip": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).notification("Equip: ".concat(action.itemName));
            });
        }
        case "useItem": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).notification("Use item: ".concat(action.itemName));
            });
        }
        case "heal": {
            return executeSafely(action.type, function () {
                player.restoreActorValue("health", action.amount);
            });
        }
        case "saveGame": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).saveGame(action.name);
            });
        }
        case "notification": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).notification(action.message);
            });
        }
        case "forceThirdPerson": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).forceThirdPerson();
            });
        }
        case "forceFirstPerson": {
            return executeSafely(action.type, function () {
                Object(function webpackMissingModule() { var e = new Error("Cannot find module 'src/skyrimPlatform'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()).forceFirstPerson();
            });
        }
    }
}


/***/ },

/***/ "./src/actions/parser.ts"
/*!*******************************!*\
  !*** ./src/actions/parser.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isValidAction: () => (/* binding */ isValidAction),
/* harmony export */   parseAction: () => (/* binding */ parseAction)
/* harmony export */ });
var ACTION_TYPES = new Set([
    "move",
    "face",
    "activate",
    "fastTravel",
    "drawWeapon",
    "sheatheWeapon",
    "attack",
    "block",
    "equip",
    "useItem",
    "heal",
    "saveGame",
    "notification",
    "forceThirdPerson",
    "forceFirstPerson",
]);
var ACTIVATE_TARGETS = new Set([
    "crosshair",
    "nearestNPC",
    "nearestDoor",
    "nearestContainer",
]);
function isActivateTarget(value) {
    return typeof value === "string" && ACTIVATE_TARGETS.has(value);
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function parseAction(raw) {
    if (!isRecord(raw)) {
        return null;
    }
    var actionType = raw.type;
    if (typeof actionType !== "string" || !ACTION_TYPES.has(actionType)) {
        return null;
    }
    switch (actionType) {
        case "move": {
            var x = raw.x, y = raw.y, z = raw.z;
            if (typeof x !== "number" || typeof y !== "number" || typeof z !== "number") {
                return null;
            }
            return { type: "move", x: x, y: y, z: z };
        }
        case "face": {
            var angle = raw.angle;
            if (typeof angle !== "number") {
                return null;
            }
            return { type: "face", angle: angle };
        }
        case "activate": {
            var target = raw.target;
            if (!isActivateTarget(target)) {
                return null;
            }
            return { type: "activate", target: target };
        }
        case "fastTravel": {
            var location = raw.location;
            if (typeof location !== "string") {
                return null;
            }
            return { type: "fastTravel", location: location };
        }
        case "equip":
        case "useItem": {
            var itemName = raw.itemName;
            if (typeof itemName !== "string") {
                return null;
            }
            return { type: actionType, itemName: itemName };
        }
        case "heal": {
            var amount = raw.amount;
            if (typeof amount !== "number") {
                return null;
            }
            return { type: "heal", amount: amount };
        }
        case "saveGame": {
            var name = raw.name;
            if (typeof name !== "string") {
                return null;
            }
            return { type: "saveGame", name: name };
        }
        case "notification": {
            var message = raw.message;
            if (typeof message !== "string") {
                return null;
            }
            return { type: "notification", message: message };
        }
        case "drawWeapon":
        case "sheatheWeapon":
        case "attack":
        case "block":
        case "forceThirdPerson":
        case "forceFirstPerson":
            return { type: actionType };
    }
    return null;
}
function isValidAction(action) {
    void action;
    return true;
}


/***/ },

/***/ "./src/actions/polling.ts"
/*!********************************!*\
  !*** ./src/actions/polling.ts ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   startPolling: () => (/* binding */ startPolling),
/* harmony export */   stopPolling: () => (/* binding */ stopPolling)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser */ "./src/actions/parser.ts");
/* harmony import */ var _executor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./executor */ "./src/actions/executor.ts");




var INITIAL_BACKOFF_MS = 1000;
var pollingClient = null;
var backoffMs = INITIAL_BACKOFF_MS;
var consecutiveFailures = 0;
var pollingActive = false;
var pollTimerId = null;
function logDebug(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] ".concat(message));
    }
}
function pollForActions() {
    if (!pollingClient || !pollingActive)
        return;
    if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen("Loading Menu")) {
        logDebug("Loading screen open — skipping action poll");
        scheduleNextPoll();
        return;
    }
    pollingClient
        .get(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingEndpoint)
        .then(function (response) {
        if (response.status === 200) {
            consecutiveFailures = 0;
            backoffMs = INITIAL_BACKOFF_MS;
            var parsed = void 0;
            try {
                parsed = JSON.parse(response.body);
            }
            catch (_a) {
                logDebug("Failed to parse action response body as JSON");
                return;
            }
            var actions = Array.isArray(parsed) ? parsed : [parsed];
            for (var _i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                var raw = actions_1[_i];
                var action = (0,_parser__WEBPACK_IMPORTED_MODULE_2__.parseAction)(raw);
                if (action !== null) {
                    (0,_executor__WEBPACK_IMPORTED_MODULE_3__.executeAction)(action);
                }
            }
        }
        else {
            handleFailure("HTTP ".concat(response.status));
        }
    })
        .catch(function (err) {
        var msg = err instanceof Error ? err.message : String(err);
        handleFailure(msg);
    })
        .finally(function () {
        scheduleNextPoll();
    });
}
function handleFailure(reason) {
    consecutiveFailures++;
    logDebug("Poll failed (".concat(consecutiveFailures, "/").concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxPollingRetries, "): ").concat(reason));
    if (consecutiveFailures >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxPollingRetries) {
        logDebug("Max retries reached \u2014 pausing for ".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingMaxBackoff, "ms"));
        backoffMs = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingMaxBackoff;
        consecutiveFailures = 0;
    }
    else {
        backoffMs = Math.min(backoffMs * 2, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingMaxBackoff);
    }
}
function scheduleNextPoll() {
    if (!pollingActive)
        return;
    pollTimerId = setTimeout(function () {
        pollTimerId = null;
        pollForActions();
    }, backoffMs);
}
function startPolling() {
    if (!_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingEnabled) {
        logDebug("Polling disabled by config");
        return;
    }
    if (pollingActive) {
        logDebug("Polling already active");
        return;
    }
    pollingClient = new _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.HttpClient(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.serverUrl);
    pollingActive = true;
    backoffMs = INITIAL_BACKOFF_MS;
    consecutiveFailures = 0;
    logDebug("Starting action polling");
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
        pollForActions();
    });
}
function stopPolling() {
    pollingActive = false;
    if (pollTimerId !== null) {
        clearTimeout(pollTimerId);
        pollTimerId = null;
    }
    pollingClient = null;
    logDebug("Action polling stopped");
}


/***/ },

/***/ "./src/arbitration/priority.ts"
/*!*************************************!*\
  !*** ./src/arbitration/priority.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   evaluatePriority: () => (/* binding */ evaluatePriority),
/* harmony export */   isStateUnchanged: () => (/* binding */ isStateUnchanged),
/* harmony export */   shouldSend: () => (/* binding */ shouldSend)
/* harmony export */ });
var lastState = null;
var lastSendTimes = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    suppressed: 0
};
var rateLimits = {
    critical: 200,
    high: 500,
    medium: 1000,
    low: 2000,
    suppressed: 5000
};
function isStateUnchanged(newState) {
    if (!lastState)
        return false;
    if (newState.eventType !== "tick")
        return false;
    if (newState.combatState !== lastState.combatState)
        return false;
    if (newState.enemies.length !== lastState.enemies.length)
        return false;
    var playerChanged = newState.player.health !== lastState.player.health ||
        newState.player.position.x !== lastState.player.position.x ||
        newState.player.position.y !== lastState.player.position.y ||
        newState.player.position.z !== lastState.player.position.z ||
        newState.player.isSneaking !== lastState.player.isSneaking;
    return !playerChanged;
}
function evaluatePriority(state) {
    if (state.player.isDead) {
        return "critical";
    }
    if (state.player.health < state.player.maxHealth * 0.25) {
        return "critical";
    }
    if (state.eventType === "hit") {
        return "high";
    }
    if (state.combatState === 1) {
        if (state.enemies.length > 0) {
            var closestEnemy = state.enemies[0];
            for (var i = 1; i < state.enemies.length; i++) {
                if (state.enemies[i].distance < closestEnemy.distance) {
                    closestEnemy = state.enemies[i];
                }
            }
            if (closestEnemy.distance < 500) {
                return "high";
            }
        }
        return "medium";
    }
    if (state.eventType !== "tick") {
        return "medium";
    }
    // Suppress if nothing interesting is happening
    if (lastState && isStateUnchanged(state)) {
        return "suppressed";
    }
    return "low";
}
function shouldSend(priority, state) {
    if (priority === "suppressed") {
        return false;
    }
    var now = Date.now();
    var lastSend = lastSendTimes[priority];
    var minInterval = rateLimits[priority];
    if (now - lastSend < minInterval) {
        return false;
    }
    // Only update state when we're actually going to send
    lastSendTimes[priority] = now;
    lastState = state;
    return true;
}


/***/ },

/***/ "./src/communication/http-client.ts"
/*!******************************************!*\
  !*** ./src/communication/http-client.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   httpClient: () => (/* binding */ httpClient),
/* harmony export */   isConnected: () => (/* binding */ isConnected),
/* harmony export */   sendGameState: () => (/* binding */ sendGameState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


var MAX_SENDS_PER_SEC = 5;
var sendCount = 0;
var lastReset = Date.now();
function resetRateLimit() {
    var now = Date.now();
    if (now - lastReset >= 1000) {
        sendCount = 0;
        lastReset = now;
    }
}
var SkyGuideHttpClient = /** @class */ (function () {
    function SkyGuideHttpClient(baseUrl) {
        this.failureCount = 0;
        this.maxFailures = 3;
        this.lastFailureTime = 0;
        this.cooldownMs = 10000;
        this.client = new _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.HttpClient(baseUrl);
    }
    SkyGuideHttpClient.prototype.sendGameState = function (payload) {
        var _this = this;
        resetRateLimit();
        if (sendCount >= MAX_SENDS_PER_SEC) {
            if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Rate limit exceeded");
            }
            return false;
        }
        return this.client
            .post("/api/game-state", {
            body: payload,
            contentType: "application/json"
        })
            .then(function (response) {
            sendCount++;
            if (response.status >= 200 && response.status < 300) {
                _this.failureCount = 0;
                return true;
            }
            else {
                if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] HTTP ".concat(response.status, ": request rejected by server"));
                }
                _this.lastFailureTime = Date.now();
                _this.failureCount++;
                return false;
            }
        })
            .catch(function (err) {
            var msg = err instanceof Error ? err.message : String(err);
            if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] HTTP POST /api/game-state failed: ".concat(msg));
            }
            _this.lastFailureTime = Date.now();
            _this.failureCount++;
            return false;
        });
    };
    SkyGuideHttpClient.prototype.isConnected = function () {
        if (this.failureCount < this.maxFailures)
            return true;
        if (Date.now() - this.lastFailureTime > this.cooldownMs) {
            this.failureCount = this.maxFailures - 1;
            return true;
        }
        return false;
    };
    return SkyGuideHttpClient;
}());
var httpClient = new SkyGuideHttpClient(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.serverUrl);
function sendGameState(payload) {
    return httpClient.sendGameState(payload);
}
function isConnected() {
    return httpClient.isConnected();
}


/***/ },

/***/ "./src/config.ts"
/*!***********************!*\
  !*** ./src/config.ts ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONFIG: () => (/* binding */ CONFIG),
/* harmony export */   PLAYER_FORM_ID: () => (/* binding */ PLAYER_FORM_ID)
/* harmony export */ });
// @env node
// NOTE: For production, consider reading from Skyrim Platform settings:
//   import { settings } from "skyrimPlatform";
//   const debugMode = settings["skyguide"]?.["debugMode"] === "true";
var PLAYER_FORM_ID = 0x14;
var CONFIG = {
    serverUrl: "http://localhost:3000",
    tickInterval: 500,
    enemyScanRadius: 5000,
    maxEnemies: 10,
    debugMode: false,
    pollingInterval: 1000,
    pollingEndpoint: "/api/actions",
    pollingMaxBackoff: 30000,
    pollingEnabled: true,
    maxPollingRetries: 5,
};


/***/ },

/***/ "./src/events.ts"
/*!***********************!*\
  !*** ./src/events.ts ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getLastActivatedRef: () => (/* binding */ getLastActivatedRef),
/* harmony export */   getLastBookRead: () => (/* binding */ getLastBookRead),
/* harmony export */   getLastContainerChanged: () => (/* binding */ getLastContainerChanged),
/* harmony export */   getLastCrosshairRef: () => (/* binding */ getLastCrosshairRef),
/* harmony export */   getLastEquipChange: () => (/* binding */ getLastEquipChange),
/* harmony export */   getLastFastTravelEnd: () => (/* binding */ getLastFastTravelEnd),
/* harmony export */   getLastItemHarvested: () => (/* binding */ getLastItemHarvested),
/* harmony export */   getLastLevelUp: () => (/* binding */ getLastLevelUp),
/* harmony export */   getLastLocation: () => (/* binding */ getLastLocation),
/* harmony export */   getLastLockChanged: () => (/* binding */ getLastLockChanged),
/* harmony export */   getLastQuestUpdate: () => (/* binding */ getLastQuestUpdate),
/* harmony export */   getOpenMenus: () => (/* binding */ getOpenMenus),
/* harmony export */   isPlayerDead: () => (/* binding */ isPlayerDead),
/* harmony export */   registerAllEvents: () => (/* binding */ registerAllEvents)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config */ "./src/config.ts");
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};


var isRegistered = false;
var lastCrosshairRef;
var openMenus = new Set();
var lastLocation;
var lastActivatedRef;
var playerDead = false;
var lastContainerChanged;
var lastEquipChange;
var lastLevelUp;
var lastQuestUpdate;
var lastFastTravelEnd;
var lastBookRead;
var lastItemHarvested;
var lastLockChanged;
function debugLog(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] ".concat(message));
    }
}
function runHandler(handlers, eventName, args) {
    var _a;
    (_a = handlers === null || handlers === void 0 ? void 0 : handlers[eventName]) === null || _a === void 0 ? void 0 : _a.call.apply(_a, __spreadArray([handlers], args, false));
}
function getLastCrosshairRef() {
    return lastCrosshairRef;
}
function getOpenMenus() {
    var snapshot = new Set();
    openMenus.forEach(function (menuName) {
        snapshot.add(menuName);
    });
    return snapshot;
}
function getLastLocation() {
    return lastLocation;
}
function getLastActivatedRef() {
    return lastActivatedRef;
}
function isPlayerDead() {
    return playerDead;
}
function getLastContainerChanged() {
    return lastContainerChanged;
}
function getLastEquipChange() {
    return lastEquipChange;
}
function getLastLevelUp() {
    return lastLevelUp;
}
function getLastQuestUpdate() {
    return lastQuestUpdate;
}
function getLastFastTravelEnd() {
    return lastFastTravelEnd;
}
function getLastBookRead() {
    return lastBookRead;
}
function getLastItemHarvested() {
    return lastItemHarvested;
}
function getLastLockChanged() {
    return lastLockChanged;
}
function registerAllEvents(handlers) {
    if (isRegistered) {
        debugLog("registerAllEvents called after initialization; skipping duplicate subscriptions");
        return;
    }
    isRegistered = true;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("crosshairRefChanged", function (event) {
        var _a;
        lastCrosshairRef = (_a = event.reference) === null || _a === void 0 ? void 0 : _a.getFormID();
        runHandler(handlers, "crosshairRefChanged", [event]);
        debugLog("crosshairRefChanged: ".concat(String(lastCrosshairRef)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("locationChanged", function (event) {
        var _a;
        lastLocation = (_a = event.newLoc) === null || _a === void 0 ? void 0 : _a.getName();
        runHandler(handlers, "locationChanged", [event]);
        debugLog("locationChanged: ".concat(lastLocation !== null && lastLocation !== void 0 ? lastLocation : "unknown"));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("locationDiscovery", function (event) {
        runHandler(handlers, "locationDiscovery", [event]);
        debugLog("locationDiscovery: ".concat(event.name));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("cellFullyLoaded", function (event) {
        runHandler(handlers, "cellFullyLoaded", [event]);
        debugLog("cellFullyLoaded: ".concat(event.cell.getName()));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuOpen", function (event) {
        if (event.name) {
            openMenus.add(event.name);
        }
        runHandler(handlers, "menuOpen", [event]);
        debugLog("menuOpen: ".concat(event.name));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuClose", function (event) {
        if (event.name) {
            openMenus.delete(event.name);
        }
        runHandler(handlers, "menuClose", [event]);
        debugLog("menuClose: ".concat(event.name));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("furnitureEnter", function (event) {
        runHandler(handlers, "furnitureEnter", [event]);
        debugLog("furnitureEnter: ".concat(String(event.target.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("furnitureExit", function (event) {
        runHandler(handlers, "furnitureExit", [event]);
        debugLog("furnitureExit: ".concat(String(event.target.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("open", function (event) {
        runHandler(handlers, "open", [event]);
        debugLog("open: ".concat(String(event.target.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("close", function (event) {
        runHandler(handlers, "close", [event]);
        debugLog("close: ".concat(String(event.target.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("questStage", function (event) {
        lastQuestUpdate = { event: "questStage", questId: event.quest.getFormID(), stage: event.stage };
        runHandler(handlers, "questStage", [event]);
        debugLog("questStage: quest=".concat(String(lastQuestUpdate.questId), " stage=").concat(String(event.stage)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("questStart", function (event) {
        lastQuestUpdate = { event: "questStart", questId: event.quest.getFormID() };
        runHandler(handlers, "questStart", [event]);
        debugLog("questStart: quest=".concat(String(lastQuestUpdate.questId)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("questStop", function (event) {
        lastQuestUpdate = { event: "questStop", questId: event.quest.getFormID() };
        runHandler(handlers, "questStop", [event]);
        debugLog("questStop: quest=".concat(String(lastQuestUpdate.questId)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("deathStart", function (event) {
        playerDead = true;
        runHandler(handlers, "deathStart", [event]);
        debugLog("deathStart");
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("deathEnd", function (event) {
        playerDead = false;
        runHandler(handlers, "deathEnd", [event]);
        debugLog("deathEnd");
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("containerChanged", function (event) {
        var _a, _b, _c;
        lastContainerChanged = {
            oldContainer: (_a = event.oldContainer) === null || _a === void 0 ? void 0 : _a.getFormID(),
            newContainer: (_b = event.newContainer) === null || _b === void 0 ? void 0 : _b.getFormID(),
            item: (_c = event.baseObj) === null || _c === void 0 ? void 0 : _c.getFormID(),
            count: event.numItems
        };
        runHandler(handlers, "containerChanged", [event]);
        debugLog("containerChanged: ".concat(String(lastContainerChanged.oldContainer), " -> ").concat(String(lastContainerChanged.newContainer), ", item=").concat(String(lastContainerChanged.item), ", count=").concat(String(event.numItems)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("equip", function (event) {
        var _a, _b;
        lastEquipChange = {
            action: "equip",
            actor: (_a = event.actor) === null || _a === void 0 ? void 0 : _a.getFormID(),
            baseObject: (_b = event.baseObj) === null || _b === void 0 ? void 0 : _b.getFormID(),
            extraData: event.uniqueId
        };
        runHandler(handlers, "equip", [event]);
        debugLog("equip: actor=".concat(String(lastEquipChange.actor), " item=").concat(String(lastEquipChange.baseObject)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("unequip", function (event) {
        var _a, _b;
        lastEquipChange = {
            action: "unequip",
            actor: (_a = event.actor) === null || _a === void 0 ? void 0 : _a.getFormID(),
            baseObject: (_b = event.baseObj) === null || _b === void 0 ? void 0 : _b.getFormID(),
            extraData: event.uniqueId
        };
        runHandler(handlers, "unequip", [event]);
        debugLog("unequip: actor=".concat(String(lastEquipChange.actor), " item=").concat(String(lastEquipChange.baseObject)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("levelIncrease", function (event) {
        lastLevelUp = {
            level: event.newLevel,
            isSkillIncrease: false
        };
        runHandler(handlers, "levelIncrease", [event]);
        debugLog("levelIncrease: level=".concat(String(event.newLevel)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("skillIncrease", function (event) {
        lastLevelUp = {
            skillId: event.actorValue,
            isSkillIncrease: true
        };
        runHandler(handlers, "skillIncrease", [event]);
        debugLog("skillIncrease: skill=".concat(String(event.actorValue)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("enterBleedout", function (event) {
        runHandler(handlers, "enterBleedout", [event]);
        debugLog("enterBleedout: actor=".concat(String(event.actor.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("fastTravelEnd", function (event) {
        lastFastTravelEnd = { travelTimeGameHours: event.travelTimeGameHours };
        runHandler(handlers, "fastTravelEnd", [event]);
        debugLog("fastTravelEnd: travelHours=".concat(String(event.travelTimeGameHours)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("sleepStart", function (event) {
        runHandler(handlers, "sleepStart", [event]);
        debugLog("sleepStart: desiredStopTime=".concat(String(event.desiredStopTime)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("sleepStop", function (event) {
        runHandler(handlers, "sleepStop", [event]);
        debugLog("sleepStop: interrupted=".concat(String(event.isInterrupted)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("activate", function (event) {
        var _a, _b;
        lastActivatedRef = (_a = event.target) === null || _a === void 0 ? void 0 : _a.getFormID();
        runHandler(handlers, "activate", [event]);
        debugLog("activate: target=".concat(String(lastActivatedRef), " caster=").concat(String((_b = event.caster) === null || _b === void 0 ? void 0 : _b.getFormID())));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("lockChanged", function (event) {
        var _a;
        lastLockChanged = {
            lockedObject: (_a = event.lockedObject) === null || _a === void 0 ? void 0 : _a.getFormID()
        };
        runHandler(handlers, "lockChanged", [event]);
        debugLog("lockChanged: object=".concat(String(lastLockChanged.lockedObject)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("bookRead", function (event) {
        var _a, _b, _c;
        lastBookRead = {
            bookFormId: (_a = event.book) === null || _a === void 0 ? void 0 : _a.getFormID(),
            title: (_b = event.book) === null || _b === void 0 ? void 0 : _b.getName()
        };
        runHandler(handlers, "bookRead", [event]);
        debugLog("bookRead: ".concat((_c = lastBookRead.title) !== null && _c !== void 0 ? _c : String(lastBookRead.bookFormId)));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("itemHarvested", function (event) {
        var _a, _b, _c;
        lastItemHarvested = {
            itemFormId: (_a = event.produceItem) === null || _a === void 0 ? void 0 : _a.getFormID(),
            ingredientName: (_b = event.produceItem) === null || _b === void 0 ? void 0 : _b.getName()
        };
        runHandler(handlers, "itemHarvested", [event]);
        debugLog("itemHarvested: ".concat((_c = lastItemHarvested.ingredientName) !== null && _c !== void 0 ? _c : String(lastItemHarvested.itemFormId)));
    });
}


/***/ },

/***/ "./src/game-state/collectors/crosshair-collector.ts"
/*!**********************************************************!*\
  !*** ./src/game-state/collectors/crosshair-collector.ts ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectCrosshairTarget: () => (/* binding */ collectCrosshairTarget)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.ts");


var FORM_TYPE_NAMES = {
    24: "Activator",
    26: "Flora",
    27: "Key",
    28: "Container",
    29: "Door",
    40: "Furniture",
    41: "Ingredient",
    42: "Apparatus",
    62: "NPC",
};
function mapFormType(typeId) {
    var _a;
    if (typeId == null) {
        return null;
    }
    return (_a = FORM_TYPE_NAMES[typeId]) !== null && _a !== void 0 ? _a : "FormType_".concat(typeId);
}
function collectCrosshairTarget() {
    var _a, _b, _c, _d;
    try {
        var ref = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getCurrentCrosshairRef();
        if (ref == null) {
            return null;
        }
        var formId = ref.getFormID();
        var baseObject = ref.getBaseObject();
        var typeId = baseObject === null || baseObject === void 0 ? void 0 : baseObject.getType();
        var type = mapFormType(typeId);
        var isOpen = null;
        if (typeId === 29) {
            try {
                isOpen = ref.getOpenState();
            }
            catch (_e) {
                isOpen = null;
            }
        }
        var name = (_b = (_a = ref.getDisplayName()) !== null && _a !== void 0 ? _a : baseObject === null || baseObject === void 0 ? void 0 : baseObject.getName()) !== null && _b !== void 0 ? _b : null;
        var distance = (_d = (_c = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer()) === null || _c === void 0 ? void 0 : _c.getDistance(ref)) !== null && _d !== void 0 ? _d : 0;
        if (formId === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID) {
            return null;
        }
        return {
            name: name,
            type: type,
            formId: formId,
            distance: distance,
            isOpen: isOpen,
        };
    }
    catch (_f) {
        return null;
    }
}


/***/ },

/***/ "./src/game-state/collectors/environment-collector.ts"
/*!************************************************************!*\
  !*** ./src/game-state/collectors/environment-collector.ts ***!
  \************************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectEnvironmentState: () => (/* binding */ collectEnvironmentState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");

function collectEnvironmentState() {
    var _a, _b;
    var gameTime = 0;
    try {
        gameTime = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Utility.getCurrentGameTime();
    }
    catch (_c) {
        gameTime = 0;
    }
    var gameHour = 0;
    try {
        gameHour = ((gameTime * 24) % 24 + 24) % 24;
    }
    catch (_d) {
        gameHour = 0;
    }
    var cameraState = 0;
    try {
        cameraState = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getCameraState();
    }
    catch (_e) {
        cameraState = 0;
    }
    var weatherName = null;
    try {
        weatherName = (_b = (_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Weather.getCurrentWeather()) === null || _a === void 0 ? void 0 : _a.getName()) !== null && _b !== void 0 ? _b : null;
    }
    catch (_f) {
        weatherName = null;
    }
    var sunPositionX = null;
    try {
        sunPositionX = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getSunPositionX();
    }
    catch (_g) {
        sunPositionX = null;
    }
    var sunPositionY = null;
    try {
        sunPositionY = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getSunPositionY();
    }
    catch (_h) {
        sunPositionY = null;
    }
    var sunPositionZ = null;
    try {
        sunPositionZ = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getSunPositionZ();
    }
    catch (_j) {
        sunPositionZ = null;
    }
    return {
        gameTime: gameTime,
        gameHour: gameHour,
        weatherName: weatherName,
        cameraState: cameraState,
        sunPositionX: sunPositionX,
        sunPositionY: sunPositionY,
        sunPositionZ: sunPositionZ
    };
}


/***/ },

/***/ "./src/game-state/collectors/input-collector.ts"
/*!******************************************************!*\
  !*** ./src/game-state/collectors/input-collector.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectInputState: () => (/* binding */ collectInputState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");

var MOVE_FORWARD = 17;
var MOVE_LEFT = 30;
var MOVE_BACKWARD = 31;
var MOVE_RIGHT = 32;
var SPRINT = 42;
var CROUCH = 29;
var JUMP_OR_ACTIVATE = 57;
function collectInputState() {
    try {
        var keysPressed = [];
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(MOVE_FORWARD))
            keysPressed.push("W");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(MOVE_LEFT))
            keysPressed.push("A");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(MOVE_BACKWARD))
            keysPressed.push("S");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(MOVE_RIGHT))
            keysPressed.push("D");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(SPRINT))
            keysPressed.push("Shift");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(CROUCH))
            keysPressed.push("Ctrl");
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.isKeyPressed(JUMP_OR_ACTIVATE))
            keysPressed.push("Space");
        return { keysPressed: keysPressed };
    }
    catch (_a) {
        return { keysPressed: [] };
    }
}


/***/ },

/***/ "./src/game-state/collectors/location-collector.ts"
/*!*********************************************************!*\
  !*** ./src/game-state/collectors/location-collector.ts ***!
  \*********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectLocationState: () => (/* binding */ collectLocationState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");

function collectLocationState() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var defaults = {
        locationName: null,
        isInterior: false,
        cellName: null,
        worldspaceName: null
    };
    try {
        var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
        if (!player) {
            return defaults;
        }
        return {
            locationName: (_b = (_a = player.getCurrentLocation()) === null || _a === void 0 ? void 0 : _a.getName()) !== null && _b !== void 0 ? _b : null,
            isInterior: (_d = (_c = player.getParentCell()) === null || _c === void 0 ? void 0 : _c.isInterior()) !== null && _d !== void 0 ? _d : false,
            cellName: (_f = (_e = player.getParentCell()) === null || _e === void 0 ? void 0 : _e.getName()) !== null && _f !== void 0 ? _f : null,
            worldspaceName: (_h = (_g = player.getWorldSpace()) === null || _g === void 0 ? void 0 : _g.getName()) !== null && _h !== void 0 ? _h : null
        };
    }
    catch (_j) {
        return defaults;
    }
}


/***/ },

/***/ "./src/game-state/collectors/nearby-collector.ts"
/*!*******************************************************!*\
  !*** ./src/game-state/collectors/nearby-collector.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectNearbyNpcs: () => (/* binding */ collectNearbyNpcs)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.ts");


function getPlayerPosition() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return null;
    return {
        x: player.getPositionX(),
        y: player.getPositionY(),
        z: player.getPositionZ(),
    };
}
function calculateDistance(x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function collectNearbyNpcs() {
    var _a, _b;
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return [];
    var playerPos = getPlayerPosition();
    if (!playerPos)
        return [];
    var scanOffsets = [
        { x: 0, y: 0 },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius, y: 0 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius, y: 0 },
        { x: 0, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius },
        { x: 0, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
    ];
    var seenFormIds = new Set();
    var nearbyNpcs = [];
    for (var _i = 0, scanOffsets_1 = scanOffsets; _i < scanOffsets_1.length; _i++) {
        var offset = scanOffsets_1[_i];
        if (nearbyNpcs.length >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxEnemies)
            break;
        var scanX = playerPos.x + offset.x;
        var scanY = playerPos.y + offset.y;
        var scanZ = playerPos.z;
        var actor = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.findClosestActor(scanX, scanY, scanZ, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius);
        if (!actor)
            continue;
        var formId = actor.getFormID();
        if (formId === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID)
            continue;
        if (seenFormIds.has(formId))
            continue;
        seenFormIds.add(formId);
        var actorPos = {
            x: actor.getPositionX(),
            y: actor.getPositionY(),
            z: actor.getPositionZ(),
        };
        var distance = calculateDistance(playerPos.x, playerPos.y, playerPos.z, actorPos.x, actorPos.y, actorPos.z);
        var baseObj = actor.getBaseObject();
        var name = (baseObj === null || baseObj === void 0 ? void 0 : baseObj.getName()) || "Unknown";
        var health = actor.getActorValue("health");
        var level = 0;
        try {
            level = actor.getLevel();
        }
        catch (_c) {
            level = 0;
        }
        var race = null;
        try {
            race = (_b = (_a = actor.getRace()) === null || _a === void 0 ? void 0 : _a.getName()) !== null && _b !== void 0 ? _b : null;
        }
        catch (_d) {
            race = null;
        }
        var isHostile = false;
        try {
            isHostile = actor.isHostileToActor(player);
        }
        catch (_e) {
            isHostile = false;
        }
        var isAlly = false;
        try {
            isAlly = actor.isPlayerTeammate();
        }
        catch (_f) {
            isAlly = false;
        }
        var isGuard = false;
        try {
            isGuard = actor.isGuard();
        }
        catch (_g) {
            isGuard = false;
        }
        var isMerchant = false;
        var isInDialogue = false;
        try {
            isInDialogue = actor.isInDialogueWithPlayer();
        }
        catch (_h) {
            isInDialogue = false;
        }
        var hasLOS = false;
        try {
            hasLOS = actor.hasLOS(player);
        }
        catch (_j) {
            hasLOS = false;
        }
        var isDetected = false;
        try {
            isDetected = actor.isDetectedBy(player);
        }
        catch (_k) {
            isDetected = false;
        }
        var relationshipRank = 0;
        try {
            relationshipRank = actor.getRelationshipRank(player);
        }
        catch (_l) {
            relationshipRank = 0;
        }
        var isDead = false;
        try {
            isDead = actor.isDead();
        }
        catch (_m) {
            isDead = false;
        }
        nearbyNpcs.push({
            formId: formId,
            name: name,
            distance: distance,
            health: health,
            level: level,
            race: race,
            isHostile: isHostile,
            isAlly: isAlly,
            isGuard: isGuard,
            isMerchant: isMerchant,
            isInDialogue: isInDialogue,
            isDetected: isDetected,
            hasLOS: hasLOS,
            relationshipRank: relationshipRank,
            isDead: isDead,
        });
    }
    return nearbyNpcs;
}


/***/ },

/***/ "./src/game-state/collectors/player-collector.ts"
/*!*******************************************************!*\
  !*** ./src/game-state/collectors/player-collector.ts ***!
  \*******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectPlayerFullState: () => (/* binding */ collectPlayerFullState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");

function safeNumber(value, fallback) {
    if (fallback === void 0) { fallback = 0; }
    return value !== null && value !== void 0 ? value : fallback;
}
function safeString(value) {
    return value !== null && value !== void 0 ? value : null;
}
function collectHeading() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player) {
        return { angleX: 0, angleY: 0, angleZ: 0, headingAngle: 0 };
    }
    return {
        angleX: safeNumber(player.getAngleX()),
        angleY: safeNumber(player.getAngleY()),
        angleZ: safeNumber(player.getAngleZ()),
        headingAngle: safeNumber(player.getHeadingAngle()),
    };
}
function collectMovement() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player) {
        return {
            isRunning: false,
            isSprinting: false,
            isSwimming: false,
            isSneaking: false,
            isOnMount: false,
            isOverEncumbered: false,
            sitState: 0,
            sleepState: 0,
        };
    }
    return {
        isRunning: player.isRunning(),
        isSprinting: player.isSprinting(),
        isSwimming: player.isSwimming(),
        isSneaking: player.isSneaking(),
        isOnMount: player.isOnMount(),
        isOverEncumbered: player.isOverEncumbered(),
        sitState: safeNumber(player.getSitState()),
        sleepState: safeNumber(player.getSleepState()),
    };
}
function collectCombat() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player) {
        return {
            isInCombat: false,
            combatTargetName: null,
            isBlocking: false,
            isWeaponDrawn: false,
        };
    }
    var combatTargetName = null;
    try {
        var target = player.getCombatTarget();
        if (target) {
            var base = target.getBaseObject();
            combatTargetName = safeString(base === null || base === void 0 ? void 0 : base.getName());
        }
    }
    catch (_a) {
        combatTargetName = null;
    }
    var isBlocking = false;
    try {
        isBlocking = player.getAnimationVariableBool("IsBlocking");
    }
    catch (_b) {
        isBlocking = false;
    }
    return {
        isInCombat: player.isInCombat(),
        combatTargetName: combatTargetName,
        isBlocking: isBlocking,
        isWeaponDrawn: player.isWeaponDrawn(),
    };
}
function collectEquipment() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player) {
        return {
            weaponName: null,
            weaponSlot: 0,
            armorSlots: {},
            shoutName: null,
            spellName: null,
        };
    }
    var weaponName = null;
    try {
        var weapon = player.getEquippedWeapon(false);
        weaponName = safeString(weapon === null || weapon === void 0 ? void 0 : weapon.getName());
    }
    catch (_a) {
        weaponName = null;
    }
    var shoutName = null;
    try {
        var shout = player.getEquippedShout();
        shoutName = safeString(shout === null || shout === void 0 ? void 0 : shout.getName());
    }
    catch (_b) {
        shoutName = null;
    }
    var spellName = null;
    try {
        var spell = player.getEquippedSpell(0);
        spellName = safeString(spell === null || spell === void 0 ? void 0 : spell.getName());
    }
    catch (_c) {
        spellName = null;
    }
    return {
        weaponName: weaponName,
        weaponSlot: 0,
        armorSlots: {},
        shoutName: shoutName,
        spellName: spellName,
    };
}
function collectPlayerFullState() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return null;
    return {
        heading: collectHeading(),
        movement: collectMovement(),
        combat: collectCombat(),
        equipment: collectEquipment(),
        goldAmount: safeNumber(player.getGoldAmount()),
        carryWeight: safeNumber(player.getActorValue("CarryWeight")),
        inventoryWeight: safeNumber(player.getActorValue("InventoryWeight")),
        magickaPercentage: safeNumber(player.getActorValuePercentage("magicka")),
        staminaPercentage: safeNumber(player.getActorValuePercentage("stamina")),
    };
}


/***/ },

/***/ "./src/game-state/collectors/quest-collector.ts"
/*!******************************************************!*\
  !*** ./src/game-state/collectors/quest-collector.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectQuestState: () => (/* binding */ collectQuestState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");

function collectQuestState() {
    var _a, _b;
    try {
        var quest = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getQuest("MQ101");
        if (!quest) {
            return null;
        }
        var objectives = [];
        for (var i = 0; i <= 10; i += 1) {
            var displayed = quest.isObjectiveDisplayed(i);
            if (!displayed) {
                continue;
            }
            objectives.push({
                index: i,
                displayed: displayed,
                completed: quest.isObjectiveCompleted(i)
            });
        }
        var questWithEditorId = quest;
        return {
            questName: (_a = quest.getName()) !== null && _a !== void 0 ? _a : null,
            editorId: typeof questWithEditorId.getEditorId === "function" ? (_b = questWithEditorId.getEditorId()) !== null && _b !== void 0 ? _b : null : null,
            currentStage: quest.getCurrentStageID(),
            objectives: objectives
        };
    }
    catch (_c) {
        return null;
    }
}


/***/ },

/***/ "./src/game-state/serializer.ts"
/*!**************************************!*\
  !*** ./src/game-state/serializer.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   serializeFullState: () => (/* binding */ serializeFullState),
/* harmony export */   serializeState: () => (/* binding */ serializeState)
/* harmony export */ });
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events */ "./src/events.ts");
/* harmony import */ var _collectors_crosshair_collector__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./collectors/crosshair-collector */ "./src/game-state/collectors/crosshair-collector.ts");
/* harmony import */ var _collectors_environment_collector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./collectors/environment-collector */ "./src/game-state/collectors/environment-collector.ts");
/* harmony import */ var _collectors_input_collector__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./collectors/input-collector */ "./src/game-state/collectors/input-collector.ts");
/* harmony import */ var _collectors_location_collector__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./collectors/location-collector */ "./src/game-state/collectors/location-collector.ts");
/* harmony import */ var _collectors_nearby_collector__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./collectors/nearby-collector */ "./src/game-state/collectors/nearby-collector.ts");
/* harmony import */ var _collectors_player_collector__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./collectors/player-collector */ "./src/game-state/collectors/player-collector.ts");
/* harmony import */ var _collectors_quest_collector__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./collectors/quest-collector */ "./src/game-state/collectors/quest-collector.ts");








function serializeState(state, priority) {
    var payload = {
        protocolVersion: 1,
        priority: priority,
        source: "skyguide",
        data: state,
        timestamp: Date.now()
    };
    return JSON.stringify(payload);
}
function serializeFullState(eventType) {
    if (eventType === void 0) { eventType = "tick"; }
    var player = null;
    var nearbyNpcs = [];
    var crosshairTarget = null;
    var location = null;
    var quest = null;
    var input = null;
    var environment = null;
    var menu = null;
    try {
        player = (0,_collectors_player_collector__WEBPACK_IMPORTED_MODULE_6__.collectPlayerFullState)();
    }
    catch (_a) {
        player = null;
    }
    try {
        nearbyNpcs = (0,_collectors_nearby_collector__WEBPACK_IMPORTED_MODULE_5__.collectNearbyNpcs)();
    }
    catch (_b) {
        nearbyNpcs = [];
    }
    try {
        crosshairTarget = (0,_collectors_crosshair_collector__WEBPACK_IMPORTED_MODULE_1__.collectCrosshairTarget)();
    }
    catch (_c) {
        crosshairTarget = null;
    }
    try {
        location = (0,_collectors_location_collector__WEBPACK_IMPORTED_MODULE_4__.collectLocationState)();
    }
    catch (_d) {
        location = null;
    }
    try {
        quest = (0,_collectors_quest_collector__WEBPACK_IMPORTED_MODULE_7__.collectQuestState)();
    }
    catch (_e) {
        quest = null;
    }
    try {
        input = (0,_collectors_input_collector__WEBPACK_IMPORTED_MODULE_3__.collectInputState)();
    }
    catch (_f) {
        input = null;
    }
    try {
        environment = (0,_collectors_environment_collector__WEBPACK_IMPORTED_MODULE_2__.collectEnvironmentState)();
    }
    catch (_g) {
        environment = null;
    }
    try {
        menu = {
            openMenus: Array.from((0,_events__WEBPACK_IMPORTED_MODULE_0__.getOpenMenus)())
        };
    }
    catch (_h) {
        menu = null;
    }
    var fullState = {
        player: player,
        nearbyNpcs: nearbyNpcs,
        crosshairTarget: crosshairTarget,
        location: location,
        quest: quest,
        input: input,
        menu: menu,
        environment: environment,
        eventType: eventType
    };
    var payload = {
        protocolVersion: 1,
        priority: "medium",
        source: "skyguide",
        data: fullState,
        timestamp: Date.now()
    };
    try {
        return JSON.stringify(payload);
    }
    catch (_j) {
        return null;
    }
}


/***/ },

/***/ "./src/skyrimPlatform.ts"
/*!*******************************!*\
  !*** ./src/skyrimPlatform.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Debug: () => (/* binding */ Debug),
/* harmony export */   DxScanCode: () => (/* binding */ DxScanCode),
/* harmony export */   Game: () => (/* binding */ Game),
/* harmony export */   HttpClient: () => (/* binding */ HttpClient),
/* harmony export */   Input: () => (/* binding */ Input),
/* harmony export */   Ui: () => (/* binding */ Ui),
/* harmony export */   Utility: () => (/* binding */ Utility),
/* harmony export */   Weather: () => (/* binding */ Weather),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   findConsoleCommand: () => (/* binding */ findConsoleCommand),
/* harmony export */   hooks: () => (/* binding */ hooks),
/* harmony export */   on: () => (/* binding */ on),
/* harmony export */   once: () => (/* binding */ once),
/* harmony export */   printConsole: () => (/* binding */ printConsole)
/* harmony export */ });
var runtime = globalThis;
if (!runtime.skyrimPlatform) {
    throw new Error('skyrimPlatform global is not available');
}
var skyrimPlatform = runtime.skyrimPlatform;
var once = skyrimPlatform.once, on = skyrimPlatform.on, printConsole = skyrimPlatform.printConsole, Debug = skyrimPlatform.Debug, hooks = skyrimPlatform.hooks, findConsoleCommand = skyrimPlatform.findConsoleCommand, HttpClient = skyrimPlatform.HttpClient, Ui = skyrimPlatform.Ui, Game = skyrimPlatform.Game, Input = skyrimPlatform.Input, DxScanCode = skyrimPlatform.DxScanCode, Utility = skyrimPlatform.Utility, Weather = skyrimPlatform.Weather;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (skyrimPlatform);


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events */ "./src/events.ts");
/* harmony import */ var _actions_polling__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./actions/polling */ "./src/actions/polling.ts");
/* harmony import */ var _arbitration_priority__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./arbitration/priority */ "./src/arbitration/priority.ts");
/* harmony import */ var _game_state_serializer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./game-state/serializer */ "./src/game-state/serializer.ts");
/* harmony import */ var _communication_http_client__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./communication/http-client */ "./src/communication/http-client.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./config */ "./src/config.ts");







var lastTickTime = 0;
var playerAnimation = "";
var eventsRegistered = false;
var pollingStarted = false;
var lastCombatState = 0;
var COLLECTORS_COUNT = 8;
function buildArbitrationState(eventType, animation) {
    return {
        player: {
            health: 1,
            maxHealth: 1,
            magicka: 0,
            stamina: 0,
            level: 1,
            position: { x: 0, y: 0, z: 0 },
            isSneaking: false,
            isDead: false
        },
        combatState: 0,
        enemies: [],
        playerAnimation: animation,
        eventType: eventType
    };
}
function processAndSend(eventType, priority, animation) {
    if (animation === void 0) { animation = ""; }
    var arbitrationState = buildArbitrationState(eventType, animation);
    if (!(0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.shouldSend)(priority, arbitrationState)) {
        return;
    }
    var payload = (0,_game_state_serializer__WEBPACK_IMPORTED_MODULE_4__.serializeFullState)(eventType);
    if (!payload) {
        if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Failed to serialize full state payload");
        }
        return;
    }
    (0,_communication_http_client__WEBPACK_IMPORTED_MODULE_5__.sendGameState)(payload).catch(function (err) {
        var msg = err instanceof Error ? err.message : String(err);
        if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Failed to send game state: ".concat(msg));
        }
    });
    if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Sent state: ".concat(priority, " priority (").concat(eventType, ")"));
    }
}
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide plugin loaded!");
    _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Debug.notification("SkyGuide is active");
    (0,_events__WEBPACK_IMPORTED_MODULE_1__.registerAllEvents)();
    eventsRegistered = true;
    (0,_actions_polling__WEBPACK_IMPORTED_MODULE_2__.startPolling)();
    pollingStarted = _config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.pollingEnabled;
    if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Tick interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.tickInterval, "ms"));
    }
    _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.hooks.sendAnimationEvent.add({
        enter: function (ctx) {
            var validAttacks = [
                "attackleft",
                "attackright",
                "attackkick",
                "attack3",
                "attackthrow"
            ];
            var eventLower = ctx.animEventName.toLowerCase();
            if (validAttacks.some(function (attack) { return eventLower.includes(attack); })) {
                playerAnimation = ctx.animEventName;
            }
        },
        leave: function () {
        }
    }, _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID, _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID + 1, "*Attack*");
});
var skyguideCommand = (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.findConsoleCommand)("skyguide");
if (skyguideCommand) {
    skyguideCommand.execute = function () {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide Status:");
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Connected: ".concat((0,_communication_http_client__WEBPACK_IMPORTED_MODULE_5__.isConnected)()));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Polling status: ".concat(pollingStarted ? "active" : "inactive"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Events registered: ".concat(eventsRegistered ? "yes (28)" : "no"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Collectors count: ".concat(COLLECTORS_COUNT));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Tick interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.tickInterval, "ms"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Debug mode: ".concat(_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode));
        return true;
    };
}
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("tick", function () {
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_5__.isConnected)()) {
        return;
    }
    var now = Date.now();
    if (now - lastTickTime < _config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.tickInterval) {
        return;
    }
    lastTickTime = now;
    var animation = playerAnimation;
    playerAnimation = "";
    processAndSend("tick", "low", animation);
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("combatState", function (event) {
    var actor = event.actor.getFormID();
    if (actor !== _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID)
        return;
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_5__.isConnected)())
        return;
    var newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
    var oldState = lastCombatState;
    lastCombatState = newState;
    processAndSend("combatState_".concat(newState), "high");
    if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Combat state changed: ".concat(oldState, " -> ").concat(newState));
    }
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("hit", function (event) {
    var _a;
    var target = event.target.getFormID();
    var source = event.aggressor.getFormID();
    var sourceBaseForm = (_a = event.source) === null || _a === void 0 ? void 0 : _a.getFormID();
    if (target !== _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID && source !== _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID)
        return;
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_5__.isConnected)())
        return;
    processAndSend("hit", "high");
    if (_config__WEBPACK_IMPORTED_MODULE_6__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Hit event: target=".concat(target, ", source=").concat(source, ", sourceForm=").concat(String(sourceBaseForm)));
    }
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0EsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ04sNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2FjdGlvbnMvZXhlY3V0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9hY3Rpb25zL3BhcnNlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2FjdGlvbnMvcG9sbGluZy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2FyYml0cmF0aW9uL3ByaW9yaXR5LnRzIiwid2VicGFjazovL3NreWd1aWRlLXNrc2UvLi9zcmMvY29tbXVuaWNhdGlvbi9odHRwLWNsaWVudC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2NvbmZpZy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2V2ZW50cy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9jcm9zc2hhaXItY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXNrc2UvLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2Vudmlyb25tZW50LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9pbnB1dC1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvbG9jYXRpb24tY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXNrc2UvLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL25lYXJieS1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvcGxheWVyLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9xdWVzdC1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9nYW1lLXN0YXRlL3NlcmlhbGl6ZXIudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9za3lyaW1QbGF0Zm9ybS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3NreWd1aWRlLXNrc2Uvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3NreWd1aWRlLXNrc2Uvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9za3lndWlkZS1za3NlL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtc2tzZS8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZywgRHhTY2FuQ29kZSwgR2FtZSwgSW5wdXQsIFVpLCBwcmludENvbnNvbGUgfSBmcm9tIFwic3JjL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuZnVuY3Rpb24gbG9nRGVidWcobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlthY3Rpb25zL2V4ZWN1dG9yXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzVmFsaWRGb3JtKGZvcm0pIHtcbiAgICBpZiAoZm9ybSA9PT0gbnVsbCB8fCBmb3JtID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGZvcm0gIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY2FuZGlkYXRlID0gZm9ybTtcbiAgICB2YXIgZGVsZXRlZCA9IHR5cGVvZiBjYW5kaWRhdGUuaXNEZWxldGVkID09PSBcImZ1bmN0aW9uXCIgPyBjYW5kaWRhdGUuaXNEZWxldGVkKCkgOiBmYWxzZTtcbiAgICB2YXIgZGlzYWJsZWQgPSB0eXBlb2YgY2FuZGlkYXRlLmlzRGlzYWJsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGNhbmRpZGF0ZS5pc0Rpc2FibGVkKCkgOiBmYWxzZTtcbiAgICByZXR1cm4gIWRlbGV0ZWQgJiYgIWRpc2FibGVkO1xufVxuZnVuY3Rpb24gZ2V0UmVmZXJlbmNlRm9ybUlkKHJlZikge1xuICAgIGlmIChyZWYgPT09IG51bGwgfHwgcmVmID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlZiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGNhbmRpZGF0ZSA9IHJlZjtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5nZXRGb3JtSUQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgaWQgPSBjYW5kaWRhdGUuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlLmdldEZvcm1JZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBpZCA9IGNhbmRpZGF0ZS5nZXRGb3JtSWQoKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBpc1ZhbGlkUmVmZXJlbmNlKHJlZikge1xuICAgIGlmIChyZWYgPT09IG51bGwgfHwgcmVmID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlZiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBjYW5kaWRhdGUgPSByZWY7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuYWN0aXZhdGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmb3JtSWQgPSBnZXRSZWZlcmVuY2VGb3JtSWQocmVmKTtcbiAgICBpZiAoZm9ybUlkID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGZvcm0gPSBHYW1lLmdldEZvcm1FeChmb3JtSWQpO1xuICAgIHJldHVybiBpc1ZhbGlkRm9ybShmb3JtKTtcbn1cbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKHBsYXllcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHBsYXllci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgeTogcGxheWVyLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICB6OiBwbGF5ZXIuZ2V0UG9zaXRpb25aKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSB7XG4gICAgaWYgKFVpLmlzTWVudU9wZW4oXCJMb2FkaW5nIE1lbnVcIikpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogTG9hZGluZyBNZW51IGlzIG9wZW5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoVWkuaXNNZW51T3BlbihcIk1lc3NhZ2VCb3hNZW51XCIpKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiQWN0aW9uIGJsb2NrZWQ6IE1lc3NhZ2VCb3hNZW51IGlzIG9wZW5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBnZXRDbG9zZXN0UmVmZXJlbmNlKHgsIHksIHosIHJhZGl1cykge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIGdhbWVXaXRoQ2xvc2VzdFJlZmVyZW5jZSA9IEdhbWU7XG4gICAgcmV0dXJuIChfYiA9IChfYSA9IGdhbWVXaXRoQ2xvc2VzdFJlZmVyZW5jZS5maW5kQ2xvc2VzdFJlZmVyZW5jZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNhbGwoZ2FtZVdpdGhDbG9zZXN0UmVmZXJlbmNlLCB4LCB5LCB6LCByYWRpdXMpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xufVxuZnVuY3Rpb24gZXhlY3V0ZVNhZmVseShhY3Rpb25UeXBlLCBvcGVyYXRpb24pIHtcbiAgICB0cnkge1xuICAgICAgICBvcGVyYXRpb24oKTtcbiAgICAgICAgbG9nRGVidWcoXCJFeGVjdXRlZCBhY3Rpb246IFwiLmNvbmNhdChhY3Rpb25UeXBlKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gZmFpbGVkOiBcIi5jb25jYXQoYWN0aW9uVHlwZSwgXCIgKFwiKS5jb25jYXQoU3RyaW5nKGVycm9yKSwgXCIpXCIpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoZGVsYXlNcykge1xuICAgIHZhciBydW50aW1lVGltZXJzID0gZ2xvYmFsVGhpcztcbiAgICBpZiAodHlwZW9mIHJ1bnRpbWVUaW1lcnMuc2V0VGltZW91dCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJ1bnRpbWVUaW1lcnMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBJbnB1dC5yZWxlYXNlS2V5KDQyIC8qIER4U2NhbkNvZGUuTGVmdFNoaWZ0ICovKTtcbiAgICAgICAgfSwgZGVsYXlNcyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIElucHV0LnJlbGVhc2VLZXkoNDIgLyogRHhTY2FuQ29kZS5MZWZ0U2hpZnQgKi8pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogcGxheWVyIGlzIG51bGxcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIHBsYXllckZvcm0gPSBHYW1lLmdldEZvcm1FeChQTEFZRVJfRk9STV9JRCk7XG4gICAgaWYgKCFpc1ZhbGlkRm9ybShwbGF5ZXJGb3JtKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBwbGF5ZXIgZm9ybSBpbnZhbGlkL2RlbGV0ZWQvZGlzYWJsZWRcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2V0UG9zaXRpb24oYWN0aW9uLngsIGFjdGlvbi55LCBhY3Rpb24ueik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFjZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zZXRBbmdsZSgwLCAwLCBhY3Rpb24uYW5nbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGl2YXRlXCI6IHtcbiAgICAgICAgICAgIHZhciBfYSA9IGdldFBsYXllclBvc2l0aW9uKHBsYXllciksIHggPSBfYS54LCB5ID0gX2EueSwgeiA9IF9hLno7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnRhcmdldCA9PT0gXCJjcm9zc2hhaXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBjcm9zc2hhaXJSZWZfMSA9IEdhbWUuZ2V0Q3VycmVudENyb3NzaGFpclJlZigpO1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZFJlZmVyZW5jZShjcm9zc2hhaXJSZWZfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBpbnZhbGlkIGNyb3NzaGFpciByZWZlcmVuY2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Jvc3NoYWlyUmVmXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3ROUENcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZWFyZXN0TnBjXzEgPSBHYW1lLmZpbmRDbG9zZXN0QWN0b3IoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3ROcGNfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBubyB2YWxpZCBuZWFyZXN0IE5QQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0TnBjXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3REb29yXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVhcmVzdERvb3JfMSA9IGdldENsb3Nlc3RSZWZlcmVuY2UoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3REb29yXzEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBkb29yXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3REb29yXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZWFyZXN0Q29udGFpbmVyXzEgPSBnZXRDbG9zZXN0UmVmZXJlbmNlKHgsIHksIHosIDIwMDApO1xuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3RDb250YWluZXJfMSkpIHtcbiAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkFjdGl2YXRlIGJsb2NrZWQ6IG5vIHZhbGlkIG5lYXJlc3QgY29udGFpbmVyXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmVhcmVzdENvbnRhaW5lcl8xLmFjdGl2YXRlKHBsYXllcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFzdFRyYXZlbFwiOiB7XG4gICAgICAgICAgICBEZWJ1Zy5ub3RpZmljYXRpb24oXCJGYXN0IHRyYXZlbCBub3Qgc3VwcG9ydGVkIHZpYSBBUElcIik7XG4gICAgICAgICAgICBsb2dEZWJ1ZyhcIkZhc3QgdHJhdmVsIGJsb2NrZWQgZm9yIGxvY2F0aW9uOiBcIi5jb25jYXQoYWN0aW9uLmxvY2F0aW9uKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRyYXdXZWFwb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZHJhd1dlYXBvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNoZWF0aGVXZWFwb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2hlYXRoZVdlYXBvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImF0dGFja1wiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBJbnB1dC50YXBLZXkoNTcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImJsb2NrXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIElucHV0LmhvbGRLZXkoNDIpO1xuICAgICAgICAgICAgICAgIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoNTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlcXVpcFwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIkVxdWlwOiBcIi5jb25jYXQoYWN0aW9uLml0ZW1OYW1lKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwidXNlSXRlbVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIlVzZSBpdGVtOiBcIi5jb25jYXQoYWN0aW9uLml0ZW1OYW1lKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaGVhbFwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5yZXN0b3JlQWN0b3JWYWx1ZShcImhlYWx0aFwiLCBhY3Rpb24uYW1vdW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzYXZlR2FtZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuc2F2ZUdhbWUoYWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihhY3Rpb24ubWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZm9yY2VUaGlyZFBlcnNvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuZm9yY2VUaGlyZFBlcnNvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBHYW1lLmZvcmNlRmlyc3RQZXJzb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwidmFyIEFDVElPTl9UWVBFUyA9IG5ldyBTZXQoW1xuICAgIFwibW92ZVwiLFxuICAgIFwiZmFjZVwiLFxuICAgIFwiYWN0aXZhdGVcIixcbiAgICBcImZhc3RUcmF2ZWxcIixcbiAgICBcImRyYXdXZWFwb25cIixcbiAgICBcInNoZWF0aGVXZWFwb25cIixcbiAgICBcImF0dGFja1wiLFxuICAgIFwiYmxvY2tcIixcbiAgICBcImVxdWlwXCIsXG4gICAgXCJ1c2VJdGVtXCIsXG4gICAgXCJoZWFsXCIsXG4gICAgXCJzYXZlR2FtZVwiLFxuICAgIFwibm90aWZpY2F0aW9uXCIsXG4gICAgXCJmb3JjZVRoaXJkUGVyc29uXCIsXG4gICAgXCJmb3JjZUZpcnN0UGVyc29uXCIsXG5dKTtcbnZhciBBQ1RJVkFURV9UQVJHRVRTID0gbmV3IFNldChbXG4gICAgXCJjcm9zc2hhaXJcIixcbiAgICBcIm5lYXJlc3ROUENcIixcbiAgICBcIm5lYXJlc3REb29yXCIsXG4gICAgXCJuZWFyZXN0Q29udGFpbmVyXCIsXG5dKTtcbmZ1bmN0aW9uIGlzQWN0aXZhdGVUYXJnZXQodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIEFDVElWQVRFX1RBUkdFVFMuaGFzKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGlvbihyYXcpIHtcbiAgICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBhY3Rpb25UeXBlID0gcmF3LnR5cGU7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25UeXBlICE9PSBcInN0cmluZ1wiIHx8ICFBQ1RJT05fVFlQRVMuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgdmFyIHggPSByYXcueCwgeSA9IHJhdy55LCB6ID0gcmF3Lno7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHggIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHkgIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHogIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibW92ZVwiLCB4OiB4LCB5OiB5LCB6OiB6IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhY2VcIjoge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gcmF3LmFuZ2xlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhbmdsZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWNlXCIsIGFuZ2xlOiBhbmdsZSB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhY3RpdmF0ZVwiOiB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gcmF3LnRhcmdldDtcbiAgICAgICAgICAgIGlmICghaXNBY3RpdmF0ZVRhcmdldCh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImFjdGl2YXRlXCIsIHRhcmdldDogdGFyZ2V0IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhc3RUcmF2ZWxcIjoge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmF3LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYXN0VHJhdmVsXCIsIGxvY2F0aW9uOiBsb2NhdGlvbiB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlcXVpcFwiOlxuICAgICAgICBjYXNlIFwidXNlSXRlbVwiOiB7XG4gICAgICAgICAgICB2YXIgaXRlbU5hbWUgPSByYXcuaXRlbU5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW1OYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBhY3Rpb25UeXBlLCBpdGVtTmFtZTogaXRlbU5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaGVhbFwiOiB7XG4gICAgICAgICAgICB2YXIgYW1vdW50ID0gcmF3LmFtb3VudDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYW1vdW50ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImhlYWxcIiwgYW1vdW50OiBhbW91bnQgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2F2ZUdhbWVcIjoge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSByYXcubmFtZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJzYXZlR2FtZVwiLCBuYW1lOiBuYW1lIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvblwiOiB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHJhdy5tZXNzYWdlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIm5vdGlmaWNhdGlvblwiLCBtZXNzYWdlOiBtZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRyYXdXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcInNoZWF0aGVXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcImF0dGFja1wiOlxuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgY2FzZSBcImZvcmNlVGhpcmRQZXJzb25cIjpcbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjpcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGFjdGlvblR5cGUgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZEFjdGlvbihhY3Rpb24pIHtcbiAgICB2b2lkIGFjdGlvbjtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiIsImltcG9ydCB7IEh0dHBDbGllbnQsIHByaW50Q29uc29sZSwgVWksIG9uY2UgfSBmcm9tIFwiLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB7IHBhcnNlQWN0aW9uIH0gZnJvbSBcIi4vcGFyc2VyXCI7XG5pbXBvcnQgeyBleGVjdXRlQWN0aW9uIH0gZnJvbSBcIi4vZXhlY3V0b3JcIjtcbnZhciBJTklUSUFMX0JBQ0tPRkZfTVMgPSAxMDAwO1xudmFyIHBvbGxpbmdDbGllbnQgPSBudWxsO1xudmFyIGJhY2tvZmZNcyA9IElOSVRJQUxfQkFDS09GRl9NUztcbnZhciBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbnZhciBwb2xsaW5nQWN0aXZlID0gZmFsc2U7XG52YXIgcG9sbFRpbWVySWQgPSBudWxsO1xuZnVuY3Rpb24gbG9nRGVidWcobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwb2xsRm9yQWN0aW9ucygpIHtcbiAgICBpZiAoIXBvbGxpbmdDbGllbnQgfHwgIXBvbGxpbmdBY3RpdmUpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAoVWkuaXNNZW51T3BlbihcIkxvYWRpbmcgTWVudVwiKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkxvYWRpbmcgc2NyZWVuIG9wZW4g4oCUIHNraXBwaW5nIGFjdGlvbiBwb2xsXCIpO1xuICAgICAgICBzY2hlZHVsZU5leHRQb2xsKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcG9sbGluZ0NsaWVudFxuICAgICAgICAuZ2V0KENPTkZJRy5wb2xsaW5nRW5kcG9pbnQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgICAgICAgICAgYmFja29mZk1zID0gSU5JVElBTF9CQUNLT0ZGX01TO1xuICAgICAgICAgICAgdmFyIHBhcnNlZCA9IHZvaWQgMDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZShyZXNwb25zZS5ib2R5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFpbGVkIHRvIHBhcnNlIGFjdGlvbiByZXNwb25zZSBib2R5IGFzIEpTT05cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGFjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhcnNlZCkgPyBwYXJzZWQgOiBbcGFyc2VkXTtcbiAgICAgICAgICAgIGZvciAodmFyIF9pID0gMCwgYWN0aW9uc18xID0gYWN0aW9uczsgX2kgPCBhY3Rpb25zXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJhdyA9IGFjdGlvbnNfMVtfaV07XG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHBhcnNlQWN0aW9uKHJhdyk7XG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBleGVjdXRlQWN0aW9uKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaGFuZGxlRmFpbHVyZShcIkhUVFAgXCIuY29uY2F0KHJlc3BvbnNlLnN0YXR1cykpO1xuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaGFuZGxlRmFpbHVyZShtc2cpO1xuICAgIH0pXG4gICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2NoZWR1bGVOZXh0UG9sbCgpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gaGFuZGxlRmFpbHVyZShyZWFzb24pIHtcbiAgICBjb25zZWN1dGl2ZUZhaWx1cmVzKys7XG4gICAgbG9nRGVidWcoXCJQb2xsIGZhaWxlZCAoXCIuY29uY2F0KGNvbnNlY3V0aXZlRmFpbHVyZXMsIFwiL1wiKS5jb25jYXQoQ09ORklHLm1heFBvbGxpbmdSZXRyaWVzLCBcIik6IFwiKS5jb25jYXQocmVhc29uKSk7XG4gICAgaWYgKGNvbnNlY3V0aXZlRmFpbHVyZXMgPj0gQ09ORklHLm1heFBvbGxpbmdSZXRyaWVzKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiTWF4IHJldHJpZXMgcmVhY2hlZCBcXHUyMDE0IHBhdXNpbmcgZm9yIFwiLmNvbmNhdChDT05GSUcucG9sbGluZ01heEJhY2tvZmYsIFwibXNcIikpO1xuICAgICAgICBiYWNrb2ZmTXMgPSBDT05GSUcucG9sbGluZ01heEJhY2tvZmY7XG4gICAgICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYmFja29mZk1zID0gTWF0aC5taW4oYmFja29mZk1zICogMiwgQ09ORklHLnBvbGxpbmdNYXhCYWNrb2ZmKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzY2hlZHVsZU5leHRQb2xsKCkge1xuICAgIGlmICghcG9sbGluZ0FjdGl2ZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHBvbGxUaW1lcklkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvbGxUaW1lcklkID0gbnVsbDtcbiAgICAgICAgcG9sbEZvckFjdGlvbnMoKTtcbiAgICB9LCBiYWNrb2ZmTXMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0UG9sbGluZygpIHtcbiAgICBpZiAoIUNPTkZJRy5wb2xsaW5nRW5hYmxlZCkge1xuICAgICAgICBsb2dEZWJ1ZyhcIlBvbGxpbmcgZGlzYWJsZWQgYnkgY29uZmlnXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwb2xsaW5nQWN0aXZlKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiUG9sbGluZyBhbHJlYWR5IGFjdGl2ZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwb2xsaW5nQ2xpZW50ID0gbmV3IEh0dHBDbGllbnQoQ09ORklHLnNlcnZlclVybCk7XG4gICAgcG9sbGluZ0FjdGl2ZSA9IHRydWU7XG4gICAgYmFja29mZk1zID0gSU5JVElBTF9CQUNLT0ZGX01TO1xuICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgIGxvZ0RlYnVnKFwiU3RhcnRpbmcgYWN0aW9uIHBvbGxpbmdcIik7XG4gICAgb25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvbGxGb3JBY3Rpb25zKCk7XG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3RvcFBvbGxpbmcoKSB7XG4gICAgcG9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgIGlmIChwb2xsVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocG9sbFRpbWVySWQpO1xuICAgICAgICBwb2xsVGltZXJJZCA9IG51bGw7XG4gICAgfVxuICAgIHBvbGxpbmdDbGllbnQgPSBudWxsO1xuICAgIGxvZ0RlYnVnKFwiQWN0aW9uIHBvbGxpbmcgc3RvcHBlZFwiKTtcbn1cbiIsInZhciBsYXN0U3RhdGUgPSBudWxsO1xudmFyIGxhc3RTZW5kVGltZXMgPSB7XG4gICAgY3JpdGljYWw6IDAsXG4gICAgaGlnaDogMCxcbiAgICBtZWRpdW06IDAsXG4gICAgbG93OiAwLFxuICAgIHN1cHByZXNzZWQ6IDBcbn07XG52YXIgcmF0ZUxpbWl0cyA9IHtcbiAgICBjcml0aWNhbDogMjAwLFxuICAgIGhpZ2g6IDUwMCxcbiAgICBtZWRpdW06IDEwMDAsXG4gICAgbG93OiAyMDAwLFxuICAgIHN1cHByZXNzZWQ6IDUwMDBcbn07XG5leHBvcnQgZnVuY3Rpb24gaXNTdGF0ZVVuY2hhbmdlZChuZXdTdGF0ZSkge1xuICAgIGlmICghbGFzdFN0YXRlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5ld1N0YXRlLmV2ZW50VHlwZSAhPT0gXCJ0aWNrXCIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmV3U3RhdGUuY29tYmF0U3RhdGUgIT09IGxhc3RTdGF0ZS5jb21iYXRTdGF0ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuZXdTdGF0ZS5lbmVtaWVzLmxlbmd0aCAhPT0gbGFzdFN0YXRlLmVuZW1pZXMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHBsYXllckNoYW5nZWQgPSBuZXdTdGF0ZS5wbGF5ZXIuaGVhbHRoICE9PSBsYXN0U3RhdGUucGxheWVyLmhlYWx0aCB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueCAhPT0gbGFzdFN0YXRlLnBsYXllci5wb3NpdGlvbi54IHx8XG4gICAgICAgIG5ld1N0YXRlLnBsYXllci5wb3NpdGlvbi55ICE9PSBsYXN0U3RhdGUucGxheWVyLnBvc2l0aW9uLnkgfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLnBvc2l0aW9uLnogIT09IGxhc3RTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueiB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIuaXNTbmVha2luZyAhPT0gbGFzdFN0YXRlLnBsYXllci5pc1NuZWFraW5nO1xuICAgIHJldHVybiAhcGxheWVyQ2hhbmdlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVByaW9yaXR5KHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLnBsYXllci5pc0RlYWQpIHtcbiAgICAgICAgcmV0dXJuIFwiY3JpdGljYWxcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnBsYXllci5oZWFsdGggPCBzdGF0ZS5wbGF5ZXIubWF4SGVhbHRoICogMC4yNSkge1xuICAgICAgICByZXR1cm4gXCJjcml0aWNhbFwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlID09PSBcImhpdFwiKSB7XG4gICAgICAgIHJldHVybiBcImhpZ2hcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmNvbWJhdFN0YXRlID09PSAxKSB7XG4gICAgICAgIGlmIChzdGF0ZS5lbmVtaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBjbG9zZXN0RW5lbXkgPSBzdGF0ZS5lbmVtaWVzWzBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdGF0ZS5lbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmVuZW1pZXNbaV0uZGlzdGFuY2UgPCBjbG9zZXN0RW5lbXkuZGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdEVuZW15ID0gc3RhdGUuZW5lbWllc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2xvc2VzdEVuZW15LmRpc3RhbmNlIDwgNTAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiaGlnaFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIm1lZGl1bVwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlICE9PSBcInRpY2tcIikge1xuICAgICAgICByZXR1cm4gXCJtZWRpdW1cIjtcbiAgICB9XG4gICAgLy8gU3VwcHJlc3MgaWYgbm90aGluZyBpbnRlcmVzdGluZyBpcyBoYXBwZW5pbmdcbiAgICBpZiAobGFzdFN0YXRlICYmIGlzU3RhdGVVbmNoYW5nZWQoc3RhdGUpKSB7XG4gICAgICAgIHJldHVybiBcInN1cHByZXNzZWRcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwibG93XCI7XG59XG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2VuZChwcmlvcml0eSwgc3RhdGUpIHtcbiAgICBpZiAocHJpb3JpdHkgPT09IFwic3VwcHJlc3NlZFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGxhc3RTZW5kID0gbGFzdFNlbmRUaW1lc1twcmlvcml0eV07XG4gICAgdmFyIG1pbkludGVydmFsID0gcmF0ZUxpbWl0c1twcmlvcml0eV07XG4gICAgaWYgKG5vdyAtIGxhc3RTZW5kIDwgbWluSW50ZXJ2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBPbmx5IHVwZGF0ZSBzdGF0ZSB3aGVuIHdlJ3JlIGFjdHVhbGx5IGdvaW5nIHRvIHNlbmRcbiAgICBsYXN0U2VuZFRpbWVzW3ByaW9yaXR5XSA9IG5vdztcbiAgICBsYXN0U3RhdGUgPSBzdGF0ZTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiIsImltcG9ydCB7IEh0dHBDbGllbnQsIHByaW50Q29uc29sZSB9IGZyb20gXCIuLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xudmFyIE1BWF9TRU5EU19QRVJfU0VDID0gNTtcbnZhciBzZW5kQ291bnQgPSAwO1xudmFyIGxhc3RSZXNldCA9IERhdGUubm93KCk7XG5mdW5jdGlvbiByZXNldFJhdGVMaW1pdCgpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdFJlc2V0ID49IDEwMDApIHtcbiAgICAgICAgc2VuZENvdW50ID0gMDtcbiAgICAgICAgbGFzdFJlc2V0ID0gbm93O1xuICAgIH1cbn1cbnZhciBTa3lHdWlkZUh0dHBDbGllbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2t5R3VpZGVIdHRwQ2xpZW50KGJhc2VVcmwpIHtcbiAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSAwO1xuICAgICAgICB0aGlzLm1heEZhaWx1cmVzID0gMztcbiAgICAgICAgdGhpcy5sYXN0RmFpbHVyZVRpbWUgPSAwO1xuICAgICAgICB0aGlzLmNvb2xkb3duTXMgPSAxMDAwMDtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBuZXcgSHR0cENsaWVudChiYXNlVXJsKTtcbiAgICB9XG4gICAgU2t5R3VpZGVIdHRwQ2xpZW50LnByb3RvdHlwZS5zZW5kR2FtZVN0YXRlID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgcmVzZXRSYXRlTGltaXQoKTtcbiAgICAgICAgaWYgKHNlbmRDb3VudCA+PSBNQVhfU0VORFNfUEVSX1NFQykge1xuICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJSYXRlIGxpbWl0IGV4Y2VlZGVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmNsaWVudFxuICAgICAgICAgICAgLnBvc3QoXCIvYXBpL2dhbWUtc3RhdGVcIiwge1xuICAgICAgICAgICAgYm9keTogcGF5bG9hZCxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzZW5kQ291bnQrKztcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmZhaWx1cmVDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEhUVFAgXCIuY29uY2F0KHJlc3BvbnNlLnN0YXR1cywgXCI6IHJlcXVlc3QgcmVqZWN0ZWQgYnkgc2VydmVyXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMubGFzdEZhaWx1cmVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5mYWlsdXJlQ291bnQrKztcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBIVFRQIFBPU1QgL2FwaS9nYW1lLXN0YXRlIGZhaWxlZDogXCIuY29uY2F0KG1zZykpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgX3RoaXMubGFzdEZhaWx1cmVUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIF90aGlzLmZhaWx1cmVDb3VudCsrO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNreUd1aWRlSHR0cENsaWVudC5wcm90b3R5cGUuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmZhaWx1cmVDb3VudCA8IHRoaXMubWF4RmFpbHVyZXMpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSB0aGlzLmxhc3RGYWlsdXJlVGltZSA+IHRoaXMuY29vbGRvd25Ncykge1xuICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSB0aGlzLm1heEZhaWx1cmVzIC0gMTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiBTa3lHdWlkZUh0dHBDbGllbnQ7XG59KCkpO1xuZXhwb3J0IHZhciBodHRwQ2xpZW50ID0gbmV3IFNreUd1aWRlSHR0cENsaWVudChDT05GSUcuc2VydmVyVXJsKTtcbmV4cG9ydCBmdW5jdGlvbiBzZW5kR2FtZVN0YXRlKHBheWxvYWQpIHtcbiAgICByZXR1cm4gaHR0cENsaWVudC5zZW5kR2FtZVN0YXRlKHBheWxvYWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiBodHRwQ2xpZW50LmlzQ29ubmVjdGVkKCk7XG59XG4iLCIvLyBAZW52IG5vZGVcbi8vIE5PVEU6IEZvciBwcm9kdWN0aW9uLCBjb25zaWRlciByZWFkaW5nIGZyb20gU2t5cmltIFBsYXRmb3JtIHNldHRpbmdzOlxuLy8gICBpbXBvcnQgeyBzZXR0aW5ncyB9IGZyb20gXCJza3lyaW1QbGF0Zm9ybVwiO1xuLy8gICBjb25zdCBkZWJ1Z01vZGUgPSBzZXR0aW5nc1tcInNreWd1aWRlXCJdPy5bXCJkZWJ1Z01vZGVcIl0gPT09IFwidHJ1ZVwiO1xuZXhwb3J0IHZhciBQTEFZRVJfRk9STV9JRCA9IDB4MTQ7XG5leHBvcnQgdmFyIENPTkZJRyA9IHtcbiAgICBzZXJ2ZXJVcmw6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXG4gICAgdGlja0ludGVydmFsOiA1MDAsXG4gICAgZW5lbXlTY2FuUmFkaXVzOiA1MDAwLFxuICAgIG1heEVuZW1pZXM6IDEwLFxuICAgIGRlYnVnTW9kZTogZmFsc2UsXG4gICAgcG9sbGluZ0ludGVydmFsOiAxMDAwLFxuICAgIHBvbGxpbmdFbmRwb2ludDogXCIvYXBpL2FjdGlvbnNcIixcbiAgICBwb2xsaW5nTWF4QmFja29mZjogMzAwMDAsXG4gICAgcG9sbGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgbWF4UG9sbGluZ1JldHJpZXM6IDUsXG59O1xuIiwidmFyIF9fc3ByZWFkQXJyYXkgPSAodGhpcyAmJiB0aGlzLl9fc3ByZWFkQXJyYXkpIHx8IGZ1bmN0aW9uICh0bywgZnJvbSwgcGFjaykge1xuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XG59O1xuaW1wb3J0IHsgb24sIHByaW50Q29uc29sZSB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBpc1JlZ2lzdGVyZWQgPSBmYWxzZTtcbnZhciBsYXN0Q3Jvc3NoYWlyUmVmO1xudmFyIG9wZW5NZW51cyA9IG5ldyBTZXQoKTtcbnZhciBsYXN0TG9jYXRpb247XG52YXIgbGFzdEFjdGl2YXRlZFJlZjtcbnZhciBwbGF5ZXJEZWFkID0gZmFsc2U7XG52YXIgbGFzdENvbnRhaW5lckNoYW5nZWQ7XG52YXIgbGFzdEVxdWlwQ2hhbmdlO1xudmFyIGxhc3RMZXZlbFVwO1xudmFyIGxhc3RRdWVzdFVwZGF0ZTtcbnZhciBsYXN0RmFzdFRyYXZlbEVuZDtcbnZhciBsYXN0Qm9va1JlYWQ7XG52YXIgbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG52YXIgbGFzdExvY2tDaGFuZ2VkO1xuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBydW5IYW5kbGVyKGhhbmRsZXJzLCBldmVudE5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgX2E7XG4gICAgKF9hID0gaGFuZGxlcnMgPT09IG51bGwgfHwgaGFuZGxlcnMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGhhbmRsZXJzW2V2ZW50TmFtZV0pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5jYWxsLmFwcGx5KF9hLCBfX3NwcmVhZEFycmF5KFtoYW5kbGVyc10sIGFyZ3MsIGZhbHNlKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENyb3NzaGFpclJlZigpIHtcbiAgICByZXR1cm4gbGFzdENyb3NzaGFpclJlZjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVuTWVudXMoKSB7XG4gICAgdmFyIHNuYXBzaG90ID0gbmV3IFNldCgpO1xuICAgIG9wZW5NZW51cy5mb3JFYWNoKGZ1bmN0aW9uIChtZW51TmFtZSkge1xuICAgICAgICBzbmFwc2hvdC5hZGQobWVudU5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBzbmFwc2hvdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIGxhc3RMb2NhdGlvbjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0QWN0aXZhdGVkUmVmKCkge1xuICAgIHJldHVybiBsYXN0QWN0aXZhdGVkUmVmO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxheWVyRGVhZCgpIHtcbiAgICByZXR1cm4gcGxheWVyRGVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q29udGFpbmVyQ2hhbmdlZCgpIHtcbiAgICByZXR1cm4gbGFzdENvbnRhaW5lckNoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEVxdWlwQ2hhbmdlKCkge1xuICAgIHJldHVybiBsYXN0RXF1aXBDaGFuZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExldmVsVXAoKSB7XG4gICAgcmV0dXJuIGxhc3RMZXZlbFVwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RRdWVzdFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gbGFzdFF1ZXN0VXBkYXRlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RGYXN0VHJhdmVsRW5kKCkge1xuICAgIHJldHVybiBsYXN0RmFzdFRyYXZlbEVuZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Qm9va1JlYWQoKSB7XG4gICAgcmV0dXJuIGxhc3RCb29rUmVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0SXRlbUhhcnZlc3RlZCgpIHtcbiAgICByZXR1cm4gbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExvY2tDaGFuZ2VkKCkge1xuICAgIHJldHVybiBsYXN0TG9ja0NoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJBbGxFdmVudHMoaGFuZGxlcnMpIHtcbiAgICBpZiAoaXNSZWdpc3RlcmVkKSB7XG4gICAgICAgIGRlYnVnTG9nKFwicmVnaXN0ZXJBbGxFdmVudHMgY2FsbGVkIGFmdGVyIGluaXRpYWxpemF0aW9uOyBza2lwcGluZyBkdXBsaWNhdGUgc3Vic2NyaXB0aW9uc1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpc1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIG9uKFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0Q3Jvc3NoYWlyUmVmID0gKF9hID0gZXZlbnQucmVmZXJlbmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjcm9zc2hhaXJSZWZDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDcm9zc2hhaXJSZWYpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NhdGlvbkNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGFzdExvY2F0aW9uID0gKF9hID0gZXZlbnQubmV3TG9jKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxvY2F0aW9uQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2NhdGlvbkNoYW5nZWQ6IFwiLmNvbmNhdChsYXN0TG9jYXRpb24gIT09IG51bGwgJiYgbGFzdExvY2F0aW9uICE9PSB2b2lkIDAgPyBsYXN0TG9jYXRpb24gOiBcInVua25vd25cIikpO1xuICAgIH0pO1xuICAgIG9uKFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9jYXRpb25EaXNjb3Zlcnk6IFwiLmNvbmNhdChldmVudC5uYW1lKSk7XG4gICAgfSk7XG4gICAgb24oXCJjZWxsRnVsbHlMb2FkZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2VsbEZ1bGx5TG9hZGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNlbGxGdWxseUxvYWRlZDogXCIuY29uY2F0KGV2ZW50LmNlbGwuZ2V0TmFtZSgpKSk7XG4gICAgfSk7XG4gICAgb24oXCJtZW51T3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5hZGQoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51T3BlblwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJtZW51T3BlbjogXCIuY29uY2F0KGV2ZW50Lm5hbWUpKTtcbiAgICB9KTtcbiAgICBvbihcIm1lbnVDbG9zZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5kZWxldGUoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51Q2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibWVudUNsb3NlOiBcIi5jb25jYXQoZXZlbnQubmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZnVybml0dXJlRW50ZXJcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZnVybml0dXJlRW50ZXI6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRXhpdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJmdXJuaXR1cmVFeGl0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImZ1cm5pdHVyZUV4aXQ6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwib3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJvcGVuXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIm9wZW46IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiY2xvc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY2xvc2U6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwicXVlc3RTdGFnZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0YWdlXCIsIHF1ZXN0SWQ6IGV2ZW50LnF1ZXN0LmdldEZvcm1JRCgpLCBzdGFnZTogZXZlbnQuc3RhZ2UgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0YWdlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInF1ZXN0U3RhZ2U6IHF1ZXN0PVwiLmNvbmNhdChTdHJpbmcobGFzdFF1ZXN0VXBkYXRlLnF1ZXN0SWQpLCBcIiBzdGFnZT1cIikuY29uY2F0KFN0cmluZyhldmVudC5zdGFnZSkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RRdWVzdFVwZGF0ZSA9IHsgZXZlbnQ6IFwicXVlc3RTdGFydFwiLCBxdWVzdElkOiBldmVudC5xdWVzdC5nZXRGb3JtSUQoKSB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInF1ZXN0U3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdGFydDogcXVlc3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0UXVlc3RVcGRhdGUucXVlc3RJZCkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RvcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0b3BcIiwgcXVlc3RJZDogZXZlbnQucXVlc3QuZ2V0Rm9ybUlEKCkgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0b3BcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdG9wOiBxdWVzdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RRdWVzdFVwZGF0ZS5xdWVzdElkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcGxheWVyRGVhZCA9IHRydWU7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZGVhdGhTdGFydFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aFN0YXJ0XCIpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHBsYXllckRlYWQgPSBmYWxzZTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJkZWF0aEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aEVuZFwiKTtcbiAgICB9KTtcbiAgICBvbihcImNvbnRhaW5lckNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0Q29udGFpbmVyQ2hhbmdlZCA9IHtcbiAgICAgICAgICAgIG9sZENvbnRhaW5lcjogKF9hID0gZXZlbnQub2xkQ29udGFpbmVyKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBuZXdDb250YWluZXI6IChfYiA9IGV2ZW50Lm5ld0NvbnRhaW5lcikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgaXRlbTogKF9jID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgY291bnQ6IGV2ZW50Lm51bUl0ZW1zXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY29udGFpbmVyQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjb250YWluZXJDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm9sZENvbnRhaW5lciksIFwiIC0+IFwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm5ld0NvbnRhaW5lciksIFwiLCBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLml0ZW0pLCBcIiwgY291bnQ9XCIpLmNvbmNhdChTdHJpbmcoZXZlbnQubnVtSXRlbXMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcImVxdWlwXCIsXG4gICAgICAgICAgICBhY3RvcjogKF9hID0gZXZlbnQuYWN0b3IpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGJhc2VPYmplY3Q6IChfYiA9IGV2ZW50LmJhc2VPYmopID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGV4dHJhRGF0YTogZXZlbnQudW5pcXVlSWRcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJlcXVpcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJlcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwidW5lcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcInVuZXF1aXBcIixcbiAgICAgICAgICAgIGFjdG9yOiAoX2EgPSBldmVudC5hY3RvcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgYmFzZU9iamVjdDogKF9iID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgZXh0cmFEYXRhOiBldmVudC51bmlxdWVJZFxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInVuZXF1aXBcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwidW5lcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwibGV2ZWxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBsZXZlbDogZXZlbnQubmV3TGV2ZWwsXG4gICAgICAgICAgICBpc1NraWxsSW5jcmVhc2U6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibGV2ZWxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsZXZlbEluY3JlYXNlOiBsZXZlbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50Lm5ld0xldmVsKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2tpbGxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBza2lsbElkOiBldmVudC5hY3RvclZhbHVlLFxuICAgICAgICAgICAgaXNTa2lsbEluY3JlYXNlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwic2tpbGxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJza2lsbEluY3JlYXNlOiBza2lsbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmFjdG9yVmFsdWUpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlbnRlckJsZWVkb3V0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImVudGVyQmxlZWRvdXRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZW50ZXJCbGVlZG91dDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhldmVudC5hY3Rvci5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImZhc3RUcmF2ZWxFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RGYXN0VHJhdmVsRW5kID0geyB0cmF2ZWxUaW1lR2FtZUhvdXJzOiBldmVudC50cmF2ZWxUaW1lR2FtZUhvdXJzIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZmFzdFRyYXZlbEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJmYXN0VHJhdmVsRW5kOiB0cmF2ZWxIb3Vycz1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRyYXZlbFRpbWVHYW1lSG91cnMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJzbGVlcFN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwic2xlZXBTdGFydDogZGVzaXJlZFN0b3BUaW1lPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuZGVzaXJlZFN0b3BUaW1lKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2xlZXBTdG9wXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RvcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJzbGVlcFN0b3A6IGludGVycnVwdGVkPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuaXNJbnRlcnJ1cHRlZCkpKTtcbiAgICB9KTtcbiAgICBvbihcImFjdGl2YXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBsYXN0QWN0aXZhdGVkUmVmID0gKF9hID0gZXZlbnQudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYWN0aXZhdGVcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYWN0aXZhdGU6IHRhcmdldD1cIi5jb25jYXQoU3RyaW5nKGxhc3RBY3RpdmF0ZWRSZWYpLCBcIiBjYXN0ZXI9XCIpLmNvbmNhdChTdHJpbmcoKF9iID0gZXZlbnQuY2FzdGVyKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NrQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0TG9ja0NoYW5nZWQgPSB7XG4gICAgICAgICAgICBsb2NrZWRPYmplY3Q6IChfYSA9IGV2ZW50LmxvY2tlZE9iamVjdCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9ja0NoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9ja0NoYW5nZWQ6IG9iamVjdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RMb2NrQ2hhbmdlZC5sb2NrZWRPYmplY3QpKSk7XG4gICAgfSk7XG4gICAgb24oXCJib29rUmVhZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIGxhc3RCb29rUmVhZCA9IHtcbiAgICAgICAgICAgIGJvb2tGb3JtSWQ6IChfYSA9IGV2ZW50LmJvb2spID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIHRpdGxlOiAoX2IgPSBldmVudC5ib29rKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0TmFtZSgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYm9va1JlYWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYm9va1JlYWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0Qm9va1JlYWQudGl0bGUpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IFN0cmluZyhsYXN0Qm9va1JlYWQuYm9va0Zvcm1JZCkpKTtcbiAgICB9KTtcbiAgICBvbihcIml0ZW1IYXJ2ZXN0ZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0SXRlbUhhcnZlc3RlZCA9IHtcbiAgICAgICAgICAgIGl0ZW1Gb3JtSWQ6IChfYSA9IGV2ZW50LnByb2R1Y2VJdGVtKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBpbmdyZWRpZW50TmFtZTogKF9iID0gZXZlbnQucHJvZHVjZUl0ZW0pID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXROYW1lKClcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJpdGVtSGFydmVzdGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIml0ZW1IYXJ2ZXN0ZWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0SXRlbUhhcnZlc3RlZC5pbmdyZWRpZW50TmFtZSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogU3RyaW5nKGxhc3RJdGVtSGFydmVzdGVkLml0ZW1Gb3JtSWQpKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbnZhciBGT1JNX1RZUEVfTkFNRVMgPSB7XG4gICAgMjQ6IFwiQWN0aXZhdG9yXCIsXG4gICAgMjY6IFwiRmxvcmFcIixcbiAgICAyNzogXCJLZXlcIixcbiAgICAyODogXCJDb250YWluZXJcIixcbiAgICAyOTogXCJEb29yXCIsXG4gICAgNDA6IFwiRnVybml0dXJlXCIsXG4gICAgNDE6IFwiSW5ncmVkaWVudFwiLFxuICAgIDQyOiBcIkFwcGFyYXR1c1wiLFxuICAgIDYyOiBcIk5QQ1wiLFxufTtcbmZ1bmN0aW9uIG1hcEZvcm1UeXBlKHR5cGVJZCkge1xuICAgIHZhciBfYTtcbiAgICBpZiAodHlwZUlkID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoX2EgPSBGT1JNX1RZUEVfTkFNRVNbdHlwZUlkXSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogXCJGb3JtVHlwZV9cIi5jb25jYXQodHlwZUlkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0KCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmVmID0gR2FtZS5nZXRDdXJyZW50Q3Jvc3NoYWlyUmVmKCk7XG4gICAgICAgIGlmIChyZWYgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvcm1JZCA9IHJlZi5nZXRGb3JtSUQoKTtcbiAgICAgICAgdmFyIGJhc2VPYmplY3QgPSByZWYuZ2V0QmFzZU9iamVjdCgpO1xuICAgICAgICB2YXIgdHlwZUlkID0gYmFzZU9iamVjdCA9PT0gbnVsbCB8fCBiYXNlT2JqZWN0ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqZWN0LmdldFR5cGUoKTtcbiAgICAgICAgdmFyIHR5cGUgPSBtYXBGb3JtVHlwZSh0eXBlSWQpO1xuICAgICAgICB2YXIgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVJZCA9PT0gMjkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gcmVmLmdldE9wZW5TdGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IChfYiA9IChfYSA9IHJlZi5nZXREaXNwbGF5TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBiYXNlT2JqZWN0ID09PSBudWxsIHx8IGJhc2VPYmplY3QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2VPYmplY3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSAoX2QgPSAoX2MgPSBHYW1lLmdldFBsYXllcigpKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuZ2V0RGlzdGFuY2UocmVmKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogMDtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxuICAgICAgICAgICAgaXNPcGVuOiBpc09wZW4sXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfZikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lLCBVdGlsaXR5LCBXZWF0aGVyIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEVudmlyb25tZW50U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB2YXIgZ2FtZVRpbWUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGdhbWVUaW1lID0gVXRpbGl0eS5nZXRDdXJyZW50R2FtZVRpbWUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIGdhbWVUaW1lID0gMDtcbiAgICB9XG4gICAgdmFyIGdhbWVIb3VyID0gMDtcbiAgICB0cnkge1xuICAgICAgICBnYW1lSG91ciA9ICgoZ2FtZVRpbWUgKiAyNCkgJSAyNCArIDI0KSAlIDI0O1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgZ2FtZUhvdXIgPSAwO1xuICAgIH1cbiAgICB2YXIgY2FtZXJhU3RhdGUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGNhbWVyYVN0YXRlID0gR2FtZS5nZXRDYW1lcmFTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgY2FtZXJhU3RhdGUgPSAwO1xuICAgIH1cbiAgICB2YXIgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHdlYXRoZXJOYW1lID0gKF9iID0gKF9hID0gV2VhdGhlci5nZXRDdXJyZW50V2VhdGhlcigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgIH1cbiAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBzdW5Qb3NpdGlvblggPSBHYW1lLmdldFN1blBvc2l0aW9uWCgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgc3VuUG9zaXRpb25ZID0gR2FtZS5nZXRTdW5Qb3NpdGlvblkoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHN1blBvc2l0aW9uWiA9IEdhbWUuZ2V0U3VuUG9zaXRpb25aKCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBnYW1lVGltZTogZ2FtZVRpbWUsXG4gICAgICAgIGdhbWVIb3VyOiBnYW1lSG91cixcbiAgICAgICAgd2VhdGhlck5hbWU6IHdlYXRoZXJOYW1lLFxuICAgICAgICBjYW1lcmFTdGF0ZTogY2FtZXJhU3RhdGUsXG4gICAgICAgIHN1blBvc2l0aW9uWDogc3VuUG9zaXRpb25YLFxuICAgICAgICBzdW5Qb3NpdGlvblk6IHN1blBvc2l0aW9uWSxcbiAgICAgICAgc3VuUG9zaXRpb25aOiBzdW5Qb3NpdGlvblpcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgSW5wdXQgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbnZhciBNT1ZFX0ZPUldBUkQgPSAxNztcbnZhciBNT1ZFX0xFRlQgPSAzMDtcbnZhciBNT1ZFX0JBQ0tXQVJEID0gMzE7XG52YXIgTU9WRV9SSUdIVCA9IDMyO1xudmFyIFNQUklOVCA9IDQyO1xudmFyIENST1VDSCA9IDI5O1xudmFyIEpVTVBfT1JfQUNUSVZBVEUgPSA1NztcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0SW5wdXRTdGF0ZSgpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIga2V5c1ByZXNzZWQgPSBbXTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChNT1ZFX0ZPUldBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIldcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9MRUZUKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJBXCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKE1PVkVfQkFDS1dBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9SSUdIVCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiRFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChTUFJJTlQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNoaWZ0XCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKENST1VDSCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiQ3RybFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChKVU1QX09SX0FDVElWQVRFKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJTcGFjZVwiKTtcbiAgICAgICAgcmV0dXJuIHsga2V5c1ByZXNzZWQ6IGtleXNQcmVzc2VkIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4geyBrZXlzUHJlc3NlZDogW10gfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdExvY2F0aW9uU3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2MsIF9kLCBfZSwgX2YsIF9nLCBfaDtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvY2F0aW9uTmFtZTogbnVsbCxcbiAgICAgICAgaXNJbnRlcmlvcjogZmFsc2UsXG4gICAgICAgIGNlbGxOYW1lOiBudWxsLFxuICAgICAgICB3b3JsZHNwYWNlTmFtZTogbnVsbFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvY2F0aW9uTmFtZTogKF9iID0gKF9hID0gcGxheWVyLmdldEN1cnJlbnRMb2NhdGlvbigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsLFxuICAgICAgICAgICAgaXNJbnRlcmlvcjogKF9kID0gKF9jID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmlzSW50ZXJpb3IoKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogZmFsc2UsXG4gICAgICAgICAgICBjZWxsTmFtZTogKF9mID0gKF9lID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9lLmdldE5hbWUoKSkgIT09IG51bGwgJiYgX2YgIT09IHZvaWQgMCA/IF9mIDogbnVsbCxcbiAgICAgICAgICAgIHdvcmxkc3BhY2VOYW1lOiAoX2ggPSAoX2cgPSBwbGF5ZXIuZ2V0V29ybGRTcGFjZSgpKSA9PT0gbnVsbCB8fCBfZyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2cuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfaCAhPT0gdm9pZCAwID8gX2ggOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHLCBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVEaXN0YW5jZSh4MSwgeTEsIHoxLCB4MiwgeTIsIHoyKSB7XG4gICAgdmFyIGR4ID0geDIgLSB4MTtcbiAgICB2YXIgZHkgPSB5MiAtIHkxO1xuICAgIHZhciBkeiA9IHoyIC0gejE7XG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3ROZWFyYnlOcGNzKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zaXRpb24oKTtcbiAgICBpZiAoIXBsYXllclBvcylcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBzY2FuT2Zmc2V0cyA9IFtcbiAgICAgICAgeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cywgeTogMCB9LFxuICAgICAgICB7IHg6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzLCB5OiAwIH0sXG4gICAgICAgIHsgeDogMCwgeTogQ09ORklHLmVuZW15U2NhblJhZGl1cyB9LFxuICAgICAgICB7IHg6IDAsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3IH0sXG4gICAgXTtcbiAgICB2YXIgc2VlbkZvcm1JZHMgPSBuZXcgU2V0KCk7XG4gICAgdmFyIG5lYXJieU5wY3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIHNjYW5PZmZzZXRzXzEgPSBzY2FuT2Zmc2V0czsgX2kgPCBzY2FuT2Zmc2V0c18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gc2Nhbk9mZnNldHNfMVtfaV07XG4gICAgICAgIGlmIChuZWFyYnlOcGNzLmxlbmd0aCA+PSBDT05GSUcubWF4RW5lbWllcylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgc2NhblggPSBwbGF5ZXJQb3MueCArIG9mZnNldC54O1xuICAgICAgICB2YXIgc2NhblkgPSBwbGF5ZXJQb3MueSArIG9mZnNldC55O1xuICAgICAgICB2YXIgc2NhblogPSBwbGF5ZXJQb3MuejtcbiAgICAgICAgdmFyIGFjdG9yID0gR2FtZS5maW5kQ2xvc2VzdEFjdG9yKHNjYW5YLCBzY2FuWSwgc2NhblosIENPTkZJRy5lbmVteVNjYW5SYWRpdXMpO1xuICAgICAgICBpZiAoIWFjdG9yKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBhY3Rvci5nZXRGb3JtSUQoKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHNlZW5Gb3JtSWRzLmhhcyhmb3JtSWQpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHNlZW5Gb3JtSWRzLmFkZChmb3JtSWQpO1xuICAgICAgICB2YXIgYWN0b3JQb3MgPSB7XG4gICAgICAgICAgICB4OiBhY3Rvci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgICAgIHk6IGFjdG9yLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICAgICAgejogYWN0b3IuZ2V0UG9zaXRpb25aKCksXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKHBsYXllclBvcy54LCBwbGF5ZXJQb3MueSwgcGxheWVyUG9zLnosIGFjdG9yUG9zLngsIGFjdG9yUG9zLnksIGFjdG9yUG9zLnopO1xuICAgICAgICB2YXIgYmFzZU9iaiA9IGFjdG9yLmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgdmFyIG5hbWUgPSAoYmFzZU9iaiA9PT0gbnVsbCB8fCBiYXNlT2JqID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqLmdldE5hbWUoKSkgfHwgXCJVbmtub3duXCI7XG4gICAgICAgIHZhciBoZWFsdGggPSBhY3Rvci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpO1xuICAgICAgICB2YXIgbGV2ZWwgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWwgPSBhY3Rvci5nZXRMZXZlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYykge1xuICAgICAgICAgICAgbGV2ZWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciByYWNlID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJhY2UgPSAoX2IgPSAoX2EgPSBhY3Rvci5nZXRSYWNlKCkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgICAgICByYWNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNIb3N0aWxlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBhY3Rvci5pc0hvc3RpbGVUb0FjdG9yKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNBbGx5ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBhY3Rvci5pc1BsYXllclRlYW1tYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNHdWFyZCA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNHdWFyZCA9IGFjdG9yLmlzR3VhcmQoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgICAgIGlzR3VhcmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNNZXJjaGFudCA9IGZhbHNlO1xuICAgICAgICB2YXIgaXNJbkRpYWxvZ3VlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBhY3Rvci5pc0luRGlhbG9ndWVXaXRoUGxheWVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFzTE9TID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBoYXNMT1MgPSBhY3Rvci5oYXNMT1MocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2opIHtcbiAgICAgICAgICAgIGhhc0xPUyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gYWN0b3IuaXNEZXRlY3RlZEJ5KHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9rKSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuayA9IGFjdG9yLmdldFJlbGF0aW9uc2hpcFJhbmsocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2wpIHtcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RlYWQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzRGVhZCA9IGFjdG9yLmlzRGVhZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfbSkge1xuICAgICAgICAgICAgaXNEZWFkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbmVhcmJ5TnBjcy5wdXNoKHtcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSxcbiAgICAgICAgICAgIGhlYWx0aDogaGVhbHRoLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgcmFjZTogcmFjZSxcbiAgICAgICAgICAgIGlzSG9zdGlsZTogaXNIb3N0aWxlLFxuICAgICAgICAgICAgaXNBbGx5OiBpc0FsbHksXG4gICAgICAgICAgICBpc0d1YXJkOiBpc0d1YXJkLFxuICAgICAgICAgICAgaXNNZXJjaGFudDogaXNNZXJjaGFudCxcbiAgICAgICAgICAgIGlzSW5EaWFsb2d1ZTogaXNJbkRpYWxvZ3VlLFxuICAgICAgICAgICAgaXNEZXRlY3RlZDogaXNEZXRlY3RlZCxcbiAgICAgICAgICAgIGhhc0xPUzogaGFzTE9TLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuazogcmVsYXRpb25zaGlwUmFuayxcbiAgICAgICAgICAgIGlzRGVhZDogaXNEZWFkLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5lYXJieU5wY3M7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5mdW5jdGlvbiBzYWZlTnVtYmVyKHZhbHVlLCBmYWxsYmFjaykge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7IGZhbGxiYWNrID0gMDsgfVxuICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cbmZ1bmN0aW9uIHNhZmVTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCA/IHZhbHVlIDogbnVsbDtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RIZWFkaW5nKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7IGFuZ2xlWDogMCwgYW5nbGVZOiAwLCBhbmdsZVo6IDAsIGhlYWRpbmdBbmdsZTogMCB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBhbmdsZVg6IHNhZmVOdW1iZXIocGxheWVyLmdldEFuZ2xlWCgpKSxcbiAgICAgICAgYW5nbGVZOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBbmdsZVkoKSksXG4gICAgICAgIGFuZ2xlWjogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QW5nbGVaKCkpLFxuICAgICAgICBoZWFkaW5nQW5nbGU6IHNhZmVOdW1iZXIocGxheWVyLmdldEhlYWRpbmdBbmdsZSgpKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY29sbGVjdE1vdmVtZW50KCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc1J1bm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTcHJpbnRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTd2ltbWluZzogZmFsc2UsXG4gICAgICAgICAgICBpc1NuZWFraW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzT25Nb3VudDogZmFsc2UsXG4gICAgICAgICAgICBpc092ZXJFbmN1bWJlcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNpdFN0YXRlOiAwLFxuICAgICAgICAgICAgc2xlZXBTdGF0ZTogMCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaXNSdW5uaW5nOiBwbGF5ZXIuaXNSdW5uaW5nKCksXG4gICAgICAgIGlzU3ByaW50aW5nOiBwbGF5ZXIuaXNTcHJpbnRpbmcoKSxcbiAgICAgICAgaXNTd2ltbWluZzogcGxheWVyLmlzU3dpbW1pbmcoKSxcbiAgICAgICAgaXNTbmVha2luZzogcGxheWVyLmlzU25lYWtpbmcoKSxcbiAgICAgICAgaXNPbk1vdW50OiBwbGF5ZXIuaXNPbk1vdW50KCksXG4gICAgICAgIGlzT3ZlckVuY3VtYmVyZWQ6IHBsYXllci5pc092ZXJFbmN1bWJlcmVkKCksXG4gICAgICAgIHNpdFN0YXRlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRTaXRTdGF0ZSgpKSxcbiAgICAgICAgc2xlZXBTdGF0ZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0U2xlZXBTdGF0ZSgpKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY29sbGVjdENvbWJhdCgpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNJbkNvbWJhdDogZmFsc2UsXG4gICAgICAgICAgICBjb21iYXRUYXJnZXROYW1lOiBudWxsLFxuICAgICAgICAgICAgaXNCbG9ja2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc1dlYXBvbkRyYXduOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGNvbWJhdFRhcmdldE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBwbGF5ZXIuZ2V0Q29tYmF0VGFyZ2V0KCk7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgIHZhciBiYXNlID0gdGFyZ2V0LmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgICAgIGNvbWJhdFRhcmdldE5hbWUgPSBzYWZlU3RyaW5nKGJhc2UgPT09IG51bGwgfHwgYmFzZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogYmFzZS5nZXROYW1lKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICBjb21iYXRUYXJnZXROYW1lID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGlzQmxvY2tpbmcgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBpc0Jsb2NraW5nID0gcGxheWVyLmdldEFuaW1hdGlvblZhcmlhYmxlQm9vbChcIklzQmxvY2tpbmdcIik7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBpc0Jsb2NraW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGlzSW5Db21iYXQ6IHBsYXllci5pc0luQ29tYmF0KCksXG4gICAgICAgIGNvbWJhdFRhcmdldE5hbWU6IGNvbWJhdFRhcmdldE5hbWUsXG4gICAgICAgIGlzQmxvY2tpbmc6IGlzQmxvY2tpbmcsXG4gICAgICAgIGlzV2VhcG9uRHJhd246IHBsYXllci5pc1dlYXBvbkRyYXduKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RFcXVpcG1lbnQoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdlYXBvbk5hbWU6IG51bGwsXG4gICAgICAgICAgICB3ZWFwb25TbG90OiAwLFxuICAgICAgICAgICAgYXJtb3JTbG90czoge30sXG4gICAgICAgICAgICBzaG91dE5hbWU6IG51bGwsXG4gICAgICAgICAgICBzcGVsbE5hbWU6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciB3ZWFwb25OYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgd2VhcG9uID0gcGxheWVyLmdldEVxdWlwcGVkV2VhcG9uKGZhbHNlKTtcbiAgICAgICAgd2VhcG9uTmFtZSA9IHNhZmVTdHJpbmcod2VhcG9uID09PSBudWxsIHx8IHdlYXBvbiA9PT0gdm9pZCAwID8gdm9pZCAwIDogd2VhcG9uLmdldE5hbWUoKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICB3ZWFwb25OYW1lID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHNob3V0TmFtZSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHNob3V0ID0gcGxheWVyLmdldEVxdWlwcGVkU2hvdXQoKTtcbiAgICAgICAgc2hvdXROYW1lID0gc2FmZVN0cmluZyhzaG91dCA9PT0gbnVsbCB8fCBzaG91dCA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2hvdXQuZ2V0TmFtZSgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9iKSB7XG4gICAgICAgIHNob3V0TmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzcGVsbE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzcGVsbCA9IHBsYXllci5nZXRFcXVpcHBlZFNwZWxsKDApO1xuICAgICAgICBzcGVsbE5hbWUgPSBzYWZlU3RyaW5nKHNwZWxsID09PSBudWxsIHx8IHNwZWxsID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzcGVsbC5nZXROYW1lKCkpO1xuICAgIH1cbiAgICBjYXRjaCAoX2MpIHtcbiAgICAgICAgc3BlbGxOYW1lID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2VhcG9uTmFtZTogd2VhcG9uTmFtZSxcbiAgICAgICAgd2VhcG9uU2xvdDogMCxcbiAgICAgICAgYXJtb3JTbG90czoge30sXG4gICAgICAgIHNob3V0TmFtZTogc2hvdXROYW1lLFxuICAgICAgICBzcGVsbE5hbWU6IHNwZWxsTmFtZSxcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RQbGF5ZXJGdWxsU3RhdGUoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGhlYWRpbmc6IGNvbGxlY3RIZWFkaW5nKCksXG4gICAgICAgIG1vdmVtZW50OiBjb2xsZWN0TW92ZW1lbnQoKSxcbiAgICAgICAgY29tYmF0OiBjb2xsZWN0Q29tYmF0KCksXG4gICAgICAgIGVxdWlwbWVudDogY29sbGVjdEVxdWlwbWVudCgpLFxuICAgICAgICBnb2xkQW1vdW50OiBzYWZlTnVtYmVyKHBsYXllci5nZXRHb2xkQW1vdW50KCkpLFxuICAgICAgICBjYXJyeVdlaWdodDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIkNhcnJ5V2VpZ2h0XCIpKSxcbiAgICAgICAgaW52ZW50b3J5V2VpZ2h0OiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlKFwiSW52ZW50b3J5V2VpZ2h0XCIpKSxcbiAgICAgICAgbWFnaWNrYVBlcmNlbnRhZ2U6IHNhZmVOdW1iZXIocGxheWVyLmdldEFjdG9yVmFsdWVQZXJjZW50YWdlKFwibWFnaWNrYVwiKSksXG4gICAgICAgIHN0YW1pbmFQZXJjZW50YWdlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlUGVyY2VudGFnZShcInN0YW1pbmFcIikpLFxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFF1ZXN0U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcXVlc3QgPSBHYW1lLmdldFF1ZXN0KFwiTVExMDFcIik7XG4gICAgICAgIGlmICghcXVlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmplY3RpdmVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDEwOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5ZWQgPSBxdWVzdC5pc09iamVjdGl2ZURpc3BsYXllZChpKTtcbiAgICAgICAgICAgIGlmICghZGlzcGxheWVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmplY3RpdmVzLnB1c2goe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgIGRpc3BsYXllZDogZGlzcGxheWVkLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogcXVlc3QuaXNPYmplY3RpdmVDb21wbGV0ZWQoaSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxdWVzdFdpdGhFZGl0b3JJZCA9IHF1ZXN0O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlc3ROYW1lOiAoX2EgPSBxdWVzdC5nZXROYW1lKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IG51bGwsXG4gICAgICAgICAgICBlZGl0b3JJZDogdHlwZW9mIHF1ZXN0V2l0aEVkaXRvcklkLmdldEVkaXRvcklkID09PSBcImZ1bmN0aW9uXCIgPyAoX2IgPSBxdWVzdFdpdGhFZGl0b3JJZC5nZXRFZGl0b3JJZCgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsIDogbnVsbCxcbiAgICAgICAgICAgIGN1cnJlbnRTdGFnZTogcXVlc3QuZ2V0Q3VycmVudFN0YWdlSUQoKSxcbiAgICAgICAgICAgIG9iamVjdGl2ZXM6IG9iamVjdGl2ZXNcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IGdldE9wZW5NZW51cyB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IGNvbGxlY3RDcm9zc2hhaXJUYXJnZXQgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL2Nyb3NzaGFpci1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGNvbGxlY3RFbnZpcm9ubWVudFN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9lbnZpcm9ubWVudC1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGNvbGxlY3RJbnB1dFN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9pbnB1dC1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGNvbGxlY3RMb2NhdGlvblN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9sb2NhdGlvbi1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGNvbGxlY3ROZWFyYnlOcGNzIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9uZWFyYnktY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0UGxheWVyRnVsbFN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9wbGF5ZXItY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0UXVlc3RTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvcXVlc3QtY29sbGVjdG9yXCI7XG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplU3RhdGUoc3RhdGUsIHByaW9yaXR5KSB7XG4gICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgIHByb3RvY29sVmVyc2lvbjogMSxcbiAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5LFxuICAgICAgICBzb3VyY2U6IFwic2t5Z3VpZGVcIixcbiAgICAgICAgZGF0YTogc3RhdGUsXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgIH07XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUZ1bGxTdGF0ZShldmVudFR5cGUpIHtcbiAgICBpZiAoZXZlbnRUeXBlID09PSB2b2lkIDApIHsgZXZlbnRUeXBlID0gXCJ0aWNrXCI7IH1cbiAgICB2YXIgcGxheWVyID0gbnVsbDtcbiAgICB2YXIgbmVhcmJ5TnBjcyA9IFtdO1xuICAgIHZhciBjcm9zc2hhaXJUYXJnZXQgPSBudWxsO1xuICAgIHZhciBsb2NhdGlvbiA9IG51bGw7XG4gICAgdmFyIHF1ZXN0ID0gbnVsbDtcbiAgICB2YXIgaW5wdXQgPSBudWxsO1xuICAgIHZhciBlbnZpcm9ubWVudCA9IG51bGw7XG4gICAgdmFyIG1lbnUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHBsYXllciA9IGNvbGxlY3RQbGF5ZXJGdWxsU3RhdGUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIHBsYXllciA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIG5lYXJieU5wY3MgPSBjb2xsZWN0TmVhcmJ5TnBjcygpO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgbmVhcmJ5TnBjcyA9IFtdO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjcm9zc2hhaXJUYXJnZXQgPSBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0KCk7XG4gICAgfVxuICAgIGNhdGNoIChfYykge1xuICAgICAgICBjcm9zc2hhaXJUYXJnZXQgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBsb2NhdGlvbiA9IGNvbGxlY3RMb2NhdGlvblN0YXRlKCk7XG4gICAgfVxuICAgIGNhdGNoIChfZCkge1xuICAgICAgICBsb2NhdGlvbiA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHF1ZXN0ID0gY29sbGVjdFF1ZXN0U3RhdGUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgIHF1ZXN0ID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaW5wdXQgPSBjb2xsZWN0SW5wdXRTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgaW5wdXQgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBlbnZpcm9ubWVudCA9IGNvbGxlY3RFbnZpcm9ubWVudFN0YXRlKCk7XG4gICAgfVxuICAgIGNhdGNoIChfZykge1xuICAgICAgICBlbnZpcm9ubWVudCA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIG1lbnUgPSB7XG4gICAgICAgICAgICBvcGVuTWVudXM6IEFycmF5LmZyb20oZ2V0T3Blbk1lbnVzKCkpXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfaCkge1xuICAgICAgICBtZW51ID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGZ1bGxTdGF0ZSA9IHtcbiAgICAgICAgcGxheWVyOiBwbGF5ZXIsXG4gICAgICAgIG5lYXJieU5wY3M6IG5lYXJieU5wY3MsXG4gICAgICAgIGNyb3NzaGFpclRhcmdldDogY3Jvc3NoYWlyVGFyZ2V0LFxuICAgICAgICBsb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgIHF1ZXN0OiBxdWVzdCxcbiAgICAgICAgaW5wdXQ6IGlucHV0LFxuICAgICAgICBtZW51OiBtZW51LFxuICAgICAgICBlbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgICAgIGV2ZW50VHlwZTogZXZlbnRUeXBlXG4gICAgfTtcbiAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiAxLFxuICAgICAgICBwcmlvcml0eTogXCJtZWRpdW1cIixcbiAgICAgICAgc291cmNlOiBcInNreWd1aWRlXCIsXG4gICAgICAgIGRhdGE6IGZ1bGxTdGF0ZSxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGF5bG9hZCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJ2YXIgcnVudGltZSA9IGdsb2JhbFRoaXM7XG5pZiAoIXJ1bnRpbWUuc2t5cmltUGxhdGZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NreXJpbVBsYXRmb3JtIGdsb2JhbCBpcyBub3QgYXZhaWxhYmxlJyk7XG59XG52YXIgc2t5cmltUGxhdGZvcm0gPSBydW50aW1lLnNreXJpbVBsYXRmb3JtO1xuZXhwb3J0IHZhciBvbmNlID0gc2t5cmltUGxhdGZvcm0ub25jZSwgb24gPSBza3lyaW1QbGF0Zm9ybS5vbiwgcHJpbnRDb25zb2xlID0gc2t5cmltUGxhdGZvcm0ucHJpbnRDb25zb2xlLCBEZWJ1ZyA9IHNreXJpbVBsYXRmb3JtLkRlYnVnLCBob29rcyA9IHNreXJpbVBsYXRmb3JtLmhvb2tzLCBmaW5kQ29uc29sZUNvbW1hbmQgPSBza3lyaW1QbGF0Zm9ybS5maW5kQ29uc29sZUNvbW1hbmQsIEh0dHBDbGllbnQgPSBza3lyaW1QbGF0Zm9ybS5IdHRwQ2xpZW50LCBVaSA9IHNreXJpbVBsYXRmb3JtLlVpLCBHYW1lID0gc2t5cmltUGxhdGZvcm0uR2FtZSwgSW5wdXQgPSBza3lyaW1QbGF0Zm9ybS5JbnB1dCwgRHhTY2FuQ29kZSA9IHNreXJpbVBsYXRmb3JtLkR4U2NhbkNvZGUsIFV0aWxpdHkgPSBza3lyaW1QbGF0Zm9ybS5VdGlsaXR5LCBXZWF0aGVyID0gc2t5cmltUGxhdGZvcm0uV2VhdGhlcjtcbmV4cG9ydCBkZWZhdWx0IHNreXJpbVBsYXRmb3JtO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IG9uY2UsIG9uLCBwcmludENvbnNvbGUsIERlYnVnLCBob29rcywgZmluZENvbnNvbGVDb21tYW5kIH0gZnJvbSBcIi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IHJlZ2lzdGVyQWxsRXZlbnRzIH0gZnJvbSBcIi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBzdGFydFBvbGxpbmcgfSBmcm9tIFwiLi9hY3Rpb25zL3BvbGxpbmdcIjtcbmltcG9ydCB7IHNob3VsZFNlbmQgfSBmcm9tIFwiLi9hcmJpdHJhdGlvbi9wcmlvcml0eVwiO1xuaW1wb3J0IHsgc2VyaWFsaXplRnVsbFN0YXRlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9zZXJpYWxpemVyXCI7XG5pbXBvcnQgeyBzZW5kR2FtZVN0YXRlLCBpc0Nvbm5lY3RlZCB9IGZyb20gXCIuL2NvbW11bmljYXRpb24vaHR0cC1jbGllbnRcIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBsYXN0VGlja1RpbWUgPSAwO1xudmFyIHBsYXllckFuaW1hdGlvbiA9IFwiXCI7XG52YXIgZXZlbnRzUmVnaXN0ZXJlZCA9IGZhbHNlO1xudmFyIHBvbGxpbmdTdGFydGVkID0gZmFsc2U7XG52YXIgbGFzdENvbWJhdFN0YXRlID0gMDtcbnZhciBDT0xMRUNUT1JTX0NPVU5UID0gODtcbmZ1bmN0aW9uIGJ1aWxkQXJiaXRyYXRpb25TdGF0ZShldmVudFR5cGUsIGFuaW1hdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBsYXllcjoge1xuICAgICAgICAgICAgaGVhbHRoOiAxLFxuICAgICAgICAgICAgbWF4SGVhbHRoOiAxLFxuICAgICAgICAgICAgbWFnaWNrYTogMCxcbiAgICAgICAgICAgIHN0YW1pbmE6IDAsXG4gICAgICAgICAgICBsZXZlbDogMSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IDAsIHk6IDAsIHo6IDAgfSxcbiAgICAgICAgICAgIGlzU25lYWtpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNEZWFkOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBjb21iYXRTdGF0ZTogMCxcbiAgICAgICAgZW5lbWllczogW10sXG4gICAgICAgIHBsYXllckFuaW1hdGlvbjogYW5pbWF0aW9uLFxuICAgICAgICBldmVudFR5cGU6IGV2ZW50VHlwZVxuICAgIH07XG59XG5mdW5jdGlvbiBwcm9jZXNzQW5kU2VuZChldmVudFR5cGUsIHByaW9yaXR5LCBhbmltYXRpb24pIHtcbiAgICBpZiAoYW5pbWF0aW9uID09PSB2b2lkIDApIHsgYW5pbWF0aW9uID0gXCJcIjsgfVxuICAgIHZhciBhcmJpdHJhdGlvblN0YXRlID0gYnVpbGRBcmJpdHJhdGlvblN0YXRlKGV2ZW50VHlwZSwgYW5pbWF0aW9uKTtcbiAgICBpZiAoIXNob3VsZFNlbmQocHJpb3JpdHksIGFyYml0cmF0aW9uU3RhdGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBheWxvYWQgPSBzZXJpYWxpemVGdWxsU3RhdGUoZXZlbnRUeXBlKTtcbiAgICBpZiAoIXBheWxvYWQpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gRmFpbGVkIHRvIHNlcmlhbGl6ZSBmdWxsIHN0YXRlIHBheWxvYWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZW5kR2FtZVN0YXRlKHBheWxvYWQpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gRmFpbGVkIHRvIHNlbmQgZ2FtZSBzdGF0ZTogXCIuY29uY2F0KG1zZykpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VudCBzdGF0ZTogXCIuY29uY2F0KHByaW9yaXR5LCBcIiBwcmlvcml0eSAoXCIpLmNvbmNhdChldmVudFR5cGUsIFwiKVwiKSk7XG4gICAgfVxufVxub25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgcHJpbnRDb25zb2xlKFwiU2t5R3VpZGUgcGx1Z2luIGxvYWRlZCFcIik7XG4gICAgRGVidWcubm90aWZpY2F0aW9uKFwiU2t5R3VpZGUgaXMgYWN0aXZlXCIpO1xuICAgIHJlZ2lzdGVyQWxsRXZlbnRzKCk7XG4gICAgZXZlbnRzUmVnaXN0ZXJlZCA9IHRydWU7XG4gICAgc3RhcnRQb2xsaW5nKCk7XG4gICAgcG9sbGluZ1N0YXJ0ZWQgPSBDT05GSUcucG9sbGluZ0VuYWJsZWQ7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VydmVyOiBcIi5jb25jYXQoQ09ORklHLnNlcnZlclVybCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJUaWNrIGludGVydmFsOiBcIi5jb25jYXQoQ09ORklHLnRpY2tJbnRlcnZhbCwgXCJtc1wiKSk7XG4gICAgfVxuICAgIGhvb2tzLnNlbmRBbmltYXRpb25FdmVudC5hZGQoe1xuICAgICAgICBlbnRlcjogZnVuY3Rpb24gKGN0eCkge1xuICAgICAgICAgICAgdmFyIHZhbGlkQXR0YWNrcyA9IFtcbiAgICAgICAgICAgICAgICBcImF0dGFja2xlZnRcIixcbiAgICAgICAgICAgICAgICBcImF0dGFja3JpZ2h0XCIsXG4gICAgICAgICAgICAgICAgXCJhdHRhY2traWNrXCIsXG4gICAgICAgICAgICAgICAgXCJhdHRhY2szXCIsXG4gICAgICAgICAgICAgICAgXCJhdHRhY2t0aHJvd1wiXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgdmFyIGV2ZW50TG93ZXIgPSBjdHguYW5pbUV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHZhbGlkQXR0YWNrcy5zb21lKGZ1bmN0aW9uIChhdHRhY2spIHsgcmV0dXJuIGV2ZW50TG93ZXIuaW5jbHVkZXMoYXR0YWNrKTsgfSkpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXJBbmltYXRpb24gPSBjdHguYW5pbUV2ZW50TmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgfVxuICAgIH0sIFBMQVlFUl9GT1JNX0lELCBQTEFZRVJfRk9STV9JRCArIDEsIFwiKkF0dGFjaypcIik7XG59KTtcbnZhciBza3lndWlkZUNvbW1hbmQgPSBmaW5kQ29uc29sZUNvbW1hbmQoXCJza3lndWlkZVwiKTtcbmlmIChza3lndWlkZUNvbW1hbmQpIHtcbiAgICBza3lndWlkZUNvbW1hbmQuZXhlY3V0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2t5R3VpZGUgU3RhdHVzOlwiKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb25uZWN0ZWQ6IFwiLmNvbmNhdChpc0Nvbm5lY3RlZCgpKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgUG9sbGluZyBzdGF0dXM6IFwiLmNvbmNhdChwb2xsaW5nU3RhcnRlZCA/IFwiYWN0aXZlXCIgOiBcImluYWN0aXZlXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBFdmVudHMgcmVnaXN0ZXJlZDogXCIuY29uY2F0KGV2ZW50c1JlZ2lzdGVyZWQgPyBcInllcyAoMjgpXCIgOiBcIm5vXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb2xsZWN0b3JzIGNvdW50OiBcIi5jb25jYXQoQ09MTEVDVE9SU19DT1VOVCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFNlcnZlcjogXCIuY29uY2F0KENPTkZJRy5zZXJ2ZXJVcmwpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBUaWNrIGludGVydmFsOiBcIi5jb25jYXQoQ09ORklHLnRpY2tJbnRlcnZhbCwgXCJtc1wiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgRGVidWcgbW9kZTogXCIuY29uY2F0KENPTkZJRy5kZWJ1Z01vZGUpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbn1cbm9uKFwidGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFpc0Nvbm5lY3RlZCgpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKG5vdyAtIGxhc3RUaWNrVGltZSA8IENPTkZJRy50aWNrSW50ZXJ2YWwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsYXN0VGlja1RpbWUgPSBub3c7XG4gICAgdmFyIGFuaW1hdGlvbiA9IHBsYXllckFuaW1hdGlvbjtcbiAgICBwbGF5ZXJBbmltYXRpb24gPSBcIlwiO1xuICAgIHByb2Nlc3NBbmRTZW5kKFwidGlja1wiLCBcImxvd1wiLCBhbmltYXRpb24pO1xufSk7XG5vbihcImNvbWJhdFN0YXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBhY3RvciA9IGV2ZW50LmFjdG9yLmdldEZvcm1JRCgpO1xuICAgIGlmIChhY3RvciAhPT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgbmV3U3RhdGUgPSBldmVudC5pc0NvbWJhdCA/IDEgOiBldmVudC5pc1NlYXJjaGluZyA/IDIgOiAwO1xuICAgIHZhciBvbGRTdGF0ZSA9IGxhc3RDb21iYXRTdGF0ZTtcbiAgICBsYXN0Q29tYmF0U3RhdGUgPSBuZXdTdGF0ZTtcbiAgICBwcm9jZXNzQW5kU2VuZChcImNvbWJhdFN0YXRlX1wiLmNvbmNhdChuZXdTdGF0ZSksIFwiaGlnaFwiKTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJDb21iYXQgc3RhdGUgY2hhbmdlZDogXCIuY29uY2F0KG9sZFN0YXRlLCBcIiAtPiBcIikuY29uY2F0KG5ld1N0YXRlKSk7XG4gICAgfVxufSk7XG5vbihcImhpdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgX2E7XG4gICAgdmFyIHRhcmdldCA9IGV2ZW50LnRhcmdldC5nZXRGb3JtSUQoKTtcbiAgICB2YXIgc291cmNlID0gZXZlbnQuYWdncmVzc29yLmdldEZvcm1JRCgpO1xuICAgIHZhciBzb3VyY2VCYXNlRm9ybSA9IChfYSA9IGV2ZW50LnNvdXJjZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpO1xuICAgIGlmICh0YXJnZXQgIT09IFBMQVlFUl9GT1JNX0lEICYmIHNvdXJjZSAhPT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpXG4gICAgICAgIHJldHVybjtcbiAgICBwcm9jZXNzQW5kU2VuZChcImhpdFwiLCBcImhpZ2hcIik7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiSGl0IGV2ZW50OiB0YXJnZXQ9XCIuY29uY2F0KHRhcmdldCwgXCIsIHNvdXJjZT1cIikuY29uY2F0KHNvdXJjZSwgXCIsIHNvdXJjZUZvcm09XCIpLmNvbmNhdChTdHJpbmcoc291cmNlQmFzZUZvcm0pKSk7XG4gICAgfVxufSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=