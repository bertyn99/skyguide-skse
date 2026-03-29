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
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


function logDebug(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[actions/executor] ".concat(message));
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
    var form = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getFormEx(formId);
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
    if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen("Loading Menu")) {
        logDebug("Action blocked: Loading Menu is open");
        return true;
    }
    if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen("MessageBoxMenu")) {
        logDebug("Action blocked: MessageBoxMenu is open");
        return true;
    }
    return false;
}
function getClosestReference(x, y, z, radius) {
    var _a, _b;
    var gameWithClosestReference = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game;
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
            _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.releaseKey(42 /* DxScanCode.LeftShift */);
        }, delayMs);
        return;
    }
    // @ts-ignore
    _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.releaseKey(42 /* DxScanCode.LeftShift */);
}
function executeAction(action) {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player) {
        logDebug("Action blocked: player is null");
        return false;
    }
    var playerForm = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getFormEx(_config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID);
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
                var crosshairRef_1 = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getCurrentCrosshairRef();
                if (!isValidReference(crosshairRef_1)) {
                    logDebug("Activate blocked: invalid crosshair reference");
                    return false;
                }
                return executeSafely(action.type, function () {
                    crosshairRef_1.activate(player);
                });
            }
            if (action.target === "nearestNPC") {
                var nearestNpc_1 = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.findClosestActor(x, y, z, 2000);
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
            _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Debug.notification("Fast travel not supported via API");
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
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.tapKey(57);
            });
        }
        case "block": {
            return executeSafely(action.type, function () {
                // @ts-ignore
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.holdKey(42);
                releaseBlockAfterDelay(500);
            });
        }
        case "equip": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Debug.notification("Equip: ".concat(action.itemName));
            });
        }
        case "useItem": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Debug.notification("Use item: ".concat(action.itemName));
            });
        }
        case "heal": {
            return executeSafely(action.type, function () {
                player.restoreActorValue("health", action.amount);
            });
        }
        case "saveGame": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.saveGame(action.name);
            });
        }
        case "notification": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Debug.notification(action.message);
            });
        }
        case "forceThirdPerson": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.forceThirdPerson();
            });
        }
        case "forceFirstPerson": {
            return executeSafely(action.type, function () {
                _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.forceFirstPerson();
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
/* harmony import */ var _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @skyrim-platform/skyrim-platform */ "@skyrim-platform/skyrim-platform");
/* harmony import */ var _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parser */ "./src/actions/parser.ts");
/* harmony import */ var _executor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./executor */ "./src/actions/executor.ts");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};




var INITIAL_BACKOFF_MS = 1000;
var pollingClient = null;
var backoffMs = INITIAL_BACKOFF_MS;
var consecutiveFailures = 0;
var pollingActive = false;
var pollTimerId = null;
function logDebug(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__.printConsole("[SkyGuide] ".concat(message));
    }
}
function pollForActions() {
    return __awaiter(this, void 0, void 0, function () {
        var response, parsed, actions, _i, actions_1, raw, action, err_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!pollingClient || !pollingActive)
                        return [2 /*return*/];
                    if (_skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen("Loading Menu")) {
                        logDebug("Loading screen open — skipping action poll");
                        scheduleNextPoll();
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, pollingClient.get(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingEndpoint)];
                case 2:
                    response = _a.sent();
                    if (response.status === 200) {
                        consecutiveFailures = 0;
                        backoffMs = INITIAL_BACKOFF_MS;
                        parsed = void 0;
                        try {
                            parsed = JSON.parse(response.body);
                        }
                        catch (_b) {
                            logDebug("Failed to parse action response body as JSON");
                            scheduleNextPoll();
                            return [2 /*return*/];
                        }
                        actions = Array.isArray(parsed) ? parsed : [parsed];
                        for (_i = 0, actions_1 = actions; _i < actions_1.length; _i++) {
                            raw = actions_1[_i];
                            action = (0,_parser__WEBPACK_IMPORTED_MODULE_2__.parseAction)(raw);
                            if (action !== null) {
                                (0,_executor__WEBPACK_IMPORTED_MODULE_3__.executeAction)(action);
                            }
                        }
                    }
                    else {
                        handleFailure("HTTP ".concat(response.status));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    msg = err_1 instanceof Error ? err_1.message : String(err_1);
                    handleFailure(msg);
                    return [3 /*break*/, 4];
                case 4:
                    scheduleNextPoll();
                    return [2 /*return*/];
            }
        });
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
    pollingClient = new _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__.HttpClient(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.serverUrl);
    pollingActive = true;
    backoffMs = INITIAL_BACKOFF_MS;
    consecutiveFailures = 0;
    logDebug("Starting action polling");
    _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__.once("update", function () {
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
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (undefined && undefined.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};


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
        return __awaiter(this, void 0, void 0, function () {
            var response, err_1, msg;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resetRateLimit();
                        if (sendCount >= MAX_SENDS_PER_SEC) {
                            if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Rate limit exceeded");
                            }
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.post("/api/game-state", {
                                body: payload,
                                contentType: "application/json"
                            })];
                    case 2:
                        response = _a.sent();
                        sendCount++;
                        if (response.status >= 200 && response.status < 300) {
                            this.failureCount = 0;
                            return [2 /*return*/, true];
                        }
                        else {
                            if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] HTTP ".concat(response.status, ": request rejected by server"));
                            }
                            this.lastFailureTime = Date.now();
                            this.failureCount++;
                            return [2 /*return*/, false];
                        }
                        // removed by dead control flow

                    case 3:
                        err_1 = _a.sent();
                        msg = err_1 instanceof Error ? err_1.message : String(err_1);
                        if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
                            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] HTTP POST /api/game-state failed: ".concat(msg));
                        }
                        this.lastFailureTime = Date.now();
                        this.failureCount++;
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
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
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, httpClient.sendGameState(payload)];
        });
    });
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
        headingAngle: safeNumber(player.getHeadingAngle(null)),
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
/* harmony export */   ObjectReference: () => (/* binding */ ObjectReference),
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
var once = skyrimPlatform.once, on = skyrimPlatform.on, printConsole = skyrimPlatform.printConsole, Debug = skyrimPlatform.Debug, hooks = skyrimPlatform.hooks, findConsoleCommand = skyrimPlatform.findConsoleCommand, ObjectReference = skyrimPlatform.ObjectReference, HttpClient = skyrimPlatform.HttpClient, Ui = skyrimPlatform.Ui, Game = skyrimPlatform.Game, Input = skyrimPlatform.Input, DxScanCode = skyrimPlatform.DxScanCode, Utility = skyrimPlatform.Utility, Weather = skyrimPlatform.Weather;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (skyrimPlatform);


/***/ },

/***/ "@skyrim-platform/skyrim-platform"
/*!***********************************!*\
  !*** external ["skyrimPlatform"] ***!
  \***********************************/
(module) {

module.exports = skyrimPlatform;

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
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
var isLoaded = false;
function init() {
    if (isLoaded)
        return;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide plugin loaded!");
    // Debug.notification("SkyGuide is active");
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
    }, _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID, _config__WEBPACK_IMPORTED_MODULE_6__.PLAYER_FORM_ID + 1, "Attack*");
    isLoaded = true;
}
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
    init();
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
    init();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDb0Q7QUFDbEI7QUFDbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSwyQ0FBTTtBQUNkLFFBQVEsNkRBQVk7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0EsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ04sNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOzs7Ozs7Ozs7Ozs7Ozs7OztBQ2hR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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDMUo0QztBQUM1QztBQUNBLCtCQUErQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsaURBQUk7QUFDckI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLGlEQUFJO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixpREFBSTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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MkNBQU07QUFDL0MsUUFBUSw2REFBWSw0QkFBNEIsMkNBQU07QUFDdEQsUUFBUSw2REFBWSx5QkFBeUIsMkNBQU07QUFDbkQ7QUFDQTtBQUNBO0FBQ0EsbURBQUU7QUFDRjtBQUNBLFNBQVMsdUVBQVc7QUFDcEI7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLDJDQUFNO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0Esa0JBQWtCLG1EQUFjO0FBQ2hDO0FBQ0EsU0FBUyx1RUFBVztBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBUSwyQ0FBTTtBQUNkLFFBQVEsNkRBQVk7QUFDcEI7QUFDQSxDQUFDO0FBQ0QsbURBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1CQUFtQixtREFBYyxlQUFlLG1EQUFjO0FBQzlEO0FBQ0EsU0FBUyx1RUFBVztBQUNwQjtBQUNBO0FBQ0EsUUFBUSwyQ0FBTTtBQUNkLFFBQVEsNkRBQVk7QUFDcEI7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2FjdGlvbnMvZXhlY3V0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2FjdGlvbnMvcGFyc2VyLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL3BvbGxpbmcudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2FyYml0cmF0aW9uL3ByaW9yaXR5LnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9jb21tdW5pY2F0aW9uL2h0dHAtY2xpZW50LnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9jb25maWcudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2V2ZW50cy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2Nyb3NzaGFpci1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9lbnZpcm9ubWVudC1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9pbnB1dC1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9sb2NhdGlvbi1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9uZWFyYnktY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvcGxheWVyLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL3F1ZXN0LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9zZXJpYWxpemVyLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9za3lyaW1QbGF0Zm9ybS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vZXh0ZXJuYWwgdmFyIFtcInNreXJpbVBsYXRmb3JtXCJdIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcsIER4U2NhbkNvZGUsIEdhbWUsIElucHV0LCBVaSwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuZnVuY3Rpb24gbG9nRGVidWcobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlthY3Rpb25zL2V4ZWN1dG9yXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzVmFsaWRGb3JtKGZvcm0pIHtcbiAgICBpZiAoZm9ybSA9PT0gbnVsbCB8fCBmb3JtID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGZvcm0gIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY2FuZGlkYXRlID0gZm9ybTtcbiAgICB2YXIgZGVsZXRlZCA9IHR5cGVvZiBjYW5kaWRhdGUuaXNEZWxldGVkID09PSBcImZ1bmN0aW9uXCIgPyBjYW5kaWRhdGUuaXNEZWxldGVkKCkgOiBmYWxzZTtcbiAgICB2YXIgZGlzYWJsZWQgPSB0eXBlb2YgY2FuZGlkYXRlLmlzRGlzYWJsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGNhbmRpZGF0ZS5pc0Rpc2FibGVkKCkgOiBmYWxzZTtcbiAgICByZXR1cm4gIWRlbGV0ZWQgJiYgIWRpc2FibGVkO1xufVxuZnVuY3Rpb24gZ2V0UmVmZXJlbmNlRm9ybUlkKHJlZikge1xuICAgIGlmIChyZWYgPT09IG51bGwgfHwgcmVmID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlZiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGNhbmRpZGF0ZSA9IHJlZjtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5nZXRGb3JtSUQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgaWQgPSBjYW5kaWRhdGUuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlLmdldEZvcm1JZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBpZCA9IGNhbmRpZGF0ZS5nZXRGb3JtSWQoKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBpc1ZhbGlkUmVmZXJlbmNlKHJlZikge1xuICAgIGlmIChyZWYgPT09IG51bGwgfHwgcmVmID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHJlZiAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBjYW5kaWRhdGUgPSByZWY7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuYWN0aXZhdGUgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmb3JtSWQgPSBnZXRSZWZlcmVuY2VGb3JtSWQocmVmKTtcbiAgICBpZiAoZm9ybUlkID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGZvcm0gPSBHYW1lLmdldEZvcm1FeChmb3JtSWQpO1xuICAgIHJldHVybiBpc1ZhbGlkRm9ybShmb3JtKTtcbn1cbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKHBsYXllcikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHBsYXllci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgeTogcGxheWVyLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICB6OiBwbGF5ZXIuZ2V0UG9zaXRpb25aKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSB7XG4gICAgaWYgKFVpLmlzTWVudU9wZW4oXCJMb2FkaW5nIE1lbnVcIikpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogTG9hZGluZyBNZW51IGlzIG9wZW5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoVWkuaXNNZW51T3BlbihcIk1lc3NhZ2VCb3hNZW51XCIpKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiQWN0aW9uIGJsb2NrZWQ6IE1lc3NhZ2VCb3hNZW51IGlzIG9wZW5cIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiBnZXRDbG9zZXN0UmVmZXJlbmNlKHgsIHksIHosIHJhZGl1cykge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIGdhbWVXaXRoQ2xvc2VzdFJlZmVyZW5jZSA9IEdhbWU7XG4gICAgcmV0dXJuIChfYiA9IChfYSA9IGdhbWVXaXRoQ2xvc2VzdFJlZmVyZW5jZS5maW5kQ2xvc2VzdFJlZmVyZW5jZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNhbGwoZ2FtZVdpdGhDbG9zZXN0UmVmZXJlbmNlLCB4LCB5LCB6LCByYWRpdXMpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xufVxuZnVuY3Rpb24gZXhlY3V0ZVNhZmVseShhY3Rpb25UeXBlLCBvcGVyYXRpb24pIHtcbiAgICB0cnkge1xuICAgICAgICBvcGVyYXRpb24oKTtcbiAgICAgICAgbG9nRGVidWcoXCJFeGVjdXRlZCBhY3Rpb246IFwiLmNvbmNhdChhY3Rpb25UeXBlKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gZmFpbGVkOiBcIi5jb25jYXQoYWN0aW9uVHlwZSwgXCIgKFwiKS5jb25jYXQoU3RyaW5nKGVycm9yKSwgXCIpXCIpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoZGVsYXlNcykge1xuICAgIHZhciBydW50aW1lVGltZXJzID0gZ2xvYmFsVGhpcztcbiAgICBpZiAodHlwZW9mIHJ1bnRpbWVUaW1lcnMuc2V0VGltZW91dCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJ1bnRpbWVUaW1lcnMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBJbnB1dC5yZWxlYXNlS2V5KDQyIC8qIER4U2NhbkNvZGUuTGVmdFNoaWZ0ICovKTtcbiAgICAgICAgfSwgZGVsYXlNcyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIElucHV0LnJlbGVhc2VLZXkoNDIgLyogRHhTY2FuQ29kZS5MZWZ0U2hpZnQgKi8pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogcGxheWVyIGlzIG51bGxcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIHBsYXllckZvcm0gPSBHYW1lLmdldEZvcm1FeChQTEFZRVJfRk9STV9JRCk7XG4gICAgaWYgKCFpc1ZhbGlkRm9ybShwbGF5ZXJGb3JtKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBwbGF5ZXIgZm9ybSBpbnZhbGlkL2RlbGV0ZWQvZGlzYWJsZWRcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2V0UG9zaXRpb24oYWN0aW9uLngsIGFjdGlvbi55LCBhY3Rpb24ueik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFjZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zZXRBbmdsZSgwLCAwLCBhY3Rpb24uYW5nbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGl2YXRlXCI6IHtcbiAgICAgICAgICAgIHZhciBfYSA9IGdldFBsYXllclBvc2l0aW9uKHBsYXllciksIHggPSBfYS54LCB5ID0gX2EueSwgeiA9IF9hLno7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnRhcmdldCA9PT0gXCJjcm9zc2hhaXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBjcm9zc2hhaXJSZWZfMSA9IEdhbWUuZ2V0Q3VycmVudENyb3NzaGFpclJlZigpO1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZFJlZmVyZW5jZShjcm9zc2hhaXJSZWZfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBpbnZhbGlkIGNyb3NzaGFpciByZWZlcmVuY2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Jvc3NoYWlyUmVmXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3ROUENcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZWFyZXN0TnBjXzEgPSBHYW1lLmZpbmRDbG9zZXN0QWN0b3IoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3ROcGNfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBubyB2YWxpZCBuZWFyZXN0IE5QQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0TnBjXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3REb29yXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVhcmVzdERvb3JfMSA9IGdldENsb3Nlc3RSZWZlcmVuY2UoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3REb29yXzEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBkb29yXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3REb29yXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZWFyZXN0Q29udGFpbmVyXzEgPSBnZXRDbG9zZXN0UmVmZXJlbmNlKHgsIHksIHosIDIwMDApO1xuICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3RDb250YWluZXJfMSkpIHtcbiAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkFjdGl2YXRlIGJsb2NrZWQ6IG5vIHZhbGlkIG5lYXJlc3QgY29udGFpbmVyXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmVhcmVzdENvbnRhaW5lcl8xLmFjdGl2YXRlKHBsYXllcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFzdFRyYXZlbFwiOiB7XG4gICAgICAgICAgICBEZWJ1Zy5ub3RpZmljYXRpb24oXCJGYXN0IHRyYXZlbCBub3Qgc3VwcG9ydGVkIHZpYSBBUElcIik7XG4gICAgICAgICAgICBsb2dEZWJ1ZyhcIkZhc3QgdHJhdmVsIGJsb2NrZWQgZm9yIGxvY2F0aW9uOiBcIi5jb25jYXQoYWN0aW9uLmxvY2F0aW9uKSk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRyYXdXZWFwb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuZHJhd1dlYXBvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNoZWF0aGVXZWFwb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2hlYXRoZVdlYXBvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImF0dGFja1wiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBJbnB1dC50YXBLZXkoNTcpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImJsb2NrXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIElucHV0LmhvbGRLZXkoNDIpO1xuICAgICAgICAgICAgICAgIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoNTAwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlcXVpcFwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIkVxdWlwOiBcIi5jb25jYXQoYWN0aW9uLml0ZW1OYW1lKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwidXNlSXRlbVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIlVzZSBpdGVtOiBcIi5jb25jYXQoYWN0aW9uLml0ZW1OYW1lKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaGVhbFwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5yZXN0b3JlQWN0b3JWYWx1ZShcImhlYWx0aFwiLCBhY3Rpb24uYW1vdW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzYXZlR2FtZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuc2F2ZUdhbWUoYWN0aW9uLm5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihhY3Rpb24ubWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZm9yY2VUaGlyZFBlcnNvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuZm9yY2VUaGlyZFBlcnNvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBHYW1lLmZvcmNlRmlyc3RQZXJzb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwidmFyIEFDVElPTl9UWVBFUyA9IG5ldyBTZXQoW1xuICAgIFwibW92ZVwiLFxuICAgIFwiZmFjZVwiLFxuICAgIFwiYWN0aXZhdGVcIixcbiAgICBcImZhc3RUcmF2ZWxcIixcbiAgICBcImRyYXdXZWFwb25cIixcbiAgICBcInNoZWF0aGVXZWFwb25cIixcbiAgICBcImF0dGFja1wiLFxuICAgIFwiYmxvY2tcIixcbiAgICBcImVxdWlwXCIsXG4gICAgXCJ1c2VJdGVtXCIsXG4gICAgXCJoZWFsXCIsXG4gICAgXCJzYXZlR2FtZVwiLFxuICAgIFwibm90aWZpY2F0aW9uXCIsXG4gICAgXCJmb3JjZVRoaXJkUGVyc29uXCIsXG4gICAgXCJmb3JjZUZpcnN0UGVyc29uXCIsXG5dKTtcbnZhciBBQ1RJVkFURV9UQVJHRVRTID0gbmV3IFNldChbXG4gICAgXCJjcm9zc2hhaXJcIixcbiAgICBcIm5lYXJlc3ROUENcIixcbiAgICBcIm5lYXJlc3REb29yXCIsXG4gICAgXCJuZWFyZXN0Q29udGFpbmVyXCIsXG5dKTtcbmZ1bmN0aW9uIGlzQWN0aXZhdGVUYXJnZXQodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiICYmIEFDVElWQVRFX1RBUkdFVFMuaGFzKHZhbHVlKTtcbn1cbmZ1bmN0aW9uIGlzUmVjb3JkKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGlvbihyYXcpIHtcbiAgICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBhY3Rpb25UeXBlID0gcmF3LnR5cGU7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25UeXBlICE9PSBcInN0cmluZ1wiIHx8ICFBQ1RJT05fVFlQRVMuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgdmFyIHggPSByYXcueCwgeSA9IHJhdy55LCB6ID0gcmF3Lno7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHggIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHkgIT09IFwibnVtYmVyXCIgfHwgdHlwZW9mIHogIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibW92ZVwiLCB4OiB4LCB5OiB5LCB6OiB6IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhY2VcIjoge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gcmF3LmFuZ2xlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhbmdsZSAhPT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYWNlXCIsIGFuZ2xlOiBhbmdsZSB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhY3RpdmF0ZVwiOiB7XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gcmF3LnRhcmdldDtcbiAgICAgICAgICAgIGlmICghaXNBY3RpdmF0ZVRhcmdldCh0YXJnZXQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImFjdGl2YXRlXCIsIHRhcmdldDogdGFyZ2V0IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhc3RUcmF2ZWxcIjoge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gcmF3LmxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJmYXN0VHJhdmVsXCIsIGxvY2F0aW9uOiBsb2NhdGlvbiB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJlcXVpcFwiOlxuICAgICAgICBjYXNlIFwidXNlSXRlbVwiOiB7XG4gICAgICAgICAgICB2YXIgaXRlbU5hbWUgPSByYXcuaXRlbU5hbWU7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW1OYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBhY3Rpb25UeXBlLCBpdGVtTmFtZTogaXRlbU5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaGVhbFwiOiB7XG4gICAgICAgICAgICB2YXIgYW1vdW50ID0gcmF3LmFtb3VudDtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYW1vdW50ICE9PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImhlYWxcIiwgYW1vdW50OiBhbW91bnQgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2F2ZUdhbWVcIjoge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSByYXcubmFtZTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJzYXZlR2FtZVwiLCBuYW1lOiBuYW1lIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcIm5vdGlmaWNhdGlvblwiOiB7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHJhdy5tZXNzYWdlO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIm5vdGlmaWNhdGlvblwiLCBtZXNzYWdlOiBtZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRyYXdXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcInNoZWF0aGVXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcImF0dGFja1wiOlxuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgY2FzZSBcImZvcmNlVGhpcmRQZXJzb25cIjpcbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjpcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGFjdGlvblR5cGUgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZEFjdGlvbihhY3Rpb24pIHtcbiAgICB2b2lkIGFjdGlvbjtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9fZ2VuZXJhdG9yID0gKHRoaXMgJiYgdGhpcy5fX2dlbmVyYXRvcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIGJvZHkpIHtcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnID0gT2JqZWN0LmNyZWF0ZSgodHlwZW9mIEl0ZXJhdG9yID09PSBcImZ1bmN0aW9uXCIgPyBJdGVyYXRvciA6IE9iamVjdCkucHJvdG90eXBlKTtcbiAgICByZXR1cm4gZy5uZXh0ID0gdmVyYigwKSwgZ1tcInRocm93XCJdID0gdmVyYigxKSwgZ1tcInJldHVyblwiXSA9IHZlcmIoMiksIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcbiAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHtcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cbn07XG5pbXBvcnQgKiBhcyBTa1QgZnJvbSAnQHNreXJpbS1wbGF0Zm9ybS9za3lyaW0tcGxhdGZvcm0nO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgcGFyc2VBY3Rpb24gfSBmcm9tIFwiLi9wYXJzZXJcIjtcbmltcG9ydCB7IGV4ZWN1dGVBY3Rpb24gfSBmcm9tIFwiLi9leGVjdXRvclwiO1xudmFyIElOSVRJQUxfQkFDS09GRl9NUyA9IDEwMDA7XG52YXIgcG9sbGluZ0NsaWVudCA9IG51bGw7XG52YXIgYmFja29mZk1zID0gSU5JVElBTF9CQUNLT0ZGX01TO1xudmFyIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xudmFyIHBvbGxpbmdBY3RpdmUgPSBmYWxzZTtcbnZhciBwb2xsVGltZXJJZCA9IG51bGw7XG5mdW5jdGlvbiBsb2dEZWJ1ZyhtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgU2tULnByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwb2xsRm9yQWN0aW9ucygpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByZXNwb25zZSwgcGFyc2VkLCBhY3Rpb25zLCBfaSwgYWN0aW9uc18xLCByYXcsIGFjdGlvbiwgZXJyXzEsIG1zZztcbiAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwb2xsaW5nQ2xpZW50IHx8ICFwb2xsaW5nQWN0aXZlKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgICAgICAgICBpZiAoU2tULlVpLmlzTWVudU9wZW4oXCJMb2FkaW5nIE1lbnVcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiTG9hZGluZyBzY3JlZW4gb3BlbiDigJQgc2tpcHBpbmcgYWN0aW9uIHBvbGxcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZU5leHRQb2xsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgX2EubGFiZWwgPSAxO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgX2EudHJ5cy5wdXNoKFsxLCAzLCAsIDRdKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0IC8qeWllbGQqLywgcG9sbGluZ0NsaWVudC5nZXQoQ09ORklHLnBvbGxpbmdFbmRwb2ludCldO1xuICAgICAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrb2ZmTXMgPSBJTklUSUFMX0JBQ0tPRkZfTVM7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWQgPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZCA9IEpTT04ucGFyc2UocmVzcG9uc2UuYm9keSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkZhaWxlZCB0byBwYXJzZSBhY3Rpb24gcmVzcG9uc2UgYm9keSBhcyBKU09OXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlTmV4dFBvbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb25zID0gQXJyYXkuaXNBcnJheShwYXJzZWQpID8gcGFyc2VkIDogW3BhcnNlZF07XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKF9pID0gMCwgYWN0aW9uc18xID0gYWN0aW9uczsgX2kgPCBhY3Rpb25zXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3ID0gYWN0aW9uc18xW19pXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBwYXJzZUFjdGlvbihyYXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZUFjdGlvbihhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUZhaWx1cmUoXCJIVFRQIFwiLmNvbmNhdChyZXNwb25zZS5zdGF0dXMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCA0XTtcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIGVycl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBlcnJfMSBpbnN0YW5jZW9mIEVycm9yID8gZXJyXzEubWVzc2FnZSA6IFN0cmluZyhlcnJfMSk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUZhaWx1cmUobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZU5leHRQb2xsKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBoYW5kbGVGYWlsdXJlKHJlYXNvbikge1xuICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMrKztcbiAgICBsb2dEZWJ1ZyhcIlBvbGwgZmFpbGVkIChcIi5jb25jYXQoY29uc2VjdXRpdmVGYWlsdXJlcywgXCIvXCIpLmNvbmNhdChDT05GSUcubWF4UG9sbGluZ1JldHJpZXMsIFwiKTogXCIpLmNvbmNhdChyZWFzb24pKTtcbiAgICBpZiAoY29uc2VjdXRpdmVGYWlsdXJlcyA+PSBDT05GSUcubWF4UG9sbGluZ1JldHJpZXMpIHtcbiAgICAgICAgbG9nRGVidWcoXCJNYXggcmV0cmllcyByZWFjaGVkIFxcdTIwMTQgcGF1c2luZyBmb3IgXCIuY29uY2F0KENPTkZJRy5wb2xsaW5nTWF4QmFja29mZiwgXCJtc1wiKSk7XG4gICAgICAgIGJhY2tvZmZNcyA9IENPTkZJRy5wb2xsaW5nTWF4QmFja29mZjtcbiAgICAgICAgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBiYWNrb2ZmTXMgPSBNYXRoLm1pbihiYWNrb2ZmTXMgKiAyLCBDT05GSUcucG9sbGluZ01heEJhY2tvZmYpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNjaGVkdWxlTmV4dFBvbGwoKSB7XG4gICAgaWYgKCFwb2xsaW5nQWN0aXZlKVxuICAgICAgICByZXR1cm47XG4gICAgcG9sbFRpbWVySWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9sbFRpbWVySWQgPSBudWxsO1xuICAgICAgICBwb2xsRm9yQWN0aW9ucygpO1xuICAgIH0sIGJhY2tvZmZNcyk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3RhcnRQb2xsaW5nKCkge1xuICAgIGlmICghQ09ORklHLnBvbGxpbmdFbmFibGVkKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiUG9sbGluZyBkaXNhYmxlZCBieSBjb25maWdcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHBvbGxpbmdBY3RpdmUpIHtcbiAgICAgICAgbG9nRGVidWcoXCJQb2xsaW5nIGFscmVhZHkgYWN0aXZlXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHBvbGxpbmdDbGllbnQgPSBuZXcgU2tULkh0dHBDbGllbnQoQ09ORklHLnNlcnZlclVybCk7XG4gICAgcG9sbGluZ0FjdGl2ZSA9IHRydWU7XG4gICAgYmFja29mZk1zID0gSU5JVElBTF9CQUNLT0ZGX01TO1xuICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgIGxvZ0RlYnVnKFwiU3RhcnRpbmcgYWN0aW9uIHBvbGxpbmdcIik7XG4gICAgU2tULm9uY2UoXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICBwb2xsRm9yQWN0aW9ucygpO1xuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHN0b3BQb2xsaW5nKCkge1xuICAgIHBvbGxpbmdBY3RpdmUgPSBmYWxzZTtcbiAgICBpZiAocG9sbFRpbWVySWQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHBvbGxUaW1lcklkKTtcbiAgICAgICAgcG9sbFRpbWVySWQgPSBudWxsO1xuICAgIH1cbiAgICBwb2xsaW5nQ2xpZW50ID0gbnVsbDtcbiAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBwb2xsaW5nIHN0b3BwZWRcIik7XG59XG4iLCJ2YXIgbGFzdFN0YXRlID0gbnVsbDtcbnZhciBsYXN0U2VuZFRpbWVzID0ge1xuICAgIGNyaXRpY2FsOiAwLFxuICAgIGhpZ2g6IDAsXG4gICAgbWVkaXVtOiAwLFxuICAgIGxvdzogMCxcbiAgICBzdXBwcmVzc2VkOiAwXG59O1xudmFyIHJhdGVMaW1pdHMgPSB7XG4gICAgY3JpdGljYWw6IDIwMCxcbiAgICBoaWdoOiA1MDAsXG4gICAgbWVkaXVtOiAxMDAwLFxuICAgIGxvdzogMjAwMCxcbiAgICBzdXBwcmVzc2VkOiA1MDAwXG59O1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3RhdGVVbmNoYW5nZWQobmV3U3RhdGUpIHtcbiAgICBpZiAoIWxhc3RTdGF0ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuZXdTdGF0ZS5ldmVudFR5cGUgIT09IFwidGlja1wiKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5ld1N0YXRlLmNvbWJhdFN0YXRlICE9PSBsYXN0U3RhdGUuY29tYmF0U3RhdGUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmV3U3RhdGUuZW5lbWllcy5sZW5ndGggIT09IGxhc3RTdGF0ZS5lbmVtaWVzLmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBwbGF5ZXJDaGFuZ2VkID0gbmV3U3RhdGUucGxheWVyLmhlYWx0aCAhPT0gbGFzdFN0YXRlLnBsYXllci5oZWFsdGggfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLnBvc2l0aW9uLnggIT09IGxhc3RTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueCB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueSAhPT0gbGFzdFN0YXRlLnBsYXllci5wb3NpdGlvbi55IHx8XG4gICAgICAgIG5ld1N0YXRlLnBsYXllci5wb3NpdGlvbi56ICE9PSBsYXN0U3RhdGUucGxheWVyLnBvc2l0aW9uLnogfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLmlzU25lYWtpbmcgIT09IGxhc3RTdGF0ZS5wbGF5ZXIuaXNTbmVha2luZztcbiAgICByZXR1cm4gIXBsYXllckNoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZXZhbHVhdGVQcmlvcml0eShzdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5wbGF5ZXIuaXNEZWFkKSB7XG4gICAgICAgIHJldHVybiBcImNyaXRpY2FsXCI7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5wbGF5ZXIuaGVhbHRoIDwgc3RhdGUucGxheWVyLm1heEhlYWx0aCAqIDAuMjUpIHtcbiAgICAgICAgcmV0dXJuIFwiY3JpdGljYWxcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmV2ZW50VHlwZSA9PT0gXCJoaXRcIikge1xuICAgICAgICByZXR1cm4gXCJoaWdoXCI7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5jb21iYXRTdGF0ZSA9PT0gMSkge1xuICAgICAgICBpZiAoc3RhdGUuZW5lbWllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgY2xvc2VzdEVuZW15ID0gc3RhdGUuZW5lbWllc1swXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc3RhdGUuZW5lbWllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5lbmVtaWVzW2ldLmRpc3RhbmNlIDwgY2xvc2VzdEVuZW15LmRpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb3Nlc3RFbmVteSA9IHN0YXRlLmVuZW1pZXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNsb3Nlc3RFbmVteS5kaXN0YW5jZSA8IDUwMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImhpZ2hcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJtZWRpdW1cIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmV2ZW50VHlwZSAhPT0gXCJ0aWNrXCIpIHtcbiAgICAgICAgcmV0dXJuIFwibWVkaXVtXCI7XG4gICAgfVxuICAgIC8vIFN1cHByZXNzIGlmIG5vdGhpbmcgaW50ZXJlc3RpbmcgaXMgaGFwcGVuaW5nXG4gICAgaWYgKGxhc3RTdGF0ZSAmJiBpc1N0YXRlVW5jaGFuZ2VkKHN0YXRlKSkge1xuICAgICAgICByZXR1cm4gXCJzdXBwcmVzc2VkXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvd1wiO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFNlbmQocHJpb3JpdHksIHN0YXRlKSB7XG4gICAgaWYgKHByaW9yaXR5ID09PSBcInN1cHByZXNzZWRcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHZhciBsYXN0U2VuZCA9IGxhc3RTZW5kVGltZXNbcHJpb3JpdHldO1xuICAgIHZhciBtaW5JbnRlcnZhbCA9IHJhdGVMaW1pdHNbcHJpb3JpdHldO1xuICAgIGlmIChub3cgLSBsYXN0U2VuZCA8IG1pbkludGVydmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgLy8gT25seSB1cGRhdGUgc3RhdGUgd2hlbiB3ZSdyZSBhY3R1YWxseSBnb2luZyB0byBzZW5kXG4gICAgbGFzdFNlbmRUaW1lc1twcmlvcml0eV0gPSBub3c7XG4gICAgbGFzdFN0YXRlID0gc3RhdGU7XG4gICAgcmV0dXJuIHRydWU7XG59XG4iLCJ2YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2dlbmVyYXRvciA9ICh0aGlzICYmIHRoaXMuX19nZW5lcmF0b3IpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZyA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBJdGVyYXRvciA9PT0gXCJmdW5jdGlvblwiID8gSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSk7XG4gICAgcmV0dXJuIGcubmV4dCA9IHZlcmIoMCksIGdbXCJ0aHJvd1wiXSA9IHZlcmIoMSksIGdbXCJyZXR1cm5cIl0gPSB2ZXJiKDIpLCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XG4gICAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgICB9XG59O1xuaW1wb3J0IHsgSHR0cENsaWVudCwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG52YXIgTUFYX1NFTkRTX1BFUl9TRUMgPSA1O1xudmFyIHNlbmRDb3VudCA9IDA7XG52YXIgbGFzdFJlc2V0ID0gRGF0ZS5ub3coKTtcbmZ1bmN0aW9uIHJlc2V0UmF0ZUxpbWl0KCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0UmVzZXQgPj0gMTAwMCkge1xuICAgICAgICBzZW5kQ291bnQgPSAwO1xuICAgICAgICBsYXN0UmVzZXQgPSBub3c7XG4gICAgfVxufVxudmFyIFNreUd1aWRlSHR0cENsaWVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTa3lHdWlkZUh0dHBDbGllbnQoYmFzZVVybCkge1xuICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubWF4RmFpbHVyZXMgPSAzO1xuICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IDA7XG4gICAgICAgIHRoaXMuY29vbGRvd25NcyA9IDEwMDAwO1xuICAgICAgICB0aGlzLmNsaWVudCA9IG5ldyBIdHRwQ2xpZW50KGJhc2VVcmwpO1xuICAgIH1cbiAgICBTa3lHdWlkZUh0dHBDbGllbnQucHJvdG90eXBlLnNlbmRHYW1lU3RhdGUgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UsIGVycl8xLCBtc2c7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldFJhdGVMaW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbmRDb3VudCA+PSBNQVhfU0VORFNfUEVSX1NFQykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIlJhdGUgbGltaXQgZXhjZWVkZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBmYWxzZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnRyeXMucHVzaChbMSwgMywgLCA0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCB0aGlzLmNsaWVudC5wb3N0KFwiL2FwaS9nYW1lLXN0YXRlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSldO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCB0cnVlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gSFRUUCBcIi5jb25jYXQocmVzcG9uc2Uuc3RhdHVzLCBcIjogcmVxdWVzdCByZWplY3RlZCBieSBzZXJ2ZXJcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgZmFsc2VdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gZXJyXzEgaW5zdGFuY2VvZiBFcnJvciA/IGVycl8xLm1lc3NhZ2UgOiBTdHJpbmcoZXJyXzEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEhUVFAgUE9TVCAvYXBpL2dhbWUtc3RhdGUgZmFpbGVkOiBcIi5jb25jYXQobXNnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGZhbHNlXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU2t5R3VpZGVIdHRwQ2xpZW50LnByb3RvdHlwZS5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZmFpbHVyZUNvdW50IDwgdGhpcy5tYXhGYWlsdXJlcylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdEZhaWx1cmVUaW1lID4gdGhpcy5jb29sZG93bk1zKSB7XG4gICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IHRoaXMubWF4RmFpbHVyZXMgLSAxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIFNreUd1aWRlSHR0cENsaWVudDtcbn0oKSk7XG5leHBvcnQgdmFyIGh0dHBDbGllbnQgPSBuZXcgU2t5R3VpZGVIdHRwQ2xpZW50KENPTkZJRy5zZXJ2ZXJVcmwpO1xuZXhwb3J0IGZ1bmN0aW9uIHNlbmRHYW1lU3RhdGUocGF5bG9hZCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGh0dHBDbGllbnQuc2VuZEdhbWVTdGF0ZShwYXlsb2FkKV07XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiBodHRwQ2xpZW50LmlzQ29ubmVjdGVkKCk7XG59XG4iLCIvLyBAZW52IG5vZGVcbi8vIE5PVEU6IEZvciBwcm9kdWN0aW9uLCBjb25zaWRlciByZWFkaW5nIGZyb20gU2t5cmltIFBsYXRmb3JtIHNldHRpbmdzOlxuLy8gICBpbXBvcnQgeyBzZXR0aW5ncyB9IGZyb20gXCJza3lyaW1QbGF0Zm9ybVwiO1xuLy8gICBjb25zdCBkZWJ1Z01vZGUgPSBzZXR0aW5nc1tcInNreWd1aWRlXCJdPy5bXCJkZWJ1Z01vZGVcIl0gPT09IFwidHJ1ZVwiO1xuZXhwb3J0IHZhciBQTEFZRVJfRk9STV9JRCA9IDB4MTQ7XG5leHBvcnQgdmFyIENPTkZJRyA9IHtcbiAgICBzZXJ2ZXJVcmw6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXG4gICAgdGlja0ludGVydmFsOiA1MDAsXG4gICAgZW5lbXlTY2FuUmFkaXVzOiA1MDAwLFxuICAgIG1heEVuZW1pZXM6IDEwLFxuICAgIGRlYnVnTW9kZTogZmFsc2UsXG4gICAgcG9sbGluZ0ludGVydmFsOiAxMDAwLFxuICAgIHBvbGxpbmdFbmRwb2ludDogXCIvYXBpL2FjdGlvbnNcIixcbiAgICBwb2xsaW5nTWF4QmFja29mZjogMzAwMDAsXG4gICAgcG9sbGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgbWF4UG9sbGluZ1JldHJpZXM6IDUsXG59O1xuIiwidmFyIF9fc3ByZWFkQXJyYXkgPSAodGhpcyAmJiB0aGlzLl9fc3ByZWFkQXJyYXkpIHx8IGZ1bmN0aW9uICh0bywgZnJvbSwgcGFjaykge1xuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XG59O1xuaW1wb3J0IHsgb24sIHByaW50Q29uc29sZSB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBpc1JlZ2lzdGVyZWQgPSBmYWxzZTtcbnZhciBsYXN0Q3Jvc3NoYWlyUmVmO1xudmFyIG9wZW5NZW51cyA9IG5ldyBTZXQoKTtcbnZhciBsYXN0TG9jYXRpb247XG52YXIgbGFzdEFjdGl2YXRlZFJlZjtcbnZhciBwbGF5ZXJEZWFkID0gZmFsc2U7XG52YXIgbGFzdENvbnRhaW5lckNoYW5nZWQ7XG52YXIgbGFzdEVxdWlwQ2hhbmdlO1xudmFyIGxhc3RMZXZlbFVwO1xudmFyIGxhc3RRdWVzdFVwZGF0ZTtcbnZhciBsYXN0RmFzdFRyYXZlbEVuZDtcbnZhciBsYXN0Qm9va1JlYWQ7XG52YXIgbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG52YXIgbGFzdExvY2tDaGFuZ2VkO1xuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBydW5IYW5kbGVyKGhhbmRsZXJzLCBldmVudE5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgX2E7XG4gICAgKF9hID0gaGFuZGxlcnMgPT09IG51bGwgfHwgaGFuZGxlcnMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGhhbmRsZXJzW2V2ZW50TmFtZV0pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5jYWxsLmFwcGx5KF9hLCBfX3NwcmVhZEFycmF5KFtoYW5kbGVyc10sIGFyZ3MsIGZhbHNlKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENyb3NzaGFpclJlZigpIHtcbiAgICByZXR1cm4gbGFzdENyb3NzaGFpclJlZjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVuTWVudXMoKSB7XG4gICAgdmFyIHNuYXBzaG90ID0gbmV3IFNldCgpO1xuICAgIG9wZW5NZW51cy5mb3JFYWNoKGZ1bmN0aW9uIChtZW51TmFtZSkge1xuICAgICAgICBzbmFwc2hvdC5hZGQobWVudU5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBzbmFwc2hvdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIGxhc3RMb2NhdGlvbjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0QWN0aXZhdGVkUmVmKCkge1xuICAgIHJldHVybiBsYXN0QWN0aXZhdGVkUmVmO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxheWVyRGVhZCgpIHtcbiAgICByZXR1cm4gcGxheWVyRGVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q29udGFpbmVyQ2hhbmdlZCgpIHtcbiAgICByZXR1cm4gbGFzdENvbnRhaW5lckNoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEVxdWlwQ2hhbmdlKCkge1xuICAgIHJldHVybiBsYXN0RXF1aXBDaGFuZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExldmVsVXAoKSB7XG4gICAgcmV0dXJuIGxhc3RMZXZlbFVwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RRdWVzdFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gbGFzdFF1ZXN0VXBkYXRlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RGYXN0VHJhdmVsRW5kKCkge1xuICAgIHJldHVybiBsYXN0RmFzdFRyYXZlbEVuZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Qm9va1JlYWQoKSB7XG4gICAgcmV0dXJuIGxhc3RCb29rUmVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0SXRlbUhhcnZlc3RlZCgpIHtcbiAgICByZXR1cm4gbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExvY2tDaGFuZ2VkKCkge1xuICAgIHJldHVybiBsYXN0TG9ja0NoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJBbGxFdmVudHMoaGFuZGxlcnMpIHtcbiAgICBpZiAoaXNSZWdpc3RlcmVkKSB7XG4gICAgICAgIGRlYnVnTG9nKFwicmVnaXN0ZXJBbGxFdmVudHMgY2FsbGVkIGFmdGVyIGluaXRpYWxpemF0aW9uOyBza2lwcGluZyBkdXBsaWNhdGUgc3Vic2NyaXB0aW9uc1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpc1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIG9uKFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0Q3Jvc3NoYWlyUmVmID0gKF9hID0gZXZlbnQucmVmZXJlbmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjcm9zc2hhaXJSZWZDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDcm9zc2hhaXJSZWYpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NhdGlvbkNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGFzdExvY2F0aW9uID0gKF9hID0gZXZlbnQubmV3TG9jKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxvY2F0aW9uQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2NhdGlvbkNoYW5nZWQ6IFwiLmNvbmNhdChsYXN0TG9jYXRpb24gIT09IG51bGwgJiYgbGFzdExvY2F0aW9uICE9PSB2b2lkIDAgPyBsYXN0TG9jYXRpb24gOiBcInVua25vd25cIikpO1xuICAgIH0pO1xuICAgIG9uKFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9jYXRpb25EaXNjb3Zlcnk6IFwiLmNvbmNhdChldmVudC5uYW1lKSk7XG4gICAgfSk7XG4gICAgb24oXCJjZWxsRnVsbHlMb2FkZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2VsbEZ1bGx5TG9hZGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNlbGxGdWxseUxvYWRlZDogXCIuY29uY2F0KGV2ZW50LmNlbGwuZ2V0TmFtZSgpKSk7XG4gICAgfSk7XG4gICAgb24oXCJtZW51T3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5hZGQoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51T3BlblwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJtZW51T3BlbjogXCIuY29uY2F0KGV2ZW50Lm5hbWUpKTtcbiAgICB9KTtcbiAgICBvbihcIm1lbnVDbG9zZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5kZWxldGUoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51Q2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibWVudUNsb3NlOiBcIi5jb25jYXQoZXZlbnQubmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZnVybml0dXJlRW50ZXJcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZnVybml0dXJlRW50ZXI6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRXhpdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJmdXJuaXR1cmVFeGl0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImZ1cm5pdHVyZUV4aXQ6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwib3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJvcGVuXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIm9wZW46IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiY2xvc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY2xvc2U6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwicXVlc3RTdGFnZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0YWdlXCIsIHF1ZXN0SWQ6IGV2ZW50LnF1ZXN0LmdldEZvcm1JRCgpLCBzdGFnZTogZXZlbnQuc3RhZ2UgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0YWdlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInF1ZXN0U3RhZ2U6IHF1ZXN0PVwiLmNvbmNhdChTdHJpbmcobGFzdFF1ZXN0VXBkYXRlLnF1ZXN0SWQpLCBcIiBzdGFnZT1cIikuY29uY2F0KFN0cmluZyhldmVudC5zdGFnZSkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RRdWVzdFVwZGF0ZSA9IHsgZXZlbnQ6IFwicXVlc3RTdGFydFwiLCBxdWVzdElkOiBldmVudC5xdWVzdC5nZXRGb3JtSUQoKSB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInF1ZXN0U3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdGFydDogcXVlc3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0UXVlc3RVcGRhdGUucXVlc3RJZCkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RvcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0b3BcIiwgcXVlc3RJZDogZXZlbnQucXVlc3QuZ2V0Rm9ybUlEKCkgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0b3BcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdG9wOiBxdWVzdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RRdWVzdFVwZGF0ZS5xdWVzdElkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcGxheWVyRGVhZCA9IHRydWU7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZGVhdGhTdGFydFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aFN0YXJ0XCIpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHBsYXllckRlYWQgPSBmYWxzZTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJkZWF0aEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aEVuZFwiKTtcbiAgICB9KTtcbiAgICBvbihcImNvbnRhaW5lckNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0Q29udGFpbmVyQ2hhbmdlZCA9IHtcbiAgICAgICAgICAgIG9sZENvbnRhaW5lcjogKF9hID0gZXZlbnQub2xkQ29udGFpbmVyKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBuZXdDb250YWluZXI6IChfYiA9IGV2ZW50Lm5ld0NvbnRhaW5lcikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgaXRlbTogKF9jID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgY291bnQ6IGV2ZW50Lm51bUl0ZW1zXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY29udGFpbmVyQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjb250YWluZXJDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm9sZENvbnRhaW5lciksIFwiIC0+IFwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm5ld0NvbnRhaW5lciksIFwiLCBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLml0ZW0pLCBcIiwgY291bnQ9XCIpLmNvbmNhdChTdHJpbmcoZXZlbnQubnVtSXRlbXMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcImVxdWlwXCIsXG4gICAgICAgICAgICBhY3RvcjogKF9hID0gZXZlbnQuYWN0b3IpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGJhc2VPYmplY3Q6IChfYiA9IGV2ZW50LmJhc2VPYmopID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGV4dHJhRGF0YTogZXZlbnQudW5pcXVlSWRcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJlcXVpcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJlcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwidW5lcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcInVuZXF1aXBcIixcbiAgICAgICAgICAgIGFjdG9yOiAoX2EgPSBldmVudC5hY3RvcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgYmFzZU9iamVjdDogKF9iID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgZXh0cmFEYXRhOiBldmVudC51bmlxdWVJZFxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInVuZXF1aXBcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwidW5lcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwibGV2ZWxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBsZXZlbDogZXZlbnQubmV3TGV2ZWwsXG4gICAgICAgICAgICBpc1NraWxsSW5jcmVhc2U6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibGV2ZWxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsZXZlbEluY3JlYXNlOiBsZXZlbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50Lm5ld0xldmVsKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2tpbGxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBza2lsbElkOiBldmVudC5hY3RvclZhbHVlLFxuICAgICAgICAgICAgaXNTa2lsbEluY3JlYXNlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwic2tpbGxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJza2lsbEluY3JlYXNlOiBza2lsbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmFjdG9yVmFsdWUpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlbnRlckJsZWVkb3V0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImVudGVyQmxlZWRvdXRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZW50ZXJCbGVlZG91dDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhldmVudC5hY3Rvci5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImZhc3RUcmF2ZWxFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RGYXN0VHJhdmVsRW5kID0geyB0cmF2ZWxUaW1lR2FtZUhvdXJzOiBldmVudC50cmF2ZWxUaW1lR2FtZUhvdXJzIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZmFzdFRyYXZlbEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJmYXN0VHJhdmVsRW5kOiB0cmF2ZWxIb3Vycz1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRyYXZlbFRpbWVHYW1lSG91cnMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJzbGVlcFN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwic2xlZXBTdGFydDogZGVzaXJlZFN0b3BUaW1lPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuZGVzaXJlZFN0b3BUaW1lKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2xlZXBTdG9wXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RvcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJzbGVlcFN0b3A6IGludGVycnVwdGVkPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuaXNJbnRlcnJ1cHRlZCkpKTtcbiAgICB9KTtcbiAgICBvbihcImFjdGl2YXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBsYXN0QWN0aXZhdGVkUmVmID0gKF9hID0gZXZlbnQudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYWN0aXZhdGVcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYWN0aXZhdGU6IHRhcmdldD1cIi5jb25jYXQoU3RyaW5nKGxhc3RBY3RpdmF0ZWRSZWYpLCBcIiBjYXN0ZXI9XCIpLmNvbmNhdChTdHJpbmcoKF9iID0gZXZlbnQuY2FzdGVyKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NrQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0TG9ja0NoYW5nZWQgPSB7XG4gICAgICAgICAgICBsb2NrZWRPYmplY3Q6IChfYSA9IGV2ZW50LmxvY2tlZE9iamVjdCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9ja0NoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9ja0NoYW5nZWQ6IG9iamVjdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RMb2NrQ2hhbmdlZC5sb2NrZWRPYmplY3QpKSk7XG4gICAgfSk7XG4gICAgb24oXCJib29rUmVhZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIGxhc3RCb29rUmVhZCA9IHtcbiAgICAgICAgICAgIGJvb2tGb3JtSWQ6IChfYSA9IGV2ZW50LmJvb2spID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIHRpdGxlOiAoX2IgPSBldmVudC5ib29rKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0TmFtZSgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYm9va1JlYWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYm9va1JlYWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0Qm9va1JlYWQudGl0bGUpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IFN0cmluZyhsYXN0Qm9va1JlYWQuYm9va0Zvcm1JZCkpKTtcbiAgICB9KTtcbiAgICBvbihcIml0ZW1IYXJ2ZXN0ZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0SXRlbUhhcnZlc3RlZCA9IHtcbiAgICAgICAgICAgIGl0ZW1Gb3JtSWQ6IChfYSA9IGV2ZW50LnByb2R1Y2VJdGVtKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBpbmdyZWRpZW50TmFtZTogKF9iID0gZXZlbnQucHJvZHVjZUl0ZW0pID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXROYW1lKClcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJpdGVtSGFydmVzdGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIml0ZW1IYXJ2ZXN0ZWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0SXRlbUhhcnZlc3RlZC5pbmdyZWRpZW50TmFtZSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogU3RyaW5nKGxhc3RJdGVtSGFydmVzdGVkLml0ZW1Gb3JtSWQpKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbnZhciBGT1JNX1RZUEVfTkFNRVMgPSB7XG4gICAgMjQ6IFwiQWN0aXZhdG9yXCIsXG4gICAgMjY6IFwiRmxvcmFcIixcbiAgICAyNzogXCJLZXlcIixcbiAgICAyODogXCJDb250YWluZXJcIixcbiAgICAyOTogXCJEb29yXCIsXG4gICAgNDA6IFwiRnVybml0dXJlXCIsXG4gICAgNDE6IFwiSW5ncmVkaWVudFwiLFxuICAgIDQyOiBcIkFwcGFyYXR1c1wiLFxuICAgIDYyOiBcIk5QQ1wiLFxufTtcbmZ1bmN0aW9uIG1hcEZvcm1UeXBlKHR5cGVJZCkge1xuICAgIHZhciBfYTtcbiAgICBpZiAodHlwZUlkID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoX2EgPSBGT1JNX1RZUEVfTkFNRVNbdHlwZUlkXSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogXCJGb3JtVHlwZV9cIi5jb25jYXQodHlwZUlkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0KCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmVmID0gR2FtZS5nZXRDdXJyZW50Q3Jvc3NoYWlyUmVmKCk7XG4gICAgICAgIGlmIChyZWYgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvcm1JZCA9IHJlZi5nZXRGb3JtSUQoKTtcbiAgICAgICAgdmFyIGJhc2VPYmplY3QgPSByZWYuZ2V0QmFzZU9iamVjdCgpO1xuICAgICAgICB2YXIgdHlwZUlkID0gYmFzZU9iamVjdCA9PT0gbnVsbCB8fCBiYXNlT2JqZWN0ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqZWN0LmdldFR5cGUoKTtcbiAgICAgICAgdmFyIHR5cGUgPSBtYXBGb3JtVHlwZSh0eXBlSWQpO1xuICAgICAgICB2YXIgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVJZCA9PT0gMjkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gcmVmLmdldE9wZW5TdGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IChfYiA9IChfYSA9IHJlZi5nZXREaXNwbGF5TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBiYXNlT2JqZWN0ID09PSBudWxsIHx8IGJhc2VPYmplY3QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2VPYmplY3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSAoX2QgPSAoX2MgPSBHYW1lLmdldFBsYXllcigpKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuZ2V0RGlzdGFuY2UocmVmKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogMDtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxuICAgICAgICAgICAgaXNPcGVuOiBpc09wZW4sXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfZikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lLCBVdGlsaXR5LCBXZWF0aGVyIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEVudmlyb25tZW50U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB2YXIgZ2FtZVRpbWUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGdhbWVUaW1lID0gVXRpbGl0eS5nZXRDdXJyZW50R2FtZVRpbWUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIGdhbWVUaW1lID0gMDtcbiAgICB9XG4gICAgdmFyIGdhbWVIb3VyID0gMDtcbiAgICB0cnkge1xuICAgICAgICBnYW1lSG91ciA9ICgoZ2FtZVRpbWUgKiAyNCkgJSAyNCArIDI0KSAlIDI0O1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgZ2FtZUhvdXIgPSAwO1xuICAgIH1cbiAgICB2YXIgY2FtZXJhU3RhdGUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGNhbWVyYVN0YXRlID0gR2FtZS5nZXRDYW1lcmFTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgY2FtZXJhU3RhdGUgPSAwO1xuICAgIH1cbiAgICB2YXIgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHdlYXRoZXJOYW1lID0gKF9iID0gKF9hID0gV2VhdGhlci5nZXRDdXJyZW50V2VhdGhlcigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgIH1cbiAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBzdW5Qb3NpdGlvblggPSBHYW1lLmdldFN1blBvc2l0aW9uWCgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgc3VuUG9zaXRpb25ZID0gR2FtZS5nZXRTdW5Qb3NpdGlvblkoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHN1blBvc2l0aW9uWiA9IEdhbWUuZ2V0U3VuUG9zaXRpb25aKCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBnYW1lVGltZTogZ2FtZVRpbWUsXG4gICAgICAgIGdhbWVIb3VyOiBnYW1lSG91cixcbiAgICAgICAgd2VhdGhlck5hbWU6IHdlYXRoZXJOYW1lLFxuICAgICAgICBjYW1lcmFTdGF0ZTogY2FtZXJhU3RhdGUsXG4gICAgICAgIHN1blBvc2l0aW9uWDogc3VuUG9zaXRpb25YLFxuICAgICAgICBzdW5Qb3NpdGlvblk6IHN1blBvc2l0aW9uWSxcbiAgICAgICAgc3VuUG9zaXRpb25aOiBzdW5Qb3NpdGlvblpcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgSW5wdXQgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbnZhciBNT1ZFX0ZPUldBUkQgPSAxNztcbnZhciBNT1ZFX0xFRlQgPSAzMDtcbnZhciBNT1ZFX0JBQ0tXQVJEID0gMzE7XG52YXIgTU9WRV9SSUdIVCA9IDMyO1xudmFyIFNQUklOVCA9IDQyO1xudmFyIENST1VDSCA9IDI5O1xudmFyIEpVTVBfT1JfQUNUSVZBVEUgPSA1NztcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0SW5wdXRTdGF0ZSgpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIga2V5c1ByZXNzZWQgPSBbXTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChNT1ZFX0ZPUldBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIldcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9MRUZUKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJBXCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKE1PVkVfQkFDS1dBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9SSUdIVCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiRFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChTUFJJTlQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNoaWZ0XCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKENST1VDSCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiQ3RybFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChKVU1QX09SX0FDVElWQVRFKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJTcGFjZVwiKTtcbiAgICAgICAgcmV0dXJuIHsga2V5c1ByZXNzZWQ6IGtleXNQcmVzc2VkIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4geyBrZXlzUHJlc3NlZDogW10gfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdExvY2F0aW9uU3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2MsIF9kLCBfZSwgX2YsIF9nLCBfaDtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvY2F0aW9uTmFtZTogbnVsbCxcbiAgICAgICAgaXNJbnRlcmlvcjogZmFsc2UsXG4gICAgICAgIGNlbGxOYW1lOiBudWxsLFxuICAgICAgICB3b3JsZHNwYWNlTmFtZTogbnVsbFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvY2F0aW9uTmFtZTogKF9iID0gKF9hID0gcGxheWVyLmdldEN1cnJlbnRMb2NhdGlvbigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsLFxuICAgICAgICAgICAgaXNJbnRlcmlvcjogKF9kID0gKF9jID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmlzSW50ZXJpb3IoKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogZmFsc2UsXG4gICAgICAgICAgICBjZWxsTmFtZTogKF9mID0gKF9lID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9lLmdldE5hbWUoKSkgIT09IG51bGwgJiYgX2YgIT09IHZvaWQgMCA/IF9mIDogbnVsbCxcbiAgICAgICAgICAgIHdvcmxkc3BhY2VOYW1lOiAoX2ggPSAoX2cgPSBwbGF5ZXIuZ2V0V29ybGRTcGFjZSgpKSA9PT0gbnVsbCB8fCBfZyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2cuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfaCAhPT0gdm9pZCAwID8gX2ggOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHLCBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVEaXN0YW5jZSh4MSwgeTEsIHoxLCB4MiwgeTIsIHoyKSB7XG4gICAgdmFyIGR4ID0geDIgLSB4MTtcbiAgICB2YXIgZHkgPSB5MiAtIHkxO1xuICAgIHZhciBkeiA9IHoyIC0gejE7XG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3ROZWFyYnlOcGNzKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zaXRpb24oKTtcbiAgICBpZiAoIXBsYXllclBvcylcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBzY2FuT2Zmc2V0cyA9IFtcbiAgICAgICAgeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cywgeTogMCB9LFxuICAgICAgICB7IHg6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzLCB5OiAwIH0sXG4gICAgICAgIHsgeDogMCwgeTogQ09ORklHLmVuZW15U2NhblJhZGl1cyB9LFxuICAgICAgICB7IHg6IDAsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3IH0sXG4gICAgXTtcbiAgICB2YXIgc2VlbkZvcm1JZHMgPSBuZXcgU2V0KCk7XG4gICAgdmFyIG5lYXJieU5wY3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIHNjYW5PZmZzZXRzXzEgPSBzY2FuT2Zmc2V0czsgX2kgPCBzY2FuT2Zmc2V0c18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gc2Nhbk9mZnNldHNfMVtfaV07XG4gICAgICAgIGlmIChuZWFyYnlOcGNzLmxlbmd0aCA+PSBDT05GSUcubWF4RW5lbWllcylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgc2NhblggPSBwbGF5ZXJQb3MueCArIG9mZnNldC54O1xuICAgICAgICB2YXIgc2NhblkgPSBwbGF5ZXJQb3MueSArIG9mZnNldC55O1xuICAgICAgICB2YXIgc2NhblogPSBwbGF5ZXJQb3MuejtcbiAgICAgICAgdmFyIGFjdG9yID0gR2FtZS5maW5kQ2xvc2VzdEFjdG9yKHNjYW5YLCBzY2FuWSwgc2NhblosIENPTkZJRy5lbmVteVNjYW5SYWRpdXMpO1xuICAgICAgICBpZiAoIWFjdG9yKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBhY3Rvci5nZXRGb3JtSUQoKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHNlZW5Gb3JtSWRzLmhhcyhmb3JtSWQpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHNlZW5Gb3JtSWRzLmFkZChmb3JtSWQpO1xuICAgICAgICB2YXIgYWN0b3JQb3MgPSB7XG4gICAgICAgICAgICB4OiBhY3Rvci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgICAgIHk6IGFjdG9yLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICAgICAgejogYWN0b3IuZ2V0UG9zaXRpb25aKCksXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKHBsYXllclBvcy54LCBwbGF5ZXJQb3MueSwgcGxheWVyUG9zLnosIGFjdG9yUG9zLngsIGFjdG9yUG9zLnksIGFjdG9yUG9zLnopO1xuICAgICAgICB2YXIgYmFzZU9iaiA9IGFjdG9yLmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgdmFyIG5hbWUgPSAoYmFzZU9iaiA9PT0gbnVsbCB8fCBiYXNlT2JqID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqLmdldE5hbWUoKSkgfHwgXCJVbmtub3duXCI7XG4gICAgICAgIHZhciBoZWFsdGggPSBhY3Rvci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpO1xuICAgICAgICB2YXIgbGV2ZWwgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWwgPSBhY3Rvci5nZXRMZXZlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYykge1xuICAgICAgICAgICAgbGV2ZWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciByYWNlID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJhY2UgPSAoX2IgPSAoX2EgPSBhY3Rvci5nZXRSYWNlKCkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgICAgICByYWNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNIb3N0aWxlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBhY3Rvci5pc0hvc3RpbGVUb0FjdG9yKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNBbGx5ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBhY3Rvci5pc1BsYXllclRlYW1tYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNHdWFyZCA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNHdWFyZCA9IGFjdG9yLmlzR3VhcmQoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgICAgIGlzR3VhcmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNNZXJjaGFudCA9IGZhbHNlO1xuICAgICAgICB2YXIgaXNJbkRpYWxvZ3VlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBhY3Rvci5pc0luRGlhbG9ndWVXaXRoUGxheWVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFzTE9TID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBoYXNMT1MgPSBhY3Rvci5oYXNMT1MocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2opIHtcbiAgICAgICAgICAgIGhhc0xPUyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gYWN0b3IuaXNEZXRlY3RlZEJ5KHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9rKSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuayA9IGFjdG9yLmdldFJlbGF0aW9uc2hpcFJhbmsocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2wpIHtcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RlYWQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzRGVhZCA9IGFjdG9yLmlzRGVhZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfbSkge1xuICAgICAgICAgICAgaXNEZWFkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbmVhcmJ5TnBjcy5wdXNoKHtcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSxcbiAgICAgICAgICAgIGhlYWx0aDogaGVhbHRoLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgcmFjZTogcmFjZSxcbiAgICAgICAgICAgIGlzSG9zdGlsZTogaXNIb3N0aWxlLFxuICAgICAgICAgICAgaXNBbGx5OiBpc0FsbHksXG4gICAgICAgICAgICBpc0d1YXJkOiBpc0d1YXJkLFxuICAgICAgICAgICAgaXNNZXJjaGFudDogaXNNZXJjaGFudCxcbiAgICAgICAgICAgIGlzSW5EaWFsb2d1ZTogaXNJbkRpYWxvZ3VlLFxuICAgICAgICAgICAgaXNEZXRlY3RlZDogaXNEZXRlY3RlZCxcbiAgICAgICAgICAgIGhhc0xPUzogaGFzTE9TLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuazogcmVsYXRpb25zaGlwUmFuayxcbiAgICAgICAgICAgIGlzRGVhZDogaXNEZWFkLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5lYXJieU5wY3M7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5mdW5jdGlvbiBzYWZlTnVtYmVyKHZhbHVlLCBmYWxsYmFjaykge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7IGZhbGxiYWNrID0gMDsgfVxuICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cbmZ1bmN0aW9uIHNhZmVTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCA/IHZhbHVlIDogbnVsbDtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RIZWFkaW5nKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7IGFuZ2xlWDogMCwgYW5nbGVZOiAwLCBhbmdsZVo6IDAsIGhlYWRpbmdBbmdsZTogMCB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBhbmdsZVg6IHNhZmVOdW1iZXIocGxheWVyLmdldEFuZ2xlWCgpKSxcbiAgICAgICAgYW5nbGVZOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBbmdsZVkoKSksXG4gICAgICAgIGFuZ2xlWjogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QW5nbGVaKCkpLFxuICAgICAgICBoZWFkaW5nQW5nbGU6IHNhZmVOdW1iZXIocGxheWVyLmdldEhlYWRpbmdBbmdsZShudWxsKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RNb3ZlbWVudCgpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3ByaW50aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3dpbW1pbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTbmVha2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc09uTW91bnQ6IGZhbHNlLFxuICAgICAgICAgICAgaXNPdmVyRW5jdW1iZXJlZDogZmFsc2UsXG4gICAgICAgICAgICBzaXRTdGF0ZTogMCxcbiAgICAgICAgICAgIHNsZWVwU3RhdGU6IDAsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGlzUnVubmluZzogcGxheWVyLmlzUnVubmluZygpLFxuICAgICAgICBpc1NwcmludGluZzogcGxheWVyLmlzU3ByaW50aW5nKCksXG4gICAgICAgIGlzU3dpbW1pbmc6IHBsYXllci5pc1N3aW1taW5nKCksXG4gICAgICAgIGlzU25lYWtpbmc6IHBsYXllci5pc1NuZWFraW5nKCksXG4gICAgICAgIGlzT25Nb3VudDogcGxheWVyLmlzT25Nb3VudCgpLFxuICAgICAgICBpc092ZXJFbmN1bWJlcmVkOiBwbGF5ZXIuaXNPdmVyRW5jdW1iZXJlZCgpLFxuICAgICAgICBzaXRTdGF0ZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0U2l0U3RhdGUoKSksXG4gICAgICAgIHNsZWVwU3RhdGU6IHNhZmVOdW1iZXIocGxheWVyLmdldFNsZWVwU3RhdGUoKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RDb21iYXQoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzSW5Db21iYXQ6IGZhbHNlLFxuICAgICAgICAgICAgY29tYmF0VGFyZ2V0TmFtZTogbnVsbCxcbiAgICAgICAgICAgIGlzQmxvY2tpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNXZWFwb25EcmF3bjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBjb21iYXRUYXJnZXROYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gcGxheWVyLmdldENvbWJhdFRhcmdldCgpO1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICB2YXIgYmFzZSA9IHRhcmdldC5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgICAgICBjb21iYXRUYXJnZXROYW1lID0gc2FmZVN0cmluZyhiYXNlID09PSBudWxsIHx8IGJhc2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2UuZ2V0TmFtZSgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgY29tYmF0VGFyZ2V0TmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBpc0Jsb2NraW5nID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgaXNCbG9ja2luZyA9IHBsYXllci5nZXRBbmltYXRpb25WYXJpYWJsZUJvb2woXCJJc0Jsb2NraW5nXCIpO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgaXNCbG9ja2luZyA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBpc0luQ29tYmF0OiBwbGF5ZXIuaXNJbkNvbWJhdCgpLFxuICAgICAgICBjb21iYXRUYXJnZXROYW1lOiBjb21iYXRUYXJnZXROYW1lLFxuICAgICAgICBpc0Jsb2NraW5nOiBpc0Jsb2NraW5nLFxuICAgICAgICBpc1dlYXBvbkRyYXduOiBwbGF5ZXIuaXNXZWFwb25EcmF3bigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjb2xsZWN0RXF1aXBtZW50KCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWFwb25OYW1lOiBudWxsLFxuICAgICAgICAgICAgd2VhcG9uU2xvdDogMCxcbiAgICAgICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICAgICAgc2hvdXROYW1lOiBudWxsLFxuICAgICAgICAgICAgc3BlbGxOYW1lOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHdlYXBvbiA9IHBsYXllci5nZXRFcXVpcHBlZFdlYXBvbihmYWxzZSk7XG4gICAgICAgIHdlYXBvbk5hbWUgPSBzYWZlU3RyaW5nKHdlYXBvbiA9PT0gbnVsbCB8fCB3ZWFwb24gPT09IHZvaWQgMCA/IHZvaWQgMCA6IHdlYXBvbi5nZXROYW1lKCkpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzaG91dE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzaG91dCA9IHBsYXllci5nZXRFcXVpcHBlZFNob3V0KCk7XG4gICAgICAgIHNob3V0TmFtZSA9IHNhZmVTdHJpbmcoc2hvdXQgPT09IG51bGwgfHwgc2hvdXQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHNob3V0LmdldE5hbWUoKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBzaG91dE5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3BlbGxOYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgc3BlbGwgPSBwbGF5ZXIuZ2V0RXF1aXBwZWRTcGVsbCgwKTtcbiAgICAgICAgc3BlbGxOYW1lID0gc2FmZVN0cmluZyhzcGVsbCA9PT0gbnVsbCB8fCBzcGVsbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogc3BlbGwuZ2V0TmFtZSgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHNwZWxsTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHdlYXBvbk5hbWU6IHdlYXBvbk5hbWUsXG4gICAgICAgIHdlYXBvblNsb3Q6IDAsXG4gICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICBzaG91dE5hbWU6IHNob3V0TmFtZSxcbiAgICAgICAgc3BlbGxOYW1lOiBzcGVsbE5hbWUsXG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UGxheWVyRnVsbFN0YXRlKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFkaW5nOiBjb2xsZWN0SGVhZGluZygpLFxuICAgICAgICBtb3ZlbWVudDogY29sbGVjdE1vdmVtZW50KCksXG4gICAgICAgIGNvbWJhdDogY29sbGVjdENvbWJhdCgpLFxuICAgICAgICBlcXVpcG1lbnQ6IGNvbGxlY3RFcXVpcG1lbnQoKSxcbiAgICAgICAgZ29sZEFtb3VudDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0R29sZEFtb3VudCgpKSxcbiAgICAgICAgY2FycnlXZWlnaHQ6IHNhZmVOdW1iZXIocGxheWVyLmdldEFjdG9yVmFsdWUoXCJDYXJyeVdlaWdodFwiKSksXG4gICAgICAgIGludmVudG9yeVdlaWdodDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIkludmVudG9yeVdlaWdodFwiKSksXG4gICAgICAgIG1hZ2lja2FQZXJjZW50YWdlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlUGVyY2VudGFnZShcIm1hZ2lja2FcIikpLFxuICAgICAgICBzdGFtaW5hUGVyY2VudGFnZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZVBlcmNlbnRhZ2UoXCJzdGFtaW5hXCIpKSxcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RRdWVzdFN0YXRlKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHF1ZXN0ID0gR2FtZS5nZXRRdWVzdChcIk1RMTAxXCIpO1xuICAgICAgICBpZiAoIXF1ZXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqZWN0aXZlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSAxMDsgaSArPSAxKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheWVkID0gcXVlc3QuaXNPYmplY3RpdmVEaXNwbGF5ZWQoaSk7XG4gICAgICAgICAgICBpZiAoIWRpc3BsYXllZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqZWN0aXZlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5ZWQ6IGRpc3BsYXllZCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IHF1ZXN0LmlzT2JqZWN0aXZlQ29tcGxldGVkKGkpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcXVlc3RXaXRoRWRpdG9ySWQgPSBxdWVzdDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXN0TmFtZTogKF9hID0gcXVlc3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBudWxsLFxuICAgICAgICAgICAgZWRpdG9ySWQ6IHR5cGVvZiBxdWVzdFdpdGhFZGl0b3JJZC5nZXRFZGl0b3JJZCA9PT0gXCJmdW5jdGlvblwiID8gKF9iID0gcXVlc3RXaXRoRWRpdG9ySWQuZ2V0RWRpdG9ySWQoKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbCA6IG51bGwsXG4gICAgICAgICAgICBjdXJyZW50U3RhZ2U6IHF1ZXN0LmdldEN1cnJlbnRTdGFnZUlEKCksXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBvYmplY3RpdmVzXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfYykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBnZXRPcGVuTWVudXMgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0IH0gZnJvbSBcIi4vY29sbGVjdG9ycy9jcm9zc2hhaXItY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0RW52aXJvbm1lbnRTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvZW52aXJvbm1lbnQtY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0SW5wdXRTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvaW5wdXQtY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0TG9jYXRpb25TdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbG9jYXRpb24tY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0TmVhcmJ5TnBjcyB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbmVhcmJ5LWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFBsYXllckZ1bGxTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvcGxheWVyLWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFF1ZXN0U3RhdGUgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL3F1ZXN0LWNvbGxlY3RvclwiO1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN0YXRlKHN0YXRlLCBwcmlvcml0eSkge1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBwcm90b2NvbFZlcnNpb246IDEsXG4gICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgc291cmNlOiBcInNreWd1aWRlXCIsXG4gICAgICAgIGRhdGE6IHN0YXRlLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICB9O1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVGdWxsU3RhdGUoZXZlbnRUeXBlKSB7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdm9pZCAwKSB7IGV2ZW50VHlwZSA9IFwidGlja1wiOyB9XG4gICAgdmFyIHBsYXllciA9IG51bGw7XG4gICAgdmFyIG5lYXJieU5wY3MgPSBbXTtcbiAgICB2YXIgY3Jvc3NoYWlyVGFyZ2V0ID0gbnVsbDtcbiAgICB2YXIgbG9jYXRpb24gPSBudWxsO1xuICAgIHZhciBxdWVzdCA9IG51bGw7XG4gICAgdmFyIGlucHV0ID0gbnVsbDtcbiAgICB2YXIgZW52aXJvbm1lbnQgPSBudWxsO1xuICAgIHZhciBtZW51ID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBwbGF5ZXIgPSBjb2xsZWN0UGxheWVyRnVsbFN0YXRlKCk7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICBwbGF5ZXIgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBuZWFyYnlOcGNzID0gY29sbGVjdE5lYXJieU5wY3MoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9iKSB7XG4gICAgICAgIG5lYXJieU5wY3MgPSBbXTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgY3Jvc3NoYWlyVGFyZ2V0ID0gY29sbGVjdENyb3NzaGFpclRhcmdldCgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2MpIHtcbiAgICAgICAgY3Jvc3NoYWlyVGFyZ2V0ID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbG9jYXRpb24gPSBjb2xsZWN0TG9jYXRpb25TdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgbG9jYXRpb24gPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBxdWVzdCA9IGNvbGxlY3RRdWVzdFN0YXRlKCk7XG4gICAgfVxuICAgIGNhdGNoIChfZSkge1xuICAgICAgICBxdWVzdCA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlucHV0ID0gY29sbGVjdElucHV0U3RhdGUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgIGlucHV0ID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgZW52aXJvbm1lbnQgPSBjb2xsZWN0RW52aXJvbm1lbnRTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgZW52aXJvbm1lbnQgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBtZW51ID0ge1xuICAgICAgICAgICAgb3Blbk1lbnVzOiBBcnJheS5mcm9tKGdldE9wZW5NZW51cygpKVxuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoX2gpIHtcbiAgICAgICAgbWVudSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBmdWxsU3RhdGUgPSB7XG4gICAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgICBuZWFyYnlOcGNzOiBuZWFyYnlOcGNzLFxuICAgICAgICBjcm9zc2hhaXJUYXJnZXQ6IGNyb3NzaGFpclRhcmdldCxcbiAgICAgICAgbG9jYXRpb246IGxvY2F0aW9uLFxuICAgICAgICBxdWVzdDogcXVlc3QsXG4gICAgICAgIGlucHV0OiBpbnB1dCxcbiAgICAgICAgbWVudTogbWVudSxcbiAgICAgICAgZW52aXJvbm1lbnQ6IGVudmlyb25tZW50LFxuICAgICAgICBldmVudFR5cGU6IGV2ZW50VHlwZVxuICAgIH07XG4gICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgIHByb3RvY29sVmVyc2lvbjogMSxcbiAgICAgICAgcHJpb3JpdHk6IFwibWVkaXVtXCIsXG4gICAgICAgIHNvdXJjZTogXCJza3lndWlkZVwiLFxuICAgICAgICBkYXRhOiBmdWxsU3RhdGUsXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpO1xuICAgIH1cbiAgICBjYXRjaCAoX2opIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuIiwidmFyIHJ1bnRpbWUgPSBnbG9iYWxUaGlzO1xuaWYgKCFydW50aW1lLnNreXJpbVBsYXRmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdza3lyaW1QbGF0Zm9ybSBnbG9iYWwgaXMgbm90IGF2YWlsYWJsZScpO1xufVxudmFyIHNreXJpbVBsYXRmb3JtID0gcnVudGltZS5za3lyaW1QbGF0Zm9ybTtcbmV4cG9ydCB2YXIgb25jZSA9IHNreXJpbVBsYXRmb3JtLm9uY2UsIG9uID0gc2t5cmltUGxhdGZvcm0ub24sIHByaW50Q29uc29sZSA9IHNreXJpbVBsYXRmb3JtLnByaW50Q29uc29sZSwgRGVidWcgPSBza3lyaW1QbGF0Zm9ybS5EZWJ1ZywgaG9va3MgPSBza3lyaW1QbGF0Zm9ybS5ob29rcywgZmluZENvbnNvbGVDb21tYW5kID0gc2t5cmltUGxhdGZvcm0uZmluZENvbnNvbGVDb21tYW5kLCBPYmplY3RSZWZlcmVuY2UgPSBza3lyaW1QbGF0Zm9ybS5PYmplY3RSZWZlcmVuY2UsIEh0dHBDbGllbnQgPSBza3lyaW1QbGF0Zm9ybS5IdHRwQ2xpZW50LCBVaSA9IHNreXJpbVBsYXRmb3JtLlVpLCBHYW1lID0gc2t5cmltUGxhdGZvcm0uR2FtZSwgSW5wdXQgPSBza3lyaW1QbGF0Zm9ybS5JbnB1dCwgRHhTY2FuQ29kZSA9IHNreXJpbVBsYXRmb3JtLkR4U2NhbkNvZGUsIFV0aWxpdHkgPSBza3lyaW1QbGF0Zm9ybS5VdGlsaXR5LCBXZWF0aGVyID0gc2t5cmltUGxhdGZvcm0uV2VhdGhlcjtcbmV4cG9ydCBkZWZhdWx0IHNreXJpbVBsYXRmb3JtO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBza3lyaW1QbGF0Zm9ybTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBvbmNlLCBvbiwgcHJpbnRDb25zb2xlLCBob29rcywgZmluZENvbnNvbGVDb21tYW5kIH0gZnJvbSBcIi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IHJlZ2lzdGVyQWxsRXZlbnRzIH0gZnJvbSBcIi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBzdGFydFBvbGxpbmcgfSBmcm9tIFwiLi9hY3Rpb25zL3BvbGxpbmdcIjtcbmltcG9ydCB7IHNob3VsZFNlbmQgfSBmcm9tIFwiLi9hcmJpdHJhdGlvbi9wcmlvcml0eVwiO1xuaW1wb3J0IHsgc2VyaWFsaXplRnVsbFN0YXRlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9zZXJpYWxpemVyXCI7XG5pbXBvcnQgeyBzZW5kR2FtZVN0YXRlLCBpc0Nvbm5lY3RlZCB9IGZyb20gXCIuL2NvbW11bmljYXRpb24vaHR0cC1jbGllbnRcIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBsYXN0VGlja1RpbWUgPSAwO1xudmFyIHBsYXllckFuaW1hdGlvbiA9IFwiXCI7XG52YXIgZXZlbnRzUmVnaXN0ZXJlZCA9IGZhbHNlO1xudmFyIHBvbGxpbmdTdGFydGVkID0gZmFsc2U7XG52YXIgbGFzdENvbWJhdFN0YXRlID0gMDtcbnZhciBDT0xMRUNUT1JTX0NPVU5UID0gODtcbmZ1bmN0aW9uIGJ1aWxkQXJiaXRyYXRpb25TdGF0ZShldmVudFR5cGUsIGFuaW1hdGlvbikge1xuICAgIHJldHVybiB7XG4gICAgICAgIHBsYXllcjoge1xuICAgICAgICAgICAgaGVhbHRoOiAxLFxuICAgICAgICAgICAgbWF4SGVhbHRoOiAxLFxuICAgICAgICAgICAgbWFnaWNrYTogMCxcbiAgICAgICAgICAgIHN0YW1pbmE6IDAsXG4gICAgICAgICAgICBsZXZlbDogMSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiB7IHg6IDAsIHk6IDAsIHo6IDAgfSxcbiAgICAgICAgICAgIGlzU25lYWtpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNEZWFkOiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBjb21iYXRTdGF0ZTogMCxcbiAgICAgICAgZW5lbWllczogW10sXG4gICAgICAgIHBsYXllckFuaW1hdGlvbjogYW5pbWF0aW9uLFxuICAgICAgICBldmVudFR5cGU6IGV2ZW50VHlwZVxuICAgIH07XG59XG5mdW5jdGlvbiBwcm9jZXNzQW5kU2VuZChldmVudFR5cGUsIHByaW9yaXR5LCBhbmltYXRpb24pIHtcbiAgICBpZiAoYW5pbWF0aW9uID09PSB2b2lkIDApIHsgYW5pbWF0aW9uID0gXCJcIjsgfVxuICAgIHZhciBhcmJpdHJhdGlvblN0YXRlID0gYnVpbGRBcmJpdHJhdGlvblN0YXRlKGV2ZW50VHlwZSwgYW5pbWF0aW9uKTtcbiAgICBpZiAoIXNob3VsZFNlbmQocHJpb3JpdHksIGFyYml0cmF0aW9uU3RhdGUpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBheWxvYWQgPSBzZXJpYWxpemVGdWxsU3RhdGUoZXZlbnRUeXBlKTtcbiAgICBpZiAoIXBheWxvYWQpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gRmFpbGVkIHRvIHNlcmlhbGl6ZSBmdWxsIHN0YXRlIHBheWxvYWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZW5kR2FtZVN0YXRlKHBheWxvYWQpLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gRmFpbGVkIHRvIHNlbmQgZ2FtZSBzdGF0ZTogXCIuY29uY2F0KG1zZykpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VudCBzdGF0ZTogXCIuY29uY2F0KHByaW9yaXR5LCBcIiBwcmlvcml0eSAoXCIpLmNvbmNhdChldmVudFR5cGUsIFwiKVwiKSk7XG4gICAgfVxufVxudmFyIGlzTG9hZGVkID0gZmFsc2U7XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGlmIChpc0xvYWRlZClcbiAgICAgICAgcmV0dXJuO1xuICAgIHByaW50Q29uc29sZShcIlNreUd1aWRlIHBsdWdpbiBsb2FkZWQhXCIpO1xuICAgIC8vIERlYnVnLm5vdGlmaWNhdGlvbihcIlNreUd1aWRlIGlzIGFjdGl2ZVwiKTtcbiAgICByZWdpc3RlckFsbEV2ZW50cygpO1xuICAgIGV2ZW50c1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIHN0YXJ0UG9sbGluZygpO1xuICAgIHBvbGxpbmdTdGFydGVkID0gQ09ORklHLnBvbGxpbmdFbmFibGVkO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlNlcnZlcjogXCIuY29uY2F0KENPTkZJRy5zZXJ2ZXJVcmwpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiVGljayBpbnRlcnZhbDogXCIuY29uY2F0KENPTkZJRy50aWNrSW50ZXJ2YWwsIFwibXNcIikpO1xuICAgIH1cbiAgICBob29rcy5zZW5kQW5pbWF0aW9uRXZlbnQuYWRkKHtcbiAgICAgICAgZW50ZXI6IGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgICAgICAgIHZhciB2YWxpZEF0dGFja3MgPSBbXG4gICAgICAgICAgICAgICAgXCJhdHRhY2tsZWZ0XCIsXG4gICAgICAgICAgICAgICAgXCJhdHRhY2tyaWdodFwiLFxuICAgICAgICAgICAgICAgIFwiYXR0YWNra2lja1wiLFxuICAgICAgICAgICAgICAgIFwiYXR0YWNrM1wiLFxuICAgICAgICAgICAgICAgIFwiYXR0YWNrdGhyb3dcIlxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHZhciBldmVudExvd2VyID0gY3R4LmFuaW1FdmVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh2YWxpZEF0dGFja3Muc29tZShmdW5jdGlvbiAoYXR0YWNrKSB7IHJldHVybiBldmVudExvd2VyLmluY2x1ZGVzKGF0dGFjayk7IH0pKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyQW5pbWF0aW9uID0gY3R4LmFuaW1FdmVudE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxlYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH1cbiAgICB9LCBQTEFZRVJfRk9STV9JRCwgUExBWUVSX0ZPUk1fSUQgKyAxLCBcIkF0dGFjaypcIik7XG4gICAgaXNMb2FkZWQgPSB0cnVlO1xufVxub25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgaW5pdCgpO1xufSk7XG52YXIgc2t5Z3VpZGVDb21tYW5kID0gZmluZENvbnNvbGVDb21tYW5kKFwic2t5Z3VpZGVcIik7XG5pZiAoc2t5Z3VpZGVDb21tYW5kKSB7XG4gICAgc2t5Z3VpZGVDb21tYW5kLmV4ZWN1dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlNreUd1aWRlIFN0YXR1czpcIik7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgQ29ubmVjdGVkOiBcIi5jb25jYXQoaXNDb25uZWN0ZWQoKSkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFBvbGxpbmcgc3RhdHVzOiBcIi5jb25jYXQocG9sbGluZ1N0YXJ0ZWQgPyBcImFjdGl2ZVwiIDogXCJpbmFjdGl2ZVwiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgRXZlbnRzIHJlZ2lzdGVyZWQ6IFwiLmNvbmNhdChldmVudHNSZWdpc3RlcmVkID8gXCJ5ZXMgKDI4KVwiIDogXCJub1wiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgQ29sbGVjdG9ycyBjb3VudDogXCIuY29uY2F0KENPTExFQ1RPUlNfQ09VTlQpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBTZXJ2ZXI6IFwiLmNvbmNhdChDT05GSUcuc2VydmVyVXJsKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgVGljayBpbnRlcnZhbDogXCIuY29uY2F0KENPTkZJRy50aWNrSW50ZXJ2YWwsIFwibXNcIikpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIERlYnVnIG1vZGU6IFwiLmNvbmNhdChDT05GSUcuZGVidWdNb2RlKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG59XG5vbihcInRpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgIGluaXQoKTtcbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdFRpY2tUaW1lIDwgQ09ORklHLnRpY2tJbnRlcnZhbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxhc3RUaWNrVGltZSA9IG5vdztcbiAgICB2YXIgYW5pbWF0aW9uID0gcGxheWVyQW5pbWF0aW9uO1xuICAgIHBsYXllckFuaW1hdGlvbiA9IFwiXCI7XG4gICAgcHJvY2Vzc0FuZFNlbmQoXCJ0aWNrXCIsIFwibG93XCIsIGFuaW1hdGlvbik7XG59KTtcbm9uKFwiY29tYmF0U3RhdGVcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGFjdG9yID0gZXZlbnQuYWN0b3IuZ2V0Rm9ybUlEKCk7XG4gICAgaWYgKGFjdG9yICE9PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmICghaXNDb25uZWN0ZWQoKSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBuZXdTdGF0ZSA9IGV2ZW50LmlzQ29tYmF0ID8gMSA6IGV2ZW50LmlzU2VhcmNoaW5nID8gMiA6IDA7XG4gICAgdmFyIG9sZFN0YXRlID0gbGFzdENvbWJhdFN0YXRlO1xuICAgIGxhc3RDb21iYXRTdGF0ZSA9IG5ld1N0YXRlO1xuICAgIHByb2Nlc3NBbmRTZW5kKFwiY29tYmF0U3RhdGVfXCIuY29uY2F0KG5ld1N0YXRlKSwgXCJoaWdoXCIpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIkNvbWJhdCBzdGF0ZSBjaGFuZ2VkOiBcIi5jb25jYXQob2xkU3RhdGUsIFwiIC0+IFwiKS5jb25jYXQobmV3U3RhdGUpKTtcbiAgICB9XG59KTtcbm9uKFwiaGl0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBfYTtcbiAgICB2YXIgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpO1xuICAgIHZhciBzb3VyY2UgPSBldmVudC5hZ2dyZXNzb3IuZ2V0Rm9ybUlEKCk7XG4gICAgdmFyIHNvdXJjZUJhc2VGb3JtID0gKF9hID0gZXZlbnQuc291cmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgaWYgKHRhcmdldCAhPT0gUExBWUVSX0ZPUk1fSUQgJiYgc291cmNlICE9PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmICghaXNDb25uZWN0ZWQoKSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHByb2Nlc3NBbmRTZW5kKFwiaGl0XCIsIFwiaGlnaFwiKTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJIaXQgZXZlbnQ6IHRhcmdldD1cIi5jb25jYXQodGFyZ2V0LCBcIiwgc291cmNlPVwiKS5jb25jYXQoc291cmNlLCBcIiwgc291cmNlRm9ybT1cIikuY29uY2F0KFN0cmluZyhzb3VyY2VCYXNlRm9ybSkpKTtcbiAgICB9XG59KTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==