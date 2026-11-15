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
/* harmony import */ var _timers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../timers */ "./src/timers.ts");



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
/**
 * Nearest loaded reference of a given form type in the player's cell, found by
 * cell enumeration (Cell.getNumRefs/getNthRef — verified APIs; the old
 * `Game.findClosestReference` call here was NOT a real API). Cell order is not
 * distance-ordered, so we scan and pick the closest valid one.
 */
function getClosestReferenceOfType(player, formType, playerFormId) {
    var _a;
    var cell = player.getParentCell();
    if (!cell || typeof cell.getNumRefs !== "function" || typeof cell.getNthRef !== "function") {
        return null;
    }
    var count = 0;
    try {
        count = (_a = cell.getNumRefs(formType)) !== null && _a !== void 0 ? _a : 0;
    }
    catch (_b) {
        return null;
    }
    var best = null;
    var bestDistance = Number.POSITIVE_INFINITY;
    var origin = null;
    for (var i = 0; i < count; i++) {
        var ref = cell.getNthRef(i, formType);
        if (!ref || !isValidReference(ref))
            continue;
        var formId = getReferenceFormId(ref);
        if (formId === null || formId === playerFormId)
            continue;
        if (!origin) {
            origin = getPlayerPosition(player);
        }
        if (!origin)
            return null;
        var candidate = ref;
        var dx = candidate.getPositionX() - origin.x;
        var dy = candidate.getPositionY() - origin.y;
        var dz = candidate.getPositionZ() - origin.z;
        var distance = dx * dx + dy * dy + dz * dz;
        if (distance < bestDistance) {
            bestDistance = distance;
            best = ref;
        }
    }
    return best;
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
    // Game-loop timer: runs on `update`, so it self-suspends during loading
    // screens instead of releasing into a loading frame like a Node timer could.
    (0,_timers__WEBPACK_IMPORTED_MODULE_2__.setGameTimeout)(function () {
        // @ts-ignore
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Input.releaseKey(42 /* DxScanCode.LeftShift */);
    }, delayMs);
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
                var nearestDoor_1 = getClosestReferenceOfType(player, 29 /* FormType.Door */, _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID);
                if (!isValidReference(nearestDoor_1)) {
                    logDebug("Activate blocked: no valid nearest door");
                    return false;
                }
                return executeSafely(action.type, function () {
                    nearestDoor_1.activate(player);
                });
            }
            var nearestContainer_1 = getClosestReferenceOfType(player, 28 /* FormType.Container */, _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID);
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
/* harmony import */ var _timers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../timers */ "./src/timers.ts");
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
/** Outbox cursor — highest action id we have pulled from the server. */
var lastSeenId = 0;
function logDebug(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        _skyrim_platform_skyrim_platform__WEBPACK_IMPORTED_MODULE_0__.printConsole("[SkyGuide] ".concat(message));
    }
}
function pollForActions() {
    return __awaiter(this, void 0, void 0, function () {
        var endpoint, response, parsed, actions, _i, actions_1, raw, id, action, err_1, msg;
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
                    endpoint = "".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.pollingEndpoint, "?since=").concat(lastSeenId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, pollingClient.get(endpoint)];
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
                            // Track the outbox cursor before executing — each entry carries a
                            // monotonic id; unknown types still advance it.
                            if (typeof raw === "object" && raw !== null) {
                                id = raw.id;
                                if (typeof id === "number" && Number.isFinite(id) && id > lastSeenId) {
                                    lastSeenId = id;
                                }
                            }
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
    pollTimerId = (0,_timers__WEBPACK_IMPORTED_MODULE_4__.setGameTimeout)(function () {
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
        (0,_timers__WEBPACK_IMPORTED_MODULE_4__.clearGameTimeout)(pollTimerId);
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

/***/ "./src/bridge.ts"
/*!***********************!*\
  !*** ./src/bridge.ts ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   heartbeatAgeMs: () => (/* binding */ heartbeatAgeMs),
/* harmony export */   initBridge: () => (/* binding */ initBridge),
/* harmony export */   isCompanionReady: () => (/* binding */ isCompanionReady),
/* harmony export */   isOverlayVisible: () => (/* binding */ isOverlayVisible),
/* harmony export */   setCompanionFocused: () => (/* binding */ setCompanionFocused)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config */ "./src/config.ts");
/* harmony import */ var _actions_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./actions/parser */ "./src/actions/parser.ts");
/* harmony import */ var _actions_executor__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./actions/executor */ "./src/actions/executor.ts");
/* harmony import */ var _timers__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./timers */ "./src/timers.ts");





/**
 * Companion browser bridge (converged design from docs/research/
 * brainstorm-pathA-bridge.md and brainstorm-pathB-direct-ws.md):
 *
 *  - The in-game CEF page (loaded from the companion app) owns the WebSocket
 *    to the app — the plugin NEVER touches WebSockets (SP JS has none).
 *  - The plugin receives page intents via `browserMessage`
 *    (page calls `window.skyrimPlatform.sendMessage(...)`).
 *  - The plugin pushes only RARE events into the page via
 *    `browser.executeJavaScript` — never per-tick state (the engine already
 *    broadcasts gameState to WS peers; the page reads it from there).
 *  - `companion-ready` handshake + heartbeat: `executeJavaScript` injections
 *    are silently dropped before the page's first load-end (verified in
 *    BrowserApiTilted.cpp — no queue), so nothing is pushed until ready.
 */
/** Menus during which the overlay is hidden (browserService.ts bad-menu list). */
var BAD_MENUS = [
    "Loading Menu",
    "Main Menu",
    "Console",
    "TweenMenu",
    "RaceSex Menu",
    " crafting ", // matches Crafting/Smithing/Enchanting menus
];
var HEARTBEAT_TIMEOUT_MS = 15000;
var WATCHDOG_INTERVAL_MS = 5000;
var MAX_TRACKED_ACTION_IDS = 64;
var bridgeActive = false;
var companionReady = false;
var lastHeartbeatAt = 0;
var overlayVisible = false;
var recentActionIds = [];
function logBridge(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide][bridge] ".concat(message));
    }
}
/**
 * Serialize-then-embed-in-source. `executeJavaScript` takes SOURCE CODE, not
 * data (MyChromiumApp.cpp:272-278) — a raw JSON interpolation of game strings
 * (actor names are modder-controlled data) would break the injection or
 * execute arbitrary JS in the page. Hence the double `JSON.stringify`.
 * Injections before the page is loaded are silently dropped on the Tilted
 * backend — callers must only inject after `companionReady`.
 */
function injectMessage(message) {
    if (!companionReady) {
        logBridge("inject skipped: page not ready yet");
        return false;
    }
    try {
        var payload = JSON.stringify(JSON.stringify(message));
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.browser.executeJavaScript("window.__skyguideReceive(".concat(payload, ")"));
        return true;
    }
    catch (err) {
        logBridge("inject failed: ".concat(String(err)));
        return false;
    }
}
function rememberActionId(id) {
    if (!id)
        return true; // untracked actions always run (HTTP parity)
    if (recentActionIds.includes(id)) {
        logBridge("duplicate action id ignored: ".concat(id));
        return false;
    }
    recentActionIds.push(id);
    if (recentActionIds.length > MAX_TRACKED_ACTION_IDS) {
        recentActionIds.shift();
    }
    return true;
}
function handleActionArgument(raw) {
    // Page may send the action as an object or as a JSON string — accept both.
    var candidate = raw;
    if (typeof candidate === "string") {
        try {
            candidate = JSON.parse(candidate);
        }
        catch (_a) {
            logBridge("bridge action rejected: non-JSON string payload");
            injectMessage({ type: "action-result", ok: false });
            return;
        }
    }
    var action = (0,_actions_parser__WEBPACK_IMPORTED_MODULE_2__.parseAction)(candidate);
    if (!action) {
        logBridge("bridge action rejected: ".concat(JSON.stringify(candidate)));
        injectMessage({ type: "action-result", ok: false });
        return;
    }
    var id = candidate.id;
    var actionId = typeof id === "string" ? id : undefined;
    if (!rememberActionId(actionId))
        return;
    var ok = (0,_actions_executor__WEBPACK_IMPORTED_MODULE_3__.executeAction)(action);
    injectMessage({ type: "action-result", id: actionId, ok: ok });
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide][bridge] action ".concat(action.type, ": ").concat(ok ? "ok" : "failed"));
    }
}
function isBadMenuOpen() {
    for (var _i = 0, BAD_MENUS_1 = BAD_MENUS; _i < BAD_MENUS_1.length; _i++) {
        var menu = BAD_MENUS_1[_i];
        try {
            if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen(menu))
                return true;
        }
        catch (_a) {
            // Menu name not recognized by this build — treat as open to stay hidden.
            return menu === "Loading Menu";
        }
    }
    return false;
}
function refreshOverlayVisibility() {
    if (!bridgeActive)
        return;
    var shouldShow = companionReady && !isBadMenuOpen();
    if (shouldShow === overlayVisible)
        return;
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.browser.setVisible(shouldShow);
        overlayVisible = shouldShow;
        logBridge("overlay ".concat(shouldShow ? "visible" : "hidden"));
    }
    catch (err) {
        logBridge("setVisible failed: ".concat(String(err)));
    }
}
function handleBrowserMessage(event) {
    var args = event.arguments;
    var kind = args[0];
    switch (kind) {
        case "companion-ready": {
            companionReady = true;
            lastHeartbeatAt = Date.now();
            refreshOverlayVisibility();
            injectMessage({ type: "hello", bridgeVersion: 1, gameReady: true });
            logBridge("companion page ready");
            return;
        }
        case "heartbeat": {
            lastHeartbeatAt = Date.now();
            return;
        }
        case "action": {
            handleActionArgument(args[1]);
            return;
        }
        case "spike-result": {
            // CEF media spike reporting (see spike/cef-media-spike/).
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide][spike] ".concat(String(args[1]), " = ").concat(String(args[2])));
            return;
        }
        case "companion-log": {
            logBridge("page: ".concat(String(args[1])));
            return;
        }
        default:
            logBridge("unknown page message: ".concat(String(kind)));
    }
}
function onMenuOpen(_event) {
    refreshOverlayVisibility();
}
function onMenuClose(_event) {
    refreshOverlayVisibility();
}
function initBridge() {
    if (bridgeActive)
        return;
    bridgeActive = true;
    // Page -> plugin channel. Works for ANY loaded page (spike page included) —
    // the handler is registered here even when bridge URL loading is disabled.
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("browserMessage", handleBrowserMessage);
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.bridgeEnabled && _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.companionUrl) {
        try {
            _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.browser.loadUrl(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.companionUrl);
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] companion page: ".concat(_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.companionUrl));
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] note: the URL loads after the first mouse move (CEF behavior)");
        }
        catch (err) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] browser.loadUrl failed: ".concat(String(err)));
        }
    }
    // Hide the overlay during bad menus; re-show after.
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuOpen", onMenuOpen);
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuClose", onMenuClose);
    // Heartbeat watchdog: page must pulse; on staleness we drop to hidden and
    // stop injecting (avoids talking into a dead/crashed renderer).
    (0,_timers__WEBPACK_IMPORTED_MODULE_4__.setGameInterval)(function () {
        if (!companionReady)
            return;
        if (Date.now() - lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) {
            companionReady = false;
            refreshOverlayVisibility();
            logBridge("companion stale (no heartbeat) — bridge paused");
        }
    }, WATCHDOG_INTERVAL_MS);
    logBridge("bridge initialized");
}
function isCompanionReady() {
    return companionReady;
}
function heartbeatAgeMs() {
    if (!companionReady)
        return null;
    return Date.now() - lastHeartbeatAt;
}
function isOverlayVisible() {
    return overlayVisible;
}
/** Manual escape hatch for dev interactivity (F6 also toggles focus in-game). */
function setCompanionFocused(focused) {
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.browser.setFocused(focused);
    }
    catch (err) {
        logBridge("setFocused failed: ".concat(String(err)));
    }
}


/***/ },

/***/ "./src/communication/file-dump.ts"
/*!****************************************!*\
  !*** ./src/communication/file-dump.ts ***!
  \****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dumpModContext: () => (/* binding */ dumpModContext)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


var fsModule;
function loadFs() {
    if (fsModule !== undefined)
        return fsModule;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        fsModule = __webpack_require__(/*! fs */ "fs");
    }
    catch (err) {
        fsModule = null;
        if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Node fs unavailable: ".concat(String(err)));
        }
    }
    return fsModule;
}
function parentDir(filePath) {
    var idx = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
    if (idx <= 0)
        return null;
    return filePath.slice(0, idx);
}
function dumpModContext(payload) {
    if (!_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.modContextDumpEnabled)
        return false;
    var fs = loadFs();
    if (!fs)
        return false;
    var target = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.modContextPath;
    var tmp = "".concat(target, ".tmp");
    try {
        var dir = parentDir(target);
        if (dir) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            }
            catch (_a) {
                // Directory may already exist.
            }
        }
        fs.writeFileSync(tmp, JSON.stringify(payload));
        fs.renameSync(tmp, target);
        return true;
    }
    catch (err) {
        if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] mod-context dump failed: ".concat(String(err)));
        }
        return false;
    }
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
var REQUEST_TIMEOUT_MS = 3000;
var sendCount = 0;
var lastReset = Date.now();
/**
 * Hardening pattern from skymp5-client settingsService: HttpClient has no
 * timeout support (verified — cpp-httplib wrapper), and its thread pool is
 * only 3, so a hung request starves every later one. Race a reject timer.
 */
function withTimeout(promise, timeoutMs, tag) {
    return new Promise(function (resolve, reject) {
        var timer = globalThis.setTimeout
            ? globalThis.setTimeout(function () { return reject(new Error("".concat(tag, ": timeout after ").concat(timeoutMs, "ms"))); }, timeoutMs)
            : null;
        promise.then(function (value) {
            if (timer !== null)
                clearTimeout(timer);
            resolve(value);
        }, function (err) {
            if (timer !== null)
                clearTimeout(timer);
            reject(err);
        });
    });
}
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
                        return [4 /*yield*/, withTimeout(this.client.post("/api/game-state", {
                                body: payload,
                                contentType: "application/json"
                            }), REQUEST_TIMEOUT_MS, "game-state POST")];
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
    // HTTP action polling: GET /api/actions?since=<lastId> — the server keeps
    // an in-memory outbox of pipeline actions (composer suggestions, question
    // answers), pruned after 15s. Each action carries a monotonic id; we send
    // ?since= for at-most-once delivery. Enabled 2026-11-15 alongside the
    // server-side endpoint.
    pollingInterval: 1000,
    pollingEndpoint: "/api/actions",
    pollingMaxBackoff: 30000,
    pollingEnabled: true,
    maxPollingRetries: 5,
    // Companion browser bridge (see src/bridge.ts). The page is served by the
    // companion app; `bridgeEnabled` only controls whether we load the URL —
    // the browserMessage handler is registered regardless (spike page support).
    bridgeEnabled: false,
    companionUrl: "http://localhost:3000/companion",
    // Parallel-array dump for the app's SkyrimFileConnector / parseSkyrimState
    // (Gate + Composer mod context). Path is relative to Skyrim's CWD unless
    // absolute — set SKYRIM_CONTEXT_FILE_PATH on the app to the same file.
    modContextDumpEnabled: true,
    modContextPath: "Data/Platform/SkyGuide/state.json",
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
/* harmony export */   collectBundle: () => (/* binding */ collectBundle),
/* harmony export */   collectFullState: () => (/* binding */ collectFullState)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _collectors_nearby_collector__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./collectors/nearby-collector */ "./src/game-state/collectors/nearby-collector.ts");
/* harmony import */ var _collectors_player_collector__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./collectors/player-collector */ "./src/game-state/collectors/player-collector.ts");
/* harmony import */ var _collectors_location_collector__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./collectors/location-collector */ "./src/game-state/collectors/location-collector.ts");
/* harmony import */ var _collectors_quest_collector__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./collectors/quest-collector */ "./src/game-state/collectors/quest-collector.ts");
/* harmony import */ var _collectors_crosshair_collector__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./collectors/crosshair-collector */ "./src/game-state/collectors/crosshair-collector.ts");







function collectPlayerState() {
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return null;
    return {
        health: player.getActorValue("health"),
        maxHealth: player.getBaseActorValue("health"),
        magicka: player.getActorValue("magicka"),
        stamina: player.getActorValue("stamina"),
        level: player.getLevel(),
        position: {
            x: player.getPositionX(),
            y: player.getPositionY(),
            z: player.getPositionZ(),
        },
        isSneaking: player.isSneaking(),
        isDead: player.isDead(),
    };
}
function enemiesFromNearby(npcs) {
    return npcs
        .filter(function (npc) { return !npc.isDead && npc.isHostile; })
        .sort(function (a, b) { return a.distance - b.distance; })
        .slice(0, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxEnemies)
        .map(function (npc) { return ({
        formId: npc.formId,
        name: npc.name,
        distance: npc.distance,
        health: npc.health,
        level: npc.level,
    }); });
}
function safeCall(fn) {
    try {
        return fn();
    }
    catch (_a) {
        return null;
    }
}
/**
 * One collection pass per send: protocol-v1 payload (reflex + dashboard) and
 * the rich snapshot (Gate/Composer mod-context dump) share the nearby-NPC scan.
 */
function collectBundle(playerAnimation, eventType) {
    var _a, _b, _c;
    if (playerAnimation === void 0) { playerAnimation = ""; }
    if (eventType === void 0) { eventType = "tick"; }
    var player = collectPlayerState();
    if (!player)
        return null;
    var nearbyNpcs = (_a = safeCall(_collectors_nearby_collector__WEBPACK_IMPORTED_MODULE_2__.collectNearbyNpcs)) !== null && _a !== void 0 ? _a : [];
    var combatState = (_c = (_b = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer()) === null || _b === void 0 ? void 0 : _b.getCombatState()) !== null && _c !== void 0 ? _c : 0;
    return {
        protocol: {
            player: player,
            combatState: combatState,
            enemies: enemiesFromNearby(nearbyNpcs),
            playerAnimation: playerAnimation,
            eventType: eventType,
        },
        snapshot: {
            player: safeCall(_collectors_player_collector__WEBPACK_IMPORTED_MODULE_3__.collectPlayerFullState),
            nearbyNpcs: nearbyNpcs,
            crosshairTarget: safeCall(_collectors_crosshair_collector__WEBPACK_IMPORTED_MODULE_6__.collectCrosshairTarget),
            location: safeCall(_collectors_location_collector__WEBPACK_IMPORTED_MODULE_4__.collectLocationState),
            quest: safeCall(_collectors_quest_collector__WEBPACK_IMPORTED_MODULE_5__.collectQuestState),
            input: null,
            menu: null,
            environment: null,
            eventType: eventType,
        },
    };
}
function collectFullState(playerAnimation, eventType) {
    var _a, _b;
    if (playerAnimation === void 0) { playerAnimation = ""; }
    if (eventType === void 0) { eventType = "tick"; }
    return (_b = (_a = collectBundle(playerAnimation, eventType)) === null || _a === void 0 ? void 0 : _a.protocol) !== null && _b !== void 0 ? _b : null;
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
/**
 * Enumerate loaded actors in the player's cell via Cell.getNumRefs/getNthRef
 * (verified APIs — replaces the old 9-offset findClosestActor scan, which
 * approximated "all nearby actors" by re-searching from offsets).
 * `FormType.Character` (= 62) filters to live actor references.
 */
function collectNearbyNpcs() {
    var _a, _b, _c;
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return [];
    var playerPos = getPlayerPosition();
    if (!playerPos)
        return [];
    var cell = player.getParentCell();
    if (!cell)
        return [];
    var refCount = 0;
    try {
        refCount = (_a = cell.getNumRefs(62 /* FormType.Character */)) !== null && _a !== void 0 ? _a : 0;
    }
    catch (_d) {
        return [];
    }
    var nearbyNpcs = [];
    for (var i = 0; i < refCount; i++) {
        if (nearbyNpcs.length >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.maxEnemies)
            break;
        var actorRef = null;
        try {
            actorRef = cell.getNthRef(i, 62 /* FormType.Character */);
        }
        catch (_e) {
            continue;
        }
        if (!actorRef)
            continue;
        // getNthRef yields ObjectReference; the detail probes below are Actor
        // methods (isHostileToActor, isGuard, ...) — cast via the verified
        // Actor.from helper (ObjectReference extends PapyrusObject).
        var actor = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Actor.from(actorRef);
        if (!actor)
            continue;
        var formId = actor.getFormID();
        if (formId === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID)
            continue;
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
        catch (_f) {
            level = 0;
        }
        var race = null;
        try {
            race = (_c = (_b = actor.getRace()) === null || _b === void 0 ? void 0 : _b.getName()) !== null && _c !== void 0 ? _c : null;
        }
        catch (_g) {
            race = null;
        }
        var isHostile = false;
        try {
            isHostile = actor.isHostileToActor(player);
        }
        catch (_h) {
            isHostile = false;
        }
        var isAlly = false;
        try {
            isAlly = actor.isPlayerTeammate();
        }
        catch (_j) {
            isAlly = false;
        }
        var isGuard = false;
        try {
            isGuard = actor.isGuard();
        }
        catch (_k) {
            isGuard = false;
        }
        var isMerchant = false;
        var isInDialogue = false;
        try {
            isInDialogue = actor.isInDialogueWithPlayer();
        }
        catch (_l) {
            isInDialogue = false;
        }
        var hasLOS = false;
        try {
            hasLOS = actor.hasLOS(player);
        }
        catch (_m) {
            hasLOS = false;
        }
        var isDetected = false;
        try {
            isDetected = actor.isDetectedBy(player);
        }
        catch (_o) {
            isDetected = false;
        }
        var relationshipRank = 0;
        try {
            relationshipRank = actor.getRelationshipRank(player);
        }
        catch (_p) {
            relationshipRank = 0;
        }
        var isDead = false;
        try {
            isDead = actor.isDead();
        }
        catch (_q) {
            isDead = false;
        }
        var headingAngle = 0;
        try {
            headingAngle = player.getHeadingAngle(actor);
        }
        catch (_r) {
            headingAngle = 0;
        }
        nearbyNpcs.push({
            formId: formId,
            name: name,
            distance: distance,
            headingAngle: headingAngle,
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

/***/ "./src/game-state/mod-context.ts"
/*!***************************************!*\
  !*** ./src/game-state/mod-context.ts ***!
  \***************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   buildModContext: () => (/* binding */ buildModContext)
/* harmony export */ });
/**
 * Parallel-array dump matching skydive-app `parseSkyrimState`
 * (`server/utils/skyrim-state-parser.ts`). The Gate/Composer read this via
 * SkyrimFileConnector — they do NOT see the HTTP protocol-v1 payload.
 *
 * Distance conversion: 70 Skyrim units ≈ 1 meter (community convention).
 */
var UNITS_PER_METER = 70;
var OBSTACLE_FRONT_UNITS = 150;
function compassFromAngleZ(angleZ) {
    var dirs = [
        "Nord",
        "Nord-Est",
        "Est",
        "Sud-Est",
        "Sud",
        "Sud-Ouest",
        "Ouest",
        "Nord-Ouest",
    ];
    var normalized = ((angleZ % 360) + 360) % 360;
    return dirs[Math.round(normalized / 45) % 8];
}
function clockFromHeadingAngle(headingAngle) {
    var normalized = ((headingAngle % 360) + 360) % 360;
    var hour = Math.round(normalized / 30) % 12;
    return "".concat(hour === 0 ? 12 : hour, "h");
}
function flag(value) {
    return value ? 1 : 0;
}
function buildModContext(snapshot, protocol) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var floats = {
        "player.health": protocol.player.health,
        "player.health_max": protocol.player.maxHealth,
        "player.magicka": protocol.player.magicka,
        "player.stamina": protocol.player.stamina,
    };
    var ints = {
        "player.is_in_interior": flag((_a = snapshot.location) === null || _a === void 0 ? void 0 : _a.isInterior),
        "player.in_combat": flag(protocol.combatState > 0 || ((_b = snapshot.player) === null || _b === void 0 ? void 0 : _b.combat.isInCombat)),
        "player.in_dialogue": flag(snapshot.nearbyNpcs.some(function (n) { return n.isInDialogue; })),
        "player.is_running": flag((_c = snapshot.player) === null || _c === void 0 ? void 0 : _c.movement.isRunning),
        "player.is_sneaking": flag(protocol.player.isSneaking || ((_d = snapshot.player) === null || _d === void 0 ? void 0 : _d.movement.isSneaking)),
        "player.is_swimming": flag((_e = snapshot.player) === null || _e === void 0 ? void 0 : _e.movement.isSwimming),
        "player.is_weapon_drawn": flag((_f = snapshot.player) === null || _f === void 0 ? void 0 : _f.combat.isWeaponDrawn),
        "player.is_stuck": 0,
        "player.obstacle_front": flag(snapshot.crosshairTarget !== null &&
            snapshot.crosshairTarget.distance <= OBSTACLE_FRONT_UNITS &&
            snapshot.crosshairTarget.type !== "NPC"),
    };
    var strings = {};
    var locationName = ((_g = snapshot.location) === null || _g === void 0 ? void 0 : _g.locationName) || ((_h = snapshot.location) === null || _h === void 0 ? void 0 : _h.cellName);
    if (locationName)
        strings["player.location"] = locationName;
    if (snapshot.player) {
        strings["player.compass"] = compassFromAngleZ(snapshot.player.heading.angleZ);
    }
    if ((_j = snapshot.quest) === null || _j === void 0 ? void 0 : _j.questName)
        strings["quest_active"] = snapshot.quest.questName;
    var living = snapshot.nearbyNpcs
        .filter(function (npc) { return !npc.isDead; })
        .slice()
        .sort(function (a, b) { return a.distance - b.distance; });
    var hostiles = living.filter(function (npc) { return npc.isHostile; });
    ints["enemies.count"] = hostiles.length;
    ints["npcs.count"] = living.length;
    return {
        float: floats,
        int: ints,
        string: strings,
        floatList: {
            "npcs.distance_m": living.map(function (npc) { return npc.distance / UNITS_PER_METER; }),
        },
        stringList: {
            "npcs.name": living.map(function (npc) { return npc.name; }),
            "npcs.clock": living.map(function (npc) { return clockFromHeadingAngle(npc.headingAngle); }),
        },
    };
}


/***/ },

/***/ "./src/game-state/serializer.ts"
/*!**************************************!*\
  !*** ./src/game-state/serializer.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   serializeState: () => (/* binding */ serializeState)
/* harmony export */ });
var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function normalizeEventType(eventType) {
    if (eventType === "hit")
        return "hit";
    if (eventType === "tick")
        return "tick";
    if (eventType.startsWith("combatState"))
        return "combatState";
    return "animation";
}
/**
 * Single outbound payload format: skydive-app protocol.
 */
function serializeState(state, priority) {
    var payload = {
        protocolVersion: 1,
        priority: priority,
        source: "skyguide",
        data: {
            player: state.player,
            combatState: state.combatState,
            enemies: state.enemies.map(function (enemy) { return (__assign(__assign({}, enemy), { animation: "" })); }),
            playerAnimation: state.playerAnimation,
            eventType: normalizeEventType(state.eventType)
        },
        timestamp: Date.now()
    };
    return JSON.stringify(payload);
}


/***/ },

/***/ "./src/skyrimPlatform.ts"
/*!*******************************!*\
  !*** ./src/skyrimPlatform.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Actor: () => (/* binding */ Actor),
/* harmony export */   Debug: () => (/* binding */ Debug),
/* harmony export */   DxScanCode: () => (/* binding */ DxScanCode),
/* harmony export */   FormType: () => (/* binding */ FormType),
/* harmony export */   Game: () => (/* binding */ Game),
/* harmony export */   HttpClient: () => (/* binding */ HttpClient),
/* harmony export */   Input: () => (/* binding */ Input),
/* harmony export */   ObjectReference: () => (/* binding */ ObjectReference),
/* harmony export */   Ui: () => (/* binding */ Ui),
/* harmony export */   Utility: () => (/* binding */ Utility),
/* harmony export */   Weather: () => (/* binding */ Weather),
/* harmony export */   browser: () => (/* binding */ browser),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   findConsoleCommand: () => (/* binding */ findConsoleCommand),
/* harmony export */   getPlatformVersion: () => (/* binding */ getPlatformVersion),
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
var once = skyrimPlatform.once, on = skyrimPlatform.on, printConsole = skyrimPlatform.printConsole, Debug = skyrimPlatform.Debug, hooks = skyrimPlatform.hooks, findConsoleCommand = skyrimPlatform.findConsoleCommand, ObjectReference = skyrimPlatform.ObjectReference, Actor = skyrimPlatform.Actor, HttpClient = skyrimPlatform.HttpClient, Ui = skyrimPlatform.Ui, Game = skyrimPlatform.Game, Input = skyrimPlatform.Input, DxScanCode = skyrimPlatform.DxScanCode, FormType = skyrimPlatform.FormType, Utility = skyrimPlatform.Utility, Weather = skyrimPlatform.Weather, browser = skyrimPlatform.browser, getPlatformVersion = skyrimPlatform.getPlatformVersion;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (skyrimPlatform);


/***/ },

/***/ "./src/timers.ts"
/*!***********************!*\
  !*** ./src/timers.ts ***!
  \***********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearGameInterval: () => (/* binding */ clearGameInterval),
/* harmony export */   clearGameTimeout: () => (/* binding */ clearGameTimeout),
/* harmony export */   setGameInterval: () => (/* binding */ setGameInterval),
/* harmony export */   setGameTimeout: () => (/* binding */ setGameTimeout)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skyrimPlatform */ "./src/skyrimPlatform.ts");

var timers = new Map();
var nextTimerId = 1;
var lastFrameAt = 0;
var pumpInstalled = false;
function pump() {
    var now = Date.now();
    var elapsed = lastFrameAt === 0 ? 0 : now - lastFrameAt;
    lastFrameAt = now;
    if (timers.size === 0)
        return;
    for (var _i = 0, _a = Array.from(timers.values()); _i < _a.length; _i++) {
        var timer = _a[_i];
        timer.remainingMs -= elapsed;
        if (timer.remainingMs > 0)
            continue;
        if (timer.intervalMs !== null) {
            // Re-arm first so the callback can clear/replace itself safely.
            timer.remainingMs = timer.intervalMs;
            try {
                timer.callback();
            }
            catch (err) {
                // Never let one timer break the pump; update handlers run every frame.
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] game-timer callback failed: ".concat(String(err)));
            }
            continue;
        }
        timers.delete(timer.id);
        try {
            timer.callback();
        }
        catch (err) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] game-timer callback failed: ".concat(String(err)));
        }
    }
}
function installPump() {
    if (pumpInstalled)
        return;
    pumpInstalled = true;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("update", pump);
}
function setGameTimeout(callback, timeoutMs) {
    installPump();
    var id = nextTimerId++;
    timers.set(id, {
        id: id,
        callback: callback,
        remainingMs: Math.max(0, timeoutMs),
        intervalMs: null,
    });
    return id;
}
function setGameInterval(callback, intervalMs) {
    installPump();
    var id = nextTimerId++;
    timers.set(id, {
        id: id,
        callback: callback,
        remainingMs: Math.max(0, intervalMs),
        intervalMs: Math.max(0, intervalMs),
    });
    return id;
}
function clearGameTimeout(id) {
    timers.delete(id);
}
function clearGameInterval(id) {
    timers.delete(id);
}


/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

module.exports = require("fs");

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
/* harmony import */ var _game_state_mod_context__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./game-state/mod-context */ "./src/game-state/mod-context.ts");
/* harmony import */ var _communication_file_dump__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./communication/file-dump */ "./src/communication/file-dump.ts");
/* harmony import */ var _communication_http_client__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./communication/http-client */ "./src/communication/http-client.ts");
/* harmony import */ var _bridge__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./bridge */ "./src/bridge.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./config */ "./src/config.ts");












var lastTickTime = 0;
var playerAnimation = "";
var eventsRegistered = false;
var pollingStarted = false;
var lastCombatState = 0;
var COLLECTORS_COUNT = 8;
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
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Platform version: ".concat((0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.getPlatformVersion)()));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Connected: ".concat((0,_communication_http_client__WEBPACK_IMPORTED_MODULE_8__.isConnected)()));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Polling status: ".concat(pollingStarted ? "active" : "inactive"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Events registered: ".concat(eventsRegistered ? "yes" : "no"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Collectors count: ".concat(COLLECTORS_COUNT));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.tickInterval, "ms (on update)"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Debug mode: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode));
        var heartbeat = (0,_bridge__WEBPACK_IMPORTED_MODULE_9__.heartbeatAgeMs)();
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Companion bridge: ".concat((0,_bridge__WEBPACK_IMPORTED_MODULE_9__.isCompanionReady)() ? "ready (heartbeat ".concat(heartbeat, "ms ago)") : "not ready", ", overlay ").concat((0,_bridge__WEBPACK_IMPORTED_MODULE_9__.isOverlayVisible)() ? "visible" : "hidden"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Companion URL: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.companionUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Mod-context dump: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.modContextDumpEnabled ? _config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.modContextPath : "off"));
        // Returning false avoids running the original host command implementation.
        return false;
    };
    if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Console: ~".concat(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE, " is now ~skyguide"));
    }
}
function processAndSend(eventType, animation) {
    if (animation === void 0) { animation = ""; }
    var bundle = (0,_game_state_collector__WEBPACK_IMPORTED_MODULE_5__.collectBundle)(animation, eventType);
    if (!bundle) {
        if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] collectBundle returned null; skip send");
        }
        return;
    }
    var state = bundle.protocol;
    try {
        (0,_communication_file_dump__WEBPACK_IMPORTED_MODULE_7__.dumpModContext)((0,_game_state_mod_context__WEBPACK_IMPORTED_MODULE_6__.buildModContext)(bundle.snapshot, state));
    }
    catch (err) {
        if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] mod-context dump threw: ".concat(String(err)));
        }
    }
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_8__.isConnected)()) {
        return;
    }
    var priority = (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.evaluatePriority)(state);
    if (!(0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.shouldSend)(priority, state)) {
        return;
    }
    var payload = (0,_game_state_serializer__WEBPACK_IMPORTED_MODULE_4__.serializeState)(state, priority);
    (0,_communication_http_client__WEBPACK_IMPORTED_MODULE_8__.sendGameState)(payload)
        .then(function (sent) {
        if (sent) {
            (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_3__.recordSentState)(state);
            if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Sent state: ".concat(priority, " priority (").concat(eventType, ")"));
            }
        }
    })
        .catch(function (err) {
        var msg = err instanceof Error ? err.message : String(err);
        if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
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
        if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] processAndSend failed (".concat(eventType, "): ").concat(msg));
        }
    }
}
var isLoaded = false;
/**
 * Accessibility QoL switches (verified APIs, patterns from skymp5-client):
 *  - bAlwaysActive: the game keeps simulating while unfocused/alt-tabbed —
 *    critical for blind players who must leave the window for other tools.
 *  - fAutoVanityModeDelay: suppress the auto-rotating vanity camera (3600s).
 */
function applyGameQolSettings() {
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Utility.setINIBool("bAlwaysActive:General", true);
    }
    catch (err) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] bAlwaysActive INI set failed: ".concat(String(err)));
    }
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Utility.setINIFloat("fAutoVanityModeDelay:Camera", 3600);
    }
    catch (err) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] vanity mode INI set failed: ".concat(String(err)));
    }
}
function init() {
    if (isLoaded)
        return;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("SkyGuide plugin loaded!");
    applyGameQolSettings();
    (0,_events__WEBPACK_IMPORTED_MODULE_1__.registerAllEvents)();
    eventsRegistered = true;
    (0,_actions_polling__WEBPACK_IMPORTED_MODULE_2__.startPolling)();
    pollingStarted = _config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.pollingEnabled;
    (0,_bridge__WEBPACK_IMPORTED_MODULE_9__.initBridge)();
    if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.tickInterval, "ms (on update)"));
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
        }, _config__WEBPACK_IMPORTED_MODULE_10__.PLAYER_FORM_ID, _config__WEBPACK_IMPORTED_MODULE_10__.PLAYER_FORM_ID, "Attack*");
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
    if (now - lastTickTime < _config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.tickInterval) {
        return;
    }
    lastTickTime = now;
    var animation = playerAnimation;
    playerAnimation = "";
    safeProcessAndSend("tick", animation);
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("combatState", function (event) {
    var actor = event.actor.getFormID();
    if (actor !== _config__WEBPACK_IMPORTED_MODULE_10__.PLAYER_FORM_ID)
        return;
    var newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
    var oldState = lastCombatState;
    lastCombatState = newState;
    safeProcessAndSend("combatState_".concat(newState));
    if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Combat state changed: ".concat(oldState, " -> ").concat(newState));
    }
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("hit", function (event) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var target = (_c = (_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.getFormID) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
    var source = (_f = (_e = (_d = event.aggressor) === null || _d === void 0 ? void 0 : _d.getFormID) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : 0;
    var sourceBaseForm = (_h = (_g = event.source) === null || _g === void 0 ? void 0 : _g.getFormID) === null || _h === void 0 ? void 0 : _h.call(_g);
    if (target !== _config__WEBPACK_IMPORTED_MODULE_10__.PLAYER_FORM_ID && source !== _config__WEBPACK_IMPORTED_MODULE_10__.PLAYER_FORM_ID)
        return;
    safeProcessAndSend("hit");
    if (_config__WEBPACK_IMPORTED_MODULE_10__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Hit event: target=".concat(target, ", source=").concat(source, ", sourceForm=").concat(String(sourceBaseForm)));
    }
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QVk7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQTtBQUNPO0FBQ1A7QUFDQSxpRUFBaUU7QUFDakU7QUFDQTtBQUNBO0FBQ0EsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ04sNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw4QkFBOEI7QUFDOUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ2hReUM7QUFDTjtBQUMrQjtBQUNLO0FBQ0E7QUFDTjtBQUNTO0FBQzFFO0FBQ0EsaUJBQWlCLGlEQUFJO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUMsc0NBQXNDO0FBQ3ZFLGdDQUFnQyxpQ0FBaUM7QUFDakUsa0JBQWtCLDJDQUFNO0FBQ3hCLDhCQUE4QjtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSyxJQUFJO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0Esc0NBQXNDO0FBQ3RDLGdDQUFnQztBQUNoQztBQUNBO0FBQ0E7QUFDQSxvQ0FBb0MsMkVBQWlCO0FBQ3JELGtDQUFrQyxpREFBSTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLDZCQUE2QixnRkFBc0I7QUFDbkQ7QUFDQSxzQ0FBc0MsbUZBQXNCO0FBQzVELCtCQUErQixnRkFBb0I7QUFDbkQsNEJBQTRCLDBFQUFpQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ087QUFDUDtBQUNBLHNDQUFzQztBQUN0QyxnQ0FBZ0M7QUFDaEM7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0RjRDO0FBQ0U7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBO0FBQ0Esa0JBQWtCLGlEQUFJO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsaURBQUk7QUFDdkMsdUJBQXVCLG1EQUFjO0FBQ3JDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7QUN4RDRDO0FBQ3JDO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQixpREFBSTtBQUN6QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7OztBQ3hCNkQ7QUFDUDtBQUN0RDtBQUNBLGlCQUFpQixpREFBSTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ087QUFDUDtBQUNBLGlCQUFpQixpREFBSTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixjQUFjO0FBQ2xDLGlDQUFpQywyQ0FBTTtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZDQUE2QztBQUM3QztBQUNBO0FBQ0Esb0JBQW9CLGtEQUFLO0FBQ3pCO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixtREFBYztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDM0s0QztBQUM1QztBQUNBLCtCQUErQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUIsaURBQUk7QUFDckI7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLGlEQUFJO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixpREFBSTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixpREFBSTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLDBCQUEwQjtBQUMxQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtB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QTtBQUNBLFFBQVEsNkRBQVk7QUFDcEI7QUFDQTtBQUNBLFFBQVEsa0RBQUs7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwwREFBMEQscUNBQXFDO0FBQy9GO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBLFNBQVMsRUFBRSxvREFBYyxFQUFFLG9EQUFjO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBLFFBQVEsNkRBQVk7QUFDcEI7QUFDQTtBQUNBO0FBQ0EscURBQUk7QUFDSjtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0EsNkJBQTZCLDRDQUFNO0FBQ25DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0Esa0JBQWtCLG9EQUFjO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLDRDQUFNO0FBQ2QsUUFBUSw2REFBWTtBQUNwQjtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG9EQUFjLGVBQWUsb0RBQWM7QUFDOUQ7QUFDQTtBQUNBLFFBQVEsNENBQU07QUFDZCxRQUFRLDZEQUFZO0FBQ3BCO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL2V4ZWN1dG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL3BhcnNlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvYWN0aW9ucy9wb2xsaW5nLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hcmJpdHJhdGlvbi9wcmlvcml0eS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvYnJpZGdlLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9jb21tdW5pY2F0aW9uL2ZpbGUtZHVtcC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29tbXVuaWNhdGlvbi9odHRwLWNsaWVudC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9ldmVudHMudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvY3Jvc3NoYWlyLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2xvY2F0aW9uLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL25lYXJieS1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9wbGF5ZXItY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvcXVlc3QtY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL21vZC1jb250ZXh0LnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL3NlcmlhbGl6ZXIudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3NreXJpbVBsYXRmb3JtLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy90aW1lcnMudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luL2V4dGVybmFsIGNvbW1vbmpzIFwiZnNcIiIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vZXh0ZXJuYWwgdmFyIFtcInNreXJpbVBsYXRmb3JtXCJdIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2NvbXBhdCBnZXQgZGVmYXVsdCBleHBvcnQiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRGVidWcsIER4U2NhbkNvZGUsIEZvcm1UeXBlLCBHYW1lLCBJbnB1dCwgVWksIHByaW50Q29uc29sZSwgfSBmcm9tIFwiLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBzZXRHYW1lVGltZW91dCB9IGZyb20gXCIuLi90aW1lcnNcIjtcbmZ1bmN0aW9uIGxvZ0RlYnVnKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbYWN0aW9ucy9leGVjdXRvcl0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc1ZhbGlkRm9ybShmb3JtKSB7XG4gICAgaWYgKGZvcm0gPT09IG51bGwgfHwgZm9ybSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBmb3JtICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGNhbmRpZGF0ZSA9IGZvcm07XG4gICAgdmFyIGRlbGV0ZWQgPSB0eXBlb2YgY2FuZGlkYXRlLmlzRGVsZXRlZCA9PT0gXCJmdW5jdGlvblwiID8gY2FuZGlkYXRlLmlzRGVsZXRlZCgpIDogZmFsc2U7XG4gICAgdmFyIGRpc2FibGVkID0gdHlwZW9mIGNhbmRpZGF0ZS5pc0Rpc2FibGVkID09PSBcImZ1bmN0aW9uXCIgPyBjYW5kaWRhdGUuaXNEaXNhYmxlZCgpIDogZmFsc2U7XG4gICAgcmV0dXJuICFkZWxldGVkICYmICFkaXNhYmxlZDtcbn1cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZUZvcm1JZChyZWYpIHtcbiAgICBpZiAocmVmID09PSBudWxsIHx8IHJlZiA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiByZWYgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBjYW5kaWRhdGUgPSByZWY7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuZ2V0Rm9ybUlEID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIGlkID0gY2FuZGlkYXRlLmdldEZvcm1JRCgpO1xuICAgICAgICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiID8gaWQgOiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5nZXRGb3JtSWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgaWQgPSBjYW5kaWRhdGUuZ2V0Rm9ybUlkKCk7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gaXNWYWxpZFJlZmVyZW5jZShyZWYpIHtcbiAgICBpZiAocmVmID09PSBudWxsIHx8IHJlZiA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiByZWYgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY2FuZGlkYXRlID0gcmVmO1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlLmFjdGl2YXRlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZm9ybUlkID0gZ2V0UmVmZXJlbmNlRm9ybUlkKHJlZik7XG4gICAgaWYgKGZvcm1JZCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmb3JtID0gR2FtZS5nZXRGb3JtRXgoZm9ybUlkKTtcbiAgICByZXR1cm4gaXNWYWxpZEZvcm0oZm9ybSk7XG59XG5mdW5jdGlvbiBnZXRQbGF5ZXJQb3NpdGlvbihwbGF5ZXIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBpc0FjdGlvbkJsb2NrZWRCeVVpKCkge1xuICAgIGlmIChVaS5pc01lbnVPcGVuKFwiTG9hZGluZyBNZW51XCIpKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiQWN0aW9uIGJsb2NrZWQ6IExvYWRpbmcgTWVudSBpcyBvcGVuXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKFVpLmlzTWVudU9wZW4oXCJNZXNzYWdlQm94TWVudVwiKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBNZXNzYWdlQm94TWVudSBpcyBvcGVuXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBOZWFyZXN0IGxvYWRlZCByZWZlcmVuY2Ugb2YgYSBnaXZlbiBmb3JtIHR5cGUgaW4gdGhlIHBsYXllcidzIGNlbGwsIGZvdW5kIGJ5XG4gKiBjZWxsIGVudW1lcmF0aW9uIChDZWxsLmdldE51bVJlZnMvZ2V0TnRoUmVmIOKAlCB2ZXJpZmllZCBBUElzOyB0aGUgb2xkXG4gKiBgR2FtZS5maW5kQ2xvc2VzdFJlZmVyZW5jZWAgY2FsbCBoZXJlIHdhcyBOT1QgYSByZWFsIEFQSSkuIENlbGwgb3JkZXIgaXMgbm90XG4gKiBkaXN0YW5jZS1vcmRlcmVkLCBzbyB3ZSBzY2FuIGFuZCBwaWNrIHRoZSBjbG9zZXN0IHZhbGlkIG9uZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdFJlZmVyZW5jZU9mVHlwZShwbGF5ZXIsIGZvcm1UeXBlLCBwbGF5ZXJGb3JtSWQpIHtcbiAgICB2YXIgX2E7XG4gICAgdmFyIGNlbGwgPSBwbGF5ZXIuZ2V0UGFyZW50Q2VsbCgpO1xuICAgIGlmICghY2VsbCB8fCB0eXBlb2YgY2VsbC5nZXROdW1SZWZzICE9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGNlbGwuZ2V0TnRoUmVmICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgY291bnQgPSAoX2EgPSBjZWxsLmdldE51bVJlZnMoZm9ybVR5cGUpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBiZXN0ID0gbnVsbDtcbiAgICB2YXIgYmVzdERpc3RhbmNlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIHZhciBvcmlnaW4gPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICB2YXIgcmVmID0gY2VsbC5nZXROdGhSZWYoaSwgZm9ybVR5cGUpO1xuICAgICAgICBpZiAoIXJlZiB8fCAhaXNWYWxpZFJlZmVyZW5jZShyZWYpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBnZXRSZWZlcmVuY2VGb3JtSWQocmVmKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gbnVsbCB8fCBmb3JtSWQgPT09IHBsYXllckZvcm1JZClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIW9yaWdpbikge1xuICAgICAgICAgICAgb3JpZ2luID0gZ2V0UGxheWVyUG9zaXRpb24ocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9yaWdpbilcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgY2FuZGlkYXRlID0gcmVmO1xuICAgICAgICB2YXIgZHggPSBjYW5kaWRhdGUuZ2V0UG9zaXRpb25YKCkgLSBvcmlnaW4ueDtcbiAgICAgICAgdmFyIGR5ID0gY2FuZGlkYXRlLmdldFBvc2l0aW9uWSgpIC0gb3JpZ2luLnk7XG4gICAgICAgIHZhciBkeiA9IGNhbmRpZGF0ZS5nZXRQb3NpdGlvblooKSAtIG9yaWdpbi56O1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG4gICAgICAgIGlmIChkaXN0YW5jZSA8IGJlc3REaXN0YW5jZSkge1xuICAgICAgICAgICAgYmVzdERpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICBiZXN0ID0gcmVmO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBiZXN0O1xufVxuZnVuY3Rpb24gZXhlY3V0ZVNhZmVseShhY3Rpb25UeXBlLCBvcGVyYXRpb24pIHtcbiAgICB0cnkge1xuICAgICAgICBvcGVyYXRpb24oKTtcbiAgICAgICAgbG9nRGVidWcoXCJFeGVjdXRlZCBhY3Rpb246IFwiLmNvbmNhdChhY3Rpb25UeXBlKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gZmFpbGVkOiBcIi5jb25jYXQoYWN0aW9uVHlwZSwgXCIgKFwiKS5jb25jYXQoU3RyaW5nKGVycm9yKSwgXCIpXCIpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoZGVsYXlNcykge1xuICAgIC8vIEdhbWUtbG9vcCB0aW1lcjogcnVucyBvbiBgdXBkYXRlYCwgc28gaXQgc2VsZi1zdXNwZW5kcyBkdXJpbmcgbG9hZGluZ1xuICAgIC8vIHNjcmVlbnMgaW5zdGVhZCBvZiByZWxlYXNpbmcgaW50byBhIGxvYWRpbmcgZnJhbWUgbGlrZSBhIE5vZGUgdGltZXIgY291bGQuXG4gICAgc2V0R2FtZVRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIElucHV0LnJlbGVhc2VLZXkoNDIgLyogRHhTY2FuQ29kZS5MZWZ0U2hpZnQgKi8pO1xuICAgIH0sIGRlbGF5TXMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogcGxheWVyIGlzIG51bGxcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIHBsYXllckZvcm0gPSBHYW1lLmdldEZvcm1FeChQTEFZRVJfRk9STV9JRCk7XG4gICAgaWYgKCFpc1ZhbGlkRm9ybShwbGF5ZXJGb3JtKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBwbGF5ZXIgZm9ybSBpbnZhbGlkL2RlbGV0ZWQvZGlzYWJsZWRcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2V0UG9zaXRpb24oYWN0aW9uLngsIGFjdGlvbi55LCBhY3Rpb24ueik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFjZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zZXRBbmdsZSgwLCAwLCBhY3Rpb24uYW5nbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGl2YXRlXCI6IHtcbiAgICAgICAgICAgIHZhciBfYSA9IGdldFBsYXllclBvc2l0aW9uKHBsYXllciksIHggPSBfYS54LCB5ID0gX2EueSwgeiA9IF9hLno7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnRhcmdldCA9PT0gXCJjcm9zc2hhaXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBjcm9zc2hhaXJSZWZfMSA9IEdhbWUuZ2V0Q3VycmVudENyb3NzaGFpclJlZigpO1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZFJlZmVyZW5jZShjcm9zc2hhaXJSZWZfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBpbnZhbGlkIGNyb3NzaGFpciByZWZlcmVuY2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Jvc3NoYWlyUmVmXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3ROUENcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZWFyZXN0TnBjXzEgPSBHYW1lLmZpbmRDbG9zZXN0QWN0b3IoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3ROcGNfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBubyB2YWxpZCBuZWFyZXN0IE5QQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0TnBjXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3REb29yXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVhcmVzdERvb3JfMSA9IGdldENsb3Nlc3RSZWZlcmVuY2VPZlR5cGUocGxheWVyLCAyOSAvKiBGb3JtVHlwZS5Eb29yICovLCBQTEFZRVJfRk9STV9JRCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3REb29yXzEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBkb29yXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3REb29yXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZWFyZXN0Q29udGFpbmVyXzEgPSBnZXRDbG9zZXN0UmVmZXJlbmNlT2ZUeXBlKHBsYXllciwgMjggLyogRm9ybVR5cGUuQ29udGFpbmVyICovLCBQTEFZRVJfRk9STV9JRCk7XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRSZWZlcmVuY2UobmVhcmVzdENvbnRhaW5lcl8xKSkge1xuICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBjb250YWluZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZWFyZXN0Q29udGFpbmVyXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYXN0VHJhdmVsXCI6IHtcbiAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIkZhc3QgdHJhdmVsIG5vdCBzdXBwb3J0ZWQgdmlhIEFQSVwiKTtcbiAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFzdCB0cmF2ZWwgYmxvY2tlZCBmb3IgbG9jYXRpb246IFwiLmNvbmNhdChhY3Rpb24ubG9jYXRpb24pKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZHJhd1dlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kcmF3V2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2hlYXRoZVdlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zaGVhdGhlV2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXR0YWNrXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIElucHV0LnRhcEtleSg1Nyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYmxvY2tcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgSW5wdXQuaG9sZEtleSg0Mik7XG4gICAgICAgICAgICAgICAgcmVsZWFzZUJsb2NrQWZ0ZXJEZWxheSg1MDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImVxdWlwXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiRXF1aXA6IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ1c2VJdGVtXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiVXNlIGl0ZW06IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJoZWFsXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnJlc3RvcmVBY3RvclZhbHVlKFwiaGVhbHRoXCIsIGFjdGlvbi5hbW91bnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNhdmVHYW1lXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgR2FtZS5zYXZlR2FtZShhY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKGFjdGlvbi5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmb3JjZVRoaXJkUGVyc29uXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgR2FtZS5mb3JjZVRoaXJkUGVyc29uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZm9yY2VGaXJzdFBlcnNvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuZm9yY2VGaXJzdFBlcnNvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJ2YXIgQUNUSU9OX1RZUEVTID0gbmV3IFNldChbXG4gICAgXCJtb3ZlXCIsXG4gICAgXCJmYWNlXCIsXG4gICAgXCJhY3RpdmF0ZVwiLFxuICAgIFwiZmFzdFRyYXZlbFwiLFxuICAgIFwiZHJhd1dlYXBvblwiLFxuICAgIFwic2hlYXRoZVdlYXBvblwiLFxuICAgIFwiYXR0YWNrXCIsXG4gICAgXCJibG9ja1wiLFxuICAgIFwiZXF1aXBcIixcbiAgICBcInVzZUl0ZW1cIixcbiAgICBcImhlYWxcIixcbiAgICBcInNhdmVHYW1lXCIsXG4gICAgXCJub3RpZmljYXRpb25cIixcbiAgICBcImZvcmNlVGhpcmRQZXJzb25cIixcbiAgICBcImZvcmNlRmlyc3RQZXJzb25cIixcbl0pO1xudmFyIEFDVElWQVRFX1RBUkdFVFMgPSBuZXcgU2V0KFtcbiAgICBcImNyb3NzaGFpclwiLFxuICAgIFwibmVhcmVzdE5QQ1wiLFxuICAgIFwibmVhcmVzdERvb3JcIixcbiAgICBcIm5lYXJlc3RDb250YWluZXJcIixcbl0pO1xuZnVuY3Rpb24gaXNBY3RpdmF0ZVRhcmdldCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgQUNUSVZBVEVfVEFSR0VUUy5oYXModmFsdWUpO1xufVxuZnVuY3Rpb24gaXNSZWNvcmQodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsO1xufVxuZnVuY3Rpb24gaXNGaW5pdGVOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSk7XG59XG5mdW5jdGlvbiBpc05vbkVtcHR5U3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkubGVuZ3RoID4gMDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGlvbihyYXcpIHtcbiAgICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBhY3Rpb25UeXBlID0gcmF3LnR5cGU7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25UeXBlICE9PSBcInN0cmluZ1wiIHx8ICFBQ1RJT05fVFlQRVMuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgdmFyIHggPSByYXcueCwgeSA9IHJhdy55LCB6ID0gcmF3Lno7XG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlTnVtYmVyKHgpIHx8ICFpc0Zpbml0ZU51bWJlcih5KSB8fCAhaXNGaW5pdGVOdW1iZXIoeikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibW92ZVwiLCB4OiB4LCB5OiB5LCB6OiB6IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhY2VcIjoge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gcmF3LmFuZ2xlO1xuICAgICAgICAgICAgaWYgKCFpc0Zpbml0ZU51bWJlcihhbmdsZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFjZVwiLCBhbmdsZTogYW5nbGUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYWN0aXZhdGVcIjoge1xuICAgICAgICAgICAgdmFyIHRhcmdldCA9IHJhdy50YXJnZXQ7XG4gICAgICAgICAgICBpZiAoIWlzQWN0aXZhdGVUYXJnZXQodGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJhY3RpdmF0ZVwiLCB0YXJnZXQ6IHRhcmdldCB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYXN0VHJhdmVsXCI6IHtcbiAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IHJhdy5sb2NhdGlvbjtcbiAgICAgICAgICAgIGlmICghaXNOb25FbXB0eVN0cmluZyhsb2NhdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFzdFRyYXZlbFwiLCBsb2NhdGlvbjogbG9jYXRpb24gfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZXF1aXBcIjpcbiAgICAgICAgY2FzZSBcInVzZUl0ZW1cIjoge1xuICAgICAgICAgICAgdmFyIGl0ZW1OYW1lID0gcmF3Lml0ZW1OYW1lO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKGl0ZW1OYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogYWN0aW9uVHlwZSwgaXRlbU5hbWU6IGl0ZW1OYW1lIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhlYWxcIjoge1xuICAgICAgICAgICAgdmFyIGFtb3VudCA9IHJhdy5hbW91bnQ7XG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlTnVtYmVyKGFtb3VudCkgfHwgYW1vdW50IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiaGVhbFwiLCBhbW91bnQ6IGFtb3VudCB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzYXZlR2FtZVwiOiB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHJhdy5uYW1lO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcInNhdmVHYW1lXCIsIG5hbWU6IG5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gcmF3Lm1lc3NhZ2U7XG4gICAgICAgICAgICBpZiAoIWlzTm9uRW1wdHlTdHJpbmcobWVzc2FnZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibm90aWZpY2F0aW9uXCIsIG1lc3NhZ2U6IG1lc3NhZ2UgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZHJhd1dlYXBvblwiOlxuICAgICAgICBjYXNlIFwic2hlYXRoZVdlYXBvblwiOlxuICAgICAgICBjYXNlIFwiYXR0YWNrXCI6XG4gICAgICAgIGNhc2UgXCJibG9ja1wiOlxuICAgICAgICBjYXNlIFwiZm9yY2VUaGlyZFBlcnNvblwiOlxuICAgICAgICBjYXNlIFwiZm9yY2VGaXJzdFBlcnNvblwiOlxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogYWN0aW9uVHlwZSB9O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQWN0aW9uKGFjdGlvbikge1xuICAgIHZvaWQgYWN0aW9uO1xuICAgIHJldHVybiB0cnVlO1xufVxuIiwidmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG52YXIgX19nZW5lcmF0b3IgPSAodGhpcyAmJiB0aGlzLl9fZ2VuZXJhdG9yKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgYm9keSkge1xuICAgIHZhciBfID0geyBsYWJlbDogMCwgc2VudDogZnVuY3Rpb24oKSB7IGlmICh0WzBdICYgMSkgdGhyb3cgdFsxXTsgcmV0dXJuIHRbMV07IH0sIHRyeXM6IFtdLCBvcHM6IFtdIH0sIGYsIHksIHQsIGcgPSBPYmplY3QuY3JlYXRlKCh0eXBlb2YgSXRlcmF0b3IgPT09IFwiZnVuY3Rpb25cIiA/IEl0ZXJhdG9yIDogT2JqZWN0KS5wcm90b3R5cGUpO1xuICAgIHJldHVybiBnLm5leHQgPSB2ZXJiKDApLCBnW1widGhyb3dcIl0gPSB2ZXJiKDEpLCBnW1wicmV0dXJuXCJdID0gdmVyYigyKSwgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIChnW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0pLCBnO1xuICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfVxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcbiAgICAgICAgaWYgKGYpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuXCIpO1xuICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkge1xuICAgICAgICAgICAgaWYgKGYgPSAxLCB5ICYmICh0ID0gb3BbMF0gJiAyID8geVtcInJldHVyblwiXSA6IG9wWzBdID8geVtcInRocm93XCJdIHx8ICgodCA9IHlbXCJyZXR1cm5cIl0pICYmIHQuY2FsbCh5KSwgMCkgOiB5Lm5leHQpICYmICEodCA9IHQuY2FsbCh5LCBvcFsxXSkpLmRvbmUpIHJldHVybiB0O1xuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xuICAgICAgICAgICAgc3dpdGNoIChvcFswXSkge1xuICAgICAgICAgICAgICAgIGNhc2UgMDogY2FzZSAxOiB0ID0gb3A7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XG4gICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogb3AgPSBfLm9wcy5wb3AoKTsgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSAzICYmICghdCB8fCAob3BbMV0gPiB0WzBdICYmIG9wWzFdIDwgdFszXSkpKSB7IF8ubGFiZWwgPSBvcFsxXTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRbMl0pIF8ub3BzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3AgPSBib2R5LmNhbGwodGhpc0FyZywgXyk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cbiAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07XG4gICAgfVxufTtcbmltcG9ydCAqIGFzIFNrVCBmcm9tICdAc2t5cmltLXBsYXRmb3JtL3NreXJpbS1wbGF0Zm9ybSc7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBwYXJzZUFjdGlvbiB9IGZyb20gXCIuL3BhcnNlclwiO1xuaW1wb3J0IHsgZXhlY3V0ZUFjdGlvbiB9IGZyb20gXCIuL2V4ZWN1dG9yXCI7XG5pbXBvcnQgeyBjbGVhckdhbWVUaW1lb3V0LCBzZXRHYW1lVGltZW91dCB9IGZyb20gXCIuLi90aW1lcnNcIjtcbnZhciBJTklUSUFMX0JBQ0tPRkZfTVMgPSBDT05GSUcucG9sbGluZ0ludGVydmFsO1xudmFyIHBvbGxpbmdDbGllbnQgPSBudWxsO1xudmFyIGJhY2tvZmZNcyA9IElOSVRJQUxfQkFDS09GRl9NUztcbnZhciBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbnZhciBwb2xsaW5nQWN0aXZlID0gZmFsc2U7XG52YXIgcG9sbFRpbWVySWQgPSBudWxsO1xuLyoqIE91dGJveCBjdXJzb3Ig4oCUIGhpZ2hlc3QgYWN0aW9uIGlkIHdlIGhhdmUgcHVsbGVkIGZyb20gdGhlIHNlcnZlci4gKi9cbnZhciBsYXN0U2VlbklkID0gMDtcbmZ1bmN0aW9uIGxvZ0RlYnVnKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBTa1QucHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHBvbGxGb3JBY3Rpb25zKCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGVuZHBvaW50LCByZXNwb25zZSwgcGFyc2VkLCBhY3Rpb25zLCBfaSwgYWN0aW9uc18xLCByYXcsIGlkLCBhY3Rpb24sIGVycl8xLCBtc2c7XG4gICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoX2EubGFiZWwpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgIGlmICghcG9sbGluZ0NsaWVudCB8fCAhcG9sbGluZ0FjdGl2ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFNrVC5VaS5pc01lbnVPcGVuKFwiTG9hZGluZyBNZW51XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dEZWJ1ZyhcIkxvYWRpbmcgc2NyZWVuIG9wZW4g4oCUIHNraXBwaW5nIGFjdGlvbiBwb2xsXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVOZXh0UG9sbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVuZHBvaW50ID0gXCJcIi5jb25jYXQoQ09ORklHLnBvbGxpbmdFbmRwb2ludCwgXCI/c2luY2U9XCIpLmNvbmNhdChsYXN0U2VlbklkKTtcbiAgICAgICAgICAgICAgICAgICAgX2EubGFiZWwgPSAxO1xuICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgX2EudHJ5cy5wdXNoKFsxLCAzLCAsIDRdKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFs0IC8qeWllbGQqLywgcG9sbGluZ0NsaWVudC5nZXQoZW5kcG9pbnQpXTtcbiAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja29mZk1zID0gSU5JVElBTF9CQUNLT0ZGX01TO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZWQgPSBKU09OLnBhcnNlKHJlc3BvbnNlLmJvZHkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKF9iKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJGYWlsZWQgdG8gcGFyc2UgYWN0aW9uIHJlc3BvbnNlIGJvZHkgYXMgSlNPTlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZU5leHRQb2xsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi9dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9ucyA9IEFycmF5LmlzQXJyYXkocGFyc2VkKSA/IHBhcnNlZCA6IFtwYXJzZWRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChfaSA9IDAsIGFjdGlvbnNfMSA9IGFjdGlvbnM7IF9pIDwgYWN0aW9uc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhdyA9IGFjdGlvbnNfMVtfaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVHJhY2sgdGhlIG91dGJveCBjdXJzb3IgYmVmb3JlIGV4ZWN1dGluZyDigJQgZWFjaCBlbnRyeSBjYXJyaWVzIGFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBtb25vdG9uaWMgaWQ7IHVua25vd24gdHlwZXMgc3RpbGwgYWR2YW5jZSBpdC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJhdyA9PT0gXCJvYmplY3RcIiAmJiByYXcgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQgPSByYXcuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKGlkKSAmJiBpZCA+IGxhc3RTZWVuSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RTZWVuSWQgPSBpZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSBwYXJzZUFjdGlvbihyYXcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhY3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhlY3V0ZUFjdGlvbihhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZUZhaWx1cmUoXCJIVFRQIFwiLmNvbmNhdChyZXNwb25zZS5zdGF0dXMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCA0XTtcbiAgICAgICAgICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgICAgICAgICAgIGVycl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICBtc2cgPSBlcnJfMSBpbnN0YW5jZW9mIEVycm9yID8gZXJyXzEubWVzc2FnZSA6IFN0cmluZyhlcnJfMSk7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZUZhaWx1cmUobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZU5leHRQb2xsKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBoYW5kbGVGYWlsdXJlKHJlYXNvbikge1xuICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMrKztcbiAgICBsb2dEZWJ1ZyhcIlBvbGwgZmFpbGVkIChcIi5jb25jYXQoY29uc2VjdXRpdmVGYWlsdXJlcywgXCIvXCIpLmNvbmNhdChDT05GSUcubWF4UG9sbGluZ1JldHJpZXMsIFwiKTogXCIpLmNvbmNhdChyZWFzb24pKTtcbiAgICBpZiAoY29uc2VjdXRpdmVGYWlsdXJlcyA+PSBDT05GSUcubWF4UG9sbGluZ1JldHJpZXMpIHtcbiAgICAgICAgbG9nRGVidWcoXCJNYXggcmV0cmllcyByZWFjaGVkIFxcdTIwMTQgcGF1c2luZyBmb3IgXCIuY29uY2F0KENPTkZJRy5wb2xsaW5nTWF4QmFja29mZiwgXCJtc1wiKSk7XG4gICAgICAgIGJhY2tvZmZNcyA9IENPTkZJRy5wb2xsaW5nTWF4QmFja29mZjtcbiAgICAgICAgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBiYWNrb2ZmTXMgPSBNYXRoLm1pbihiYWNrb2ZmTXMgKiAyLCBDT05GSUcucG9sbGluZ01heEJhY2tvZmYpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNjaGVkdWxlTmV4dFBvbGwoKSB7XG4gICAgaWYgKCFwb2xsaW5nQWN0aXZlKVxuICAgICAgICByZXR1cm47XG4gICAgcG9sbFRpbWVySWQgPSBzZXRHYW1lVGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvbGxUaW1lcklkID0gbnVsbDtcbiAgICAgICAgcG9sbEZvckFjdGlvbnMoKTtcbiAgICB9LCBiYWNrb2ZmTXMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0UG9sbGluZygpIHtcbiAgICBpZiAoIUNPTkZJRy5wb2xsaW5nRW5hYmxlZCkge1xuICAgICAgICBsb2dEZWJ1ZyhcIlBvbGxpbmcgZGlzYWJsZWQgYnkgY29uZmlnXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChwb2xsaW5nQWN0aXZlKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiUG9sbGluZyBhbHJlYWR5IGFjdGl2ZVwiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBwb2xsaW5nQ2xpZW50ID0gbmV3IFNrVC5IdHRwQ2xpZW50KENPTkZJRy5zZXJ2ZXJVcmwpO1xuICAgIHBvbGxpbmdBY3RpdmUgPSB0cnVlO1xuICAgIGJhY2tvZmZNcyA9IElOSVRJQUxfQkFDS09GRl9NUztcbiAgICBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbiAgICBsb2dEZWJ1ZyhcIlN0YXJ0aW5nIGFjdGlvbiBwb2xsaW5nXCIpO1xuICAgIFNrVC5vbmNlKFwidXBkYXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcG9sbEZvckFjdGlvbnMoKTtcbiAgICB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdG9wUG9sbGluZygpIHtcbiAgICBwb2xsaW5nQWN0aXZlID0gZmFsc2U7XG4gICAgaWYgKHBvbGxUaW1lcklkICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyR2FtZVRpbWVvdXQocG9sbFRpbWVySWQpO1xuICAgICAgICBwb2xsVGltZXJJZCA9IG51bGw7XG4gICAgfVxuICAgIHBvbGxpbmdDbGllbnQgPSBudWxsO1xuICAgIGxvZ0RlYnVnKFwiQWN0aW9uIHBvbGxpbmcgc3RvcHBlZFwiKTtcbn1cbiIsInZhciBsYXN0U3RhdGUgPSBudWxsO1xudmFyIGxhc3RTZW5kVGltZXMgPSB7XG4gICAgY3JpdGljYWw6IDAsXG4gICAgaGlnaDogMCxcbiAgICBtZWRpdW06IDAsXG4gICAgbG93OiAwLFxuICAgIHN1cHByZXNzZWQ6IDBcbn07XG52YXIgcmF0ZUxpbWl0cyA9IHtcbiAgICBjcml0aWNhbDogMjAwLFxuICAgIGhpZ2g6IDUwMCxcbiAgICBtZWRpdW06IDEwMDAsXG4gICAgbG93OiAyMDAwLFxuICAgIHN1cHByZXNzZWQ6IDUwMDBcbn07XG5leHBvcnQgZnVuY3Rpb24gaXNTdGF0ZVVuY2hhbmdlZChuZXdTdGF0ZSkge1xuICAgIGlmICghbGFzdFN0YXRlKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5ld1N0YXRlLmV2ZW50VHlwZSAhPT0gXCJ0aWNrXCIpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmV3U3RhdGUuY29tYmF0U3RhdGUgIT09IGxhc3RTdGF0ZS5jb21iYXRTdGF0ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuZXdTdGF0ZS5lbmVtaWVzLmxlbmd0aCAhPT0gbGFzdFN0YXRlLmVuZW1pZXMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHBsYXllckNoYW5nZWQgPSBuZXdTdGF0ZS5wbGF5ZXIuaGVhbHRoICE9PSBsYXN0U3RhdGUucGxheWVyLmhlYWx0aCB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueCAhPT0gbGFzdFN0YXRlLnBsYXllci5wb3NpdGlvbi54IHx8XG4gICAgICAgIG5ld1N0YXRlLnBsYXllci5wb3NpdGlvbi55ICE9PSBsYXN0U3RhdGUucGxheWVyLnBvc2l0aW9uLnkgfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLnBvc2l0aW9uLnogIT09IGxhc3RTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueiB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIuaXNTbmVha2luZyAhPT0gbGFzdFN0YXRlLnBsYXllci5pc1NuZWFraW5nO1xuICAgIHJldHVybiAhcGxheWVyQ2hhbmdlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVByaW9yaXR5KHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlLnBsYXllci5pc0RlYWQpIHtcbiAgICAgICAgcmV0dXJuIFwiY3JpdGljYWxcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLnBsYXllci5oZWFsdGggPCBzdGF0ZS5wbGF5ZXIubWF4SGVhbHRoICogMC4yNSkge1xuICAgICAgICByZXR1cm4gXCJjcml0aWNhbFwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlID09PSBcImhpdFwiKSB7XG4gICAgICAgIHJldHVybiBcImhpZ2hcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmNvbWJhdFN0YXRlID09PSAxKSB7XG4gICAgICAgIGlmIChzdGF0ZS5lbmVtaWVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBjbG9zZXN0RW5lbXkgPSBzdGF0ZS5lbmVtaWVzWzBdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBzdGF0ZS5lbmVtaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlLmVuZW1pZXNbaV0uZGlzdGFuY2UgPCBjbG9zZXN0RW5lbXkuZGlzdGFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xvc2VzdEVuZW15ID0gc3RhdGUuZW5lbWllc1tpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoY2xvc2VzdEVuZW15LmRpc3RhbmNlIDwgNTAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiaGlnaFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBcIm1lZGl1bVwiO1xuICAgIH1cbiAgICBpZiAoc3RhdGUuZXZlbnRUeXBlICE9PSBcInRpY2tcIikge1xuICAgICAgICByZXR1cm4gXCJtZWRpdW1cIjtcbiAgICB9XG4gICAgLy8gU3VwcHJlc3MgaWYgbm90aGluZyBpbnRlcmVzdGluZyBpcyBoYXBwZW5pbmdcbiAgICBpZiAobGFzdFN0YXRlICYmIGlzU3RhdGVVbmNoYW5nZWQoc3RhdGUpKSB7XG4gICAgICAgIHJldHVybiBcInN1cHByZXNzZWRcIjtcbiAgICB9XG4gICAgcmV0dXJuIFwibG93XCI7XG59XG5leHBvcnQgZnVuY3Rpb24gc2hvdWxkU2VuZChwcmlvcml0eSwgc3RhdGUpIHtcbiAgICB2b2lkIHN0YXRlO1xuICAgIGlmIChwcmlvcml0eSA9PT0gXCJzdXBwcmVzc2VkXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgbGFzdFNlbmQgPSBsYXN0U2VuZFRpbWVzW3ByaW9yaXR5XTtcbiAgICB2YXIgbWluSW50ZXJ2YWwgPSByYXRlTGltaXRzW3ByaW9yaXR5XTtcbiAgICBpZiAobm93IC0gbGFzdFNlbmQgPCBtaW5JbnRlcnZhbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFJhdGUtbGltaXQgaXMgYXR0ZW1wdC1iYXNlZCB0byBhdm9pZCBoYW1tZXJpbmcgdHJhbnNwb3J0IG9uIHJlcGVhdGVkIGZhaWx1cmVzLlxuICAgIGxhc3RTZW5kVGltZXNbcHJpb3JpdHldID0gbm93O1xuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlY29yZFNlbnRTdGF0ZShzdGF0ZSkge1xuICAgIGxhc3RTdGF0ZSA9IHN0YXRlO1xufVxuIiwiaW1wb3J0IHsgYnJvd3Nlciwgb24sIHByaW50Q29uc29sZSwgVWksIH0gZnJvbSBcIi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgcGFyc2VBY3Rpb24gfSBmcm9tIFwiLi9hY3Rpb25zL3BhcnNlclwiO1xuaW1wb3J0IHsgZXhlY3V0ZUFjdGlvbiB9IGZyb20gXCIuL2FjdGlvbnMvZXhlY3V0b3JcIjtcbmltcG9ydCB7IHNldEdhbWVJbnRlcnZhbCB9IGZyb20gXCIuL3RpbWVyc1wiO1xuLyoqXG4gKiBDb21wYW5pb24gYnJvd3NlciBicmlkZ2UgKGNvbnZlcmdlZCBkZXNpZ24gZnJvbSBkb2NzL3Jlc2VhcmNoL1xuICogYnJhaW5zdG9ybS1wYXRoQS1icmlkZ2UubWQgYW5kIGJyYWluc3Rvcm0tcGF0aEItZGlyZWN0LXdzLm1kKTpcbiAqXG4gKiAgLSBUaGUgaW4tZ2FtZSBDRUYgcGFnZSAobG9hZGVkIGZyb20gdGhlIGNvbXBhbmlvbiBhcHApIG93bnMgdGhlIFdlYlNvY2tldFxuICogICAgdG8gdGhlIGFwcCDigJQgdGhlIHBsdWdpbiBORVZFUiB0b3VjaGVzIFdlYlNvY2tldHMgKFNQIEpTIGhhcyBub25lKS5cbiAqICAtIFRoZSBwbHVnaW4gcmVjZWl2ZXMgcGFnZSBpbnRlbnRzIHZpYSBgYnJvd3Nlck1lc3NhZ2VgXG4gKiAgICAocGFnZSBjYWxscyBgd2luZG93LnNreXJpbVBsYXRmb3JtLnNlbmRNZXNzYWdlKC4uLilgKS5cbiAqICAtIFRoZSBwbHVnaW4gcHVzaGVzIG9ubHkgUkFSRSBldmVudHMgaW50byB0aGUgcGFnZSB2aWFcbiAqICAgIGBicm93c2VyLmV4ZWN1dGVKYXZhU2NyaXB0YCDigJQgbmV2ZXIgcGVyLXRpY2sgc3RhdGUgKHRoZSBlbmdpbmUgYWxyZWFkeVxuICogICAgYnJvYWRjYXN0cyBnYW1lU3RhdGUgdG8gV1MgcGVlcnM7IHRoZSBwYWdlIHJlYWRzIGl0IGZyb20gdGhlcmUpLlxuICogIC0gYGNvbXBhbmlvbi1yZWFkeWAgaGFuZHNoYWtlICsgaGVhcnRiZWF0OiBgZXhlY3V0ZUphdmFTY3JpcHRgIGluamVjdGlvbnNcbiAqICAgIGFyZSBzaWxlbnRseSBkcm9wcGVkIGJlZm9yZSB0aGUgcGFnZSdzIGZpcnN0IGxvYWQtZW5kICh2ZXJpZmllZCBpblxuICogICAgQnJvd3NlckFwaVRpbHRlZC5jcHAg4oCUIG5vIHF1ZXVlKSwgc28gbm90aGluZyBpcyBwdXNoZWQgdW50aWwgcmVhZHkuXG4gKi9cbi8qKiBNZW51cyBkdXJpbmcgd2hpY2ggdGhlIG92ZXJsYXkgaXMgaGlkZGVuIChicm93c2VyU2VydmljZS50cyBiYWQtbWVudSBsaXN0KS4gKi9cbnZhciBCQURfTUVOVVMgPSBbXG4gICAgXCJMb2FkaW5nIE1lbnVcIixcbiAgICBcIk1haW4gTWVudVwiLFxuICAgIFwiQ29uc29sZVwiLFxuICAgIFwiVHdlZW5NZW51XCIsXG4gICAgXCJSYWNlU2V4IE1lbnVcIixcbiAgICBcIiBjcmFmdGluZyBcIiwgLy8gbWF0Y2hlcyBDcmFmdGluZy9TbWl0aGluZy9FbmNoYW50aW5nIG1lbnVzXG5dO1xudmFyIEhFQVJUQkVBVF9USU1FT1VUX01TID0gMTUwMDA7XG52YXIgV0FUQ0hET0dfSU5URVJWQUxfTVMgPSA1MDAwO1xudmFyIE1BWF9UUkFDS0VEX0FDVElPTl9JRFMgPSA2NDtcbnZhciBicmlkZ2VBY3RpdmUgPSBmYWxzZTtcbnZhciBjb21wYW5pb25SZWFkeSA9IGZhbHNlO1xudmFyIGxhc3RIZWFydGJlYXRBdCA9IDA7XG52YXIgb3ZlcmxheVZpc2libGUgPSBmYWxzZTtcbnZhciByZWNlbnRBY3Rpb25JZHMgPSBbXTtcbmZ1bmN0aW9uIGxvZ0JyaWRnZShtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXVticmlkZ2VdIFwiLmNvbmNhdChtZXNzYWdlKSk7XG4gICAgfVxufVxuLyoqXG4gKiBTZXJpYWxpemUtdGhlbi1lbWJlZC1pbi1zb3VyY2UuIGBleGVjdXRlSmF2YVNjcmlwdGAgdGFrZXMgU09VUkNFIENPREUsIG5vdFxuICogZGF0YSAoTXlDaHJvbWl1bUFwcC5jcHA6MjcyLTI3OCkg4oCUIGEgcmF3IEpTT04gaW50ZXJwb2xhdGlvbiBvZiBnYW1lIHN0cmluZ3NcbiAqIChhY3RvciBuYW1lcyBhcmUgbW9kZGVyLWNvbnRyb2xsZWQgZGF0YSkgd291bGQgYnJlYWsgdGhlIGluamVjdGlvbiBvclxuICogZXhlY3V0ZSBhcmJpdHJhcnkgSlMgaW4gdGhlIHBhZ2UuIEhlbmNlIHRoZSBkb3VibGUgYEpTT04uc3RyaW5naWZ5YC5cbiAqIEluamVjdGlvbnMgYmVmb3JlIHRoZSBwYWdlIGlzIGxvYWRlZCBhcmUgc2lsZW50bHkgZHJvcHBlZCBvbiB0aGUgVGlsdGVkXG4gKiBiYWNrZW5kIOKAlCBjYWxsZXJzIG11c3Qgb25seSBpbmplY3QgYWZ0ZXIgYGNvbXBhbmlvblJlYWR5YC5cbiAqL1xuZnVuY3Rpb24gaW5qZWN0TWVzc2FnZShtZXNzYWdlKSB7XG4gICAgaWYgKCFjb21wYW5pb25SZWFkeSkge1xuICAgICAgICBsb2dCcmlkZ2UoXCJpbmplY3Qgc2tpcHBlZDogcGFnZSBub3QgcmVhZHkgeWV0XCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHZhciBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkoSlNPTi5zdHJpbmdpZnkobWVzc2FnZSkpO1xuICAgICAgICBicm93c2VyLmV4ZWN1dGVKYXZhU2NyaXB0KFwid2luZG93Ll9fc2t5Z3VpZGVSZWNlaXZlKFwiLmNvbmNhdChwYXlsb2FkLCBcIilcIikpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dCcmlkZ2UoXCJpbmplY3QgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbWVtYmVyQWN0aW9uSWQoaWQpIHtcbiAgICBpZiAoIWlkKVxuICAgICAgICByZXR1cm4gdHJ1ZTsgLy8gdW50cmFja2VkIGFjdGlvbnMgYWx3YXlzIHJ1biAoSFRUUCBwYXJpdHkpXG4gICAgaWYgKHJlY2VudEFjdGlvbklkcy5pbmNsdWRlcyhpZCkpIHtcbiAgICAgICAgbG9nQnJpZGdlKFwiZHVwbGljYXRlIGFjdGlvbiBpZCBpZ25vcmVkOiBcIi5jb25jYXQoaWQpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZWNlbnRBY3Rpb25JZHMucHVzaChpZCk7XG4gICAgaWYgKHJlY2VudEFjdGlvbklkcy5sZW5ndGggPiBNQVhfVFJBQ0tFRF9BQ1RJT05fSURTKSB7XG4gICAgICAgIHJlY2VudEFjdGlvbklkcy5zaGlmdCgpO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIGhhbmRsZUFjdGlvbkFyZ3VtZW50KHJhdykge1xuICAgIC8vIFBhZ2UgbWF5IHNlbmQgdGhlIGFjdGlvbiBhcyBhbiBvYmplY3Qgb3IgYXMgYSBKU09OIHN0cmluZyDigJQgYWNjZXB0IGJvdGguXG4gICAgdmFyIGNhbmRpZGF0ZSA9IHJhdztcbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gSlNPTi5wYXJzZShjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgbG9nQnJpZGdlKFwiYnJpZGdlIGFjdGlvbiByZWplY3RlZDogbm9uLUpTT04gc3RyaW5nIHBheWxvYWRcIik7XG4gICAgICAgICAgICBpbmplY3RNZXNzYWdlKHsgdHlwZTogXCJhY3Rpb24tcmVzdWx0XCIsIG9rOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgYWN0aW9uID0gcGFyc2VBY3Rpb24oY2FuZGlkYXRlKTtcbiAgICBpZiAoIWFjdGlvbikge1xuICAgICAgICBsb2dCcmlkZ2UoXCJicmlkZ2UgYWN0aW9uIHJlamVjdGVkOiBcIi5jb25jYXQoSlNPTi5zdHJpbmdpZnkoY2FuZGlkYXRlKSkpO1xuICAgICAgICBpbmplY3RNZXNzYWdlKHsgdHlwZTogXCJhY3Rpb24tcmVzdWx0XCIsIG9rOiBmYWxzZSB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgaWQgPSBjYW5kaWRhdGUuaWQ7XG4gICAgdmFyIGFjdGlvbklkID0gdHlwZW9mIGlkID09PSBcInN0cmluZ1wiID8gaWQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKCFyZW1lbWJlckFjdGlvbklkKGFjdGlvbklkKSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBvayA9IGV4ZWN1dGVBY3Rpb24oYWN0aW9uKTtcbiAgICBpbmplY3RNZXNzYWdlKHsgdHlwZTogXCJhY3Rpb24tcmVzdWx0XCIsIGlkOiBhY3Rpb25JZCwgb2s6IG9rIH0pO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV1bYnJpZGdlXSBhY3Rpb24gXCIuY29uY2F0KGFjdGlvbi50eXBlLCBcIjogXCIpLmNvbmNhdChvayA/IFwib2tcIiA6IFwiZmFpbGVkXCIpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc0JhZE1lbnVPcGVuKCkge1xuICAgIGZvciAodmFyIF9pID0gMCwgQkFEX01FTlVTXzEgPSBCQURfTUVOVVM7IF9pIDwgQkFEX01FTlVTXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBtZW51ID0gQkFEX01FTlVTXzFbX2ldO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKFVpLmlzTWVudU9wZW4obWVudSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgICAgICAvLyBNZW51IG5hbWUgbm90IHJlY29nbml6ZWQgYnkgdGhpcyBidWlsZCDigJQgdHJlYXQgYXMgb3BlbiB0byBzdGF5IGhpZGRlbi5cbiAgICAgICAgICAgIHJldHVybiBtZW51ID09PSBcIkxvYWRpbmcgTWVudVwiO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbmZ1bmN0aW9uIHJlZnJlc2hPdmVybGF5VmlzaWJpbGl0eSgpIHtcbiAgICBpZiAoIWJyaWRnZUFjdGl2ZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBzaG91bGRTaG93ID0gY29tcGFuaW9uUmVhZHkgJiYgIWlzQmFkTWVudU9wZW4oKTtcbiAgICBpZiAoc2hvdWxkU2hvdyA9PT0gb3ZlcmxheVZpc2libGUpXG4gICAgICAgIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgICBicm93c2VyLnNldFZpc2libGUoc2hvdWxkU2hvdyk7XG4gICAgICAgIG92ZXJsYXlWaXNpYmxlID0gc2hvdWxkU2hvdztcbiAgICAgICAgbG9nQnJpZGdlKFwib3ZlcmxheSBcIi5jb25jYXQoc2hvdWxkU2hvdyA/IFwidmlzaWJsZVwiIDogXCJoaWRkZW5cIikpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ0JyaWRnZShcInNldFZpc2libGUgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBoYW5kbGVCcm93c2VyTWVzc2FnZShldmVudCkge1xuICAgIHZhciBhcmdzID0gZXZlbnQuYXJndW1lbnRzO1xuICAgIHZhciBraW5kID0gYXJnc1swXTtcbiAgICBzd2l0Y2ggKGtpbmQpIHtcbiAgICAgICAgY2FzZSBcImNvbXBhbmlvbi1yZWFkeVwiOiB7XG4gICAgICAgICAgICBjb21wYW5pb25SZWFkeSA9IHRydWU7XG4gICAgICAgICAgICBsYXN0SGVhcnRiZWF0QXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgcmVmcmVzaE92ZXJsYXlWaXNpYmlsaXR5KCk7XG4gICAgICAgICAgICBpbmplY3RNZXNzYWdlKHsgdHlwZTogXCJoZWxsb1wiLCBicmlkZ2VWZXJzaW9uOiAxLCBnYW1lUmVhZHk6IHRydWUgfSk7XG4gICAgICAgICAgICBsb2dCcmlkZ2UoXCJjb21wYW5pb24gcGFnZSByZWFkeVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiaGVhcnRiZWF0XCI6IHtcbiAgICAgICAgICAgIGxhc3RIZWFydGJlYXRBdCA9IERhdGUubm93KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGlvblwiOiB7XG4gICAgICAgICAgICBoYW5kbGVBY3Rpb25Bcmd1bWVudChhcmdzWzFdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic3Bpa2UtcmVzdWx0XCI6IHtcbiAgICAgICAgICAgIC8vIENFRiBtZWRpYSBzcGlrZSByZXBvcnRpbmcgKHNlZSBzcGlrZS9jZWYtbWVkaWEtc3Bpa2UvKS5cbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV1bc3Bpa2VdIFwiLmNvbmNhdChTdHJpbmcoYXJnc1sxXSksIFwiID0gXCIpLmNvbmNhdChTdHJpbmcoYXJnc1syXSkpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiY29tcGFuaW9uLWxvZ1wiOiB7XG4gICAgICAgICAgICBsb2dCcmlkZ2UoXCJwYWdlOiBcIi5jb25jYXQoU3RyaW5nKGFyZ3NbMV0pKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGxvZ0JyaWRnZShcInVua25vd24gcGFnZSBtZXNzYWdlOiBcIi5jb25jYXQoU3RyaW5nKGtpbmQpKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gb25NZW51T3BlbihfZXZlbnQpIHtcbiAgICByZWZyZXNoT3ZlcmxheVZpc2liaWxpdHkoKTtcbn1cbmZ1bmN0aW9uIG9uTWVudUNsb3NlKF9ldmVudCkge1xuICAgIHJlZnJlc2hPdmVybGF5VmlzaWJpbGl0eSgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGluaXRCcmlkZ2UoKSB7XG4gICAgaWYgKGJyaWRnZUFjdGl2ZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGJyaWRnZUFjdGl2ZSA9IHRydWU7XG4gICAgLy8gUGFnZSAtPiBwbHVnaW4gY2hhbm5lbC4gV29ya3MgZm9yIEFOWSBsb2FkZWQgcGFnZSAoc3Bpa2UgcGFnZSBpbmNsdWRlZCkg4oCUXG4gICAgLy8gdGhlIGhhbmRsZXIgaXMgcmVnaXN0ZXJlZCBoZXJlIGV2ZW4gd2hlbiBicmlkZ2UgVVJMIGxvYWRpbmcgaXMgZGlzYWJsZWQuXG4gICAgb24oXCJicm93c2VyTWVzc2FnZVwiLCBoYW5kbGVCcm93c2VyTWVzc2FnZSk7XG4gICAgaWYgKENPTkZJRy5icmlkZ2VFbmFibGVkICYmIENPTkZJRy5jb21wYW5pb25VcmwpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGJyb3dzZXIubG9hZFVybChDT05GSUcuY29tcGFuaW9uVXJsKTtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gY29tcGFuaW9uIHBhZ2U6IFwiLmNvbmNhdChDT05GSUcuY29tcGFuaW9uVXJsKSk7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIG5vdGU6IHRoZSBVUkwgbG9hZHMgYWZ0ZXIgdGhlIGZpcnN0IG1vdXNlIG1vdmUgKENFRiBiZWhhdmlvcilcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBicm93c2VyLmxvYWRVcmwgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBIaWRlIHRoZSBvdmVybGF5IGR1cmluZyBiYWQgbWVudXM7IHJlLXNob3cgYWZ0ZXIuXG4gICAgb24oXCJtZW51T3BlblwiLCBvbk1lbnVPcGVuKTtcbiAgICBvbihcIm1lbnVDbG9zZVwiLCBvbk1lbnVDbG9zZSk7XG4gICAgLy8gSGVhcnRiZWF0IHdhdGNoZG9nOiBwYWdlIG11c3QgcHVsc2U7IG9uIHN0YWxlbmVzcyB3ZSBkcm9wIHRvIGhpZGRlbiBhbmRcbiAgICAvLyBzdG9wIGluamVjdGluZyAoYXZvaWRzIHRhbGtpbmcgaW50byBhIGRlYWQvY3Jhc2hlZCByZW5kZXJlcikuXG4gICAgc2V0R2FtZUludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjb21wYW5pb25SZWFkeSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKERhdGUubm93KCkgLSBsYXN0SGVhcnRiZWF0QXQgPiBIRUFSVEJFQVRfVElNRU9VVF9NUykge1xuICAgICAgICAgICAgY29tcGFuaW9uUmVhZHkgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlZnJlc2hPdmVybGF5VmlzaWJpbGl0eSgpO1xuICAgICAgICAgICAgbG9nQnJpZGdlKFwiY29tcGFuaW9uIHN0YWxlIChubyBoZWFydGJlYXQpIOKAlCBicmlkZ2UgcGF1c2VkXCIpO1xuICAgICAgICB9XG4gICAgfSwgV0FUQ0hET0dfSU5URVJWQUxfTVMpO1xuICAgIGxvZ0JyaWRnZShcImJyaWRnZSBpbml0aWFsaXplZFwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBhbmlvblJlYWR5KCkge1xuICAgIHJldHVybiBjb21wYW5pb25SZWFkeTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBoZWFydGJlYXRBZ2VNcygpIHtcbiAgICBpZiAoIWNvbXBhbmlvblJlYWR5KVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gRGF0ZS5ub3coKSAtIGxhc3RIZWFydGJlYXRBdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc092ZXJsYXlWaXNpYmxlKCkge1xuICAgIHJldHVybiBvdmVybGF5VmlzaWJsZTtcbn1cbi8qKiBNYW51YWwgZXNjYXBlIGhhdGNoIGZvciBkZXYgaW50ZXJhY3Rpdml0eSAoRjYgYWxzbyB0b2dnbGVzIGZvY3VzIGluLWdhbWUpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldENvbXBhbmlvbkZvY3VzZWQoZm9jdXNlZCkge1xuICAgIHRyeSB7XG4gICAgICAgIGJyb3dzZXIuc2V0Rm9jdXNlZChmb2N1c2VkKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dCcmlkZ2UoXCJzZXRGb2N1c2VkIGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG52YXIgZnNNb2R1bGU7XG5mdW5jdGlvbiBsb2FkRnMoKSB7XG4gICAgaWYgKGZzTW9kdWxlICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmc01vZHVsZTtcbiAgICB0cnkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXJlcXVpcmUtaW1wb3J0c1xuICAgICAgICBmc01vZHVsZSA9IHJlcXVpcmUoXCJmc1wiKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBmc01vZHVsZSA9IG51bGw7XG4gICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIE5vZGUgZnMgdW5hdmFpbGFibGU6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmc01vZHVsZTtcbn1cbmZ1bmN0aW9uIHBhcmVudERpcihmaWxlUGF0aCkge1xuICAgIHZhciBpZHggPSBNYXRoLm1heChmaWxlUGF0aC5sYXN0SW5kZXhPZihcIi9cIiksIGZpbGVQYXRoLmxhc3RJbmRleE9mKFwiXFxcXFwiKSk7XG4gICAgaWYgKGlkeCA8PSAwKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gZmlsZVBhdGguc2xpY2UoMCwgaWR4KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkdW1wTW9kQ29udGV4dChwYXlsb2FkKSB7XG4gICAgaWYgKCFDT05GSUcubW9kQ29udGV4dER1bXBFbmFibGVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGZzID0gbG9hZEZzKCk7XG4gICAgaWYgKCFmcylcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHZhciB0YXJnZXQgPSBDT05GSUcubW9kQ29udGV4dFBhdGg7XG4gICAgdmFyIHRtcCA9IFwiXCIuY29uY2F0KHRhcmdldCwgXCIudG1wXCIpO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBkaXIgPSBwYXJlbnREaXIodGFyZ2V0KTtcbiAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBmcy5ta2RpclN5bmMoZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgICAgIC8vIERpcmVjdG9yeSBtYXkgYWxyZWFkeSBleGlzdC5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkpO1xuICAgICAgICBmcy5yZW5hbWVTeW5jKHRtcCwgdGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gbW9kLWNvbnRleHQgZHVtcCBmYWlsZWQ6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iLCJ2YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2dlbmVyYXRvciA9ICh0aGlzICYmIHRoaXMuX19nZW5lcmF0b3IpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZyA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBJdGVyYXRvciA9PT0gXCJmdW5jdGlvblwiID8gSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSk7XG4gICAgcmV0dXJuIGcubmV4dCA9IHZlcmIoMCksIGdbXCJ0aHJvd1wiXSA9IHZlcmIoMSksIGdbXCJyZXR1cm5cIl0gPSB2ZXJiKDIpLCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XG4gICAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgICB9XG59O1xuaW1wb3J0IHsgSHR0cENsaWVudCwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG52YXIgTUFYX1NFTkRTX1BFUl9TRUMgPSA1O1xudmFyIFJFUVVFU1RfVElNRU9VVF9NUyA9IDMwMDA7XG52YXIgc2VuZENvdW50ID0gMDtcbnZhciBsYXN0UmVzZXQgPSBEYXRlLm5vdygpO1xuLyoqXG4gKiBIYXJkZW5pbmcgcGF0dGVybiBmcm9tIHNreW1wNS1jbGllbnQgc2V0dGluZ3NTZXJ2aWNlOiBIdHRwQ2xpZW50IGhhcyBub1xuICogdGltZW91dCBzdXBwb3J0ICh2ZXJpZmllZCDigJQgY3BwLWh0dHBsaWIgd3JhcHBlciksIGFuZCBpdHMgdGhyZWFkIHBvb2wgaXNcbiAqIG9ubHkgMywgc28gYSBodW5nIHJlcXVlc3Qgc3RhcnZlcyBldmVyeSBsYXRlciBvbmUuIFJhY2UgYSByZWplY3QgdGltZXIuXG4gKi9cbmZ1bmN0aW9uIHdpdGhUaW1lb3V0KHByb21pc2UsIHRpbWVvdXRNcywgdGFnKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHRpbWVyID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0XG4gICAgICAgICAgICA/IGdsb2JhbFRoaXMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiByZWplY3QobmV3IEVycm9yKFwiXCIuY29uY2F0KHRhZywgXCI6IHRpbWVvdXQgYWZ0ZXIgXCIpLmNvbmNhdCh0aW1lb3V0TXMsIFwibXNcIikpKTsgfSwgdGltZW91dE1zKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHJlc2V0UmF0ZUxpbWl0KCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0UmVzZXQgPj0gMTAwMCkge1xuICAgICAgICBzZW5kQ291bnQgPSAwO1xuICAgICAgICBsYXN0UmVzZXQgPSBub3c7XG4gICAgfVxufVxudmFyIFNreUd1aWRlSHR0cENsaWVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTa3lHdWlkZUh0dHBDbGllbnQoYmFzZVVybCkge1xuICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubWF4RmFpbHVyZXMgPSAzO1xuICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IDA7XG4gICAgICAgIHRoaXMuY29vbGRvd25NcyA9IDEwMDAwO1xuICAgICAgICB0aGlzLmNsaWVudCA9IG5ldyBIdHRwQ2xpZW50KGJhc2VVcmwpO1xuICAgIH1cbiAgICBTa3lHdWlkZUh0dHBDbGllbnQucHJvdG90eXBlLnNlbmRHYW1lU3RhdGUgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UsIGVycl8xLCBtc2c7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldFJhdGVMaW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbmRDb3VudCA+PSBNQVhfU0VORFNfUEVSX1NFQykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIlJhdGUgbGltaXQgZXhjZWVkZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBmYWxzZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnRyeXMucHVzaChbMSwgMywgLCA0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCB3aXRoVGltZW91dCh0aGlzLmNsaWVudC5wb3N0KFwiL2FwaS9nYW1lLXN0YXRlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksIFJFUVVFU1RfVElNRU9VVF9NUywgXCJnYW1lLXN0YXRlIFBPU1RcIildO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCB0cnVlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gSFRUUCBcIi5jb25jYXQocmVzcG9uc2Uuc3RhdHVzLCBcIjogcmVxdWVzdCByZWplY3RlZCBieSBzZXJ2ZXJcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgZmFsc2VdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gZXJyXzEgaW5zdGFuY2VvZiBFcnJvciA/IGVycl8xLm1lc3NhZ2UgOiBTdHJpbmcoZXJyXzEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEhUVFAgUE9TVCAvYXBpL2dhbWUtc3RhdGUgZmFpbGVkOiBcIi5jb25jYXQobXNnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGZhbHNlXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU2t5R3VpZGVIdHRwQ2xpZW50LnByb3RvdHlwZS5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZmFpbHVyZUNvdW50IDwgdGhpcy5tYXhGYWlsdXJlcylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdEZhaWx1cmVUaW1lID4gdGhpcy5jb29sZG93bk1zKSB7XG4gICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IHRoaXMubWF4RmFpbHVyZXMgLSAxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIFNreUd1aWRlSHR0cENsaWVudDtcbn0oKSk7XG5leHBvcnQgdmFyIGh0dHBDbGllbnQgPSBuZXcgU2t5R3VpZGVIdHRwQ2xpZW50KENPTkZJRy5zZXJ2ZXJVcmwpO1xuZXhwb3J0IGZ1bmN0aW9uIHNlbmRHYW1lU3RhdGUocGF5bG9hZCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGh0dHBDbGllbnQuc2VuZEdhbWVTdGF0ZShwYXlsb2FkKV07XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiBodHRwQ2xpZW50LmlzQ29ubmVjdGVkKCk7XG59XG4iLCIvLyBAZW52IG5vZGVcbi8vIE5PVEU6IEZvciBwcm9kdWN0aW9uLCBjb25zaWRlciByZWFkaW5nIGZyb20gU2t5cmltIFBsYXRmb3JtIHNldHRpbmdzOlxuLy8gICBpbXBvcnQgeyBzZXR0aW5ncyB9IGZyb20gXCJza3lyaW1QbGF0Zm9ybVwiO1xuLy8gICBjb25zdCBkZWJ1Z01vZGUgPSBzZXR0aW5nc1tcInNreWd1aWRlXCJdPy5bXCJkZWJ1Z01vZGVcIl0gPT09IFwidHJ1ZVwiO1xuZXhwb3J0IHZhciBQTEFZRVJfRk9STV9JRCA9IDB4MTQ7XG5leHBvcnQgdmFyIENPTkZJRyA9IHtcbiAgICBzZXJ2ZXJVcmw6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXG4gICAgdGlja0ludGVydmFsOiA1MDAsXG4gICAgZW5lbXlTY2FuUmFkaXVzOiA1MDAwLFxuICAgIG1heEVuZW1pZXM6IDEwLFxuICAgIGRlYnVnTW9kZTogZmFsc2UsXG4gICAgLy8gSFRUUCBhY3Rpb24gcG9sbGluZzogR0VUIC9hcGkvYWN0aW9ucz9zaW5jZT08bGFzdElkPiDigJQgdGhlIHNlcnZlciBrZWVwc1xuICAgIC8vIGFuIGluLW1lbW9yeSBvdXRib3ggb2YgcGlwZWxpbmUgYWN0aW9ucyAoY29tcG9zZXIgc3VnZ2VzdGlvbnMsIHF1ZXN0aW9uXG4gICAgLy8gYW5zd2VycyksIHBydW5lZCBhZnRlciAxNXMuIEVhY2ggYWN0aW9uIGNhcnJpZXMgYSBtb25vdG9uaWMgaWQ7IHdlIHNlbmRcbiAgICAvLyA/c2luY2U9IGZvciBhdC1tb3N0LW9uY2UgZGVsaXZlcnkuIEVuYWJsZWQgMjAyNi0xMS0xNSBhbG9uZ3NpZGUgdGhlXG4gICAgLy8gc2VydmVyLXNpZGUgZW5kcG9pbnQuXG4gICAgcG9sbGluZ0ludGVydmFsOiAxMDAwLFxuICAgIHBvbGxpbmdFbmRwb2ludDogXCIvYXBpL2FjdGlvbnNcIixcbiAgICBwb2xsaW5nTWF4QmFja29mZjogMzAwMDAsXG4gICAgcG9sbGluZ0VuYWJsZWQ6IHRydWUsXG4gICAgbWF4UG9sbGluZ1JldHJpZXM6IDUsXG4gICAgLy8gQ29tcGFuaW9uIGJyb3dzZXIgYnJpZGdlIChzZWUgc3JjL2JyaWRnZS50cykuIFRoZSBwYWdlIGlzIHNlcnZlZCBieSB0aGVcbiAgICAvLyBjb21wYW5pb24gYXBwOyBgYnJpZGdlRW5hYmxlZGAgb25seSBjb250cm9scyB3aGV0aGVyIHdlIGxvYWQgdGhlIFVSTCDigJRcbiAgICAvLyB0aGUgYnJvd3Nlck1lc3NhZ2UgaGFuZGxlciBpcyByZWdpc3RlcmVkIHJlZ2FyZGxlc3MgKHNwaWtlIHBhZ2Ugc3VwcG9ydCkuXG4gICAgYnJpZGdlRW5hYmxlZDogZmFsc2UsXG4gICAgY29tcGFuaW9uVXJsOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9jb21wYW5pb25cIixcbiAgICAvLyBQYXJhbGxlbC1hcnJheSBkdW1wIGZvciB0aGUgYXBwJ3MgU2t5cmltRmlsZUNvbm5lY3RvciAvIHBhcnNlU2t5cmltU3RhdGVcbiAgICAvLyAoR2F0ZSArIENvbXBvc2VyIG1vZCBjb250ZXh0KS4gUGF0aCBpcyByZWxhdGl2ZSB0byBTa3lyaW0ncyBDV0QgdW5sZXNzXG4gICAgLy8gYWJzb2x1dGUg4oCUIHNldCBTS1lSSU1fQ09OVEVYVF9GSUxFX1BBVEggb24gdGhlIGFwcCB0byB0aGUgc2FtZSBmaWxlLlxuICAgIG1vZENvbnRleHREdW1wRW5hYmxlZDogdHJ1ZSxcbiAgICBtb2RDb250ZXh0UGF0aDogXCJEYXRhL1BsYXRmb3JtL1NreUd1aWRlL3N0YXRlLmpzb25cIixcbn07XG4iLCJ2YXIgX19zcHJlYWRBcnJheSA9ICh0aGlzICYmIHRoaXMuX19zcHJlYWRBcnJheSkgfHwgZnVuY3Rpb24gKHRvLCBmcm9tLCBwYWNrKSB7XG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcbn07XG5pbXBvcnQgeyBvbiwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gXCIuL2NvbmZpZ1wiO1xudmFyIGlzUmVnaXN0ZXJlZCA9IGZhbHNlO1xudmFyIGxhc3RDcm9zc2hhaXJSZWY7XG52YXIgb3Blbk1lbnVzID0gbmV3IFNldCgpO1xudmFyIGxhc3RMb2NhdGlvbjtcbnZhciBsYXN0QWN0aXZhdGVkUmVmO1xudmFyIHBsYXllckRlYWQgPSBmYWxzZTtcbnZhciBsYXN0Q29udGFpbmVyQ2hhbmdlZDtcbnZhciBsYXN0RXF1aXBDaGFuZ2U7XG52YXIgbGFzdExldmVsVXA7XG52YXIgbGFzdFF1ZXN0VXBkYXRlO1xudmFyIGxhc3RGYXN0VHJhdmVsRW5kO1xudmFyIGxhc3RCb29rUmVhZDtcbnZhciBsYXN0SXRlbUhhcnZlc3RlZDtcbnZhciBsYXN0TG9ja0NoYW5nZWQ7XG5mdW5jdGlvbiBkZWJ1Z0xvZyhtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIGV2ZW50TmFtZSwgYXJncykge1xuICAgIHZhciBfYTtcbiAgICAoX2EgPSBoYW5kbGVycyA9PT0gbnVsbCB8fCBoYW5kbGVycyA9PT0gdm9pZCAwID8gdm9pZCAwIDogaGFuZGxlcnNbZXZlbnROYW1lXSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNhbGwuYXBwbHkoX2EsIF9fc3ByZWFkQXJyYXkoW2hhbmRsZXJzXSwgYXJncywgZmFsc2UpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q3Jvc3NoYWlyUmVmKCkge1xuICAgIHJldHVybiBsYXN0Q3Jvc3NoYWlyUmVmO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldE9wZW5NZW51cygpIHtcbiAgICB2YXIgc25hcHNob3QgPSBuZXcgU2V0KCk7XG4gICAgb3Blbk1lbnVzLmZvckVhY2goZnVuY3Rpb24gKG1lbnVOYW1lKSB7XG4gICAgICAgIHNuYXBzaG90LmFkZChtZW51TmFtZSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNuYXBzaG90O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RMb2NhdGlvbigpIHtcbiAgICByZXR1cm4gbGFzdExvY2F0aW9uO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RBY3RpdmF0ZWRSZWYoKSB7XG4gICAgcmV0dXJuIGxhc3RBY3RpdmF0ZWRSZWY7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNQbGF5ZXJEZWFkKCkge1xuICAgIHJldHVybiBwbGF5ZXJEZWFkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RDb250YWluZXJDaGFuZ2VkKCkge1xuICAgIHJldHVybiBsYXN0Q29udGFpbmVyQ2hhbmdlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0RXF1aXBDaGFuZ2UoKSB7XG4gICAgcmV0dXJuIGxhc3RFcXVpcENoYW5nZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0TGV2ZWxVcCgpIHtcbiAgICByZXR1cm4gbGFzdExldmVsVXA7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdFF1ZXN0VXBkYXRlKCkge1xuICAgIHJldHVybiBsYXN0UXVlc3RVcGRhdGU7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEZhc3RUcmF2ZWxFbmQoKSB7XG4gICAgcmV0dXJuIGxhc3RGYXN0VHJhdmVsRW5kO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RCb29rUmVhZCgpIHtcbiAgICByZXR1cm4gbGFzdEJvb2tSZWFkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RJdGVtSGFydmVzdGVkKCkge1xuICAgIHJldHVybiBsYXN0SXRlbUhhcnZlc3RlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0TG9ja0NoYW5nZWQoKSB7XG4gICAgcmV0dXJuIGxhc3RMb2NrQ2hhbmdlZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckFsbEV2ZW50cyhoYW5kbGVycykge1xuICAgIGlmIChpc1JlZ2lzdGVyZWQpIHtcbiAgICAgICAgZGVidWdMb2coXCJyZWdpc3RlckFsbEV2ZW50cyBjYWxsZWQgYWZ0ZXIgaW5pdGlhbGl6YXRpb247IHNraXBwaW5nIGR1cGxpY2F0ZSBzdWJzY3JpcHRpb25zXCIpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlzUmVnaXN0ZXJlZCA9IHRydWU7XG4gICAgb24oXCJjcm9zc2hhaXJSZWZDaGFuZ2VkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGxhc3RDcm9zc2hhaXJSZWYgPSAoX2EgPSBldmVudC5yZWZlcmVuY2UpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJjcm9zc2hhaXJSZWZDaGFuZ2VkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNyb3NzaGFpclJlZkNoYW5nZWQ6IFwiLmNvbmNhdChTdHJpbmcobGFzdENyb3NzaGFpclJlZikpKTtcbiAgICB9KTtcbiAgICBvbihcImxvY2F0aW9uQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0TG9jYXRpb24gPSAoX2EgPSBldmVudC5uZXdMb2MpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9jYXRpb25DaGFuZ2VkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImxvY2F0aW9uQ2hhbmdlZDogXCIuY29uY2F0KGxhc3RMb2NhdGlvbiAhPT0gbnVsbCAmJiBsYXN0TG9jYXRpb24gIT09IHZvaWQgMCA/IGxhc3RMb2NhdGlvbiA6IFwidW5rbm93blwiKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NhdGlvbkRpc2NvdmVyeVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJsb2NhdGlvbkRpc2NvdmVyeVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2NhdGlvbkRpc2NvdmVyeTogXCIuY29uY2F0KGV2ZW50Lm5hbWUpKTtcbiAgICB9KTtcbiAgICBvbihcImNlbGxGdWxseUxvYWRlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJjZWxsRnVsbHlMb2FkZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY2VsbEZ1bGx5TG9hZGVkOiBcIi5jb25jYXQoZXZlbnQuY2VsbC5nZXROYW1lKCkpKTtcbiAgICB9KTtcbiAgICBvbihcIm1lbnVPcGVuXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQubmFtZSkge1xuICAgICAgICAgICAgb3Blbk1lbnVzLmFkZChldmVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcIm1lbnVPcGVuXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIm1lbnVPcGVuOiBcIi5jb25jYXQoZXZlbnQubmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwibWVudUNsb3NlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoZXZlbnQubmFtZSkge1xuICAgICAgICAgICAgb3Blbk1lbnVzLmRlbGV0ZShldmVudC5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcIm1lbnVDbG9zZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJtZW51Q2xvc2U6IFwiLmNvbmNhdChldmVudC5uYW1lKSk7XG4gICAgfSk7XG4gICAgb24oXCJmdXJuaXR1cmVFbnRlclwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJmdXJuaXR1cmVFbnRlclwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJmdXJuaXR1cmVFbnRlcjogXCIuY29uY2F0KFN0cmluZyhldmVudC50YXJnZXQuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJmdXJuaXR1cmVFeGl0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImZ1cm5pdHVyZUV4aXRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZnVybml0dXJlRXhpdDogXCIuY29uY2F0KFN0cmluZyhldmVudC50YXJnZXQuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJvcGVuXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcIm9wZW5cIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwib3BlbjogXCIuY29uY2F0KFN0cmluZyhldmVudC50YXJnZXQuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJjbG9zZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJjbG9zZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjbG9zZTogXCIuY29uY2F0KFN0cmluZyhldmVudC50YXJnZXQuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJxdWVzdFN0YWdlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0UXVlc3RVcGRhdGUgPSB7IGV2ZW50OiBcInF1ZXN0U3RhZ2VcIiwgcXVlc3RJZDogZXZlbnQucXVlc3QuZ2V0Rm9ybUlEKCksIHN0YWdlOiBldmVudC5zdGFnZSB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInF1ZXN0U3RhZ2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdGFnZTogcXVlc3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0UXVlc3RVcGRhdGUucXVlc3RJZCksIFwiIHN0YWdlPVwiKS5jb25jYXQoU3RyaW5nKGV2ZW50LnN0YWdlKSkpO1xuICAgIH0pO1xuICAgIG9uKFwicXVlc3RTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0YXJ0XCIsIHF1ZXN0SWQ6IGV2ZW50LnF1ZXN0LmdldEZvcm1JRCgpIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwicXVlc3RTdGFydFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJxdWVzdFN0YXJ0OiBxdWVzdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RRdWVzdFVwZGF0ZS5xdWVzdElkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwicXVlc3RTdG9wXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0UXVlc3RVcGRhdGUgPSB7IGV2ZW50OiBcInF1ZXN0U3RvcFwiLCBxdWVzdElkOiBldmVudC5xdWVzdC5nZXRGb3JtSUQoKSB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInF1ZXN0U3RvcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJxdWVzdFN0b3A6IHF1ZXN0PVwiLmNvbmNhdChTdHJpbmcobGFzdFF1ZXN0VXBkYXRlLnF1ZXN0SWQpKSk7XG4gICAgfSk7XG4gICAgb24oXCJkZWF0aFN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBwbGF5ZXJEZWFkID0gdHJ1ZTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJkZWF0aFN0YXJ0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImRlYXRoU3RhcnRcIik7XG4gICAgfSk7XG4gICAgb24oXCJkZWF0aEVuZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcGxheWVyRGVhZCA9IGZhbHNlO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImRlYXRoRW5kXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImRlYXRoRW5kXCIpO1xuICAgIH0pO1xuICAgIG9uKFwiY29udGFpbmVyQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIGxhc3RDb250YWluZXJDaGFuZ2VkID0ge1xuICAgICAgICAgICAgb2xkQ29udGFpbmVyOiAoX2EgPSBldmVudC5vbGRDb250YWluZXIpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIG5ld0NvbnRhaW5lcjogKF9iID0gZXZlbnQubmV3Q29udGFpbmVyKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBpdGVtOiAoX2MgPSBldmVudC5iYXNlT2JqKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBjb3VudDogZXZlbnQubnVtSXRlbXNcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJjb250YWluZXJDaGFuZ2VkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNvbnRhaW5lckNoYW5nZWQ6IFwiLmNvbmNhdChTdHJpbmcobGFzdENvbnRhaW5lckNoYW5nZWQub2xkQ29udGFpbmVyKSwgXCIgLT4gXCIpLmNvbmNhdChTdHJpbmcobGFzdENvbnRhaW5lckNoYW5nZWQubmV3Q29udGFpbmVyKSwgXCIsIGl0ZW09XCIpLmNvbmNhdChTdHJpbmcobGFzdENvbnRhaW5lckNoYW5nZWQuaXRlbSksIFwiLCBjb3VudD1cIikuY29uY2F0KFN0cmluZyhldmVudC5udW1JdGVtcykpKTtcbiAgICB9KTtcbiAgICBvbihcImVxdWlwXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBsYXN0RXF1aXBDaGFuZ2UgPSB7XG4gICAgICAgICAgICBhY3Rpb246IFwiZXF1aXBcIixcbiAgICAgICAgICAgIGFjdG9yOiAoX2EgPSBldmVudC5hY3RvcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgYmFzZU9iamVjdDogKF9iID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgZXh0cmFEYXRhOiBldmVudC51bmlxdWVJZFxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImVxdWlwXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImVxdWlwOiBhY3Rvcj1cIi5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5hY3RvciksIFwiIGl0ZW09XCIpLmNvbmNhdChTdHJpbmcobGFzdEVxdWlwQ2hhbmdlLmJhc2VPYmplY3QpKSk7XG4gICAgfSk7XG4gICAgb24oXCJ1bmVxdWlwXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBsYXN0RXF1aXBDaGFuZ2UgPSB7XG4gICAgICAgICAgICBhY3Rpb246IFwidW5lcXVpcFwiLFxuICAgICAgICAgICAgYWN0b3I6IChfYSA9IGV2ZW50LmFjdG9yKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBiYXNlT2JqZWN0OiAoX2IgPSBldmVudC5iYXNlT2JqKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBleHRyYURhdGE6IGV2ZW50LnVuaXF1ZUlkXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwidW5lcXVpcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJ1bmVxdWlwOiBhY3Rvcj1cIi5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5hY3RvciksIFwiIGl0ZW09XCIpLmNvbmNhdChTdHJpbmcobGFzdEVxdWlwQ2hhbmdlLmJhc2VPYmplY3QpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsZXZlbEluY3JlYXNlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0TGV2ZWxVcCA9IHtcbiAgICAgICAgICAgIGxldmVsOiBldmVudC5uZXdMZXZlbCxcbiAgICAgICAgICAgIGlzU2tpbGxJbmNyZWFzZTogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJsZXZlbEluY3JlYXNlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImxldmVsSW5jcmVhc2U6IGxldmVsPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQubmV3TGV2ZWwpKSk7XG4gICAgfSk7XG4gICAgb24oXCJza2lsbEluY3JlYXNlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBsYXN0TGV2ZWxVcCA9IHtcbiAgICAgICAgICAgIHNraWxsSWQ6IGV2ZW50LmFjdG9yVmFsdWUsXG4gICAgICAgICAgICBpc1NraWxsSW5jcmVhc2U6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJza2lsbEluY3JlYXNlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInNraWxsSW5jcmVhc2U6IHNraWxsPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuYWN0b3JWYWx1ZSkpKTtcbiAgICB9KTtcbiAgICBvbihcImVudGVyQmxlZWRvdXRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZW50ZXJCbGVlZG91dFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJlbnRlckJsZWVkb3V0OiBhY3Rvcj1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmFjdG9yLmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZmFzdFRyYXZlbEVuZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdEZhc3RUcmF2ZWxFbmQgPSB7IHRyYXZlbFRpbWVHYW1lSG91cnM6IGV2ZW50LnRyYXZlbFRpbWVHYW1lSG91cnMgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJmYXN0VHJhdmVsRW5kXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImZhc3RUcmF2ZWxFbmQ6IHRyYXZlbEhvdXJzPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQudHJhdmVsVGltZUdhbWVIb3VycykpKTtcbiAgICB9KTtcbiAgICBvbihcInNsZWVwU3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwic2xlZXBTdGFydFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJzbGVlcFN0YXJ0OiBkZXNpcmVkU3RvcFRpbWU9XCIuY29uY2F0KFN0cmluZyhldmVudC5kZXNpcmVkU3RvcFRpbWUpKSk7XG4gICAgfSk7XG4gICAgb24oXCJzbGVlcFN0b3BcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwic2xlZXBTdG9wXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInNsZWVwU3RvcDogaW50ZXJydXB0ZWQ9XCIuY29uY2F0KFN0cmluZyhldmVudC5pc0ludGVycnVwdGVkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiYWN0aXZhdGVcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIGxhc3RBY3RpdmF0ZWRSZWYgPSAoX2EgPSBldmVudC50YXJnZXQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJhY3RpdmF0ZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJhY3RpdmF0ZTogdGFyZ2V0PVwiLmNvbmNhdChTdHJpbmcobGFzdEFjdGl2YXRlZFJlZiksIFwiIGNhc3Rlcj1cIikuY29uY2F0KFN0cmluZygoX2IgPSBldmVudC5jYXN0ZXIpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImxvY2tDaGFuZ2VkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGxhc3RMb2NrQ2hhbmdlZCA9IHtcbiAgICAgICAgICAgIGxvY2tlZE9iamVjdDogKF9hID0gZXZlbnQubG9ja2VkT2JqZWN0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKClcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJsb2NrQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2NrQ2hhbmdlZDogb2JqZWN0PVwiLmNvbmNhdChTdHJpbmcobGFzdExvY2tDaGFuZ2VkLmxvY2tlZE9iamVjdCkpKTtcbiAgICB9KTtcbiAgICBvbihcImJvb2tSZWFkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgbGFzdEJvb2tSZWFkID0ge1xuICAgICAgICAgICAgYm9va0Zvcm1JZDogKF9hID0gZXZlbnQuYm9vaykgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgdGl0bGU6IChfYiA9IGV2ZW50LmJvb2spID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXROYW1lKClcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJib29rUmVhZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJib29rUmVhZDogXCIuY29uY2F0KChfYyA9IGxhc3RCb29rUmVhZC50aXRsZSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogU3RyaW5nKGxhc3RCb29rUmVhZC5ib29rRm9ybUlkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiaXRlbUhhcnZlc3RlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIGxhc3RJdGVtSGFydmVzdGVkID0ge1xuICAgICAgICAgICAgaXRlbUZvcm1JZDogKF9hID0gZXZlbnQucHJvZHVjZUl0ZW0pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGluZ3JlZGllbnROYW1lOiAoX2IgPSBldmVudC5wcm9kdWNlSXRlbSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldE5hbWUoKVxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcIml0ZW1IYXJ2ZXN0ZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiaXRlbUhhcnZlc3RlZDogXCIuY29uY2F0KChfYyA9IGxhc3RJdGVtSGFydmVzdGVkLmluZ3JlZGllbnROYW1lKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiBTdHJpbmcobGFzdEl0ZW1IYXJ2ZXN0ZWQuaXRlbUZvcm1JZCkpKTtcbiAgICB9KTtcbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gXCIuLi9jb25maWdcIjtcbmltcG9ydCB7IGNvbGxlY3ROZWFyYnlOcGNzIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9uZWFyYnktY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0UGxheWVyRnVsbFN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9wbGF5ZXItY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0TG9jYXRpb25TdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbG9jYXRpb24tY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0UXVlc3RTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvcXVlc3QtY29sbGVjdG9yXCI7XG5pbXBvcnQgeyBjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0IH0gZnJvbSBcIi4vY29sbGVjdG9ycy9jcm9zc2hhaXItY29sbGVjdG9yXCI7XG5mdW5jdGlvbiBjb2xsZWN0UGxheWVyU3RhdGUoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGhlYWx0aDogcGxheWVyLmdldEFjdG9yVmFsdWUoXCJoZWFsdGhcIiksXG4gICAgICAgIG1heEhlYWx0aDogcGxheWVyLmdldEJhc2VBY3RvclZhbHVlKFwiaGVhbHRoXCIpLFxuICAgICAgICBtYWdpY2thOiBwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIm1hZ2lja2FcIiksXG4gICAgICAgIHN0YW1pbmE6IHBsYXllci5nZXRBY3RvclZhbHVlKFwic3RhbWluYVwiKSxcbiAgICAgICAgbGV2ZWw6IHBsYXllci5nZXRMZXZlbCgpLFxuICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgeDogcGxheWVyLmdldFBvc2l0aW9uWCgpLFxuICAgICAgICAgICAgeTogcGxheWVyLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgICAgICB9LFxuICAgICAgICBpc1NuZWFraW5nOiBwbGF5ZXIuaXNTbmVha2luZygpLFxuICAgICAgICBpc0RlYWQ6IHBsYXllci5pc0RlYWQoKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gZW5lbWllc0Zyb21OZWFyYnkobnBjcykge1xuICAgIHJldHVybiBucGNzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG5wYykgeyByZXR1cm4gIW5wYy5pc0RlYWQgJiYgbnBjLmlzSG9zdGlsZTsgfSlcbiAgICAgICAgLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlOyB9KVxuICAgICAgICAuc2xpY2UoMCwgQ09ORklHLm1heEVuZW1pZXMpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG5wYykgeyByZXR1cm4gKHtcbiAgICAgICAgZm9ybUlkOiBucGMuZm9ybUlkLFxuICAgICAgICBuYW1lOiBucGMubmFtZSxcbiAgICAgICAgZGlzdGFuY2U6IG5wYy5kaXN0YW5jZSxcbiAgICAgICAgaGVhbHRoOiBucGMuaGVhbHRoLFxuICAgICAgICBsZXZlbDogbnBjLmxldmVsLFxuICAgIH0pOyB9KTtcbn1cbmZ1bmN0aW9uIHNhZmVDYWxsKGZuKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGZuKCk7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4vKipcbiAqIE9uZSBjb2xsZWN0aW9uIHBhc3MgcGVyIHNlbmQ6IHByb3RvY29sLXYxIHBheWxvYWQgKHJlZmxleCArIGRhc2hib2FyZCkgYW5kXG4gKiB0aGUgcmljaCBzbmFwc2hvdCAoR2F0ZS9Db21wb3NlciBtb2QtY29udGV4dCBkdW1wKSBzaGFyZSB0aGUgbmVhcmJ5LU5QQyBzY2FuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEJ1bmRsZShwbGF5ZXJBbmltYXRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBfYSwgX2IsIF9jO1xuICAgIGlmIChwbGF5ZXJBbmltYXRpb24gPT09IHZvaWQgMCkgeyBwbGF5ZXJBbmltYXRpb24gPSBcIlwiOyB9XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gdm9pZCAwKSB7IGV2ZW50VHlwZSA9IFwidGlja1wiOyB9XG4gICAgdmFyIHBsYXllciA9IGNvbGxlY3RQbGF5ZXJTdGF0ZSgpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB2YXIgbmVhcmJ5TnBjcyA9IChfYSA9IHNhZmVDYWxsKGNvbGxlY3ROZWFyYnlOcGNzKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogW107XG4gICAgdmFyIGNvbWJhdFN0YXRlID0gKF9jID0gKF9iID0gR2FtZS5nZXRQbGF5ZXIoKSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldENvbWJhdFN0YXRlKCkpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvdG9jb2w6IHtcbiAgICAgICAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgICAgICAgY29tYmF0U3RhdGU6IGNvbWJhdFN0YXRlLFxuICAgICAgICAgICAgZW5lbWllczogZW5lbWllc0Zyb21OZWFyYnkobmVhcmJ5TnBjcyksXG4gICAgICAgICAgICBwbGF5ZXJBbmltYXRpb246IHBsYXllckFuaW1hdGlvbixcbiAgICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnRUeXBlLFxuICAgICAgICB9LFxuICAgICAgICBzbmFwc2hvdDoge1xuICAgICAgICAgICAgcGxheWVyOiBzYWZlQ2FsbChjb2xsZWN0UGxheWVyRnVsbFN0YXRlKSxcbiAgICAgICAgICAgIG5lYXJieU5wY3M6IG5lYXJieU5wY3MsXG4gICAgICAgICAgICBjcm9zc2hhaXJUYXJnZXQ6IHNhZmVDYWxsKGNvbGxlY3RDcm9zc2hhaXJUYXJnZXQpLFxuICAgICAgICAgICAgbG9jYXRpb246IHNhZmVDYWxsKGNvbGxlY3RMb2NhdGlvblN0YXRlKSxcbiAgICAgICAgICAgIHF1ZXN0OiBzYWZlQ2FsbChjb2xsZWN0UXVlc3RTdGF0ZSksXG4gICAgICAgICAgICBpbnB1dDogbnVsbCxcbiAgICAgICAgICAgIG1lbnU6IG51bGwsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDogbnVsbCxcbiAgICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnRUeXBlLFxuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEZ1bGxTdGF0ZShwbGF5ZXJBbmltYXRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgaWYgKHBsYXllckFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IHBsYXllckFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICBpZiAoZXZlbnRUeXBlID09PSB2b2lkIDApIHsgZXZlbnRUeXBlID0gXCJ0aWNrXCI7IH1cbiAgICByZXR1cm4gKF9iID0gKF9hID0gY29sbGVjdEJ1bmRsZShwbGF5ZXJBbmltYXRpb24sIGV2ZW50VHlwZSkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5wcm90b2NvbCkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbDtcbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ1wiO1xudmFyIEZPUk1fVFlQRV9OQU1FUyA9IHtcbiAgICAyNDogXCJBY3RpdmF0b3JcIixcbiAgICAyNjogXCJGbG9yYVwiLFxuICAgIDI3OiBcIktleVwiLFxuICAgIDI4OiBcIkNvbnRhaW5lclwiLFxuICAgIDI5OiBcIkRvb3JcIixcbiAgICA0MDogXCJGdXJuaXR1cmVcIixcbiAgICA0MTogXCJJbmdyZWRpZW50XCIsXG4gICAgNDI6IFwiQXBwYXJhdHVzXCIsXG4gICAgNjI6IFwiTlBDXCIsXG59O1xuZnVuY3Rpb24gbWFwRm9ybVR5cGUodHlwZUlkKSB7XG4gICAgdmFyIF9hO1xuICAgIGlmICh0eXBlSWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIChfYSA9IEZPUk1fVFlQRV9OQU1FU1t0eXBlSWRdKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBcIkZvcm1UeXBlX1wiLmNvbmNhdCh0eXBlSWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RDcm9zc2hhaXJUYXJnZXQoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2MsIF9kO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciByZWYgPSBHYW1lLmdldEN1cnJlbnRDcm9zc2hhaXJSZWYoKTtcbiAgICAgICAgaWYgKHJlZiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZm9ybUlkID0gcmVmLmdldEZvcm1JRCgpO1xuICAgICAgICB2YXIgYmFzZU9iamVjdCA9IHJlZi5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgIHZhciB0eXBlSWQgPSBiYXNlT2JqZWN0ID09PSBudWxsIHx8IGJhc2VPYmplY3QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2VPYmplY3QuZ2V0VHlwZSgpO1xuICAgICAgICB2YXIgdHlwZSA9IG1hcEZvcm1UeXBlKHR5cGVJZCk7XG4gICAgICAgIHZhciBpc09wZW4gPSBudWxsO1xuICAgICAgICBpZiAodHlwZUlkID09PSAyOSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpc09wZW4gPSByZWYuZ2V0T3BlblN0YXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICBpc09wZW4gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gKF9iID0gKF9hID0gcmVmLmdldERpc3BsYXlOYW1lKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IGJhc2VPYmplY3QgPT09IG51bGwgfHwgYmFzZU9iamVjdCA9PT0gdm9pZCAwID8gdm9pZCAwIDogYmFzZU9iamVjdC5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IChfZCA9IChfYyA9IEdhbWUuZ2V0UGxheWVyKCkpID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5nZXREaXN0YW5jZShyZWYpKSAhPT0gbnVsbCAmJiBfZCAhPT0gdm9pZCAwID8gX2QgOiAwO1xuICAgICAgICBpZiAoZm9ybUlkID09PSBQTEFZRVJfRk9STV9JRCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgZm9ybUlkOiBmb3JtSWQsXG4gICAgICAgICAgICBkaXN0YW5jZTogZGlzdGFuY2UsXG4gICAgICAgICAgICBpc09wZW46IGlzT3BlbixcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0TG9jYXRpb25TdGF0ZSgpIHtcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZiwgX2csIF9oO1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgbG9jYXRpb25OYW1lOiBudWxsLFxuICAgICAgICBpc0ludGVyaW9yOiBmYWxzZSxcbiAgICAgICAgY2VsbE5hbWU6IG51bGwsXG4gICAgICAgIHdvcmxkc3BhY2VOYW1lOiBudWxsXG4gICAgfTtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICAgICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbG9jYXRpb25OYW1lOiAoX2IgPSAoX2EgPSBwbGF5ZXIuZ2V0Q3VycmVudExvY2F0aW9uKCkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGwsXG4gICAgICAgICAgICBpc0ludGVyaW9yOiAoX2QgPSAoX2MgPSBwbGF5ZXIuZ2V0UGFyZW50Q2VsbCgpKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuaXNJbnRlcmlvcigpKSAhPT0gbnVsbCAmJiBfZCAhPT0gdm9pZCAwID8gX2QgOiBmYWxzZSxcbiAgICAgICAgICAgIGNlbGxOYW1lOiAoX2YgPSAoX2UgPSBwbGF5ZXIuZ2V0UGFyZW50Q2VsbCgpKSA9PT0gbnVsbCB8fCBfZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2UuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfZiAhPT0gdm9pZCAwID8gX2YgOiBudWxsLFxuICAgICAgICAgICAgd29ybGRzcGFjZU5hbWU6IChfaCA9IChfZyA9IHBsYXllci5nZXRXb3JsZFNwYWNlKCkpID09PSBudWxsIHx8IF9nID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZy5nZXROYW1lKCkpICE9PSBudWxsICYmIF9oICE9PSB2b2lkIDAgPyBfaCA6IG51bGxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9qKSB7XG4gICAgICAgIHJldHVybiBkZWZhdWx0cztcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBBY3RvciwgRm9ybVR5cGUsIEdhbWUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi4vLi4vY29uZmlnXCI7XG5mdW5jdGlvbiBnZXRQbGF5ZXJQb3NpdGlvbigpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcilcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcGxheWVyLmdldFBvc2l0aW9uWCgpLFxuICAgICAgICB5OiBwbGF5ZXIuZ2V0UG9zaXRpb25ZKCksXG4gICAgICAgIHo6IHBsYXllci5nZXRQb3NpdGlvblooKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY2FsY3VsYXRlRGlzdGFuY2UoeDEsIHkxLCB6MSwgeDIsIHkyLCB6Mikge1xuICAgIHZhciBkeCA9IHgyIC0geDE7XG4gICAgdmFyIGR5ID0geTIgLSB5MTtcbiAgICB2YXIgZHogPSB6MiAtIHoxO1xuICAgIHJldHVybiBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkgKyBkeiAqIGR6KTtcbn1cbi8qKlxuICogRW51bWVyYXRlIGxvYWRlZCBhY3RvcnMgaW4gdGhlIHBsYXllcidzIGNlbGwgdmlhIENlbGwuZ2V0TnVtUmVmcy9nZXROdGhSZWZcbiAqICh2ZXJpZmllZCBBUElzIOKAlCByZXBsYWNlcyB0aGUgb2xkIDktb2Zmc2V0IGZpbmRDbG9zZXN0QWN0b3Igc2Nhbiwgd2hpY2hcbiAqIGFwcHJveGltYXRlZCBcImFsbCBuZWFyYnkgYWN0b3JzXCIgYnkgcmUtc2VhcmNoaW5nIGZyb20gb2Zmc2V0cykuXG4gKiBgRm9ybVR5cGUuQ2hhcmFjdGVyYCAoPSA2MikgZmlsdGVycyB0byBsaXZlIGFjdG9yIHJlZmVyZW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0TmVhcmJ5TnBjcygpIHtcbiAgICB2YXIgX2EsIF9iLCBfYztcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcilcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBwbGF5ZXJQb3MgPSBnZXRQbGF5ZXJQb3NpdGlvbigpO1xuICAgIGlmICghcGxheWVyUG9zKVxuICAgICAgICByZXR1cm4gW107XG4gICAgdmFyIGNlbGwgPSBwbGF5ZXIuZ2V0UGFyZW50Q2VsbCgpO1xuICAgIGlmICghY2VsbClcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciByZWZDb3VudCA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVmQ291bnQgPSAoX2EgPSBjZWxsLmdldE51bVJlZnMoNjIgLyogRm9ybVR5cGUuQ2hhcmFjdGVyICovKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMDtcbiAgICB9XG4gICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdmFyIG5lYXJieU5wY3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlZkNvdW50OyBpKyspIHtcbiAgICAgICAgaWYgKG5lYXJieU5wY3MubGVuZ3RoID49IENPTkZJRy5tYXhFbmVtaWVzKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHZhciBhY3RvclJlZiA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhY3RvclJlZiA9IGNlbGwuZ2V0TnRoUmVmKGksIDYyIC8qIEZvcm1UeXBlLkNoYXJhY3RlciAqLyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWFjdG9yUmVmKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIGdldE50aFJlZiB5aWVsZHMgT2JqZWN0UmVmZXJlbmNlOyB0aGUgZGV0YWlsIHByb2JlcyBiZWxvdyBhcmUgQWN0b3JcbiAgICAgICAgLy8gbWV0aG9kcyAoaXNIb3N0aWxlVG9BY3RvciwgaXNHdWFyZCwgLi4uKSDigJQgY2FzdCB2aWEgdGhlIHZlcmlmaWVkXG4gICAgICAgIC8vIEFjdG9yLmZyb20gaGVscGVyIChPYmplY3RSZWZlcmVuY2UgZXh0ZW5kcyBQYXB5cnVzT2JqZWN0KS5cbiAgICAgICAgdmFyIGFjdG9yID0gQWN0b3IuZnJvbShhY3RvclJlZik7XG4gICAgICAgIGlmICghYWN0b3IpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdmFyIGZvcm1JZCA9IGFjdG9yLmdldEZvcm1JRCgpO1xuICAgICAgICBpZiAoZm9ybUlkID09PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB2YXIgYWN0b3JQb3MgPSB7XG4gICAgICAgICAgICB4OiBhY3Rvci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgICAgIHk6IGFjdG9yLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICAgICAgejogYWN0b3IuZ2V0UG9zaXRpb25aKCksXG4gICAgICAgIH07XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGNhbGN1bGF0ZURpc3RhbmNlKHBsYXllclBvcy54LCBwbGF5ZXJQb3MueSwgcGxheWVyUG9zLnosIGFjdG9yUG9zLngsIGFjdG9yUG9zLnksIGFjdG9yUG9zLnopO1xuICAgICAgICB2YXIgYmFzZU9iaiA9IGFjdG9yLmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgdmFyIG5hbWUgPSAoYmFzZU9iaiA9PT0gbnVsbCB8fCBiYXNlT2JqID09PSB2b2lkIDAgPyB2b2lkIDAgOiBiYXNlT2JqLmdldE5hbWUoKSkgfHwgXCJVbmtub3duXCI7XG4gICAgICAgIHZhciBoZWFsdGggPSBhY3Rvci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpO1xuICAgICAgICB2YXIgbGV2ZWwgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV2ZWwgPSBhY3Rvci5nZXRMZXZlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfZikge1xuICAgICAgICAgICAgbGV2ZWwgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciByYWNlID0gbnVsbDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJhY2UgPSAoX2MgPSAoX2IgPSBhY3Rvci5nZXRSYWNlKCkpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXROYW1lKCkpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9nKSB7XG4gICAgICAgICAgICByYWNlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNIb3N0aWxlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBhY3Rvci5pc0hvc3RpbGVUb0FjdG9yKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgICAgICBpc0hvc3RpbGUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNBbGx5ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBhY3Rvci5pc1BsYXllclRlYW1tYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9qKSB7XG4gICAgICAgICAgICBpc0FsbHkgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNHdWFyZCA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNHdWFyZCA9IGFjdG9yLmlzR3VhcmQoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2spIHtcbiAgICAgICAgICAgIGlzR3VhcmQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNNZXJjaGFudCA9IGZhbHNlO1xuICAgICAgICB2YXIgaXNJbkRpYWxvZ3VlID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBhY3Rvci5pc0luRGlhbG9ndWVXaXRoUGxheWVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9sKSB7XG4gICAgICAgICAgICBpc0luRGlhbG9ndWUgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaGFzTE9TID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBoYXNMT1MgPSBhY3Rvci5oYXNMT1MocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX20pIHtcbiAgICAgICAgICAgIGhhc0xPUyA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gYWN0b3IuaXNEZXRlY3RlZEJ5KHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9vKSB7XG4gICAgICAgICAgICBpc0RldGVjdGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuayA9IGFjdG9yLmdldFJlbGF0aW9uc2hpcFJhbmsocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX3ApIHtcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcFJhbmsgPSAwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpc0RlYWQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzRGVhZCA9IGFjdG9yLmlzRGVhZCgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfcSkge1xuICAgICAgICAgICAgaXNEZWFkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhlYWRpbmdBbmdsZSA9IDA7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBoZWFkaW5nQW5nbGUgPSBwbGF5ZXIuZ2V0SGVhZGluZ0FuZ2xlKGFjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX3IpIHtcbiAgICAgICAgICAgIGhlYWRpbmdBbmdsZSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgbmVhcmJ5TnBjcy5wdXNoKHtcbiAgICAgICAgICAgIGZvcm1JZDogZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgIGRpc3RhbmNlOiBkaXN0YW5jZSxcbiAgICAgICAgICAgIGhlYWRpbmdBbmdsZTogaGVhZGluZ0FuZ2xlLFxuICAgICAgICAgICAgaGVhbHRoOiBoZWFsdGgsXG4gICAgICAgICAgICBsZXZlbDogbGV2ZWwsXG4gICAgICAgICAgICByYWNlOiByYWNlLFxuICAgICAgICAgICAgaXNIb3N0aWxlOiBpc0hvc3RpbGUsXG4gICAgICAgICAgICBpc0FsbHk6IGlzQWxseSxcbiAgICAgICAgICAgIGlzR3VhcmQ6IGlzR3VhcmQsXG4gICAgICAgICAgICBpc01lcmNoYW50OiBpc01lcmNoYW50LFxuICAgICAgICAgICAgaXNJbkRpYWxvZ3VlOiBpc0luRGlhbG9ndWUsXG4gICAgICAgICAgICBpc0RldGVjdGVkOiBpc0RldGVjdGVkLFxuICAgICAgICAgICAgaGFzTE9TOiBoYXNMT1MsXG4gICAgICAgICAgICByZWxhdGlvbnNoaXBSYW5rOiByZWxhdGlvbnNoaXBSYW5rLFxuICAgICAgICAgICAgaXNEZWFkOiBpc0RlYWQsXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbmVhcmJ5TnBjcztcbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmZ1bmN0aW9uIHNhZmVOdW1iZXIodmFsdWUsIGZhbGxiYWNrKSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHsgZmFsbGJhY2sgPSAwOyB9XG4gICAgcmV0dXJuIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB2b2lkIDAgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuZnVuY3Rpb24gc2FmZVN0cmluZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwID8gdmFsdWUgOiBudWxsO1xufVxuZnVuY3Rpb24gY29sbGVjdEhlYWRpbmcoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHsgYW5nbGVYOiAwLCBhbmdsZVk6IDAsIGFuZ2xlWjogMCwgaGVhZGluZ0FuZ2xlOiAwIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGFuZ2xlWDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QW5nbGVYKCkpLFxuICAgICAgICBhbmdsZVk6IHNhZmVOdW1iZXIocGxheWVyLmdldEFuZ2xlWSgpKSxcbiAgICAgICAgYW5nbGVaOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBbmdsZVooKSksXG4gICAgICAgIGhlYWRpbmdBbmdsZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0SGVhZGluZ0FuZ2xlKG51bGwpKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY29sbGVjdE1vdmVtZW50KCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBpc1J1bm5pbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTcHJpbnRpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTd2ltbWluZzogZmFsc2UsXG4gICAgICAgICAgICBpc1NuZWFraW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzT25Nb3VudDogZmFsc2UsXG4gICAgICAgICAgICBpc092ZXJFbmN1bWJlcmVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNpdFN0YXRlOiAwLFxuICAgICAgICAgICAgc2xlZXBTdGF0ZTogMCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaXNSdW5uaW5nOiBwbGF5ZXIuaXNSdW5uaW5nKCksXG4gICAgICAgIGlzU3ByaW50aW5nOiBwbGF5ZXIuaXNTcHJpbnRpbmcoKSxcbiAgICAgICAgaXNTd2ltbWluZzogcGxheWVyLmlzU3dpbW1pbmcoKSxcbiAgICAgICAgaXNTbmVha2luZzogcGxheWVyLmlzU25lYWtpbmcoKSxcbiAgICAgICAgaXNPbk1vdW50OiBwbGF5ZXIuaXNPbk1vdW50KCksXG4gICAgICAgIGlzT3ZlckVuY3VtYmVyZWQ6IHBsYXllci5pc092ZXJFbmN1bWJlcmVkKCksXG4gICAgICAgIHNpdFN0YXRlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRTaXRTdGF0ZSgpKSxcbiAgICAgICAgc2xlZXBTdGF0ZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0U2xlZXBTdGF0ZSgpKSxcbiAgICB9O1xufVxuZnVuY3Rpb24gY29sbGVjdENvbWJhdCgpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNJbkNvbWJhdDogZmFsc2UsXG4gICAgICAgICAgICBjb21iYXRUYXJnZXROYW1lOiBudWxsLFxuICAgICAgICAgICAgaXNCbG9ja2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc1dlYXBvbkRyYXduOiBmYWxzZSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGNvbWJhdFRhcmdldE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSBwbGF5ZXIuZ2V0Q29tYmF0VGFyZ2V0KCk7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgIHZhciBiYXNlID0gdGFyZ2V0LmdldEJhc2VPYmplY3QoKTtcbiAgICAgICAgICAgIGNvbWJhdFRhcmdldE5hbWUgPSBzYWZlU3RyaW5nKGJhc2UgPT09IG51bGwgfHwgYmFzZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogYmFzZS5nZXROYW1lKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICBjb21iYXRUYXJnZXROYW1lID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGlzQmxvY2tpbmcgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBpc0Jsb2NraW5nID0gcGxheWVyLmdldEFuaW1hdGlvblZhcmlhYmxlQm9vbChcIklzQmxvY2tpbmdcIik7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBpc0Jsb2NraW5nID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGlzSW5Db21iYXQ6IHBsYXllci5pc0luQ29tYmF0KCksXG4gICAgICAgIGNvbWJhdFRhcmdldE5hbWU6IGNvbWJhdFRhcmdldE5hbWUsXG4gICAgICAgIGlzQmxvY2tpbmc6IGlzQmxvY2tpbmcsXG4gICAgICAgIGlzV2VhcG9uRHJhd246IHBsYXllci5pc1dlYXBvbkRyYXduKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RFcXVpcG1lbnQoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdlYXBvbk5hbWU6IG51bGwsXG4gICAgICAgICAgICB3ZWFwb25TbG90OiAwLFxuICAgICAgICAgICAgYXJtb3JTbG90czoge30sXG4gICAgICAgICAgICBzaG91dE5hbWU6IG51bGwsXG4gICAgICAgICAgICBzcGVsbE5hbWU6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciB3ZWFwb25OYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgd2VhcG9uID0gcGxheWVyLmdldEVxdWlwcGVkV2VhcG9uKGZhbHNlKTtcbiAgICAgICAgd2VhcG9uTmFtZSA9IHNhZmVTdHJpbmcod2VhcG9uID09PSBudWxsIHx8IHdlYXBvbiA9PT0gdm9pZCAwID8gdm9pZCAwIDogd2VhcG9uLmdldE5hbWUoKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICB3ZWFwb25OYW1lID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHNob3V0TmFtZSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHNob3V0ID0gcGxheWVyLmdldEVxdWlwcGVkU2hvdXQoKTtcbiAgICAgICAgc2hvdXROYW1lID0gc2FmZVN0cmluZyhzaG91dCA9PT0gbnVsbCB8fCBzaG91dCA9PT0gdm9pZCAwID8gdm9pZCAwIDogc2hvdXQuZ2V0TmFtZSgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9iKSB7XG4gICAgICAgIHNob3V0TmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzcGVsbE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzcGVsbCA9IHBsYXllci5nZXRFcXVpcHBlZFNwZWxsKDApO1xuICAgICAgICBzcGVsbE5hbWUgPSBzYWZlU3RyaW5nKHNwZWxsID09PSBudWxsIHx8IHNwZWxsID09PSB2b2lkIDAgPyB2b2lkIDAgOiBzcGVsbC5nZXROYW1lKCkpO1xuICAgIH1cbiAgICBjYXRjaCAoX2MpIHtcbiAgICAgICAgc3BlbGxOYW1lID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgd2VhcG9uTmFtZTogd2VhcG9uTmFtZSxcbiAgICAgICAgd2VhcG9uU2xvdDogMCxcbiAgICAgICAgYXJtb3JTbG90czoge30sXG4gICAgICAgIHNob3V0TmFtZTogc2hvdXROYW1lLFxuICAgICAgICBzcGVsbE5hbWU6IHNwZWxsTmFtZSxcbiAgICB9O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RQbGF5ZXJGdWxsU3RhdGUoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIGhlYWRpbmc6IGNvbGxlY3RIZWFkaW5nKCksXG4gICAgICAgIG1vdmVtZW50OiBjb2xsZWN0TW92ZW1lbnQoKSxcbiAgICAgICAgY29tYmF0OiBjb2xsZWN0Q29tYmF0KCksXG4gICAgICAgIGVxdWlwbWVudDogY29sbGVjdEVxdWlwbWVudCgpLFxuICAgICAgICBnb2xkQW1vdW50OiBzYWZlTnVtYmVyKHBsYXllci5nZXRHb2xkQW1vdW50KCkpLFxuICAgICAgICBjYXJyeVdlaWdodDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIkNhcnJ5V2VpZ2h0XCIpKSxcbiAgICAgICAgaW52ZW50b3J5V2VpZ2h0OiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlKFwiSW52ZW50b3J5V2VpZ2h0XCIpKSxcbiAgICAgICAgbWFnaWNrYVBlcmNlbnRhZ2U6IHNhZmVOdW1iZXIocGxheWVyLmdldEFjdG9yVmFsdWVQZXJjZW50YWdlKFwibWFnaWNrYVwiKSksXG4gICAgICAgIHN0YW1pbmFQZXJjZW50YWdlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlUGVyY2VudGFnZShcInN0YW1pbmFcIikpLFxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdFF1ZXN0U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcXVlc3QgPSBHYW1lLmdldFF1ZXN0KFwiTVExMDFcIik7XG4gICAgICAgIGlmICghcXVlc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmplY3RpdmVzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDEwOyBpICs9IDEpIHtcbiAgICAgICAgICAgIHZhciBkaXNwbGF5ZWQgPSBxdWVzdC5pc09iamVjdGl2ZURpc3BsYXllZChpKTtcbiAgICAgICAgICAgIGlmICghZGlzcGxheWVkKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvYmplY3RpdmVzLnB1c2goe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgIGRpc3BsYXllZDogZGlzcGxheWVkLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlZDogcXVlc3QuaXNPYmplY3RpdmVDb21wbGV0ZWQoaSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBxdWVzdFdpdGhFZGl0b3JJZCA9IHF1ZXN0O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcXVlc3ROYW1lOiAoX2EgPSBxdWVzdC5nZXROYW1lKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IG51bGwsXG4gICAgICAgICAgICBlZGl0b3JJZDogdHlwZW9mIHF1ZXN0V2l0aEVkaXRvcklkLmdldEVkaXRvcklkID09PSBcImZ1bmN0aW9uXCIgPyAoX2IgPSBxdWVzdFdpdGhFZGl0b3JJZC5nZXRFZGl0b3JJZCgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsIDogbnVsbCxcbiAgICAgICAgICAgIGN1cnJlbnRTdGFnZTogcXVlc3QuZ2V0Q3VycmVudFN0YWdlSUQoKSxcbiAgICAgICAgICAgIG9iamVjdGl2ZXM6IG9iamVjdGl2ZXNcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsIi8qKlxuICogUGFyYWxsZWwtYXJyYXkgZHVtcCBtYXRjaGluZyBza3lkaXZlLWFwcCBgcGFyc2VTa3lyaW1TdGF0ZWBcbiAqIChgc2VydmVyL3V0aWxzL3NreXJpbS1zdGF0ZS1wYXJzZXIudHNgKS4gVGhlIEdhdGUvQ29tcG9zZXIgcmVhZCB0aGlzIHZpYVxuICogU2t5cmltRmlsZUNvbm5lY3RvciDigJQgdGhleSBkbyBOT1Qgc2VlIHRoZSBIVFRQIHByb3RvY29sLXYxIHBheWxvYWQuXG4gKlxuICogRGlzdGFuY2UgY29udmVyc2lvbjogNzAgU2t5cmltIHVuaXRzIOKJiCAxIG1ldGVyIChjb21tdW5pdHkgY29udmVudGlvbikuXG4gKi9cbnZhciBVTklUU19QRVJfTUVURVIgPSA3MDtcbnZhciBPQlNUQUNMRV9GUk9OVF9VTklUUyA9IDE1MDtcbmZ1bmN0aW9uIGNvbXBhc3NGcm9tQW5nbGVaKGFuZ2xlWikge1xuICAgIHZhciBkaXJzID0gW1xuICAgICAgICBcIk5vcmRcIixcbiAgICAgICAgXCJOb3JkLUVzdFwiLFxuICAgICAgICBcIkVzdFwiLFxuICAgICAgICBcIlN1ZC1Fc3RcIixcbiAgICAgICAgXCJTdWRcIixcbiAgICAgICAgXCJTdWQtT3Vlc3RcIixcbiAgICAgICAgXCJPdWVzdFwiLFxuICAgICAgICBcIk5vcmQtT3Vlc3RcIixcbiAgICBdO1xuICAgIHZhciBub3JtYWxpemVkID0gKChhbmdsZVogJSAzNjApICsgMzYwKSAlIDM2MDtcbiAgICByZXR1cm4gZGlyc1tNYXRoLnJvdW5kKG5vcm1hbGl6ZWQgLyA0NSkgJSA4XTtcbn1cbmZ1bmN0aW9uIGNsb2NrRnJvbUhlYWRpbmdBbmdsZShoZWFkaW5nQW5nbGUpIHtcbiAgICB2YXIgbm9ybWFsaXplZCA9ICgoaGVhZGluZ0FuZ2xlICUgMzYwKSArIDM2MCkgJSAzNjA7XG4gICAgdmFyIGhvdXIgPSBNYXRoLnJvdW5kKG5vcm1hbGl6ZWQgLyAzMCkgJSAxMjtcbiAgICByZXR1cm4gXCJcIi5jb25jYXQoaG91ciA9PT0gMCA/IDEyIDogaG91ciwgXCJoXCIpO1xufVxuZnVuY3Rpb24gZmxhZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA/IDEgOiAwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTW9kQ29udGV4dChzbmFwc2hvdCwgcHJvdG9jb2wpIHtcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZiwgX2csIF9oLCBfajtcbiAgICB2YXIgZmxvYXRzID0ge1xuICAgICAgICBcInBsYXllci5oZWFsdGhcIjogcHJvdG9jb2wucGxheWVyLmhlYWx0aCxcbiAgICAgICAgXCJwbGF5ZXIuaGVhbHRoX21heFwiOiBwcm90b2NvbC5wbGF5ZXIubWF4SGVhbHRoLFxuICAgICAgICBcInBsYXllci5tYWdpY2thXCI6IHByb3RvY29sLnBsYXllci5tYWdpY2thLFxuICAgICAgICBcInBsYXllci5zdGFtaW5hXCI6IHByb3RvY29sLnBsYXllci5zdGFtaW5hLFxuICAgIH07XG4gICAgdmFyIGludHMgPSB7XG4gICAgICAgIFwicGxheWVyLmlzX2luX2ludGVyaW9yXCI6IGZsYWcoKF9hID0gc25hcHNob3QubG9jYXRpb24pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5pc0ludGVyaW9yKSxcbiAgICAgICAgXCJwbGF5ZXIuaW5fY29tYmF0XCI6IGZsYWcocHJvdG9jb2wuY29tYmF0U3RhdGUgPiAwIHx8ICgoX2IgPSBzbmFwc2hvdC5wbGF5ZXIpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jb21iYXQuaXNJbkNvbWJhdCkpLFxuICAgICAgICBcInBsYXllci5pbl9kaWFsb2d1ZVwiOiBmbGFnKHNuYXBzaG90Lm5lYXJieU5wY3Muc29tZShmdW5jdGlvbiAobikgeyByZXR1cm4gbi5pc0luRGlhbG9ndWU7IH0pKSxcbiAgICAgICAgXCJwbGF5ZXIuaXNfcnVubmluZ1wiOiBmbGFnKChfYyA9IHNuYXBzaG90LnBsYXllcikgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLm1vdmVtZW50LmlzUnVubmluZyksXG4gICAgICAgIFwicGxheWVyLmlzX3NuZWFraW5nXCI6IGZsYWcocHJvdG9jb2wucGxheWVyLmlzU25lYWtpbmcgfHwgKChfZCA9IHNuYXBzaG90LnBsYXllcikgPT09IG51bGwgfHwgX2QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9kLm1vdmVtZW50LmlzU25lYWtpbmcpKSxcbiAgICAgICAgXCJwbGF5ZXIuaXNfc3dpbW1pbmdcIjogZmxhZygoX2UgPSBzbmFwc2hvdC5wbGF5ZXIpID09PSBudWxsIHx8IF9lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZS5tb3ZlbWVudC5pc1N3aW1taW5nKSxcbiAgICAgICAgXCJwbGF5ZXIuaXNfd2VhcG9uX2RyYXduXCI6IGZsYWcoKF9mID0gc25hcHNob3QucGxheWVyKSA9PT0gbnVsbCB8fCBfZiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2YuY29tYmF0LmlzV2VhcG9uRHJhd24pLFxuICAgICAgICBcInBsYXllci5pc19zdHVja1wiOiAwLFxuICAgICAgICBcInBsYXllci5vYnN0YWNsZV9mcm9udFwiOiBmbGFnKHNuYXBzaG90LmNyb3NzaGFpclRhcmdldCAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgc25hcHNob3QuY3Jvc3NoYWlyVGFyZ2V0LmRpc3RhbmNlIDw9IE9CU1RBQ0xFX0ZST05UX1VOSVRTICYmXG4gICAgICAgICAgICBzbmFwc2hvdC5jcm9zc2hhaXJUYXJnZXQudHlwZSAhPT0gXCJOUENcIiksXG4gICAgfTtcbiAgICB2YXIgc3RyaW5ncyA9IHt9O1xuICAgIHZhciBsb2NhdGlvbk5hbWUgPSAoKF9nID0gc25hcHNob3QubG9jYXRpb24pID09PSBudWxsIHx8IF9nID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZy5sb2NhdGlvbk5hbWUpIHx8ICgoX2ggPSBzbmFwc2hvdC5sb2NhdGlvbikgPT09IG51bGwgfHwgX2ggPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9oLmNlbGxOYW1lKTtcbiAgICBpZiAobG9jYXRpb25OYW1lKVxuICAgICAgICBzdHJpbmdzW1wicGxheWVyLmxvY2F0aW9uXCJdID0gbG9jYXRpb25OYW1lO1xuICAgIGlmIChzbmFwc2hvdC5wbGF5ZXIpIHtcbiAgICAgICAgc3RyaW5nc1tcInBsYXllci5jb21wYXNzXCJdID0gY29tcGFzc0Zyb21BbmdsZVooc25hcHNob3QucGxheWVyLmhlYWRpbmcuYW5nbGVaKTtcbiAgICB9XG4gICAgaWYgKChfaiA9IHNuYXBzaG90LnF1ZXN0KSA9PT0gbnVsbCB8fCBfaiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2oucXVlc3ROYW1lKVxuICAgICAgICBzdHJpbmdzW1wicXVlc3RfYWN0aXZlXCJdID0gc25hcHNob3QucXVlc3QucXVlc3ROYW1lO1xuICAgIHZhciBsaXZpbmcgPSBzbmFwc2hvdC5uZWFyYnlOcGNzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG5wYykgeyByZXR1cm4gIW5wYy5pc0RlYWQ7IH0pXG4gICAgICAgIC5zbGljZSgpXG4gICAgICAgIC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZTsgfSk7XG4gICAgdmFyIGhvc3RpbGVzID0gbGl2aW5nLmZpbHRlcihmdW5jdGlvbiAobnBjKSB7IHJldHVybiBucGMuaXNIb3N0aWxlOyB9KTtcbiAgICBpbnRzW1wiZW5lbWllcy5jb3VudFwiXSA9IGhvc3RpbGVzLmxlbmd0aDtcbiAgICBpbnRzW1wibnBjcy5jb3VudFwiXSA9IGxpdmluZy5sZW5ndGg7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmxvYXQ6IGZsb2F0cyxcbiAgICAgICAgaW50OiBpbnRzLFxuICAgICAgICBzdHJpbmc6IHN0cmluZ3MsXG4gICAgICAgIGZsb2F0TGlzdDoge1xuICAgICAgICAgICAgXCJucGNzLmRpc3RhbmNlX21cIjogbGl2aW5nLm1hcChmdW5jdGlvbiAobnBjKSB7IHJldHVybiBucGMuZGlzdGFuY2UgLyBVTklUU19QRVJfTUVURVI7IH0pLFxuICAgICAgICB9LFxuICAgICAgICBzdHJpbmdMaXN0OiB7XG4gICAgICAgICAgICBcIm5wY3MubmFtZVwiOiBsaXZpbmcubWFwKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuIG5wYy5uYW1lOyB9KSxcbiAgICAgICAgICAgIFwibnBjcy5jbG9ja1wiOiBsaXZpbmcubWFwKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuIGNsb2NrRnJvbUhlYWRpbmdBbmdsZShucGMuaGVhZGluZ0FuZ2xlKTsgfSksXG4gICAgICAgIH0sXG4gICAgfTtcbn1cbiIsInZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5mdW5jdGlvbiBub3JtYWxpemVFdmVudFR5cGUoZXZlbnRUeXBlKSB7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gXCJoaXRcIilcbiAgICAgICAgcmV0dXJuIFwiaGl0XCI7XG4gICAgaWYgKGV2ZW50VHlwZSA9PT0gXCJ0aWNrXCIpXG4gICAgICAgIHJldHVybiBcInRpY2tcIjtcbiAgICBpZiAoZXZlbnRUeXBlLnN0YXJ0c1dpdGgoXCJjb21iYXRTdGF0ZVwiKSlcbiAgICAgICAgcmV0dXJuIFwiY29tYmF0U3RhdGVcIjtcbiAgICByZXR1cm4gXCJhbmltYXRpb25cIjtcbn1cbi8qKlxuICogU2luZ2xlIG91dGJvdW5kIHBheWxvYWQgZm9ybWF0OiBza3lkaXZlLWFwcCBwcm90b2NvbC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZVN0YXRlKHN0YXRlLCBwcmlvcml0eSkge1xuICAgIHZhciBwYXlsb2FkID0ge1xuICAgICAgICBwcm90b2NvbFZlcnNpb246IDEsXG4gICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgc291cmNlOiBcInNreWd1aWRlXCIsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHBsYXllcjogc3RhdGUucGxheWVyLFxuICAgICAgICAgICAgY29tYmF0U3RhdGU6IHN0YXRlLmNvbWJhdFN0YXRlLFxuICAgICAgICAgICAgZW5lbWllczogc3RhdGUuZW5lbWllcy5tYXAoZnVuY3Rpb24gKGVuZW15KSB7IHJldHVybiAoX19hc3NpZ24oX19hc3NpZ24oe30sIGVuZW15KSwgeyBhbmltYXRpb246IFwiXCIgfSkpOyB9KSxcbiAgICAgICAgICAgIHBsYXllckFuaW1hdGlvbjogc3RhdGUucGxheWVyQW5pbWF0aW9uLFxuICAgICAgICAgICAgZXZlbnRUeXBlOiBub3JtYWxpemVFdmVudFR5cGUoc3RhdGUuZXZlbnRUeXBlKVxuICAgICAgICB9LFxuICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KClcbiAgICB9O1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbn1cbiIsInZhciBydW50aW1lID0gZ2xvYmFsVGhpcztcbmlmICghcnVudGltZS5za3lyaW1QbGF0Zm9ybSkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2t5cmltUGxhdGZvcm0gZ2xvYmFsIGlzIG5vdCBhdmFpbGFibGUnKTtcbn1cbnZhciBza3lyaW1QbGF0Zm9ybSA9IHJ1bnRpbWUuc2t5cmltUGxhdGZvcm07XG5leHBvcnQgdmFyIG9uY2UgPSBza3lyaW1QbGF0Zm9ybS5vbmNlLCBvbiA9IHNreXJpbVBsYXRmb3JtLm9uLCBwcmludENvbnNvbGUgPSBza3lyaW1QbGF0Zm9ybS5wcmludENvbnNvbGUsIERlYnVnID0gc2t5cmltUGxhdGZvcm0uRGVidWcsIGhvb2tzID0gc2t5cmltUGxhdGZvcm0uaG9va3MsIGZpbmRDb25zb2xlQ29tbWFuZCA9IHNreXJpbVBsYXRmb3JtLmZpbmRDb25zb2xlQ29tbWFuZCwgT2JqZWN0UmVmZXJlbmNlID0gc2t5cmltUGxhdGZvcm0uT2JqZWN0UmVmZXJlbmNlLCBBY3RvciA9IHNreXJpbVBsYXRmb3JtLkFjdG9yLCBIdHRwQ2xpZW50ID0gc2t5cmltUGxhdGZvcm0uSHR0cENsaWVudCwgVWkgPSBza3lyaW1QbGF0Zm9ybS5VaSwgR2FtZSA9IHNreXJpbVBsYXRmb3JtLkdhbWUsIElucHV0ID0gc2t5cmltUGxhdGZvcm0uSW5wdXQsIER4U2NhbkNvZGUgPSBza3lyaW1QbGF0Zm9ybS5EeFNjYW5Db2RlLCBGb3JtVHlwZSA9IHNreXJpbVBsYXRmb3JtLkZvcm1UeXBlLCBVdGlsaXR5ID0gc2t5cmltUGxhdGZvcm0uVXRpbGl0eSwgV2VhdGhlciA9IHNreXJpbVBsYXRmb3JtLldlYXRoZXIsIGJyb3dzZXIgPSBza3lyaW1QbGF0Zm9ybS5icm93c2VyLCBnZXRQbGF0Zm9ybVZlcnNpb24gPSBza3lyaW1QbGF0Zm9ybS5nZXRQbGF0Zm9ybVZlcnNpb247XG5leHBvcnQgZGVmYXVsdCBza3lyaW1QbGF0Zm9ybTtcbiIsImltcG9ydCB7IG9uLCBwcmludENvbnNvbGUgfSBmcm9tIFwiLi9za3lyaW1QbGF0Zm9ybVwiO1xudmFyIHRpbWVycyA9IG5ldyBNYXAoKTtcbnZhciBuZXh0VGltZXJJZCA9IDE7XG52YXIgbGFzdEZyYW1lQXQgPSAwO1xudmFyIHB1bXBJbnN0YWxsZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIHB1bXAoKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSBsYXN0RnJhbWVBdCA9PT0gMCA/IDAgOiBub3cgLSBsYXN0RnJhbWVBdDtcbiAgICBsYXN0RnJhbWVBdCA9IG5vdztcbiAgICBpZiAodGltZXJzLnNpemUgPT09IDApXG4gICAgICAgIHJldHVybjtcbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gQXJyYXkuZnJvbSh0aW1lcnMudmFsdWVzKCkpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgdGltZXIgPSBfYVtfaV07XG4gICAgICAgIHRpbWVyLnJlbWFpbmluZ01zIC09IGVsYXBzZWQ7XG4gICAgICAgIGlmICh0aW1lci5yZW1haW5pbmdNcyA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRpbWVyLmludGVydmFsTXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFJlLWFybSBmaXJzdCBzbyB0aGUgY2FsbGJhY2sgY2FuIGNsZWFyL3JlcGxhY2UgaXRzZWxmIHNhZmVseS5cbiAgICAgICAgICAgIHRpbWVyLnJlbWFpbmluZ01zID0gdGltZXIuaW50ZXJ2YWxNcztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGltZXIuY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAvLyBOZXZlciBsZXQgb25lIHRpbWVyIGJyZWFrIHRoZSBwdW1wOyB1cGRhdGUgaGFuZGxlcnMgcnVuIGV2ZXJ5IGZyYW1lLlxuICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gZ2FtZS10aW1lciBjYWxsYmFjayBmYWlsZWQ6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGltZXJzLmRlbGV0ZSh0aW1lci5pZCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aW1lci5jYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gZ2FtZS10aW1lciBjYWxsYmFjayBmYWlsZWQ6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zdGFsbFB1bXAoKSB7XG4gICAgaWYgKHB1bXBJbnN0YWxsZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBwdW1wSW5zdGFsbGVkID0gdHJ1ZTtcbiAgICBvbihcInVwZGF0ZVwiLCBwdW1wKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRHYW1lVGltZW91dChjYWxsYmFjaywgdGltZW91dE1zKSB7XG4gICAgaW5zdGFsbFB1bXAoKTtcbiAgICB2YXIgaWQgPSBuZXh0VGltZXJJZCsrO1xuICAgIHRpbWVycy5zZXQoaWQsIHtcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBjYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgIHJlbWFpbmluZ01zOiBNYXRoLm1heCgwLCB0aW1lb3V0TXMpLFxuICAgICAgICBpbnRlcnZhbE1zOiBudWxsLFxuICAgIH0pO1xuICAgIHJldHVybiBpZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRHYW1lSW50ZXJ2YWwoY2FsbGJhY2ssIGludGVydmFsTXMpIHtcbiAgICBpbnN0YWxsUHVtcCgpO1xuICAgIHZhciBpZCA9IG5leHRUaW1lcklkKys7XG4gICAgdGltZXJzLnNldChpZCwge1xuICAgICAgICBpZDogaWQsXG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgcmVtYWluaW5nTXM6IE1hdGgubWF4KDAsIGludGVydmFsTXMpLFxuICAgICAgICBpbnRlcnZhbE1zOiBNYXRoLm1heCgwLCBpbnRlcnZhbE1zKSxcbiAgICB9KTtcbiAgICByZXR1cm4gaWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gY2xlYXJHYW1lVGltZW91dChpZCkge1xuICAgIHRpbWVycy5kZWxldGUoaWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyR2FtZUludGVydmFsKGlkKSB7XG4gICAgdGltZXJzLmRlbGV0ZShpZCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJmc1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHNreXJpbVBsYXRmb3JtOyIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IG9uY2UsIG9uLCBwcmludENvbnNvbGUsIGhvb2tzLCBmaW5kQ29uc29sZUNvbW1hbmQsIFV0aWxpdHkgfSBmcm9tIFwiLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgcmVnaXN0ZXJBbGxFdmVudHMgfSBmcm9tIFwiLi9ldmVudHNcIjtcbmltcG9ydCB7IHN0YXJ0UG9sbGluZyB9IGZyb20gXCIuL2FjdGlvbnMvcG9sbGluZ1wiO1xuaW1wb3J0IHsgZXZhbHVhdGVQcmlvcml0eSwgc2hvdWxkU2VuZCwgcmVjb3JkU2VudFN0YXRlIH0gZnJvbSBcIi4vYXJiaXRyYXRpb24vcHJpb3JpdHlcIjtcbmltcG9ydCB7IHNlcmlhbGl6ZVN0YXRlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9zZXJpYWxpemVyXCI7XG5pbXBvcnQgeyBjb2xsZWN0QnVuZGxlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGJ1aWxkTW9kQ29udGV4dCB9IGZyb20gXCIuL2dhbWUtc3RhdGUvbW9kLWNvbnRleHRcIjtcbmltcG9ydCB7IGR1bXBNb2RDb250ZXh0IH0gZnJvbSBcIi4vY29tbXVuaWNhdGlvbi9maWxlLWR1bXBcIjtcbmltcG9ydCB7IHNlbmRHYW1lU3RhdGUsIGlzQ29ubmVjdGVkIH0gZnJvbSBcIi4vY29tbXVuaWNhdGlvbi9odHRwLWNsaWVudFwiO1xuaW1wb3J0IHsgaW5pdEJyaWRnZSwgaXNDb21wYW5pb25SZWFkeSwgaGVhcnRiZWF0QWdlTXMsIGlzT3ZlcmxheVZpc2libGUsIH0gZnJvbSBcIi4vYnJpZGdlXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4vY29uZmlnXCI7XG5pbXBvcnQgeyBnZXRQbGF0Zm9ybVZlcnNpb24gfSBmcm9tIFwiLi9za3lyaW1QbGF0Zm9ybVwiO1xudmFyIGxhc3RUaWNrVGltZSA9IDA7XG52YXIgcGxheWVyQW5pbWF0aW9uID0gXCJcIjtcbnZhciBldmVudHNSZWdpc3RlcmVkID0gZmFsc2U7XG52YXIgcG9sbGluZ1N0YXJ0ZWQgPSBmYWxzZTtcbnZhciBsYXN0Q29tYmF0U3RhdGUgPSAwO1xudmFyIENPTExFQ1RPUlNfQ09VTlQgPSA4O1xuLyoqXG4gKiBmaW5kQ29uc29sZUNvbW1hbmQgb25seSByZXNvbHZlcyBidWlsdC1pbiBTQ1JJUFRfRlVOQ1RJT04gZW50cmllczsgaXQgY2Fubm90IGludmVudCBuZXcgY29tbWFuZHMuXG4gKiBXZSByZXB1cnBvc2UgYW4gZXhpc3Rpbmcgc2xvdCBhbmQgcmVuYW1lIGl0IHRvIFwic2t5Z3VpZGVcIiAoc2VlIHNreW1wL2RvY3Mvc2t5cmltX3BsYXRmb3JtL2ZlYXR1cmVzLm1kKS5cbiAqL1xudmFyIEhPU1RfQ09OU09MRV9DT01NQU5EX0ZPUl9TS1lHVUlERSA9IFwiR2V0QVZJbmZvXCI7XG5mdW5jdGlvbiByZWdpc3RlclNreWd1aWRlQ29uc29sZUNvbW1hbmQoKSB7XG4gICAgdmFyIGhvc3QgPSBmaW5kQ29uc29sZUNvbW1hbmQoSE9TVF9DT05TT0xFX0NPTU1BTkRfRk9SX1NLWUdVSURFKTtcbiAgICBpZiAoIWhvc3QpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBDb25zb2xlIGhvb2sgZmFpbGVkOiBubyBcXFwiXCIuY29uY2F0KEhPU1RfQ09OU09MRV9DT01NQU5EX0ZPUl9TS1lHVUlERSwgXCJcXFwiIGNvbW1hbmQgKHVuZXhwZWN0ZWQpLlwiKSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaG9zdC5sb25nTmFtZSA9IFwic2t5Z3VpZGVcIjtcbiAgICBob3N0LnNob3J0TmFtZSA9IFwiXCI7XG4gICAgaG9zdC5udW1BcmdzID0gMDtcbiAgICBob3N0LmV4ZWN1dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlNreUd1aWRlIFN0YXR1czpcIik7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgUGxhdGZvcm0gdmVyc2lvbjogXCIuY29uY2F0KGdldFBsYXRmb3JtVmVyc2lvbigpKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgQ29ubmVjdGVkOiBcIi5jb25jYXQoaXNDb25uZWN0ZWQoKSkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFBvbGxpbmcgc3RhdHVzOiBcIi5jb25jYXQocG9sbGluZ1N0YXJ0ZWQgPyBcImFjdGl2ZVwiIDogXCJpbmFjdGl2ZVwiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgRXZlbnRzIHJlZ2lzdGVyZWQ6IFwiLmNvbmNhdChldmVudHNSZWdpc3RlcmVkID8gXCJ5ZXNcIiA6IFwibm9cIikpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIENvbGxlY3RvcnMgY291bnQ6IFwiLmNvbmNhdChDT0xMRUNUT1JTX0NPVU5UKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgU2VydmVyOiBcIi5jb25jYXQoQ09ORklHLnNlcnZlclVybCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFNlbmQgaW50ZXJ2YWw6IFwiLmNvbmNhdChDT05GSUcudGlja0ludGVydmFsLCBcIm1zIChvbiB1cGRhdGUpXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBEZWJ1ZyBtb2RlOiBcIi5jb25jYXQoQ09ORklHLmRlYnVnTW9kZSkpO1xuICAgICAgICB2YXIgaGVhcnRiZWF0ID0gaGVhcnRiZWF0QWdlTXMoKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb21wYW5pb24gYnJpZGdlOiBcIi5jb25jYXQoaXNDb21wYW5pb25SZWFkeSgpID8gXCJyZWFkeSAoaGVhcnRiZWF0IFwiLmNvbmNhdChoZWFydGJlYXQsIFwibXMgYWdvKVwiKSA6IFwibm90IHJlYWR5XCIsIFwiLCBvdmVybGF5IFwiKS5jb25jYXQoaXNPdmVybGF5VmlzaWJsZSgpID8gXCJ2aXNpYmxlXCIgOiBcImhpZGRlblwiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgQ29tcGFuaW9uIFVSTDogXCIuY29uY2F0KENPTkZJRy5jb21wYW5pb25VcmwpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBNb2QtY29udGV4dCBkdW1wOiBcIi5jb25jYXQoQ09ORklHLm1vZENvbnRleHREdW1wRW5hYmxlZCA/IENPTkZJRy5tb2RDb250ZXh0UGF0aCA6IFwib2ZmXCIpKTtcbiAgICAgICAgLy8gUmV0dXJuaW5nIGZhbHNlIGF2b2lkcyBydW5uaW5nIHRoZSBvcmlnaW5hbCBob3N0IGNvbW1hbmQgaW1wbGVtZW50YXRpb24uXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gQ29uc29sZTogflwiLmNvbmNhdChIT1NUX0NPTlNPTEVfQ09NTUFORF9GT1JfU0tZR1VJREUsIFwiIGlzIG5vdyB+c2t5Z3VpZGVcIikpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHByb2Nlc3NBbmRTZW5kKGV2ZW50VHlwZSwgYW5pbWF0aW9uKSB7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICB2YXIgYnVuZGxlID0gY29sbGVjdEJ1bmRsZShhbmltYXRpb24sIGV2ZW50VHlwZSk7XG4gICAgaWYgKCFidW5kbGUpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gY29sbGVjdEJ1bmRsZSByZXR1cm5lZCBudWxsOyBza2lwIHNlbmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBidW5kbGUucHJvdG9jb2w7XG4gICAgdHJ5IHtcbiAgICAgICAgZHVtcE1vZENvbnRleHQoYnVpbGRNb2RDb250ZXh0KGJ1bmRsZS5zbmFwc2hvdCwgc3RhdGUpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBtb2QtY29udGV4dCBkdW1wIHRocmV3OiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcHJpb3JpdHkgPSBldmFsdWF0ZVByaW9yaXR5KHN0YXRlKTtcbiAgICBpZiAoIXNob3VsZFNlbmQocHJpb3JpdHksIHN0YXRlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBwYXlsb2FkID0gc2VyaWFsaXplU3RhdGUoc3RhdGUsIHByaW9yaXR5KTtcbiAgICBzZW5kR2FtZVN0YXRlKHBheWxvYWQpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChzZW50KSB7XG4gICAgICAgIGlmIChzZW50KSB7XG4gICAgICAgICAgICByZWNvcmRTZW50U3RhdGUoc3RhdGUpO1xuICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJTZW50IHN0YXRlOiBcIi5jb25jYXQocHJpb3JpdHksIFwiIHByaW9yaXR5IChcIikuY29uY2F0KGV2ZW50VHlwZSwgXCIpXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEZhaWxlZCB0byBzZW5kIGdhbWUgc3RhdGU6IFwiLmNvbmNhdChtc2cpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gc2FmZVByb2Nlc3NBbmRTZW5kKGV2ZW50VHlwZSwgYW5pbWF0aW9uKSB7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICB0cnkge1xuICAgICAgICBwcm9jZXNzQW5kU2VuZChldmVudFR5cGUsIGFuaW1hdGlvbik7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gcHJvY2Vzc0FuZFNlbmQgZmFpbGVkIChcIi5jb25jYXQoZXZlbnRUeXBlLCBcIik6IFwiKS5jb25jYXQobXNnKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG52YXIgaXNMb2FkZWQgPSBmYWxzZTtcbi8qKlxuICogQWNjZXNzaWJpbGl0eSBRb0wgc3dpdGNoZXMgKHZlcmlmaWVkIEFQSXMsIHBhdHRlcm5zIGZyb20gc2t5bXA1LWNsaWVudCk6XG4gKiAgLSBiQWx3YXlzQWN0aXZlOiB0aGUgZ2FtZSBrZWVwcyBzaW11bGF0aW5nIHdoaWxlIHVuZm9jdXNlZC9hbHQtdGFiYmVkIOKAlFxuICogICAgY3JpdGljYWwgZm9yIGJsaW5kIHBsYXllcnMgd2hvIG11c3QgbGVhdmUgdGhlIHdpbmRvdyBmb3Igb3RoZXIgdG9vbHMuXG4gKiAgLSBmQXV0b1Zhbml0eU1vZGVEZWxheTogc3VwcHJlc3MgdGhlIGF1dG8tcm90YXRpbmcgdmFuaXR5IGNhbWVyYSAoMzYwMHMpLlxuICovXG5mdW5jdGlvbiBhcHBseUdhbWVRb2xTZXR0aW5ncygpIHtcbiAgICB0cnkge1xuICAgICAgICBVdGlsaXR5LnNldElOSUJvb2woXCJiQWx3YXlzQWN0aXZlOkdlbmVyYWxcIiwgdHJ1ZSk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBiQWx3YXlzQWN0aXZlIElOSSBzZXQgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgVXRpbGl0eS5zZXRJTklGbG9hdChcImZBdXRvVmFuaXR5TW9kZURlbGF5OkNhbWVyYVwiLCAzNjAwKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIHZhbml0eSBtb2RlIElOSSBzZXQgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGlmIChpc0xvYWRlZClcbiAgICAgICAgcmV0dXJuO1xuICAgIHByaW50Q29uc29sZShcIlNreUd1aWRlIHBsdWdpbiBsb2FkZWQhXCIpO1xuICAgIGFwcGx5R2FtZVFvbFNldHRpbmdzKCk7XG4gICAgcmVnaXN0ZXJBbGxFdmVudHMoKTtcbiAgICBldmVudHNSZWdpc3RlcmVkID0gdHJ1ZTtcbiAgICBzdGFydFBvbGxpbmcoKTtcbiAgICBwb2xsaW5nU3RhcnRlZCA9IENPTkZJRy5wb2xsaW5nRW5hYmxlZDtcbiAgICBpbml0QnJpZGdlKCk7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VydmVyOiBcIi5jb25jYXQoQ09ORklHLnNlcnZlclVybCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJTZW5kIGludGVydmFsOiBcIi5jb25jYXQoQ09ORklHLnRpY2tJbnRlcnZhbCwgXCJtcyAob24gdXBkYXRlKVwiKSk7XG4gICAgfVxuICAgIC8vIFJlZ2lzdGVyIGJlZm9yZSBob29rcy5zZW5kQW5pbWF0aW9uRXZlbnQ7IGlmIHRoYXQgdGhyb3dzIChlLmcuIG1haW4gbWVudSBzdGF0ZSksIHdlIHN0aWxsIGdldCBhIH4gY29tbWFuZC5cbiAgICB0cnkge1xuICAgICAgICByZWdpc3RlclNreWd1aWRlQ29uc29sZUNvbW1hbmQoKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2YXIgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIENvbnNvbGUgY29tbWFuZCByZWdpc3RyYXRpb24gZmFpbGVkOiBcIi5jb25jYXQobXNnKSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGhvb2tzLnNlbmRBbmltYXRpb25FdmVudC5hZGQoe1xuICAgICAgICAgICAgZW50ZXI6IGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRBdHRhY2tzID0gW1xuICAgICAgICAgICAgICAgICAgICBcImF0dGFja2xlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2tyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF0dGFja2tpY2tcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2szXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0YWNrdGhyb3dcIlxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50TG93ZXIgPSBjdHguYW5pbUV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh2YWxpZEF0dGFja3Muc29tZShmdW5jdGlvbiAoYXR0YWNrKSB7IHJldHVybiBldmVudExvd2VyLmluY2x1ZGVzKGF0dGFjayk7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllckFuaW1hdGlvbiA9IGN0eC5hbmltRXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZWF2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBQTEFZRVJfRk9STV9JRCwgUExBWUVSX0ZPUk1fSUQsIFwiQXR0YWNrKlwiKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2YXIgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIHNlbmRBbmltYXRpb25FdmVudCBob29rIGZhaWxlZCAobm9uLWZhdGFsKTogXCIuY29uY2F0KG1zZykpO1xuICAgIH1cbiAgICBpc0xvYWRlZCA9IHRydWU7XG59XG5vbmNlKFwidXBkYXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICBpbml0KCk7XG59KTtcbm9uKFwidXBkYXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobm93IC0gbGFzdFRpY2tUaW1lIDwgQ09ORklHLnRpY2tJbnRlcnZhbCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxhc3RUaWNrVGltZSA9IG5vdztcbiAgICB2YXIgYW5pbWF0aW9uID0gcGxheWVyQW5pbWF0aW9uO1xuICAgIHBsYXllckFuaW1hdGlvbiA9IFwiXCI7XG4gICAgc2FmZVByb2Nlc3NBbmRTZW5kKFwidGlja1wiLCBhbmltYXRpb24pO1xufSk7XG5vbihcImNvbWJhdFN0YXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBhY3RvciA9IGV2ZW50LmFjdG9yLmdldEZvcm1JRCgpO1xuICAgIGlmIChhY3RvciAhPT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgbmV3U3RhdGUgPSBldmVudC5pc0NvbWJhdCA/IDEgOiBldmVudC5pc1NlYXJjaGluZyA/IDIgOiAwO1xuICAgIHZhciBvbGRTdGF0ZSA9IGxhc3RDb21iYXRTdGF0ZTtcbiAgICBsYXN0Q29tYmF0U3RhdGUgPSBuZXdTdGF0ZTtcbiAgICBzYWZlUHJvY2Vzc0FuZFNlbmQoXCJjb21iYXRTdGF0ZV9cIi5jb25jYXQobmV3U3RhdGUpKTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJDb21iYXQgc3RhdGUgY2hhbmdlZDogXCIuY29uY2F0KG9sZFN0YXRlLCBcIiAtPiBcIikuY29uY2F0KG5ld1N0YXRlKSk7XG4gICAgfVxufSk7XG5vbihcImhpdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZiwgX2csIF9oO1xuICAgIHZhciB0YXJnZXQgPSAoX2MgPSAoX2IgPSAoX2EgPSBldmVudC50YXJnZXQpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jYWxsKF9hKSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogMDtcbiAgICB2YXIgc291cmNlID0gKF9mID0gKF9lID0gKF9kID0gZXZlbnQuYWdncmVzc29yKSA9PT0gbnVsbCB8fCBfZCA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2QuZ2V0Rm9ybUlEKSA9PT0gbnVsbCB8fCBfZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2UuY2FsbChfZCkpICE9PSBudWxsICYmIF9mICE9PSB2b2lkIDAgPyBfZiA6IDA7XG4gICAgdmFyIHNvdXJjZUJhc2VGb3JtID0gKF9oID0gKF9nID0gZXZlbnQuc291cmNlKSA9PT0gbnVsbCB8fCBfZyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2cuZ2V0Rm9ybUlEKSA9PT0gbnVsbCB8fCBfaCA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2guY2FsbChfZyk7XG4gICAgaWYgKHRhcmdldCAhPT0gUExBWUVSX0ZPUk1fSUQgJiYgc291cmNlICE9PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgcmV0dXJuO1xuICAgIHNhZmVQcm9jZXNzQW5kU2VuZChcImhpdFwiKTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJIaXQgZXZlbnQ6IHRhcmdldD1cIi5jb25jYXQodGFyZ2V0LCBcIiwgc291cmNlPVwiKS5jb25jYXQoc291cmNlLCBcIiwgc291cmNlRm9ybT1cIikuY29uY2F0KFN0cmluZyhzb3VyY2VCYXNlRm9ybSkpKTtcbiAgICB9XG59KTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==