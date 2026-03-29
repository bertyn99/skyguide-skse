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
function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
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
            if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
                return null;
            }
            return { type: "move", x: x, y: y, z: z };
        }
        case "face": {
            var angle = raw.angle;
            if (!isFiniteNumber(angle)) {
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
            if (!isNonEmptyString(location)) {
                return null;
            }
            return { type: "fastTravel", location: location };
        }
        case "equip":
        case "useItem": {
            var itemName = raw.itemName;
            if (!isNonEmptyString(itemName)) {
                return null;
            }
            return { type: actionType, itemName: itemName };
        }
        case "heal": {
            var amount = raw.amount;
            if (!isFiniteNumber(amount) || amount <= 0) {
                return null;
            }
            return { type: "heal", amount: amount };
        }
        case "saveGame": {
            var name = raw.name;
            if (!isNonEmptyString(name)) {
                return null;
            }
            return { type: "saveGame", name: name };
        }
        case "notification": {
            var message = raw.message;
            if (!isNonEmptyString(message)) {
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




var INITIAL_BACKOFF_MS = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingInterval;
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
/* harmony export */   recordSentState: () => (/* binding */ recordSentState),
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
    void state;
    if (priority === "suppressed") {
        return false;
    }
    var now = Date.now();
    var lastSend = lastSendTimes[priority];
    var minInterval = rateLimits[priority];
    if (now - lastSend < minInterval) {
        return false;
    }
    // Rate-limit is attempt-based to avoid hammering transport on repeated failures.
    lastSendTimes[priority] = now;
    return true;
}
function recordSentState(state) {
    lastState = state;
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

/***/ "./src/game-state/collector.ts"
/*!*************************************!*\
  !*** ./src/game-state/collector.ts ***!
  \*************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectFullState: () => (/* binding */ collectFullState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


function getPlayerPosition() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return null;
    return {
        x: player.getPositionX(),
        y: player.getPositionY(),
        z: player.getPositionZ()
    };
}
function calculateDistance(x1, y1, z1, x2, y2, z2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var dz = z2 - z1;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function collectPlayerState() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return null;
    var pos = getPlayerPosition();
    if (!pos)
        return null;
    return {
        health: player.getActorValue("health"),
        maxHealth: player.getBaseActorValue("health"),
        magicka: player.getActorValue("magicka"),
        stamina: player.getActorValue("stamina"),
        level: player.getLevel(),
        position: pos,
        isSneaking: player.isSneaking(),
        isDead: player.isDead()
    };
}
function collectEnemies() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return [];
    var playerPos = getPlayerPosition();
    if (!playerPos)
        return [];
    var seenFormIds = new Set();
    var enemies = [];
    // Multi-scan: center + 8 offset positions to find multiple actors
    // Game.findClosestActor() only returns ONE actor, so we scan multiple positions
    var scanOffsets = [
        { x: 0, y: 0 },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius, y: 0 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius, y: 0 },
        { x: 0, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius },
        { x: 0, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 },
        { x: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707, y: -_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius * 0.707 }
    ];
    for (var _i = 0, scanOffsets_1 = scanOffsets; _i < scanOffsets_1.length; _i++) {
        var offset = scanOffsets_1[_i];
        if (enemies.length >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxEnemies)
            break;
        var scanX = playerPos.x + offset.x;
        var scanY = playerPos.y + offset.y;
        var scanZ = playerPos.z;
        var actor = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.findClosestActor(scanX, scanY, scanZ, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.enemyScanRadius);
        if (!actor)
            continue;
        // Skip player
        if (actor.getFormID() === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID)
            continue;
        // Skip dead actors
        if (actor.isDead())
            continue;
        // Deduplicate by formId
        var formId = actor.getFormID();
        if (seenFormIds.has(formId))
            continue;
        seenFormIds.add(formId);
        var actorPos = {
            x: actor.getPositionX(),
            y: actor.getPositionY(),
            z: actor.getPositionZ()
        };
        var distance = calculateDistance(playerPos.x, playerPos.y, playerPos.z, actorPos.x, actorPos.y, actorPos.z);
        var baseObj = actor.getBaseObject();
        var name = baseObj ? baseObj.getName() || "Unknown" : "Unknown";
        enemies.push({
            formId: formId,
            name: name,
            distance: distance,
            health: actor.getActorValue("health"),
            level: actor.getLevel()
        });
    }
    return enemies;
}
function collectFullState(playerAnimation, eventType) {
    var _a, _b;
    if (playerAnimation === void 0) { playerAnimation = ""; }
    if (eventType === void 0) { eventType = "tick"; }
    var player = collectPlayerState();
    if (!player)
        return null;
    var combatState = (_b = (_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer()) === null || _a === void 0 ? void 0 : _a.getCombatState()) !== null && _b !== void 0 ? _b : 0;
    var enemies = collectEnemies();
    return {
        player: player,
        combatState: combatState,
        enemies: enemies,
        playerAnimation: playerAnimation,
        eventType: eventType
    };
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
function serializeFullState(eventType, priority) {
    if (eventType === void 0) { eventType = "tick"; }
    if (priority === void 0) { priority = "medium"; }
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
        priority: priority,
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
/* harmony import */ var _game_state_collector__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./game-state/collector */ "./src/game-state/collector.ts");
/* harmony import */ var _communication_http_client__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./communication/http-client */ "./src/communication/http-client.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./config */ "./src/config.ts");








var lastTickTime = 0;
var playerAnimation = "";
var eventsRegistered = false;
var pollingStarted = false;
var lastCombatState = 0;
var lastMovementLogTime = 0;
var lastLoggedPosition = null;
var COLLECTORS_COUNT = 8;
var MOVEMENT_LOG_MIN_DISTANCE = 100;
var MOVEMENT_LOG_INTERVAL_MS = 1000;
/**
 * findConsoleCommand only resolves built-in SCRIPT_FUNCTION entries; it cannot invent new commands.
 * We repurpose an existing slot and rename it to "skyguide" (see skymp/docs/skyrim_platform/features.md).
 */
var HOST_CONSOLE_COMMAND_FOR_SKYGUIDE = "GetAVInfo";
function registerSkyguideConsoleCommand() {
    var host = (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.findConsoleCommand)(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE);
    if (!host) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Console hook failed: no \"".concat(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE, "\" command (unexpected)."));
        return;
    }
    host.longName = "skyguide";
    host.shortName = "";
    host.numArgs = 0;
    host.execute = function () {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide Status:");
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Connected: ".concat((0,_communication_http_client__WEBPACK_IMPORTED_MODULE_6__.isConnected)()));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Polling status: ".concat(pollingStarted ? "active" : "inactive"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Events registered: ".concat(eventsRegistered ? "yes" : "no"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Collectors count: ".concat(COLLECTORS_COUNT));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.tickInterval, "ms (on update)"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Debug mode: ".concat(_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode));
        // Returning false avoids running the original host command implementation.
        return false;
    };
    if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Console: ~".concat(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE, " is now ~skyguide"));
    }
}
function processAndSend(eventType, animation) {
    if (animation === void 0) { animation = ""; }
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_6__.isConnected)()) {
        return;
    }
    var state = (0,_game_state_collector__WEBPACK_IMPORTED_MODULE_5__.collectFullState)(animation, eventType);
    if (!state) {
        if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] collectFullState returned null; skip send");
        }
        return;
    }
    var priority = (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.evaluatePriority)(state);
    if (!(0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.shouldSend)(priority, state)) {
        return;
    }
    var payload = (0,_game_state_serializer__WEBPACK_IMPORTED_MODULE_4__.serializeFullState)(eventType, priority);
    if (!payload) {
        if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Failed to serialize full state payload");
        }
        return;
    }
    (0,_communication_http_client__WEBPACK_IMPORTED_MODULE_6__.sendGameState)(payload)
        .then(function (sent) {
        if (sent) {
            (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.recordSentState)(state);
            if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Sent state: ".concat(priority, " priority (").concat(eventType, ")"));
            }
        }
    })
        .catch(function (err) {
        var msg = err instanceof Error ? err.message : String(err);
        if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Failed to send game state: ".concat(msg));
        }
    });
}
function safeProcessAndSend(eventType, animation) {
    if (animation === void 0) { animation = ""; }
    try {
        processAndSend(eventType, animation);
    }
    catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] processAndSend failed (".concat(eventType, "): ").concat(msg));
        }
    }
}
function distance3D(from, to) {
    var dx = to.x - from.x;
    var dy = to.y - from.y;
    var dz = to.z - from.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function logPlayerWalking(now) {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player || player.isDead()) {
        lastLoggedPosition = null;
        return;
    }
    var currentPosition = {
        x: player.getPositionX(),
        y: player.getPositionY(),
        z: player.getPositionZ()
    };
    if (!lastLoggedPosition) {
        lastLoggedPosition = currentPosition;
        return;
    }
    var walkedDistance = distance3D(lastLoggedPosition, currentPosition);
    if (walkedDistance < MOVEMENT_LOG_MIN_DISTANCE) {
        return;
    }
    if (now - lastMovementLogTime < MOVEMENT_LOG_INTERVAL_MS) {
        return;
    }
    var movementKind = player.isSprinting()
        ? "sprinting"
        : player.isRunning()
            ? "running"
            : "walking";
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Player ".concat(movementKind, ": x=").concat(currentPosition.x.toFixed(0), " y=").concat(currentPosition.y.toFixed(0), " z=").concat(currentPosition.z.toFixed(0), " (moved ").concat(walkedDistance.toFixed(0), ")"));
    lastLoggedPosition = currentPosition;
    lastMovementLogTime = now;
}
var isLoaded = false;
function init() {
    if (isLoaded)
        return;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide plugin loaded!");
    (0,_events__WEBPACK_IMPORTED_MODULE_1__.registerAllEvents)();
    eventsRegistered = true;
    (0,_actions_polling__WEBPACK_IMPORTED_MODULE_2__.startPolling)();
    pollingStarted = _config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.pollingEnabled;
    if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.tickInterval, "ms (on update)"));
    }
    // Register before hooks.sendAnimationEvent; if that throws (e.g. main menu state), we still get a ~ command.
    try {
        registerSkyguideConsoleCommand();
    }
    catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Console command registration failed: ".concat(msg));
    }
    try {
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
        }, _config__WEBPACK_IMPORTED_MODULE_7__.PLAYER_FORM_ID, _config__WEBPACK_IMPORTED_MODULE_7__.PLAYER_FORM_ID, "Attack*");
    }
    catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] sendAnimationEvent hook failed (non-fatal): ".concat(msg));
    }
    isLoaded = true;
}
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
    init();
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("update", function () {
    var now = Date.now();
    logPlayerWalking(now);
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_6__.isConnected)()) {
        return;
    }
    if (now - lastTickTime < _config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.tickInterval) {
        return;
    }
    lastTickTime = now;
    var animation = playerAnimation;
    playerAnimation = "";
    safeProcessAndSend("tick", animation);
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("combatState", function (event) {
    var actor = event.actor.getFormID();
    if (actor !== _config__WEBPACK_IMPORTED_MODULE_7__.PLAYER_FORM_ID)
        return;
    var newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
    var oldState = lastCombatState;
    lastCombatState = newState;
    safeProcessAndSend("combatState_".concat(newState));
    if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Combat state changed: ".concat(oldState, " -> ").concat(newState));
    }
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("hit", function (event) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var target = (_c = (_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.getFormID) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
    var source = (_f = (_e = (_d = event.aggressor) === null || _d === void 0 ? void 0 : _d.getFormID) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : 0;
    var sourceBaseForm = (_h = (_g = event.source) === null || _g === void 0 ? void 0 : _g.getFormID) === null || _h === void 0 ? void 0 : _h.call(_g);
    if (target !== _config__WEBPACK_IMPORTED_MODULE_7__.PLAYER_FORM_ID && source !== _config__WEBPACK_IMPORTED_MODULE_7__.PLAYER_FORM_ID)
        return;
    safeProcessAndSend("hit");
    if (_config__WEBPACK_IMPORTED_MODULE_7__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Hit event: target=".concat(target, ", source=").concat(source, ", sourceForm=").concat(String(sourceBaseForm)));
    }
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUFDTCxJQUFJLG1EQUFFO0FBQ04sNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7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O0FBQ0EsNkJBQTZCLDJDQUFNO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0Esa0JBQWtCLG1EQUFjO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLDJDQUFNO0FBQ2QsUUFBUSw2REFBWTtBQUNwQjtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG1EQUFjLGVBQWUsbURBQWM7QUFDOUQ7QUFDQTtBQUNBLFFBQVEsMkNBQU07QUFDZCxRQUFRLDZEQUFZO0FBQ3BCO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL2V4ZWN1dG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL3BhcnNlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvYWN0aW9ucy9wb2xsaW5nLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hcmJpdHJhdGlvbi9wcmlvcml0eS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29tbXVuaWNhdGlvbi9odHRwLWNsaWVudC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9ldmVudHMudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvY3Jvc3NoYWlyLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2Vudmlyb25tZW50LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2lucHV0LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2xvY2F0aW9uLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL25lYXJieS1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9wbGF5ZXItY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvcXVlc3QtY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL3NlcmlhbGl6ZXIudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3NreXJpbVBsYXRmb3JtLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi9leHRlcm5hbCB2YXIgW1wic2t5cmltUGxhdGZvcm1cIl0iLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZywgRHhTY2FuQ29kZSwgR2FtZSwgSW5wdXQsIFVpLCBwcmludENvbnNvbGUgfSBmcm9tIFwiLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5mdW5jdGlvbiBsb2dEZWJ1ZyhtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW2FjdGlvbnMvZXhlY3V0b3JdIFwiLmNvbmNhdChtZXNzYWdlKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNWYWxpZEZvcm0oZm9ybSkge1xuICAgIGlmIChmb3JtID09PSBudWxsIHx8IGZvcm0gPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgZm9ybSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBjYW5kaWRhdGUgPSBmb3JtO1xuICAgIHZhciBkZWxldGVkID0gdHlwZW9mIGNhbmRpZGF0ZS5pc0RlbGV0ZWQgPT09IFwiZnVuY3Rpb25cIiA/IGNhbmRpZGF0ZS5pc0RlbGV0ZWQoKSA6IGZhbHNlO1xuICAgIHZhciBkaXNhYmxlZCA9IHR5cGVvZiBjYW5kaWRhdGUuaXNEaXNhYmxlZCA9PT0gXCJmdW5jdGlvblwiID8gY2FuZGlkYXRlLmlzRGlzYWJsZWQoKSA6IGZhbHNlO1xuICAgIHJldHVybiAhZGVsZXRlZCAmJiAhZGlzYWJsZWQ7XG59XG5mdW5jdGlvbiBnZXRSZWZlcmVuY2VGb3JtSWQocmVmKSB7XG4gICAgaWYgKHJlZiA9PT0gbnVsbCB8fCByZWYgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgcmVmICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB2YXIgY2FuZGlkYXRlID0gcmVmO1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlLmdldEZvcm1JRCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHZhciBpZCA9IGNhbmRpZGF0ZS5nZXRGb3JtSUQoKTtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiA/IGlkIDogbnVsbDtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuZ2V0Rm9ybUlkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIGlkID0gY2FuZGlkYXRlLmdldEZvcm1JZCgpO1xuICAgICAgICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiID8gaWQgOiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGlzVmFsaWRSZWZlcmVuY2UocmVmKSB7XG4gICAgaWYgKHJlZiA9PT0gbnVsbCB8fCByZWYgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgcmVmICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGNhbmRpZGF0ZSA9IHJlZjtcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5hY3RpdmF0ZSAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGZvcm1JZCA9IGdldFJlZmVyZW5jZUZvcm1JZChyZWYpO1xuICAgIGlmIChmb3JtSWQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZm9ybSA9IEdhbWUuZ2V0Rm9ybUV4KGZvcm1JZCk7XG4gICAgcmV0dXJuIGlzVmFsaWRGb3JtKGZvcm0pO1xufVxuZnVuY3Rpb24gZ2V0UGxheWVyUG9zaXRpb24ocGxheWVyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcGxheWVyLmdldFBvc2l0aW9uWCgpLFxuICAgICAgICB5OiBwbGF5ZXIuZ2V0UG9zaXRpb25ZKCksXG4gICAgICAgIHo6IHBsYXllci5nZXRQb3NpdGlvblooKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gaXNBY3Rpb25CbG9ja2VkQnlVaSgpIHtcbiAgICBpZiAoVWkuaXNNZW51T3BlbihcIkxvYWRpbmcgTWVudVwiKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBMb2FkaW5nIE1lbnUgaXMgb3BlblwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChVaS5pc01lbnVPcGVuKFwiTWVzc2FnZUJveE1lbnVcIikpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogTWVzc2FnZUJveE1lbnUgaXMgb3BlblwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIGdldENsb3Nlc3RSZWZlcmVuY2UoeCwgeSwgeiwgcmFkaXVzKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB2YXIgZ2FtZVdpdGhDbG9zZXN0UmVmZXJlbmNlID0gR2FtZTtcbiAgICByZXR1cm4gKF9iID0gKF9hID0gZ2FtZVdpdGhDbG9zZXN0UmVmZXJlbmNlLmZpbmRDbG9zZXN0UmVmZXJlbmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY2FsbChnYW1lV2l0aENsb3Nlc3RSZWZlcmVuY2UsIHgsIHksIHosIHJhZGl1cykpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG59XG5mdW5jdGlvbiBleGVjdXRlU2FmZWx5KGFjdGlvblR5cGUsIG9wZXJhdGlvbikge1xuICAgIHRyeSB7XG4gICAgICAgIG9wZXJhdGlvbigpO1xuICAgICAgICBsb2dEZWJ1ZyhcIkV4ZWN1dGVkIGFjdGlvbjogXCIuY29uY2F0KGFjdGlvblR5cGUpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBmYWlsZWQ6IFwiLmNvbmNhdChhY3Rpb25UeXBlLCBcIiAoXCIpLmNvbmNhdChTdHJpbmcoZXJyb3IpLCBcIilcIikpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVsZWFzZUJsb2NrQWZ0ZXJEZWxheShkZWxheU1zKSB7XG4gICAgdmFyIHJ1bnRpbWVUaW1lcnMgPSBnbG9iYWxUaGlzO1xuICAgIGlmICh0eXBlb2YgcnVudGltZVRpbWVycy5zZXRUaW1lb3V0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcnVudGltZVRpbWVycy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIElucHV0LnJlbGVhc2VLZXkoNDIgLyogRHhTY2FuQ29kZS5MZWZ0U2hpZnQgKi8pO1xuICAgICAgICB9LCBkZWxheU1zKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBAdHMtaWdub3JlXG4gICAgSW5wdXQucmVsZWFzZUtleSg0MiAvKiBEeFNjYW5Db2RlLkxlZnRTaGlmdCAqLyk7XG59XG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUFjdGlvbihhY3Rpb24pIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBwbGF5ZXIgaXMgbnVsbFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgcGxheWVyRm9ybSA9IEdhbWUuZ2V0Rm9ybUV4KFBMQVlFUl9GT1JNX0lEKTtcbiAgICBpZiAoIWlzVmFsaWRGb3JtKHBsYXllckZvcm0pKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiQWN0aW9uIGJsb2NrZWQ6IHBsYXllciBmb3JtIGludmFsaWQvZGVsZXRlZC9kaXNhYmxlZFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoaXNBY3Rpb25CbG9ja2VkQnlVaSgpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgc3dpdGNoIChhY3Rpb24udHlwZSkge1xuICAgICAgICBjYXNlIFwibW92ZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zZXRQb3NpdGlvbihhY3Rpb24ueCwgYWN0aW9uLnksIGFjdGlvbi56KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYWNlXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnNldEFuZ2xlKDAsIDAsIGFjdGlvbi5hbmdsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYWN0aXZhdGVcIjoge1xuICAgICAgICAgICAgdmFyIF9hID0gZ2V0UGxheWVyUG9zaXRpb24ocGxheWVyKSwgeCA9IF9hLngsIHkgPSBfYS55LCB6ID0gX2EuejtcbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcImNyb3NzaGFpclwiKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNyb3NzaGFpclJlZl8xID0gR2FtZS5nZXRDdXJyZW50Q3Jvc3NoYWlyUmVmKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKGNyb3NzaGFpclJlZl8xKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkFjdGl2YXRlIGJsb2NrZWQ6IGludmFsaWQgY3Jvc3NoYWlyIHJlZmVyZW5jZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBjcm9zc2hhaXJSZWZfMS5hY3RpdmF0ZShwbGF5ZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFjdGlvbi50YXJnZXQgPT09IFwibmVhcmVzdE5QQ1wiKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5lYXJlc3ROcGNfMSA9IEdhbWUuZmluZENsb3Nlc3RBY3Rvcih4LCB5LCB6LCAyMDAwKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWRSZWZlcmVuY2UobmVhcmVzdE5wY18xKSkge1xuICAgICAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkFjdGl2YXRlIGJsb2NrZWQ6IG5vIHZhbGlkIG5lYXJlc3QgTlBDXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3ROcGNfMS5hY3RpdmF0ZShwbGF5ZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGFjdGlvbi50YXJnZXQgPT09IFwibmVhcmVzdERvb3JcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZWFyZXN0RG9vcl8xID0gZ2V0Q2xvc2VzdFJlZmVyZW5jZSh4LCB5LCB6LCAyMDAwKTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzVmFsaWRSZWZlcmVuY2UobmVhcmVzdERvb3JfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBubyB2YWxpZCBuZWFyZXN0IGRvb3JcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbmVhcmVzdERvb3JfMS5hY3RpdmF0ZShwbGF5ZXIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG5lYXJlc3RDb250YWluZXJfMSA9IGdldENsb3Nlc3RSZWZlcmVuY2UoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRSZWZlcmVuY2UobmVhcmVzdENvbnRhaW5lcl8xKSkge1xuICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBjb250YWluZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZWFyZXN0Q29udGFpbmVyXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYXN0VHJhdmVsXCI6IHtcbiAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIkZhc3QgdHJhdmVsIG5vdCBzdXBwb3J0ZWQgdmlhIEFQSVwiKTtcbiAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFzdCB0cmF2ZWwgYmxvY2tlZCBmb3IgbG9jYXRpb246IFwiLmNvbmNhdChhY3Rpb24ubG9jYXRpb24pKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZHJhd1dlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kcmF3V2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2hlYXRoZVdlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zaGVhdGhlV2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXR0YWNrXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIElucHV0LnRhcEtleSg1Nyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYmxvY2tcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgSW5wdXQuaG9sZEtleSg0Mik7XG4gICAgICAgICAgICAgICAgcmVsZWFzZUJsb2NrQWZ0ZXJEZWxheSg1MDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImVxdWlwXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiRXF1aXA6IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ1c2VJdGVtXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiVXNlIGl0ZW06IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJoZWFsXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnJlc3RvcmVBY3RvclZhbHVlKFwiaGVhbHRoXCIsIGFjdGlvbi5hbW91bnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNhdmVHYW1lXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgR2FtZS5zYXZlR2FtZShhY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKGFjdGlvbi5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmb3JjZVRoaXJkUGVyc29uXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgR2FtZS5mb3JjZVRoaXJkUGVyc29uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZm9yY2VGaXJzdFBlcnNvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuZm9yY2VGaXJzdFBlcnNvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ2YXIgQUNUSU9OX1RZUEVTID0gbmV3IFNldChbXG4gICAgXCJtb3ZlXCIsXG4gICAgXCJmYWNlXCIsXG4gICAgXCJhY3RpdmF0ZVwiLFxuICAgIFwiZmFzdFRyYXZlbFwiLFxuICAgIFwiZHJhd1dlYXBvblwiLFxuICAgIFwic2hlYXRoZVdlYXBvblwiLFxuICAgIFwiYXR0YWNrXCIsXG4gICAgXCJibG9ja1wiLFxuICAgIFwiZXF1aXBcIixcbiAgICBcInVzZUl0ZW1cIixcbiAgICBcImhlYWxcIixcbiAgICBcInNhdmVHYW1lXCIsXG4gICAgXCJub3RpZmljYXRpb25cIixcbiAgICBcImZvcmNlVGhpcmRQZXJzb25cIixcbiAgICBcImZvcmNlRmlyc3RQZXJzb25cIixcbl0pO1xudmFyIEFDVElWQVRFX1RBUkdFVFMgPSBuZXcgU2V0KFtcbiAgICBcImNyb3NzaGFpclwiLFxuICAgIFwibmVhcmVzdE5QQ1wiLFxuICAgIFwibmVhcmVzdERvb3JcIixcbiAgICBcIm5lYXJlc3RDb250YWluZXJcIixcbl0pO1xuZnVuY3Rpb24gaXNBY3RpdmF0ZVRhcmdldCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgQUNUSVZBVEVfVEFSR0VUUy5oYXModmFsdWUpO1xufVxuZnVuY3Rpb24gaXNSZWNvcmQodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsO1xufVxuZnVuY3Rpb24gaXNGaW5pdGVOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSk7XG59XG5mdW5jdGlvbiBpc05vbkVtcHR5U3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkubGVuZ3RoID4gMDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGlvbihyYXcpIHtcbiAgICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBhY3Rpb25UeXBlID0gcmF3LnR5cGU7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25UeXBlICE9PSBcInN0cmluZ1wiIHx8ICFBQ1RJT05fVFlQRVMuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgdmFyIHggPSByYXcueCwgeSA9IHJhdy55LCB6ID0gcmF3Lno7XG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlTnVtYmVyKHgpIHx8ICFpc0Zpbml0ZU51bWJlcih5KSB8fCAhaXNGaW5pdGVOdW1iZXIoeikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibW92ZVwiLCB4OiB4LCB5OiB5LCB6OiB6IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhY2VcIjoge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gcmF3LmFuZ2xlO1xuICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZU51bWJlcihhbmdsZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFjZVwiLCBhbmdsZTogYW5nbGUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYWN0aXZhdGVcIjoge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHJhdy50YXJnZXQ7XG4gICAgICAgICAgICBpZiAoIWlzQWN0aXZhdGVUYXJnZXQodGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJhY3RpdmF0ZVwiLCB0YXJnZXQ6IHRhcmdldCB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYXN0VHJhdmVsXCI6IHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJhdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIGlmICghaXNOb25FbXB0eVN0cmluZyhsb2NhdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFzdFRyYXZlbFwiLCBsb2NhdGlvbjogbG9jYXRpb24gfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZXF1aXBcIjpcbiAgICAgICAgY2FzZSBcInVzZUl0ZW1cIjoge1xuICAgICAgICAgICAgdmFyIGl0ZW1OYW1lID0gcmF3Lml0ZW1OYW1lO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKGl0ZW1OYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogYWN0aW9uVHlwZSwgaXRlbU5hbWU6IGl0ZW1OYW1lIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhlYWxcIjoge1xuICAgICAgICAgICAgdmFyIGFtb3VudCA9IHJhdy5hbW91bnQ7XG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlTnVtYmVyKGFtb3VudCkgfHwgYW1vdW50IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiaGVhbFwiLCBhbW91bnQ6IGFtb3VudCB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzYXZlR2FtZVwiOiB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHJhdy5uYW1lO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcInNhdmVHYW1lXCIsIG5hbWU6IG5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gcmF3Lm1lc3NhZ2U7XG4gICAgICAgICAgICBpZiAoIWlzTm9uRW1wdHlTdHJpbmcobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibm90aWZpY2F0aW9uXCIsIG1lc3NhZ2U6IG1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZHJhd1dlYXBvblwiOlxuICAgICAgICBjYXNlIFwic2hlYXRoZVdlYXBvblwiOlxuICAgICAgICBjYXNlIFwiYXR0YWNrXCI6XG4gICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICBjYXNlIFwiZm9yY2VUaGlyZFBlcnNvblwiOlxuICAgICAgICBjYXNlIFwiZm9yY2VGaXJzdFBlcnNvblwiOlxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogYWN0aW9uVHlwZSB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQWN0aW9uKGFjdGlvbikge1xuICAgIHZvaWQgYWN0aW9uO1xuICAgIHJldHVybiB0cnVlO1xufVxuIiwidmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19nZW5lcmF0b3IgPSAodGhpcyAmJiB0aGlzLl9fZ2VuZXJhdG9yKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgYm9keSkge1xuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xuICAgIHJldHVybiBnLm5leHQgPSB2ZXJiKDApLCBnW1widGhyb3dcIl0gPSB2ZXJiKDEpLCBnW1wicmV0dXJuXCJdID0gdmVyYigyKSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XG4gICAgfVxufTtcbmltcG9ydCAqIGFzIFNrVCBmcm9tICdAc2t5cmltLXBsYXRmb3JtL3NreXJpbS1wbGF0Zm9ybSc7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwYXJzZUFjdGlvbiB9IGZyb20gXCIuL3BhcnNlclwiO1xuaW1wb3J0IHsgZXhlY3V0ZUFjdGlvbiB9IGZyb20gXCIuL2V4ZWN1dG9yXCI7XG52YXIgSU5JVElBTF9CQUNLT0ZGX01TID0gQ09ORklHLnBvbGxpbmdJbnRlcnZhbDtcbnZhciBwb2xsaW5nQ2xpZW50ID0gbnVsbDtcbnZhciBiYWNrb2ZmTXMgPSBJTklUSUFMX0JBQ0tPRkZfTVM7XG52YXIgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG52YXIgcG9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xudmFyIHBvbGxUaW1lcklkID0gbnVsbDtcbmZ1bmN0aW9uIGxvZ0RlYnVnKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBTa1QucHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBvbGxGb3JBY3Rpb25zKCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlLCBwYXJzZWQsIGFjdGlvbnMsIF9pLCBhY3Rpb25zXzEsIHJhdywgYWN0aW9uLCBlcnJfMSwgbXNnO1xuICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBvbGxpbmdDbGllbnQgfHwgIXBvbGxpbmdBY3RpdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgICAgIGlmIChTa1QuVWkuaXNNZW51T3BlbihcIkxvYWRpbmcgTWVudVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJMb2FkaW5nIHNjcmVlbiBvcGVuIOKAlCBza2lwcGluZyBhY3Rpb24gcG9sbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlTmV4dFBvbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDE7XG4gICAgICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgICAgICBfYS50cnlzLnB1c2goWzEsIDMsICwgNF0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCBwb2xsaW5nQ2xpZW50LmdldChDT05GSUcucG9sbGluZ0VuZHBvaW50KV07XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tvZmZNcyA9IElOSVRJQUxfQkFDS09GRl9NUztcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZCA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZShyZXNwb25zZS5ib2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChfYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFpbGVkIHRvIHBhcnNlIGFjdGlvbiByZXNwb25zZSBib2R5IGFzIEpTT05cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVOZXh0UG9sbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhcnNlZCkgPyBwYXJzZWQgOiBbcGFyc2VkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoX2kgPSAwLCBhY3Rpb25zXzEgPSBhY3Rpb25zOyBfaSA8IGFjdGlvbnNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXcgPSBhY3Rpb25zXzFbX2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9IHBhcnNlQWN0aW9uKHJhdyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjdXRlQWN0aW9uKGFjdGlvbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlRmFpbHVyZShcIkhUVFAgXCIuY29uY2F0KHJlc3BvbnNlLnN0YXR1cykpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDRdO1xuICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgZXJyXzEgPSBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgIG1zZyA9IGVycl8xIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJfMS5tZXNzYWdlIDogU3RyaW5nKGVycl8xKTtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlRmFpbHVyZShtc2cpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCA0XTtcbiAgICAgICAgICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlTmV4dFBvbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGhhbmRsZUZhaWx1cmUocmVhc29uKSB7XG4gICAgY29uc2VjdXRpdmVGYWlsdXJlcysrO1xuICAgIGxvZ0RlYnVnKFwiUG9sbCBmYWlsZWQgKFwiLmNvbmNhdChjb25zZWN1dGl2ZUZhaWx1cmVzLCBcIi9cIikuY29uY2F0KENPTkZJRy5tYXhQb2xsaW5nUmV0cmllcywgXCIpOiBcIikuY29uY2F0KHJlYXNvbikpO1xuICAgIGlmIChjb25zZWN1dGl2ZUZhaWx1cmVzID49IENPTkZJRy5tYXhQb2xsaW5nUmV0cmllcykge1xuICAgICAgICBsb2dEZWJ1ZyhcIk1heCByZXRyaWVzIHJlYWNoZWQgXFx1MjAxNCBwYXVzaW5nIGZvciBcIi5jb25jYXQoQ09ORklHLnBvbGxpbmdNYXhCYWNrb2ZmLCBcIm1zXCIpKTtcbiAgICAgICAgYmFja29mZk1zID0gQ09ORklHLnBvbGxpbmdNYXhCYWNrb2ZmO1xuICAgICAgICBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGJhY2tvZmZNcyA9IE1hdGgubWluKGJhY2tvZmZNcyAqIDIsIENPTkZJRy5wb2xsaW5nTWF4QmFja29mZik7XG4gICAgfVxufVxuZnVuY3Rpb24gc2NoZWR1bGVOZXh0UG9sbCgpIHtcbiAgICBpZiAoIXBvbGxpbmdBY3RpdmUpXG4gICAgICAgIHJldHVybjtcbiAgICBwb2xsVGltZXJJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBwb2xsVGltZXJJZCA9IG51bGw7XG4gICAgICAgIHBvbGxGb3JBY3Rpb25zKCk7XG4gICAgfSwgYmFja29mZk1zKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFBvbGxpbmcoKSB7XG4gICAgaWYgKCFDT05GSUcucG9sbGluZ0VuYWJsZWQpIHtcbiAgICAgICAgbG9nRGVidWcoXCJQb2xsaW5nIGRpc2FibGVkIGJ5IGNvbmZpZ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocG9sbGluZ0FjdGl2ZSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIlBvbGxpbmcgYWxyZWFkeSBhY3RpdmVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcG9sbGluZ0NsaWVudCA9IG5ldyBTa1QuSHR0cENsaWVudChDT05GSUcuc2VydmVyVXJsKTtcbiAgICBwb2xsaW5nQWN0aXZlID0gdHJ1ZTtcbiAgICBiYWNrb2ZmTXMgPSBJTklUSUFMX0JBQ0tPRkZfTVM7XG4gICAgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG4gICAgbG9nRGVidWcoXCJTdGFydGluZyBhY3Rpb24gcG9sbGluZ1wiKTtcbiAgICBTa1Qub25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvbGxGb3JBY3Rpb25zKCk7XG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3RvcFBvbGxpbmcoKSB7XG4gICAgcG9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgIGlmIChwb2xsVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocG9sbFRpbWVySWQpO1xuICAgICAgICBwb2xsVGltZXJJZCA9IG51bGw7XG4gICAgfVxuICAgIHBvbGxpbmdDbGllbnQgPSBudWxsO1xuICAgIGxvZ0RlYnVnKFwiQWN0aW9uIHBvbGxpbmcgc3RvcHBlZFwiKTtcbn1cbiIsInZhciBsYXN0U3RhdGUgPSBudWxsO1xudmFyIGxhc3RTZW5kVGltZXMgPSB7XG4gICAgY3JpdGljYWw6IDAsXG4gICAgaGlnaDogMCxcbiAgICBtZWRpdW06IDAsXG4gICAgbG93OiAwLFxuICAgIHN1cHByZXNzZWQ6IDBcbn07XG52YXIgcmF0ZUxpbWl0cyA9IHtcbiAgICBjcml0aWNhbDogMjAwLFxuICAgIGhpZ2g6IDUwMCxcbiAgICBtZWRpdW06IDEwMDAsXG4gICAgbG93OiAyMDAwLFxuICAgIHN1cHByZXNzZWQ6IDUwMDBcbn07XG5leHBvcnQgZnVuY3Rpb24gaXNTdGF0ZVVuY2hhbmdlZChuZXdTdGF0ZSkge1xuICAgIGlmICghbGFzdFN0YXRlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5ld1N0YXRlLmV2ZW50VHlwZSAhPT0gXCJ0aWNrXCIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmV3U3RhdGUuY29tYmF0U3RhdGUgIT09IGxhc3RTdGF0ZS5jb21iYXRTdGF0ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuZXdTdGF0ZS5lbmVtaWVzLmxlbmd0aCAhPT0gbGFzdFN0YXRlLmVuZW1pZXMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHBsYXllckNoYW5nZWQgPSBuZXdTdGF0ZS5wbGF5ZXIuaGVhbHRoICE9PSBsYXN0U3RhdGUucGxheWVyLmhlYWx0aCB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueCAhPT0gbGFzdFN0YXRlLnBsYXllci5wb3NpdGlvbi54IHx8XG4gICAgICAgIG5ld1N0YXRlLnBsYXllci5wb3NpdGlvbi55ICE9PSBsYXN0U3RhdGUucGxheWVyLnBvc2l0aW9uLnkgfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLnBvc2l0aW9uLnogIT09IGxhc3RTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueiB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIuaXNTbmVha2luZyAhPT0gbGFzdFN0YXRlLnBsYXllci5pc1NuZWFraW5nO1xuICAgIHJldHVybiAhcGxheWVyQ2hhbmdlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVByaW9yaXR5KHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLnBsYXllci5pc0RlYWQpIHtcbiAgICAgICAgcmV0dXJuIFwiY3JpdGljYWxcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnBsYXllci5oZWFsdGggPCBzdGF0ZS5wbGF5ZXIubWF4SGVhbHRoICogMC4yNSkge1xuICAgICAgICByZXR1cm4gXCJjcml0aWNhbFwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlID09PSBcImhpdFwiKSB7XG4gICAgICAgIHJldHVybiBcImhpZ2hcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmNvbWJhdFN0YXRlID09PSAxKSB7XG4gICAgICAgIGlmIChzdGF0ZS5lbmVtaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBjbG9zZXN0RW5lbXkgPSBzdGF0ZS5lbmVtaWVzWzBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdGF0ZS5lbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmVuZW1pZXNbaV0uZGlzdGFuY2UgPCBjbG9zZXN0RW5lbXkuZGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdEVuZW15ID0gc3RhdGUuZW5lbWllc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2xvc2VzdEVuZW15LmRpc3RhbmNlIDwgNTAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiaGlnaFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIm1lZGl1bVwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlICE9PSBcInRpY2tcIikge1xuICAgICAgICByZXR1cm4gXCJtZWRpdW1cIjtcbiAgICB9XG4gICAgLy8gU3VwcHJlc3MgaWYgbm90aGluZyBpbnRlcmVzdGluZyBpcyBoYXBwZW5pbmdcbiAgICBpZiAobGFzdFN0YXRlICYmIGlzU3RhdGVVbmNoYW5nZWQoc3RhdGUpKSB7XG4gICAgICAgIHJldHVybiBcInN1cHByZXNzZWRcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwibG93XCI7XG59XG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2VuZChwcmlvcml0eSwgc3RhdGUpIHtcbiAgICB2b2lkIHN0YXRlO1xuICAgIGlmIChwcmlvcml0eSA9PT0gXCJzdXBwcmVzc2VkXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgbGFzdFNlbmQgPSBsYXN0U2VuZFRpbWVzW3ByaW9yaXR5XTtcbiAgICB2YXIgbWluSW50ZXJ2YWwgPSByYXRlTGltaXRzW3ByaW9yaXR5XTtcbiAgICBpZiAobm93IC0gbGFzdFNlbmQgPCBtaW5JbnRlcnZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFJhdGUtbGltaXQgaXMgYXR0ZW1wdC1iYXNlZCB0byBhdm9pZCBoYW1tZXJpbmcgdHJhbnNwb3J0IG9uIHJlcGVhdGVkIGZhaWx1cmVzLlxuICAgIGxhc3RTZW5kVGltZXNbcHJpb3JpdHldID0gbm93O1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlY29yZFNlbnRTdGF0ZShzdGF0ZSkge1xuICAgIGxhc3RTdGF0ZSA9IHN0YXRlO1xufVxuIiwidmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19nZW5lcmF0b3IgPSAodGhpcyAmJiB0aGlzLl9fZ2VuZXJhdG9yKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgYm9keSkge1xuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xuICAgIHJldHVybiBnLm5leHQgPSB2ZXJiKDApLCBnW1widGhyb3dcIl0gPSB2ZXJiKDEpLCBnW1wicmV0dXJuXCJdID0gdmVyYigyKSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XG4gICAgfVxufTtcbmltcG9ydCB7IEh0dHBDbGllbnQsIHByaW50Q29uc29sZSB9IGZyb20gXCIuLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xudmFyIE1BWF9TRU5EU19QRVJfU0VDID0gNTtcbnZhciBzZW5kQ291bnQgPSAwO1xudmFyIGxhc3RSZXNldCA9IERhdGUubm93KCk7XG5mdW5jdGlvbiByZXNldFJhdGVMaW1pdCgpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdFJlc2V0ID49IDEwMDApIHtcbiAgICAgICAgc2VuZENvdW50ID0gMDtcbiAgICAgICAgbGFzdFJlc2V0ID0gbm93O1xuICAgIH1cbn1cbnZhciBTa3lHdWlkZUh0dHBDbGllbnQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2t5R3VpZGVIdHRwQ2xpZW50KGJhc2VVcmwpIHtcbiAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSAwO1xuICAgICAgICB0aGlzLm1heEZhaWx1cmVzID0gMztcbiAgICAgICAgdGhpcy5sYXN0RmFpbHVyZVRpbWUgPSAwO1xuICAgICAgICB0aGlzLmNvb2xkb3duTXMgPSAxMDAwMDtcbiAgICAgICAgdGhpcy5jbGllbnQgPSBuZXcgSHR0cENsaWVudChiYXNlVXJsKTtcbiAgICB9XG4gICAgU2t5R3VpZGVIdHRwQ2xpZW50LnByb3RvdHlwZS5zZW5kR2FtZVN0YXRlID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJlc3BvbnNlLCBlcnJfMSwgbXNnO1xuICAgICAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoX2EubGFiZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzZXRSYXRlTGltaXQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZW5kQ291bnQgPj0gTUFYX1NFTkRTX1BFUl9TRUMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJSYXRlIGxpbWl0IGV4Y2VlZGVkXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgZmFsc2VdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgX2EubGFiZWwgPSAxO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS50cnlzLnB1c2goWzEsIDMsICwgNF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0IC8qeWllbGQqLywgdGhpcy5jbGllbnQucG9zdChcIi9hcGkvZ2FtZS1zdGF0ZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvZHk6IHBheWxvYWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBfYS5zZW50KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdGF0dXMgPj0gMjAwICYmIHJlc3BvbnNlLnN0YXR1cyA8IDMwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbHVyZUNvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgdHJ1ZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEhUVFAgXCIuY29uY2F0KHJlc3BvbnNlLnN0YXR1cywgXCI6IHJlcXVlc3QgcmVqZWN0ZWQgYnkgc2VydmVyXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0RmFpbHVyZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbHVyZUNvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGZhbHNlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDRdO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJfMSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZyA9IGVycl8xIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJfMS5tZXNzYWdlIDogU3RyaW5nKGVycl8xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBIVFRQIFBPU1QgL2FwaS9nYW1lLXN0YXRlIGZhaWxlZDogXCIuY29uY2F0KG1zZykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0RmFpbHVyZVRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBmYWxzZV07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgNDogcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFNreUd1aWRlSHR0cENsaWVudC5wcm90b3R5cGUuaXNDb25uZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmZhaWx1cmVDb3VudCA8IHRoaXMubWF4RmFpbHVyZXMpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSB0aGlzLmxhc3RGYWlsdXJlVGltZSA+IHRoaXMuY29vbGRvd25Ncykge1xuICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSB0aGlzLm1heEZhaWx1cmVzIC0gMTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHJldHVybiBTa3lHdWlkZUh0dHBDbGllbnQ7XG59KCkpO1xuZXhwb3J0IHZhciBodHRwQ2xpZW50ID0gbmV3IFNreUd1aWRlSHR0cENsaWVudChDT05GSUcuc2VydmVyVXJsKTtcbmV4cG9ydCBmdW5jdGlvbiBzZW5kR2FtZVN0YXRlKHBheWxvYWQpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBodHRwQ2xpZW50LnNlbmRHYW1lU3RhdGUocGF5bG9hZCldO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gaHR0cENsaWVudC5pc0Nvbm5lY3RlZCgpO1xufVxuIiwiLy8gQGVudiBub2RlXG4vLyBOT1RFOiBGb3IgcHJvZHVjdGlvbiwgY29uc2lkZXIgcmVhZGluZyBmcm9tIFNreXJpbSBQbGF0Zm9ybSBzZXR0aW5nczpcbi8vICAgaW1wb3J0IHsgc2V0dGluZ3MgfSBmcm9tIFwic2t5cmltUGxhdGZvcm1cIjtcbi8vICAgY29uc3QgZGVidWdNb2RlID0gc2V0dGluZ3NbXCJza3lndWlkZVwiXT8uW1wiZGVidWdNb2RlXCJdID09PSBcInRydWVcIjtcbmV4cG9ydCB2YXIgUExBWUVSX0ZPUk1fSUQgPSAweDE0O1xuZXhwb3J0IHZhciBDT05GSUcgPSB7XG4gICAgc2VydmVyVXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMFwiLFxuICAgIHRpY2tJbnRlcnZhbDogNTAwLFxuICAgIGVuZW15U2NhblJhZGl1czogNTAwMCxcbiAgICBtYXhFbmVtaWVzOiAxMCxcbiAgICBkZWJ1Z01vZGU6IGZhbHNlLFxuICAgIHBvbGxpbmdJbnRlcnZhbDogMTAwMCxcbiAgICBwb2xsaW5nRW5kcG9pbnQ6IFwiL2FwaS9hY3Rpb25zXCIsXG4gICAgcG9sbGluZ01heEJhY2tvZmY6IDMwMDAwLFxuICAgIHBvbGxpbmdFbmFibGVkOiB0cnVlLFxuICAgIG1heFBvbGxpbmdSZXRyaWVzOiA1LFxufTtcbiIsInZhciBfX3NwcmVhZEFycmF5ID0gKHRoaXMgJiYgdGhpcy5fX3NwcmVhZEFycmF5KSB8fCBmdW5jdGlvbiAodG8sIGZyb20sIHBhY2spIHtcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XG4gICAgICAgICAgICBpZiAoIWFyKSBhciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20sIDAsIGkpO1xuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xufTtcbmltcG9ydCB7IG9uLCBwcmludENvbnNvbGUgfSBmcm9tIFwiLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4vY29uZmlnXCI7XG52YXIgaXNSZWdpc3RlcmVkID0gZmFsc2U7XG52YXIgbGFzdENyb3NzaGFpclJlZjtcbnZhciBvcGVuTWVudXMgPSBuZXcgU2V0KCk7XG52YXIgbGFzdExvY2F0aW9uO1xudmFyIGxhc3RBY3RpdmF0ZWRSZWY7XG52YXIgcGxheWVyRGVhZCA9IGZhbHNlO1xudmFyIGxhc3RDb250YWluZXJDaGFuZ2VkO1xudmFyIGxhc3RFcXVpcENoYW5nZTtcbnZhciBsYXN0TGV2ZWxVcDtcbnZhciBsYXN0UXVlc3RVcGRhdGU7XG52YXIgbGFzdEZhc3RUcmF2ZWxFbmQ7XG52YXIgbGFzdEJvb2tSZWFkO1xudmFyIGxhc3RJdGVtSGFydmVzdGVkO1xudmFyIGxhc3RMb2NrQ2hhbmdlZDtcbmZ1bmN0aW9uIGRlYnVnTG9nKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIFwiLmNvbmNhdChtZXNzYWdlKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gcnVuSGFuZGxlcihoYW5kbGVycywgZXZlbnROYW1lLCBhcmdzKSB7XG4gICAgdmFyIF9hO1xuICAgIChfYSA9IGhhbmRsZXJzID09PSBudWxsIHx8IGhhbmRsZXJzID09PSB2b2lkIDAgPyB2b2lkIDAgOiBoYW5kbGVyc1tldmVudE5hbWVdKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY2FsbC5hcHBseShfYSwgX19zcHJlYWRBcnJheShbaGFuZGxlcnNdLCBhcmdzLCBmYWxzZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDcm9zc2hhaXJSZWYoKSB7XG4gICAgcmV0dXJuIGxhc3RDcm9zc2hhaXJSZWY7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3Blbk1lbnVzKCkge1xuICAgIHZhciBzbmFwc2hvdCA9IG5ldyBTZXQoKTtcbiAgICBvcGVuTWVudXMuZm9yRWFjaChmdW5jdGlvbiAobWVudU5hbWUpIHtcbiAgICAgICAgc25hcHNob3QuYWRkKG1lbnVOYW1lKTtcbiAgICB9KTtcbiAgICByZXR1cm4gc25hcHNob3Q7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExvY2F0aW9uKCkge1xuICAgIHJldHVybiBsYXN0TG9jYXRpb247XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEFjdGl2YXRlZFJlZigpIHtcbiAgICByZXR1cm4gbGFzdEFjdGl2YXRlZFJlZjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1BsYXllckRlYWQoKSB7XG4gICAgcmV0dXJuIHBsYXllckRlYWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENvbnRhaW5lckNoYW5nZWQoKSB7XG4gICAgcmV0dXJuIGxhc3RDb250YWluZXJDaGFuZ2VkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RFcXVpcENoYW5nZSgpIHtcbiAgICByZXR1cm4gbGFzdEVxdWlwQ2hhbmdlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RMZXZlbFVwKCkge1xuICAgIHJldHVybiBsYXN0TGV2ZWxVcDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0UXVlc3RVcGRhdGUoKSB7XG4gICAgcmV0dXJuIGxhc3RRdWVzdFVwZGF0ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0RmFzdFRyYXZlbEVuZCgpIHtcbiAgICByZXR1cm4gbGFzdEZhc3RUcmF2ZWxFbmQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEJvb2tSZWFkKCkge1xuICAgIHJldHVybiBsYXN0Qm9va1JlYWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEl0ZW1IYXJ2ZXN0ZWQoKSB7XG4gICAgcmV0dXJuIGxhc3RJdGVtSGFydmVzdGVkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RMb2NrQ2hhbmdlZCgpIHtcbiAgICByZXR1cm4gbGFzdExvY2tDaGFuZ2VkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQWxsRXZlbnRzKGhhbmRsZXJzKSB7XG4gICAgaWYgKGlzUmVnaXN0ZXJlZCkge1xuICAgICAgICBkZWJ1Z0xvZyhcInJlZ2lzdGVyQWxsRXZlbnRzIGNhbGxlZCBhZnRlciBpbml0aWFsaXphdGlvbjsgc2tpcHBpbmcgZHVwbGljYXRlIHN1YnNjcmlwdGlvbnNcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaXNSZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICBvbihcImNyb3NzaGFpclJlZkNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGFzdENyb3NzaGFpclJlZiA9IChfYSA9IGV2ZW50LnJlZmVyZW5jZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImNyb3NzaGFpclJlZkNoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZDogXCIuY29uY2F0KFN0cmluZyhsYXN0Q3Jvc3NoYWlyUmVmKSkpO1xuICAgIH0pO1xuICAgIG9uKFwibG9jYXRpb25DaGFuZ2VkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGxhc3RMb2NhdGlvbiA9IChfYSA9IGV2ZW50Lm5ld0xvYykgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldE5hbWUoKTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJsb2NhdGlvbkNoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9jYXRpb25DaGFuZ2VkOiBcIi5jb25jYXQobGFzdExvY2F0aW9uICE9PSBudWxsICYmIGxhc3RMb2NhdGlvbiAhPT0gdm9pZCAwID8gbGFzdExvY2F0aW9uIDogXCJ1bmtub3duXCIpKTtcbiAgICB9KTtcbiAgICBvbihcImxvY2F0aW9uRGlzY292ZXJ5XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxvY2F0aW9uRGlzY292ZXJ5XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImxvY2F0aW9uRGlzY292ZXJ5OiBcIi5jb25jYXQoZXZlbnQubmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwiY2VsbEZ1bGx5TG9hZGVkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImNlbGxGdWxseUxvYWRlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjZWxsRnVsbHlMb2FkZWQ6IFwiLmNvbmNhdChldmVudC5jZWxsLmdldE5hbWUoKSkpO1xuICAgIH0pO1xuICAgIG9uKFwibWVudU9wZW5cIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5uYW1lKSB7XG4gICAgICAgICAgICBvcGVuTWVudXMuYWRkKGV2ZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibWVudU9wZW5cIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibWVudU9wZW46IFwiLmNvbmNhdChldmVudC5uYW1lKSk7XG4gICAgfSk7XG4gICAgb24oXCJtZW51Q2xvc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5uYW1lKSB7XG4gICAgICAgICAgICBvcGVuTWVudXMuZGVsZXRlKGV2ZW50Lm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibWVudUNsb3NlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIm1lbnVDbG9zZTogXCIuY29uY2F0KGV2ZW50Lm5hbWUpKTtcbiAgICB9KTtcbiAgICBvbihcImZ1cm5pdHVyZUVudGVyXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImZ1cm5pdHVyZUVudGVyXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImZ1cm5pdHVyZUVudGVyOiBcIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRhcmdldC5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImZ1cm5pdHVyZUV4aXRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZnVybml0dXJlRXhpdFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJmdXJuaXR1cmVFeGl0OiBcIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRhcmdldC5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcIm9wZW5cIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwib3BlblwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJvcGVuOiBcIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRhcmdldC5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImNsb3NlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImNsb3NlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNsb3NlOiBcIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRhcmdldC5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RhZ2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RRdWVzdFVwZGF0ZSA9IHsgZXZlbnQ6IFwicXVlc3RTdGFnZVwiLCBxdWVzdElkOiBldmVudC5xdWVzdC5nZXRGb3JtSUQoKSwgc3RhZ2U6IGV2ZW50LnN0YWdlIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwicXVlc3RTdGFnZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJxdWVzdFN0YWdlOiBxdWVzdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RRdWVzdFVwZGF0ZS5xdWVzdElkKSwgXCIgc3RhZ2U9XCIpLmNvbmNhdChTdHJpbmcoZXZlbnQuc3RhZ2UpKSk7XG4gICAgfSk7XG4gICAgb24oXCJxdWVzdFN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0UXVlc3RVcGRhdGUgPSB7IGV2ZW50OiBcInF1ZXN0U3RhcnRcIiwgcXVlc3RJZDogZXZlbnQucXVlc3QuZ2V0Rm9ybUlEKCkgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0YXJ0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInF1ZXN0U3RhcnQ6IHF1ZXN0PVwiLmNvbmNhdChTdHJpbmcobGFzdFF1ZXN0VXBkYXRlLnF1ZXN0SWQpKSk7XG4gICAgfSk7XG4gICAgb24oXCJxdWVzdFN0b3BcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RRdWVzdFVwZGF0ZSA9IHsgZXZlbnQ6IFwicXVlc3RTdG9wXCIsIHF1ZXN0SWQ6IGV2ZW50LnF1ZXN0LmdldEZvcm1JRCgpIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwicXVlc3RTdG9wXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInF1ZXN0U3RvcDogcXVlc3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0UXVlc3RVcGRhdGUucXVlc3RJZCkpKTtcbiAgICB9KTtcbiAgICBvbihcImRlYXRoU3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHBsYXllckRlYWQgPSB0cnVlO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImRlYXRoU3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZGVhdGhTdGFydFwiKTtcbiAgICB9KTtcbiAgICBvbihcImRlYXRoRW5kXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBwbGF5ZXJEZWFkID0gZmFsc2U7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZGVhdGhFbmRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZGVhdGhFbmRcIik7XG4gICAgfSk7XG4gICAgb24oXCJjb250YWluZXJDaGFuZ2VkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgbGFzdENvbnRhaW5lckNoYW5nZWQgPSB7XG4gICAgICAgICAgICBvbGRDb250YWluZXI6IChfYSA9IGV2ZW50Lm9sZENvbnRhaW5lcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgbmV3Q29udGFpbmVyOiAoX2IgPSBldmVudC5uZXdDb250YWluZXIpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGl0ZW06IChfYyA9IGV2ZW50LmJhc2VPYmopID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGNvdW50OiBldmVudC5udW1JdGVtc1xuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImNvbnRhaW5lckNoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY29udGFpbmVyQ2hhbmdlZDogXCIuY29uY2F0KFN0cmluZyhsYXN0Q29udGFpbmVyQ2hhbmdlZC5vbGRDb250YWluZXIpLCBcIiAtPiBcIikuY29uY2F0KFN0cmluZyhsYXN0Q29udGFpbmVyQ2hhbmdlZC5uZXdDb250YWluZXIpLCBcIiwgaXRlbT1cIikuY29uY2F0KFN0cmluZyhsYXN0Q29udGFpbmVyQ2hhbmdlZC5pdGVtKSwgXCIsIGNvdW50PVwiKS5jb25jYXQoU3RyaW5nKGV2ZW50Lm51bUl0ZW1zKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZXF1aXBcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGxhc3RFcXVpcENoYW5nZSA9IHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJlcXVpcFwiLFxuICAgICAgICAgICAgYWN0b3I6IChfYSA9IGV2ZW50LmFjdG9yKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBiYXNlT2JqZWN0OiAoX2IgPSBldmVudC5iYXNlT2JqKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBleHRyYURhdGE6IGV2ZW50LnVuaXF1ZUlkXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZXF1aXBcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZXF1aXA6IGFjdG9yPVwiLmNvbmNhdChTdHJpbmcobGFzdEVxdWlwQ2hhbmdlLmFjdG9yKSwgXCIgaXRlbT1cIikuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYmFzZU9iamVjdCkpKTtcbiAgICB9KTtcbiAgICBvbihcInVuZXF1aXBcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGxhc3RFcXVpcENoYW5nZSA9IHtcbiAgICAgICAgICAgIGFjdGlvbjogXCJ1bmVxdWlwXCIsXG4gICAgICAgICAgICBhY3RvcjogKF9hID0gZXZlbnQuYWN0b3IpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGJhc2VPYmplY3Q6IChfYiA9IGV2ZW50LmJhc2VPYmopID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGV4dHJhRGF0YTogZXZlbnQudW5pcXVlSWRcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJ1bmVxdWlwXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInVuZXF1aXA6IGFjdG9yPVwiLmNvbmNhdChTdHJpbmcobGFzdEVxdWlwQ2hhbmdlLmFjdG9yKSwgXCIgaXRlbT1cIikuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYmFzZU9iamVjdCkpKTtcbiAgICB9KTtcbiAgICBvbihcImxldmVsSW5jcmVhc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RMZXZlbFVwID0ge1xuICAgICAgICAgICAgbGV2ZWw6IGV2ZW50Lm5ld0xldmVsLFxuICAgICAgICAgICAgaXNTa2lsbEluY3JlYXNlOiBmYWxzZVxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxldmVsSW5jcmVhc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibGV2ZWxJbmNyZWFzZTogbGV2ZWw9XCIuY29uY2F0KFN0cmluZyhldmVudC5uZXdMZXZlbCkpKTtcbiAgICB9KTtcbiAgICBvbihcInNraWxsSW5jcmVhc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RMZXZlbFVwID0ge1xuICAgICAgICAgICAgc2tpbGxJZDogZXZlbnQuYWN0b3JWYWx1ZSxcbiAgICAgICAgICAgIGlzU2tpbGxJbmNyZWFzZTogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNraWxsSW5jcmVhc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwic2tpbGxJbmNyZWFzZTogc2tpbGw9XCIuY29uY2F0KFN0cmluZyhldmVudC5hY3RvclZhbHVlKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZW50ZXJCbGVlZG91dFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJlbnRlckJsZWVkb3V0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImVudGVyQmxlZWRvdXQ6IGFjdG9yPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuYWN0b3IuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJmYXN0VHJhdmVsRW5kXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0RmFzdFRyYXZlbEVuZCA9IHsgdHJhdmVsVGltZUdhbWVIb3VyczogZXZlbnQudHJhdmVsVGltZUdhbWVIb3VycyB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImZhc3RUcmF2ZWxFbmRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZmFzdFRyYXZlbEVuZDogdHJhdmVsSG91cnM9XCIuY29uY2F0KFN0cmluZyhldmVudC50cmF2ZWxUaW1lR2FtZUhvdXJzKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2xlZXBTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJzbGVlcFN0YXJ0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInNsZWVwU3RhcnQ6IGRlc2lyZWRTdG9wVGltZT1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmRlc2lyZWRTdG9wVGltZSkpKTtcbiAgICB9KTtcbiAgICBvbihcInNsZWVwU3RvcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJzbGVlcFN0b3BcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwic2xlZXBTdG9wOiBpbnRlcnJ1cHRlZD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmlzSW50ZXJydXB0ZWQpKSk7XG4gICAgfSk7XG4gICAgb24oXCJhY3RpdmF0ZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEFjdGl2YXRlZFJlZiA9IChfYSA9IGV2ZW50LnRhcmdldCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImFjdGl2YXRlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImFjdGl2YXRlOiB0YXJnZXQ9XCIuY29uY2F0KFN0cmluZyhsYXN0QWN0aXZhdGVkUmVmKSwgXCIgY2FzdGVyPVwiKS5jb25jYXQoU3RyaW5nKChfYiA9IGV2ZW50LmNhc3RlcikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwibG9ja0NoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGFzdExvY2tDaGFuZ2VkID0ge1xuICAgICAgICAgICAgbG9ja2VkT2JqZWN0OiAoX2EgPSBldmVudC5sb2NrZWRPYmplY3QpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKVxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxvY2tDaGFuZ2VkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImxvY2tDaGFuZ2VkOiBvYmplY3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0TG9ja0NoYW5nZWQubG9ja2VkT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwiYm9va1JlYWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0Qm9va1JlYWQgPSB7XG4gICAgICAgICAgICBib29rRm9ybUlkOiAoX2EgPSBldmVudC5ib29rKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICB0aXRsZTogKF9iID0gZXZlbnQuYm9vaykgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldE5hbWUoKVxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImJvb2tSZWFkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImJvb2tSZWFkOiBcIi5jb25jYXQoKF9jID0gbGFzdEJvb2tSZWFkLnRpdGxlKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiBTdHJpbmcobGFzdEJvb2tSZWFkLmJvb2tGb3JtSWQpKSk7XG4gICAgfSk7XG4gICAgb24oXCJpdGVtSGFydmVzdGVkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgbGFzdEl0ZW1IYXJ2ZXN0ZWQgPSB7XG4gICAgICAgICAgICBpdGVtRm9ybUlkOiAoX2EgPSBldmVudC5wcm9kdWNlSXRlbSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgaW5ncmVkaWVudE5hbWU6IChfYiA9IGV2ZW50LnByb2R1Y2VJdGVtKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0TmFtZSgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiaXRlbUhhcnZlc3RlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJpdGVtSGFydmVzdGVkOiBcIi5jb25jYXQoKF9jID0gbGFzdEl0ZW1IYXJ2ZXN0ZWQuaW5ncmVkaWVudE5hbWUpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IFN0cmluZyhsYXN0SXRlbUhhcnZlc3RlZC5pdGVtRm9ybUlkKSkpO1xuICAgIH0pO1xufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHLCBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi9jb25maWdcIjtcbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZURpc3RhbmNlKHgxLCB5MSwgejEsIHgyLCB5MiwgejIpIHtcbiAgICB2YXIgZHggPSB4MiAtIHgxO1xuICAgIHZhciBkeSA9IHkyIC0geTE7XG4gICAgdmFyIGR6ID0gejIgLSB6MTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG59XG5mdW5jdGlvbiBjb2xsZWN0UGxheWVyU3RhdGUoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHZhciBwb3MgPSBnZXRQbGF5ZXJQb3NpdGlvbigpO1xuICAgIGlmICghcG9zKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFsdGg6IHBsYXllci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpLFxuICAgICAgICBtYXhIZWFsdGg6IHBsYXllci5nZXRCYXNlQWN0b3JWYWx1ZShcImhlYWx0aFwiKSxcbiAgICAgICAgbWFnaWNrYTogcGxheWVyLmdldEFjdG9yVmFsdWUoXCJtYWdpY2thXCIpLFxuICAgICAgICBzdGFtaW5hOiBwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcInN0YW1pbmFcIiksXG4gICAgICAgIGxldmVsOiBwbGF5ZXIuZ2V0TGV2ZWwoKSxcbiAgICAgICAgcG9zaXRpb246IHBvcyxcbiAgICAgICAgaXNTbmVha2luZzogcGxheWVyLmlzU25lYWtpbmcoKSxcbiAgICAgICAgaXNEZWFkOiBwbGF5ZXIuaXNEZWFkKClcbiAgICB9O1xufVxuZnVuY3Rpb24gY29sbGVjdEVuZW1pZXMoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zaXRpb24oKTtcbiAgICBpZiAoIXBsYXllclBvcylcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBzZWVuRm9ybUlkcyA9IG5ldyBTZXQoKTtcbiAgICB2YXIgZW5lbWllcyA9IFtdO1xuICAgIC8vIE11bHRpLXNjYW46IGNlbnRlciArIDggb2Zmc2V0IHBvc2l0aW9ucyB0byBmaW5kIG11bHRpcGxlIGFjdG9yc1xuICAgIC8vIEdhbWUuZmluZENsb3Nlc3RBY3RvcigpIG9ubHkgcmV0dXJucyBPTkUgYWN0b3IsIHNvIHdlIHNjYW4gbXVsdGlwbGUgcG9zaXRpb25zXG4gICAgdmFyIHNjYW5PZmZzZXRzID0gW1xuICAgICAgICB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgeyB4OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzLCB5OiAwIH0sXG4gICAgICAgIHsgeDogLUNPTkZJRy5lbmVteVNjYW5SYWRpdXMsIHk6IDAgfSxcbiAgICAgICAgeyB4OiAwLCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzIH0sXG4gICAgICAgIHsgeDogMCwgeTogLUNPTkZJRy5lbmVteVNjYW5SYWRpdXMgfSxcbiAgICAgICAgeyB4OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IENPTkZJRy5lbmVteVNjYW5SYWRpdXMgKiAwLjcwNyB9LFxuICAgICAgICB7IHg6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IENPTkZJRy5lbmVteVNjYW5SYWRpdXMgKiAwLjcwNyB9LFxuICAgICAgICB7IHg6IENPTkZJRy5lbmVteVNjYW5SYWRpdXMgKiAwLjcwNywgeTogLUNPTkZJRy5lbmVteVNjYW5SYWRpdXMgKiAwLjcwNyB9LFxuICAgICAgICB7IHg6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfVxuICAgIF07XG4gICAgZm9yICh2YXIgX2kgPSAwLCBzY2FuT2Zmc2V0c18xID0gc2Nhbk9mZnNldHM7IF9pIDwgc2Nhbk9mZnNldHNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IHNjYW5PZmZzZXRzXzFbX2ldO1xuICAgICAgICBpZiAoZW5lbWllcy5sZW5ndGggPj0gQ09ORklHLm1heEVuZW1pZXMpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgdmFyIHNjYW5YID0gcGxheWVyUG9zLnggKyBvZmZzZXQueDtcbiAgICAgICAgdmFyIHNjYW5ZID0gcGxheWVyUG9zLnkgKyBvZmZzZXQueTtcbiAgICAgICAgdmFyIHNjYW5aID0gcGxheWVyUG9zLno7XG4gICAgICAgIHZhciBhY3RvciA9IEdhbWUuZmluZENsb3Nlc3RBY3RvcihzY2FuWCwgc2NhblksIHNjYW5aLCBDT05GSUcuZW5lbXlTY2FuUmFkaXVzKTtcbiAgICAgICAgaWYgKCFhY3RvcilcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAvLyBTa2lwIHBsYXllclxuICAgICAgICBpZiAoYWN0b3IuZ2V0Rm9ybUlEKCkgPT09IFBMQVlFUl9GT1JNX0lEKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIFNraXAgZGVhZCBhY3RvcnNcbiAgICAgICAgaWYgKGFjdG9yLmlzRGVhZCgpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIERlZHVwbGljYXRlIGJ5IGZvcm1JZFxuICAgICAgICB2YXIgZm9ybUlkID0gYWN0b3IuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIGlmIChzZWVuRm9ybUlkcy5oYXMoZm9ybUlkKSlcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBzZWVuRm9ybUlkcy5hZGQoZm9ybUlkKTtcbiAgICAgICAgdmFyIGFjdG9yUG9zID0ge1xuICAgICAgICAgICAgeDogYWN0b3IuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgICAgICB5OiBhY3Rvci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgICAgIHo6IGFjdG9yLmdldFBvc2l0aW9uWigpXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKHBsYXllclBvcy54LCBwbGF5ZXJQb3MueSwgcGxheWVyUG9zLnosIGFjdG9yUG9zLngsIGFjdG9yUG9zLnksIGFjdG9yUG9zLnopO1xuICAgICAgICB2YXIgYmFzZU9iaiA9IGFjdG9yLmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgdmFyIG5hbWUgPSBiYXNlT2JqID8gYmFzZU9iai5nZXROYW1lKCkgfHwgXCJVbmtub3duXCIgOiBcIlVua25vd25cIjtcbiAgICAgICAgZW5lbWllcy5wdXNoKHtcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSxcbiAgICAgICAgICAgIGhlYWx0aDogYWN0b3IuZ2V0QWN0b3JWYWx1ZShcImhlYWx0aFwiKSxcbiAgICAgICAgICAgIGxldmVsOiBhY3Rvci5nZXRMZXZlbCgpXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZW5lbWllcztcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0RnVsbFN0YXRlKHBsYXllckFuaW1hdGlvbiwgZXZlbnRUeXBlKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICBpZiAocGxheWVyQW5pbWF0aW9uID09PSB2b2lkIDApIHsgcGxheWVyQW5pbWF0aW9uID0gXCJcIjsgfVxuICAgIGlmIChldmVudFR5cGUgPT09IHZvaWQgMCkgeyBldmVudFR5cGUgPSBcInRpY2tcIjsgfVxuICAgIHZhciBwbGF5ZXIgPSBjb2xsZWN0UGxheWVyU3RhdGUoKTtcbiAgICBpZiAoIXBsYXllcilcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgdmFyIGNvbWJhdFN0YXRlID0gKF9iID0gKF9hID0gR2FtZS5nZXRQbGF5ZXIoKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldENvbWJhdFN0YXRlKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IDA7XG4gICAgdmFyIGVuZW1pZXMgPSBjb2xsZWN0RW5lbWllcygpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgICBjb21iYXRTdGF0ZTogY29tYmF0U3RhdGUsXG4gICAgICAgIGVuZW1pZXM6IGVuZW1pZXMsXG4gICAgICAgIHBsYXllckFuaW1hdGlvbjogcGxheWVyQW5pbWF0aW9uLFxuICAgICAgICBldmVudFR5cGU6IGV2ZW50VHlwZVxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbnZhciBGT1JNX1RZUEVfTkFNRVMgPSB7XG4gICAgMjQ6IFwiQWN0aXZhdG9yXCIsXG4gICAgMjY6IFwiRmxvcmFcIixcbiAgICAyNzogXCJLZXlcIixcbiAgICAyODogXCJDb250YWluZXJcIixcbiAgICAyOTogXCJEb29yXCIsXG4gICAgNDA6IFwiRnVybml0dXJlXCIsXG4gICAgNDE6IFwiSW5ncmVkaWVudFwiLFxuICAgIDQyOiBcIkFwcGFyYXR1c1wiLFxuICAgIDYyOiBcIk5QQ1wiLFxufTtcbmZ1bmN0aW9uIG1hcEZvcm1UeXBlKHR5cGVJZCkge1xuICAgIHZhciBfYTtcbiAgICBpZiAodHlwZUlkID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoX2EgPSBGT1JNX1RZUEVfTkFNRVNbdHlwZUlkXSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogXCJGb3JtVHlwZV9cIi5jb25jYXQodHlwZUlkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0KCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmVmID0gR2FtZS5nZXRDdXJyZW50Q3Jvc3NoYWlyUmVmKCk7XG4gICAgICAgIGlmIChyZWYgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZvcm1JZCA9IHJlZi5nZXRGb3JtSUQoKTtcbiAgICAgICAgdmFyIGJhc2VPYmplY3QgPSByZWYuZ2V0QmFzZU9iamVjdCgpO1xuICAgICAgICB2YXIgdHlwZUlkID0gYmFzZU9iamVjdCA9PT0gbnVsbCB8fCBiYXNlT2JqZWN0ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqZWN0LmdldFR5cGUoKTtcbiAgICAgICAgdmFyIHR5cGUgPSBtYXBGb3JtVHlwZSh0eXBlSWQpO1xuICAgICAgICB2YXIgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgaWYgKHR5cGVJZCA9PT0gMjkpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gcmVmLmdldE9wZW5TdGF0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAgICAgaXNPcGVuID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IChfYiA9IChfYSA9IHJlZi5nZXREaXNwbGF5TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBiYXNlT2JqZWN0ID09PSBudWxsIHx8IGJhc2VPYmplY3QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2VPYmplY3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSAoX2QgPSAoX2MgPSBHYW1lLmdldFBsYXllcigpKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuZ2V0RGlzdGFuY2UocmVmKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogMDtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxuICAgICAgICAgICAgaXNPcGVuOiBpc09wZW4sXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfZikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lLCBVdGlsaXR5LCBXZWF0aGVyIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEVudmlyb25tZW50U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB2YXIgZ2FtZVRpbWUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGdhbWVUaW1lID0gVXRpbGl0eS5nZXRDdXJyZW50R2FtZVRpbWUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIGdhbWVUaW1lID0gMDtcbiAgICB9XG4gICAgdmFyIGdhbWVIb3VyID0gMDtcbiAgICB0cnkge1xuICAgICAgICBnYW1lSG91ciA9ICgoZ2FtZVRpbWUgKiAyNCkgJSAyNCArIDI0KSAlIDI0O1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgZ2FtZUhvdXIgPSAwO1xuICAgIH1cbiAgICB2YXIgY2FtZXJhU3RhdGUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGNhbWVyYVN0YXRlID0gR2FtZS5nZXRDYW1lcmFTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgY2FtZXJhU3RhdGUgPSAwO1xuICAgIH1cbiAgICB2YXIgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHdlYXRoZXJOYW1lID0gKF9iID0gKF9hID0gV2VhdGhlci5nZXRDdXJyZW50V2VhdGhlcigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgIH1cbiAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBzdW5Qb3NpdGlvblggPSBHYW1lLmdldFN1blBvc2l0aW9uWCgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgc3VuUG9zaXRpb25ZID0gR2FtZS5nZXRTdW5Qb3NpdGlvblkoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHN1blBvc2l0aW9uWiA9IEdhbWUuZ2V0U3VuUG9zaXRpb25aKCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBnYW1lVGltZTogZ2FtZVRpbWUsXG4gICAgICAgIGdhbWVIb3VyOiBnYW1lSG91cixcbiAgICAgICAgd2VhdGhlck5hbWU6IHdlYXRoZXJOYW1lLFxuICAgICAgICBjYW1lcmFTdGF0ZTogY2FtZXJhU3RhdGUsXG4gICAgICAgIHN1blBvc2l0aW9uWDogc3VuUG9zaXRpb25YLFxuICAgICAgICBzdW5Qb3NpdGlvblk6IHN1blBvc2l0aW9uWSxcbiAgICAgICAgc3VuUG9zaXRpb25aOiBzdW5Qb3NpdGlvblpcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgSW5wdXQgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbnZhciBNT1ZFX0ZPUldBUkQgPSAxNztcbnZhciBNT1ZFX0xFRlQgPSAzMDtcbnZhciBNT1ZFX0JBQ0tXQVJEID0gMzE7XG52YXIgTU9WRV9SSUdIVCA9IDMyO1xudmFyIFNQUklOVCA9IDQyO1xudmFyIENST1VDSCA9IDI5O1xudmFyIEpVTVBfT1JfQUNUSVZBVEUgPSA1NztcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0SW5wdXRTdGF0ZSgpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIga2V5c1ByZXNzZWQgPSBbXTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChNT1ZFX0ZPUldBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIldcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9MRUZUKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJBXCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKE1PVkVfQkFDS1dBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9SSUdIVCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiRFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChTUFJJTlQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNoaWZ0XCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKENST1VDSCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiQ3RybFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChKVU1QX09SX0FDVElWQVRFKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJTcGFjZVwiKTtcbiAgICAgICAgcmV0dXJuIHsga2V5c1ByZXNzZWQ6IGtleXNQcmVzc2VkIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4geyBrZXlzUHJlc3NlZDogW10gfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdExvY2F0aW9uU3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2MsIF9kLCBfZSwgX2YsIF9nLCBfaDtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIGxvY2F0aW9uTmFtZTogbnVsbCxcbiAgICAgICAgaXNJbnRlcmlvcjogZmFsc2UsXG4gICAgICAgIGNlbGxOYW1lOiBudWxsLFxuICAgICAgICB3b3JsZHNwYWNlTmFtZTogbnVsbFxuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvY2F0aW9uTmFtZTogKF9iID0gKF9hID0gcGxheWVyLmdldEN1cnJlbnRMb2NhdGlvbigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsLFxuICAgICAgICAgICAgaXNJbnRlcmlvcjogKF9kID0gKF9jID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmlzSW50ZXJpb3IoKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogZmFsc2UsXG4gICAgICAgICAgICBjZWxsTmFtZTogKF9mID0gKF9lID0gcGxheWVyLmdldFBhcmVudENlbGwoKSkgPT09IG51bGwgfHwgX2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9lLmdldE5hbWUoKSkgIT09IG51bGwgJiYgX2YgIT09IHZvaWQgMCA/IF9mIDogbnVsbCxcbiAgICAgICAgICAgIHdvcmxkc3BhY2VOYW1lOiAoX2ggPSAoX2cgPSBwbGF5ZXIuZ2V0V29ybGRTcGFjZSgpKSA9PT0gbnVsbCB8fCBfZyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2cuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfaCAhPT0gdm9pZCAwID8gX2ggOiBudWxsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICByZXR1cm4gZGVmYXVsdHM7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgQ09ORklHLCBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbmZ1bmN0aW9uIGdldFBsYXllclBvc2l0aW9uKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjYWxjdWxhdGVEaXN0YW5jZSh4MSwgeTEsIHoxLCB4MiwgeTIsIHoyKSB7XG4gICAgdmFyIGR4ID0geDIgLSB4MTtcbiAgICB2YXIgZHkgPSB5MiAtIHkxO1xuICAgIHZhciBkeiA9IHoyIC0gejE7XG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3ROZWFyYnlOcGNzKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zaXRpb24oKTtcbiAgICBpZiAoIXBsYXllclBvcylcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBzY2FuT2Zmc2V0cyA9IFtcbiAgICAgICAgeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cywgeTogMCB9LFxuICAgICAgICB7IHg6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzLCB5OiAwIH0sXG4gICAgICAgIHsgeDogMCwgeTogQ09ORklHLmVuZW15U2NhblJhZGl1cyB9LFxuICAgICAgICB7IHg6IDAsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzIH0sXG4gICAgICAgIHsgeDogQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiBDT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcsIHk6IC1DT05GSUcuZW5lbXlTY2FuUmFkaXVzICogMC43MDcgfSxcbiAgICAgICAgeyB4OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3LCB5OiAtQ09ORklHLmVuZW15U2NhblJhZGl1cyAqIDAuNzA3IH0sXG4gICAgXTtcbiAgICB2YXIgc2VlbkZvcm1JZHMgPSBuZXcgU2V0KCk7XG4gICAgdmFyIG5lYXJieU5wY3MgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIHNjYW5PZmZzZXRzXzEgPSBzY2FuT2Zmc2V0czsgX2kgPCBzY2FuT2Zmc2V0c18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gc2Nhbk9mZnNldHNfMVtfaV07XG4gICAgICAgIGlmIChuZWFyYnlOcGNzLmxlbmd0aCA+PSBDT05GSUcubWF4RW5lbWllcylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgc2NhblggPSBwbGF5ZXJQb3MueCArIG9mZnNldC54O1xuICAgICAgICB2YXIgc2NhblkgPSBwbGF5ZXJQb3MueSArIG9mZnNldC55O1xuICAgICAgICB2YXIgc2NhblogPSBwbGF5ZXJQb3MuejtcbiAgICAgICAgdmFyIGFjdG9yID0gR2FtZS5maW5kQ2xvc2VzdEFjdG9yKHNjYW5YLCBzY2FuWSwgc2NhblosIENPTkZJRy5lbmVteVNjYW5SYWRpdXMpO1xuICAgICAgICBpZiAoIWFjdG9yKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBhY3Rvci5nZXRGb3JtSUQoKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHNlZW5Gb3JtSWRzLmhhcyhmb3JtSWQpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHNlZW5Gb3JtSWRzLmFkZChmb3JtSWQpO1xuICAgICAgICB2YXIgYWN0b3JQb3MgPSB7XG4gICAgICAgICAgICB4OiBhY3Rvci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgICAgIHk6IGFjdG9yLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICAgICAgejogYWN0b3IuZ2V0UG9zaXRpb25aKCksXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKHBsYXllclBvcy54LCBwbGF5ZXJQb3MueSwgcGxheWVyUG9zLnosIGFjdG9yUG9zLngsIGFjdG9yUG9zLnksIGFjdG9yUG9zLnopO1xuICAgICAgICB2YXIgYmFzZU9iaiA9IGFjdG9yLmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgdmFyIG5hbWUgPSAoYmFzZU9iaiA9PT0gbnVsbCB8fCBiYXNlT2JqID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqLmdldE5hbWUoKSkgfHwgXCJVbmtub3duXCI7XG4gICAgICAgIHZhciBoZWFsdGggPSBhY3Rvci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpO1xuICAgICAgICB2YXIgbGV2ZWwgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWwgPSBhY3Rvci5nZXRMZXZlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYykge1xuICAgICAgICAgICAgbGV2ZWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciByYWNlID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJhY2UgPSAoX2IgPSAoX2EgPSBhY3Rvci5nZXRSYWNlKCkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgICAgICByYWNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNIb3N0aWxlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBhY3Rvci5pc0hvc3RpbGVUb0FjdG9yKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNBbGx5ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBhY3Rvci5pc1BsYXllclRlYW1tYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNHdWFyZCA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNHdWFyZCA9IGFjdG9yLmlzR3VhcmQoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgICAgIGlzR3VhcmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNNZXJjaGFudCA9IGZhbHNlO1xuICAgICAgICB2YXIgaXNJbkRpYWxvZ3VlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBhY3Rvci5pc0luRGlhbG9ndWVXaXRoUGxheWVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFzTE9TID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBoYXNMT1MgPSBhY3Rvci5oYXNMT1MocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2opIHtcbiAgICAgICAgICAgIGhhc0xPUyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gYWN0b3IuaXNEZXRlY3RlZEJ5KHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9rKSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuayA9IGFjdG9yLmdldFJlbGF0aW9uc2hpcFJhbmsocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2wpIHtcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RlYWQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzRGVhZCA9IGFjdG9yLmlzRGVhZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfbSkge1xuICAgICAgICAgICAgaXNEZWFkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbmVhcmJ5TnBjcy5wdXNoKHtcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSxcbiAgICAgICAgICAgIGhlYWx0aDogaGVhbHRoLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgcmFjZTogcmFjZSxcbiAgICAgICAgICAgIGlzSG9zdGlsZTogaXNIb3N0aWxlLFxuICAgICAgICAgICAgaXNBbGx5OiBpc0FsbHksXG4gICAgICAgICAgICBpc0d1YXJkOiBpc0d1YXJkLFxuICAgICAgICAgICAgaXNNZXJjaGFudDogaXNNZXJjaGFudCxcbiAgICAgICAgICAgIGlzSW5EaWFsb2d1ZTogaXNJbkRpYWxvZ3VlLFxuICAgICAgICAgICAgaXNEZXRlY3RlZDogaXNEZXRlY3RlZCxcbiAgICAgICAgICAgIGhhc0xPUzogaGFzTE9TLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuazogcmVsYXRpb25zaGlwUmFuayxcbiAgICAgICAgICAgIGlzRGVhZDogaXNEZWFkLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5lYXJieU5wY3M7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5mdW5jdGlvbiBzYWZlTnVtYmVyKHZhbHVlLCBmYWxsYmFjaykge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7IGZhbGxiYWNrID0gMDsgfVxuICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cbmZ1bmN0aW9uIHNhZmVTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCA/IHZhbHVlIDogbnVsbDtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RIZWFkaW5nKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7IGFuZ2xlWDogMCwgYW5nbGVZOiAwLCBhbmdsZVo6IDAsIGhlYWRpbmdBbmdsZTogMCB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBhbmdsZVg6IHNhZmVOdW1iZXIocGxheWVyLmdldEFuZ2xlWCgpKSxcbiAgICAgICAgYW5nbGVZOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBbmdsZVkoKSksXG4gICAgICAgIGFuZ2xlWjogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QW5nbGVaKCkpLFxuICAgICAgICBoZWFkaW5nQW5nbGU6IHNhZmVOdW1iZXIocGxheWVyLmdldEhlYWRpbmdBbmdsZShudWxsKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RNb3ZlbWVudCgpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3ByaW50aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3dpbW1pbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTbmVha2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc09uTW91bnQ6IGZhbHNlLFxuICAgICAgICAgICAgaXNPdmVyRW5jdW1iZXJlZDogZmFsc2UsXG4gICAgICAgICAgICBzaXRTdGF0ZTogMCxcbiAgICAgICAgICAgIHNsZWVwU3RhdGU6IDAsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGlzUnVubmluZzogcGxheWVyLmlzUnVubmluZygpLFxuICAgICAgICBpc1NwcmludGluZzogcGxheWVyLmlzU3ByaW50aW5nKCksXG4gICAgICAgIGlzU3dpbW1pbmc6IHBsYXllci5pc1N3aW1taW5nKCksXG4gICAgICAgIGlzU25lYWtpbmc6IHBsYXllci5pc1NuZWFraW5nKCksXG4gICAgICAgIGlzT25Nb3VudDogcGxheWVyLmlzT25Nb3VudCgpLFxuICAgICAgICBpc092ZXJFbmN1bWJlcmVkOiBwbGF5ZXIuaXNPdmVyRW5jdW1iZXJlZCgpLFxuICAgICAgICBzaXRTdGF0ZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0U2l0U3RhdGUoKSksXG4gICAgICAgIHNsZWVwU3RhdGU6IHNhZmVOdW1iZXIocGxheWVyLmdldFNsZWVwU3RhdGUoKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RDb21iYXQoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzSW5Db21iYXQ6IGZhbHNlLFxuICAgICAgICAgICAgY29tYmF0VGFyZ2V0TmFtZTogbnVsbCxcbiAgICAgICAgICAgIGlzQmxvY2tpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNXZWFwb25EcmF3bjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBjb21iYXRUYXJnZXROYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gcGxheWVyLmdldENvbWJhdFRhcmdldCgpO1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICB2YXIgYmFzZSA9IHRhcmdldC5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgICAgICBjb21iYXRUYXJnZXROYW1lID0gc2FmZVN0cmluZyhiYXNlID09PSBudWxsIHx8IGJhc2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2UuZ2V0TmFtZSgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgY29tYmF0VGFyZ2V0TmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBpc0Jsb2NraW5nID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgaXNCbG9ja2luZyA9IHBsYXllci5nZXRBbmltYXRpb25WYXJpYWJsZUJvb2woXCJJc0Jsb2NraW5nXCIpO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgaXNCbG9ja2luZyA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBpc0luQ29tYmF0OiBwbGF5ZXIuaXNJbkNvbWJhdCgpLFxuICAgICAgICBjb21iYXRUYXJnZXROYW1lOiBjb21iYXRUYXJnZXROYW1lLFxuICAgICAgICBpc0Jsb2NraW5nOiBpc0Jsb2NraW5nLFxuICAgICAgICBpc1dlYXBvbkRyYXduOiBwbGF5ZXIuaXNXZWFwb25EcmF3bigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjb2xsZWN0RXF1aXBtZW50KCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWFwb25OYW1lOiBudWxsLFxuICAgICAgICAgICAgd2VhcG9uU2xvdDogMCxcbiAgICAgICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICAgICAgc2hvdXROYW1lOiBudWxsLFxuICAgICAgICAgICAgc3BlbGxOYW1lOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHdlYXBvbiA9IHBsYXllci5nZXRFcXVpcHBlZFdlYXBvbihmYWxzZSk7XG4gICAgICAgIHdlYXBvbk5hbWUgPSBzYWZlU3RyaW5nKHdlYXBvbiA9PT0gbnVsbCB8fCB3ZWFwb24gPT09IHZvaWQgMCA/IHZvaWQgMCA6IHdlYXBvbi5nZXROYW1lKCkpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzaG91dE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzaG91dCA9IHBsYXllci5nZXRFcXVpcHBlZFNob3V0KCk7XG4gICAgICAgIHNob3V0TmFtZSA9IHNhZmVTdHJpbmcoc2hvdXQgPT09IG51bGwgfHwgc2hvdXQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHNob3V0LmdldE5hbWUoKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBzaG91dE5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3BlbGxOYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgc3BlbGwgPSBwbGF5ZXIuZ2V0RXF1aXBwZWRTcGVsbCgwKTtcbiAgICAgICAgc3BlbGxOYW1lID0gc2FmZVN0cmluZyhzcGVsbCA9PT0gbnVsbCB8fCBzcGVsbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogc3BlbGwuZ2V0TmFtZSgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHNwZWxsTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHdlYXBvbk5hbWU6IHdlYXBvbk5hbWUsXG4gICAgICAgIHdlYXBvblNsb3Q6IDAsXG4gICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICBzaG91dE5hbWU6IHNob3V0TmFtZSxcbiAgICAgICAgc3BlbGxOYW1lOiBzcGVsbE5hbWUsXG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UGxheWVyRnVsbFN0YXRlKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFkaW5nOiBjb2xsZWN0SGVhZGluZygpLFxuICAgICAgICBtb3ZlbWVudDogY29sbGVjdE1vdmVtZW50KCksXG4gICAgICAgIGNvbWJhdDogY29sbGVjdENvbWJhdCgpLFxuICAgICAgICBlcXVpcG1lbnQ6IGNvbGxlY3RFcXVpcG1lbnQoKSxcbiAgICAgICAgZ29sZEFtb3VudDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0R29sZEFtb3VudCgpKSxcbiAgICAgICAgY2FycnlXZWlnaHQ6IHNhZmVOdW1iZXIocGxheWVyLmdldEFjdG9yVmFsdWUoXCJDYXJyeVdlaWdodFwiKSksXG4gICAgICAgIGludmVudG9yeVdlaWdodDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIkludmVudG9yeVdlaWdodFwiKSksXG4gICAgICAgIG1hZ2lja2FQZXJjZW50YWdlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlUGVyY2VudGFnZShcIm1hZ2lja2FcIikpLFxuICAgICAgICBzdGFtaW5hUGVyY2VudGFnZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZVBlcmNlbnRhZ2UoXCJzdGFtaW5hXCIpKSxcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RRdWVzdFN0YXRlKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHF1ZXN0ID0gR2FtZS5nZXRRdWVzdChcIk1RMTAxXCIpO1xuICAgICAgICBpZiAoIXF1ZXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqZWN0aXZlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSAxMDsgaSArPSAxKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheWVkID0gcXVlc3QuaXNPYmplY3RpdmVEaXNwbGF5ZWQoaSk7XG4gICAgICAgICAgICBpZiAoIWRpc3BsYXllZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqZWN0aXZlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5ZWQ6IGRpc3BsYXllZCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IHF1ZXN0LmlzT2JqZWN0aXZlQ29tcGxldGVkKGkpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcXVlc3RXaXRoRWRpdG9ySWQgPSBxdWVzdDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXN0TmFtZTogKF9hID0gcXVlc3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBudWxsLFxuICAgICAgICAgICAgZWRpdG9ySWQ6IHR5cGVvZiBxdWVzdFdpdGhFZGl0b3JJZC5nZXRFZGl0b3JJZCA9PT0gXCJmdW5jdGlvblwiID8gKF9iID0gcXVlc3RXaXRoRWRpdG9ySWQuZ2V0RWRpdG9ySWQoKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbCA6IG51bGwsXG4gICAgICAgICAgICBjdXJyZW50U3RhZ2U6IHF1ZXN0LmdldEN1cnJlbnRTdGFnZUlEKCksXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBvYmplY3RpdmVzXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfYykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBnZXRPcGVuTWVudXMgfSBmcm9tIFwiLi4vZXZlbnRzXCI7XG5pbXBvcnQgeyBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0IH0gZnJvbSBcIi4vY29sbGVjdG9ycy9jcm9zc2hhaXItY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0RW52aXJvbm1lbnRTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvZW52aXJvbm1lbnQtY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0SW5wdXRTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvaW5wdXQtY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0TG9jYXRpb25TdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbG9jYXRpb24tY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0TmVhcmJ5TnBjcyB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbmVhcmJ5LWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFBsYXllckZ1bGxTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvcGxheWVyLWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFF1ZXN0U3RhdGUgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL3F1ZXN0LWNvbGxlY3RvclwiO1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN0YXRlKHN0YXRlLCBwcmlvcml0eSkge1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBwcm90b2NvbFZlcnNpb246IDEsXG4gICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgc291cmNlOiBcInNreWd1aWRlXCIsXG4gICAgICAgIGRhdGE6IHN0YXRlLFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICB9O1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXJpYWxpemVGdWxsU3RhdGUoZXZlbnRUeXBlLCBwcmlvcml0eSkge1xuICAgIGlmIChldmVudFR5cGUgPT09IHZvaWQgMCkgeyBldmVudFR5cGUgPSBcInRpY2tcIjsgfVxuICAgIGlmIChwcmlvcml0eSA9PT0gdm9pZCAwKSB7IHByaW9yaXR5ID0gXCJtZWRpdW1cIjsgfVxuICAgIHZhciBwbGF5ZXIgPSBudWxsO1xuICAgIHZhciBuZWFyYnlOcGNzID0gW107XG4gICAgdmFyIGNyb3NzaGFpclRhcmdldCA9IG51bGw7XG4gICAgdmFyIGxvY2F0aW9uID0gbnVsbDtcbiAgICB2YXIgcXVlc3QgPSBudWxsO1xuICAgIHZhciBpbnB1dCA9IG51bGw7XG4gICAgdmFyIGVudmlyb25tZW50ID0gbnVsbDtcbiAgICB2YXIgbWVudSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgcGxheWVyID0gY29sbGVjdFBsYXllckZ1bGxTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcGxheWVyID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbmVhcmJ5TnBjcyA9IGNvbGxlY3ROZWFyYnlOcGNzKCk7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBuZWFyYnlOcGNzID0gW107XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGNyb3NzaGFpclRhcmdldCA9IGNvbGxlY3RDcm9zc2hhaXJUYXJnZXQoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIGNyb3NzaGFpclRhcmdldCA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGxvY2F0aW9uID0gY29sbGVjdExvY2F0aW9uU3RhdGUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgIGxvY2F0aW9uID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgcXVlc3QgPSBjb2xsZWN0UXVlc3RTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgcXVlc3QgPSBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpbnB1dCA9IGNvbGxlY3RJbnB1dFN0YXRlKCk7XG4gICAgfVxuICAgIGNhdGNoIChfZikge1xuICAgICAgICBpbnB1dCA9IG51bGw7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGVudmlyb25tZW50ID0gY29sbGVjdEVudmlyb25tZW50U3RhdGUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9nKSB7XG4gICAgICAgIGVudmlyb25tZW50ID0gbnVsbDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgbWVudSA9IHtcbiAgICAgICAgICAgIG9wZW5NZW51czogQXJyYXkuZnJvbShnZXRPcGVuTWVudXMoKSlcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgIG1lbnUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgZnVsbFN0YXRlID0ge1xuICAgICAgICBwbGF5ZXI6IHBsYXllcixcbiAgICAgICAgbmVhcmJ5TnBjczogbmVhcmJ5TnBjcyxcbiAgICAgICAgY3Jvc3NoYWlyVGFyZ2V0OiBjcm9zc2hhaXJUYXJnZXQsXG4gICAgICAgIGxvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgcXVlc3Q6IHF1ZXN0LFxuICAgICAgICBpbnB1dDogaW5wdXQsXG4gICAgICAgIG1lbnU6IG1lbnUsXG4gICAgICAgIGVudmlyb25tZW50OiBlbnZpcm9ubWVudCxcbiAgICAgICAgZXZlbnRUeXBlOiBldmVudFR5cGVcbiAgICB9O1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBwcm90b2NvbFZlcnNpb246IDEsXG4gICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgc291cmNlOiBcInNreWd1aWRlXCIsXG4gICAgICAgIGRhdGE6IGZ1bGxTdGF0ZSxcbiAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkocGF5bG9hZCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJ2YXIgcnVudGltZSA9IGdsb2JhbFRoaXM7XG5pZiAoIXJ1bnRpbWUuc2t5cmltUGxhdGZvcm0pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NreXJpbVBsYXRmb3JtIGdsb2JhbCBpcyBub3QgYXZhaWxhYmxlJyk7XG59XG52YXIgc2t5cmltUGxhdGZvcm0gPSBydW50aW1lLnNreXJpbVBsYXRmb3JtO1xuZXhwb3J0IHZhciBvbmNlID0gc2t5cmltUGxhdGZvcm0ub25jZSwgb24gPSBza3lyaW1QbGF0Zm9ybS5vbiwgcHJpbnRDb25zb2xlID0gc2t5cmltUGxhdGZvcm0ucHJpbnRDb25zb2xlLCBEZWJ1ZyA9IHNreXJpbVBsYXRmb3JtLkRlYnVnLCBob29rcyA9IHNreXJpbVBsYXRmb3JtLmhvb2tzLCBmaW5kQ29uc29sZUNvbW1hbmQgPSBza3lyaW1QbGF0Zm9ybS5maW5kQ29uc29sZUNvbW1hbmQsIE9iamVjdFJlZmVyZW5jZSA9IHNreXJpbVBsYXRmb3JtLk9iamVjdFJlZmVyZW5jZSwgSHR0cENsaWVudCA9IHNreXJpbVBsYXRmb3JtLkh0dHBDbGllbnQsIFVpID0gc2t5cmltUGxhdGZvcm0uVWksIEdhbWUgPSBza3lyaW1QbGF0Zm9ybS5HYW1lLCBJbnB1dCA9IHNreXJpbVBsYXRmb3JtLklucHV0LCBEeFNjYW5Db2RlID0gc2t5cmltUGxhdGZvcm0uRHhTY2FuQ29kZSwgVXRpbGl0eSA9IHNreXJpbVBsYXRmb3JtLlV0aWxpdHksIFdlYXRoZXIgPSBza3lyaW1QbGF0Zm9ybS5XZWF0aGVyO1xuZXhwb3J0IGRlZmF1bHQgc2t5cmltUGxhdGZvcm07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHNreXJpbVBsYXRmb3JtOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IG9uY2UsIG9uLCBwcmludENvbnNvbGUsIGhvb2tzLCBmaW5kQ29uc29sZUNvbW1hbmQsIEdhbWUgfSBmcm9tIFwiLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJBbGxFdmVudHMgfSBmcm9tIFwiLi9ldmVudHNcIjtcbmltcG9ydCB7IHN0YXJ0UG9sbGluZyB9IGZyb20gXCIuL2FjdGlvbnMvcG9sbGluZ1wiO1xuaW1wb3J0IHsgZXZhbHVhdGVQcmlvcml0eSwgc2hvdWxkU2VuZCwgcmVjb3JkU2VudFN0YXRlIH0gZnJvbSBcIi4vYXJiaXRyYXRpb24vcHJpb3JpdHlcIjtcbmltcG9ydCB7IHNlcmlhbGl6ZUZ1bGxTdGF0ZSB9IGZyb20gXCIuL2dhbWUtc3RhdGUvc2VyaWFsaXplclwiO1xuaW1wb3J0IHsgY29sbGVjdEZ1bGxTdGF0ZSB9IGZyb20gXCIuL2dhbWUtc3RhdGUvY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBzZW5kR2FtZVN0YXRlLCBpc0Nvbm5lY3RlZCB9IGZyb20gXCIuL2NvbW11bmljYXRpb24vaHR0cC1jbGllbnRcIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBsYXN0VGlja1RpbWUgPSAwO1xudmFyIHBsYXllckFuaW1hdGlvbiA9IFwiXCI7XG52YXIgZXZlbnRzUmVnaXN0ZXJlZCA9IGZhbHNlO1xudmFyIHBvbGxpbmdTdGFydGVkID0gZmFsc2U7XG52YXIgbGFzdENvbWJhdFN0YXRlID0gMDtcbnZhciBsYXN0TW92ZW1lbnRMb2dUaW1lID0gMDtcbnZhciBsYXN0TG9nZ2VkUG9zaXRpb24gPSBudWxsO1xudmFyIENPTExFQ1RPUlNfQ09VTlQgPSA4O1xudmFyIE1PVkVNRU5UX0xPR19NSU5fRElTVEFOQ0UgPSAxMDA7XG52YXIgTU9WRU1FTlRfTE9HX0lOVEVSVkFMX01TID0gMTAwMDtcbi8qKlxuICogZmluZENvbnNvbGVDb21tYW5kIG9ubHkgcmVzb2x2ZXMgYnVpbHQtaW4gU0NSSVBUX0ZVTkNUSU9OIGVudHJpZXM7IGl0IGNhbm5vdCBpbnZlbnQgbmV3IGNvbW1hbmRzLlxuICogV2UgcmVwdXJwb3NlIGFuIGV4aXN0aW5nIHNsb3QgYW5kIHJlbmFtZSBpdCB0byBcInNreWd1aWRlXCIgKHNlZSBza3ltcC9kb2NzL3NreXJpbV9wbGF0Zm9ybS9mZWF0dXJlcy5tZCkuXG4gKi9cbnZhciBIT1NUX0NPTlNPTEVfQ09NTUFORF9GT1JfU0tZR1VJREUgPSBcIkdldEFWSW5mb1wiO1xuZnVuY3Rpb24gcmVnaXN0ZXJTa3lndWlkZUNvbnNvbGVDb21tYW5kKCkge1xuICAgIHZhciBob3N0ID0gZmluZENvbnNvbGVDb21tYW5kKEhPU1RfQ09OU09MRV9DT01NQU5EX0ZPUl9TS1lHVUlERSk7XG4gICAgaWYgKCFob3N0KSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gQ29uc29sZSBob29rIGZhaWxlZDogbm8gXFxcIlwiLmNvbmNhdChIT1NUX0NPTlNPTEVfQ09NTUFORF9GT1JfU0tZR1VJREUsIFwiXFxcIiBjb21tYW5kICh1bmV4cGVjdGVkKS5cIikpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGhvc3QubG9uZ05hbWUgPSBcInNreWd1aWRlXCI7XG4gICAgaG9zdC5zaG9ydE5hbWUgPSBcIlwiO1xuICAgIGhvc3QubnVtQXJncyA9IDA7XG4gICAgaG9zdC5leGVjdXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJTa3lHdWlkZSBTdGF0dXM6XCIpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIENvbm5lY3RlZDogXCIuY29uY2F0KGlzQ29ubmVjdGVkKCkpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBQb2xsaW5nIHN0YXR1czogXCIuY29uY2F0KHBvbGxpbmdTdGFydGVkID8gXCJhY3RpdmVcIiA6IFwiaW5hY3RpdmVcIikpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIEV2ZW50cyByZWdpc3RlcmVkOiBcIi5jb25jYXQoZXZlbnRzUmVnaXN0ZXJlZCA/IFwieWVzXCIgOiBcIm5vXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb2xsZWN0b3JzIGNvdW50OiBcIi5jb25jYXQoQ09MTEVDVE9SU19DT1VOVCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFNlcnZlcjogXCIuY29uY2F0KENPTkZJRy5zZXJ2ZXJVcmwpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBTZW5kIGludGVydmFsOiBcIi5jb25jYXQoQ09ORklHLnRpY2tJbnRlcnZhbCwgXCJtcyAob24gdXBkYXRlKVwiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgRGVidWcgbW9kZTogXCIuY29uY2F0KENPTkZJRy5kZWJ1Z01vZGUpKTtcbiAgICAgICAgLy8gUmV0dXJuaW5nIGZhbHNlIGF2b2lkcyBydW5uaW5nIHRoZSBvcmlnaW5hbCBob3N0IGNvbW1hbmQgaW1wbGVtZW50YXRpb24uXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gQ29uc29sZTogflwiLmNvbmNhdChIT1NUX0NPTlNPTEVfQ09NTUFORF9GT1JfU0tZR1VJREUsIFwiIGlzIG5vdyB+c2t5Z3VpZGVcIikpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHByb2Nlc3NBbmRTZW5kKGV2ZW50VHlwZSwgYW5pbWF0aW9uKSB7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBjb2xsZWN0RnVsbFN0YXRlKGFuaW1hdGlvbiwgZXZlbnRUeXBlKTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIGNvbGxlY3RGdWxsU3RhdGUgcmV0dXJuZWQgbnVsbDsgc2tpcCBzZW5kXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHByaW9yaXR5ID0gZXZhbHVhdGVQcmlvcml0eShzdGF0ZSk7XG4gICAgaWYgKCFzaG91bGRTZW5kKHByaW9yaXR5LCBzdGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcGF5bG9hZCA9IHNlcmlhbGl6ZUZ1bGxTdGF0ZShldmVudFR5cGUsIHByaW9yaXR5KTtcbiAgICBpZiAoIXBheWxvYWQpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gRmFpbGVkIHRvIHNlcmlhbGl6ZSBmdWxsIHN0YXRlIHBheWxvYWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZW5kR2FtZVN0YXRlKHBheWxvYWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZW50KSB7XG4gICAgICAgIGlmIChzZW50KSB7XG4gICAgICAgICAgICByZWNvcmRTZW50U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJTZW50IHN0YXRlOiBcIi5jb25jYXQocHJpb3JpdHksIFwiIHByaW9yaXR5IChcIikuY29uY2F0KGV2ZW50VHlwZSwgXCIpXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEZhaWxlZCB0byBzZW5kIGdhbWUgc3RhdGU6IFwiLmNvbmNhdChtc2cpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gc2FmZVByb2Nlc3NBbmRTZW5kKGV2ZW50VHlwZSwgYW5pbWF0aW9uKSB7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICB0cnkge1xuICAgICAgICBwcm9jZXNzQW5kU2VuZChldmVudFR5cGUsIGFuaW1hdGlvbik7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gcHJvY2Vzc0FuZFNlbmQgZmFpbGVkIChcIi5jb25jYXQoZXZlbnRUeXBlLCBcIik6IFwiKS5jb25jYXQobXNnKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBkaXN0YW5jZTNEKGZyb20sIHRvKSB7XG4gICAgdmFyIGR4ID0gdG8ueCAtIGZyb20ueDtcbiAgICB2YXIgZHkgPSB0by55IC0gZnJvbS55O1xuICAgIHZhciBkeiA9IHRvLnogLSBmcm9tLno7XG4gICAgcmV0dXJuIE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHopO1xufVxuZnVuY3Rpb24gbG9nUGxheWVyV2Fsa2luZyhub3cpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllciB8fCBwbGF5ZXIuaXNEZWFkKCkpIHtcbiAgICAgICAgbGFzdExvZ2dlZFBvc2l0aW9uID0gbnVsbDtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgY3VycmVudFBvc2l0aW9uID0ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpXG4gICAgfTtcbiAgICBpZiAoIWxhc3RMb2dnZWRQb3NpdGlvbikge1xuICAgICAgICBsYXN0TG9nZ2VkUG9zaXRpb24gPSBjdXJyZW50UG9zaXRpb247XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHdhbGtlZERpc3RhbmNlID0gZGlzdGFuY2UzRChsYXN0TG9nZ2VkUG9zaXRpb24sIGN1cnJlbnRQb3NpdGlvbik7XG4gICAgaWYgKHdhbGtlZERpc3RhbmNlIDwgTU9WRU1FTlRfTE9HX01JTl9ESVNUQU5DRSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChub3cgLSBsYXN0TW92ZW1lbnRMb2dUaW1lIDwgTU9WRU1FTlRfTE9HX0lOVEVSVkFMX01TKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG1vdmVtZW50S2luZCA9IHBsYXllci5pc1NwcmludGluZygpXG4gICAgICAgID8gXCJzcHJpbnRpbmdcIlxuICAgICAgICA6IHBsYXllci5pc1J1bm5pbmcoKVxuICAgICAgICAgICAgPyBcInJ1bm5pbmdcIlxuICAgICAgICAgICAgOiBcIndhbGtpbmdcIjtcbiAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIFBsYXllciBcIi5jb25jYXQobW92ZW1lbnRLaW5kLCBcIjogeD1cIikuY29uY2F0KGN1cnJlbnRQb3NpdGlvbi54LnRvRml4ZWQoMCksIFwiIHk9XCIpLmNvbmNhdChjdXJyZW50UG9zaXRpb24ueS50b0ZpeGVkKDApLCBcIiB6PVwiKS5jb25jYXQoY3VycmVudFBvc2l0aW9uLnoudG9GaXhlZCgwKSwgXCIgKG1vdmVkIFwiKS5jb25jYXQod2Fsa2VkRGlzdGFuY2UudG9GaXhlZCgwKSwgXCIpXCIpKTtcbiAgICBsYXN0TG9nZ2VkUG9zaXRpb24gPSBjdXJyZW50UG9zaXRpb247XG4gICAgbGFzdE1vdmVtZW50TG9nVGltZSA9IG5vdztcbn1cbnZhciBpc0xvYWRlZCA9IGZhbHNlO1xuZnVuY3Rpb24gaW5pdCgpIHtcbiAgICBpZiAoaXNMb2FkZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBwcmludENvbnNvbGUoXCJTa3lHdWlkZSBwbHVnaW4gbG9hZGVkIVwiKTtcbiAgICByZWdpc3RlckFsbEV2ZW50cygpO1xuICAgIGV2ZW50c1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIHN0YXJ0UG9sbGluZygpO1xuICAgIHBvbGxpbmdTdGFydGVkID0gQ09ORklHLnBvbGxpbmdFbmFibGVkO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlNlcnZlcjogXCIuY29uY2F0KENPTkZJRy5zZXJ2ZXJVcmwpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VuZCBpbnRlcnZhbDogXCIuY29uY2F0KENPTkZJRy50aWNrSW50ZXJ2YWwsIFwibXMgKG9uIHVwZGF0ZSlcIikpO1xuICAgIH1cbiAgICAvLyBSZWdpc3RlciBiZWZvcmUgaG9va3Muc2VuZEFuaW1hdGlvbkV2ZW50OyBpZiB0aGF0IHRocm93cyAoZS5nLiBtYWluIG1lbnUgc3RhdGUpLCB3ZSBzdGlsbCBnZXQgYSB+IGNvbW1hbmQuXG4gICAgdHJ5IHtcbiAgICAgICAgcmVnaXN0ZXJTa3lndWlkZUNvbnNvbGVDb21tYW5kKCk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBDb25zb2xlIGNvbW1hbmQgcmVnaXN0cmF0aW9uIGZhaWxlZDogXCIuY29uY2F0KG1zZykpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBob29rcy5zZW5kQW5pbWF0aW9uRXZlbnQuYWRkKHtcbiAgICAgICAgICAgIGVudGVyOiBmdW5jdGlvbiAoY3R4KSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbGlkQXR0YWNrcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2tsZWZ0XCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0YWNrcmlnaHRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2traWNrXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0YWNrM1wiLFxuICAgICAgICAgICAgICAgICAgICBcImF0dGFja3Rocm93XCJcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIHZhciBldmVudExvd2VyID0gY3R4LmFuaW1FdmVudE5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRBdHRhY2tzLnNvbWUoZnVuY3Rpb24gKGF0dGFjaykgeyByZXR1cm4gZXZlbnRMb3dlci5pbmNsdWRlcyhhdHRhY2spOyB9KSkge1xuICAgICAgICAgICAgICAgICAgICBwbGF5ZXJBbmltYXRpb24gPSBjdHguYW5pbUV2ZW50TmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgUExBWUVSX0ZPUk1fSUQsIFBMQVlFUl9GT1JNX0lELCBcIkF0dGFjaypcIik7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBzZW5kQW5pbWF0aW9uRXZlbnQgaG9vayBmYWlsZWQgKG5vbi1mYXRhbCk6IFwiLmNvbmNhdChtc2cpKTtcbiAgICB9XG4gICAgaXNMb2FkZWQgPSB0cnVlO1xufVxub25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgaW5pdCgpO1xufSk7XG5vbihcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgbG9nUGxheWVyV2Fsa2luZyhub3cpO1xuICAgIGlmICghaXNDb25uZWN0ZWQoKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChub3cgLSBsYXN0VGlja1RpbWUgPCBDT05GSUcudGlja0ludGVydmFsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGFzdFRpY2tUaW1lID0gbm93O1xuICAgIHZhciBhbmltYXRpb24gPSBwbGF5ZXJBbmltYXRpb247XG4gICAgcGxheWVyQW5pbWF0aW9uID0gXCJcIjtcbiAgICBzYWZlUHJvY2Vzc0FuZFNlbmQoXCJ0aWNrXCIsIGFuaW1hdGlvbik7XG59KTtcbm9uKFwiY29tYmF0U3RhdGVcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGFjdG9yID0gZXZlbnQuYWN0b3IuZ2V0Rm9ybUlEKCk7XG4gICAgaWYgKGFjdG9yICE9PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBuZXdTdGF0ZSA9IGV2ZW50LmlzQ29tYmF0ID8gMSA6IGV2ZW50LmlzU2VhcmNoaW5nID8gMiA6IDA7XG4gICAgdmFyIG9sZFN0YXRlID0gbGFzdENvbWJhdFN0YXRlO1xuICAgIGxhc3RDb21iYXRTdGF0ZSA9IG5ld1N0YXRlO1xuICAgIHNhZmVQcm9jZXNzQW5kU2VuZChcImNvbWJhdFN0YXRlX1wiLmNvbmNhdChuZXdTdGF0ZSkpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIkNvbWJhdCBzdGF0ZSBjaGFuZ2VkOiBcIi5jb25jYXQob2xkU3RhdGUsIFwiIC0+IFwiKS5jb25jYXQobmV3U3RhdGUpKTtcbiAgICB9XG59KTtcbm9uKFwiaGl0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2UsIF9mLCBfZywgX2g7XG4gICAgdmFyIHRhcmdldCA9IChfYyA9IChfYiA9IChfYSA9IGV2ZW50LnRhcmdldCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoX2EpKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiAwO1xuICAgIHZhciBzb3VyY2UgPSAoX2YgPSAoX2UgPSAoX2QgPSBldmVudC5hZ2dyZXNzb3IpID09PSBudWxsIHx8IF9kID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZC5nZXRGb3JtSUQpID09PSBudWxsIHx8IF9lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZS5jYWxsKF9kKSkgIT09IG51bGwgJiYgX2YgIT09IHZvaWQgMCA/IF9mIDogMDtcbiAgICB2YXIgc291cmNlQmFzZUZvcm0gPSAoX2ggPSAoX2cgPSBldmVudC5zb3VyY2UpID09PSBudWxsIHx8IF9nID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZy5nZXRGb3JtSUQpID09PSBudWxsIHx8IF9oID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfaC5jYWxsKF9nKTtcbiAgICBpZiAodGFyZ2V0ICE9PSBQTEFZRVJfRk9STV9JRCAmJiBzb3VyY2UgIT09IFBMQVlFUl9GT1JNX0lEKVxuICAgICAgICByZXR1cm47XG4gICAgc2FmZVByb2Nlc3NBbmRTZW5kKFwiaGl0XCIpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIkhpdCBldmVudDogdGFyZ2V0PVwiLmNvbmNhdCh0YXJnZXQsIFwiLCBzb3VyY2U9XCIpLmNvbmNhdChzb3VyY2UsIFwiLCBzb3VyY2VGb3JtPVwiKS5jb25jYXQoU3RyaW5nKHNvdXJjZUJhc2VGb3JtKSkpO1xuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9