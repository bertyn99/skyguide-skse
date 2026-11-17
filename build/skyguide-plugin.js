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
/* harmony import */ var _game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../game-state/collectors/world-scanner */ "./src/game-state/collectors/world-scanner.ts");
/* harmony import */ var _world_autowalk__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../world/autowalk */ "./src/world/autowalk.ts");





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
            if ("formId" in action) {
                // W4 formId targeting: the LLM may only activate objects the scanner
                // actually saw (cache = allowlisted types, distance-capped, fresh).
                // Cache presence doubles as the distance sanity check.
                var inCache = (0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_3__.getWorldObjects)().some(function (object) { return object.formId === action.formId; });
                if (!inCache) {
                    logDebug("Activate blocked: formId ".concat(action.formId, " not in scanner cache"));
                    return false;
                }
                var form = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getFormEx(action.formId);
                var ref_1 = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.ObjectReference.from(form);
                if (!isValidReference(ref_1)) {
                    logDebug("Activate blocked: formId ".concat(action.formId, " invalid/deleted/disabled"));
                    return false;
                }
                return executeSafely(action.type, function () {
                    ref_1.activate(player);
                });
            }
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
        case "scan": {
            // Drop the scanner cache; the next update tick re-sweeps within its
            // probe budget. Safe from menus — no game refs are touched here.
            return executeSafely(action.type, function () {
                (0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_3__.invalidateWorldScan)();
            });
        }
        case "autowalkTo": {
            // W6: scanner-cache validation + ESP handshake live in world/autowalk.
            // Fails cleanly (status "failed") when SkyGuide.esp is absent.
            return executeSafely(action.type, function () {
                var _a;
                var ok = (0,_world_autowalk__WEBPACK_IMPORTED_MODULE_4__.requestAutowalk)({ formId: action.formId, stopDistance: (_a = action.stopDistance) !== null && _a !== void 0 ? _a : _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.autowalkStopDistance });
                if (!ok)
                    throw new Error("autowalk request rejected");
            });
        }
        case "autowalkCancel": {
            return executeSafely(action.type, function () {
                (0,_world_autowalk__WEBPACK_IMPORTED_MODULE_4__.cancelAutowalk)("cancelled");
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
    "scan",
    "autowalkTo",
    "autowalkCancel",
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
/**
 * Accepts a decimal number, a decimal string, or an explicit hex string
 * ("0x14") — composer params are a free record and LLMs like to emit hex
 * form ids. Bare strings parse as DECIMAL (only the 0x prefix means hex).
 */
function parseFormId(value) {
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
    }
    if (typeof value === "string") {
        var trimmed = value.trim();
        if (/^0x[0-9a-f]+$/i.test(trimmed)) {
            var parsed = Number.parseInt(trimmed.slice(2), 16);
            if (Number.isFinite(parsed) && parsed > 0)
                return parsed;
        }
        else if (/^\d+$/.test(trimmed)) {
            var parsed = Number.parseInt(trimmed, 10);
            if (Number.isFinite(parsed) && parsed > 0)
                return parsed;
        }
    }
    return null;
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
/**
 * The companion outbox (`GET /api/actions`) wraps fields as
 * `{ type, params, id, source }`. Flatten so both that shape and a flat
 * `{ type, amount, ... }` parse.
 */
function flattenOutboxShape(raw) {
    var params = raw.params;
    if (!isRecord(params)) {
        return raw;
    }
    return __assign(__assign({}, params), { type: raw.type, id: raw.id });
}
function parseAction(raw) {
    if (!isRecord(raw)) {
        return null;
    }
    var flat = flattenOutboxShape(raw);
    var actionType = flat.type;
    if (typeof actionType !== "string" || !ACTION_TYPES.has(actionType)) {
        return null;
    }
    switch (actionType) {
        case "move": {
            var x = flat.x, y = flat.y, z = flat.z;
            if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
                return null;
            }
            return { type: "move", x: x, y: y, z: z };
        }
        case "face": {
            var angle = flat.angle;
            if (!isFiniteNumber(angle)) {
                return null;
            }
            return { type: "face", angle: angle };
        }
        case "activate": {
            // W4 formId targeting — validated against the scanner cache in the
            // executor (an LLM must not activate arbitrary forms).
            var formId = parseFormId(flat.formId);
            if (formId !== null) {
                return { type: "activate", formId: formId };
            }
            var target = flat.target;
            if (!isActivateTarget(target)) {
                return null;
            }
            return { type: "activate", target: target };
        }
        case "autowalkTo": {
            // Reuses parseFormId (hex/decimal forms from the composer) and falls
            // back to the CONFIG stop distance when the LLM omits it.
            var formId = parseFormId(flat.formId);
            if (formId === null) {
                return null;
            }
            var rawDistance = flat.stopDistance;
            var stopDistance = typeof rawDistance === "number" && Number.isFinite(rawDistance) && rawDistance > 0
                ? rawDistance
                : 100;
            return { type: "autowalkTo", formId: formId, stopDistance: stopDistance };
        }
        case "autowalkCancel": {
            return { type: "autowalkCancel" };
        }
        case "fastTravel": {
            var location = flat.location;
            if (!isNonEmptyString(location)) {
                return null;
            }
            return { type: "fastTravel", location: location };
        }
        case "equip":
        case "useItem": {
            var itemName = flat.itemName;
            if (!isNonEmptyString(itemName)) {
                return null;
            }
            return { type: actionType, itemName: itemName };
        }
        case "heal": {
            var amount = flat.amount;
            if (!isFiniteNumber(amount) || amount <= 0) {
                return null;
            }
            return { type: "heal", amount: amount };
        }
        case "saveGame": {
            var name = flat.name;
            if (!isNonEmptyString(name)) {
                return null;
            }
            return { type: "saveGame", name: name };
        }
        case "notification": {
            var message = flat.message;
            if (!isNonEmptyString(message)) {
                return null;
            }
            return { type: "notification", message: message };
        }
        case "drawWeapon":
        case "sheatheWeapon":
        case "attack":
        case "block":
        case "scan":
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
/* harmony import */ var _diag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../diag */ "./src/diag.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


var fsModule;
var fsFailureLogged = false;
var fsSuccessLogged = false;
function logFsFailure(msg) {
    if (fsFailureLogged)
        return;
    fsFailureLogged = true;
    (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[SkyGuide] fs UNAVAILABLE \u2014 state.json disabled: ".concat(msg));
}
function loadFs() {
    if (fsModule !== undefined)
        return fsModule;
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        fsModule = __webpack_require__(/*! fs */ "fs");
        // SP's host fs is a PARTIAL Node shim — dump what it actually exposes.
        (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[SkyGuide] fs keys: ".concat(Object.keys(fsModule).join(",")));
        (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[SkyGuide] fs methods: writeFileSync=".concat(typeof fsModule.writeFileSync, " writeFile=").concat(typeof fsModule.writeFile, " readFileSync=").concat(typeof fsModule.readFileSync));
    }
    catch (err) {
        fsModule = null;
        logFsFailure(String(err));
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
    var _a;
    if (!_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.modContextDumpEnabled)
        return false;
    var fsAny = loadFs();
    if (!fsAny)
        return false;
    var target = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.modContextPath;
    try {
        var data = JSON.stringify(payload);
        // SP's fs shim: prefer atomic write+rename, fall back to whatever
        // write primitive exists (sync or callback-style).
        if (typeof fsAny.writeFileSync === "function") {
            var tmp = "".concat(target, ".tmp");
            try {
                var dir = parentDir(target);
                if (dir) {
                    try {
                        (_a = fsAny.mkdirSync) === null || _a === void 0 ? void 0 : _a.call(fsAny, dir, { recursive: true });
                    }
                    catch (_b) {
                        // Directory may already exist.
                    }
                }
                fsAny.writeFileSync(tmp, data);
                if (typeof fsAny.renameSync === "function") {
                    fsAny.renameSync(tmp, target);
                }
            }
            catch (_c) {
                // Direct write fallback (atomicity is best-effort).
                fsAny.writeFileSync(target, data);
            }
        }
        else if (typeof fsAny.writeFile === "function") {
            // Callback-style Node writeFile — the SP event loop drains callbacks
            // between frames (same mechanism as HttpClient callbacks).
            fsAny.writeFile(target, data, function (err) {
                if (err)
                    logFsFailure(String(err));
                else if (!fsSuccessLogged) {
                    fsSuccessLogged = true;
                    (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[SkyGuide] state.json written (async): ".concat(target));
                }
            });
        }
        else {
            if (!fsFailureLogged) {
                logFsFailure("no usable write primitive on fs module");
            }
            return false;
        }
        if (!fsSuccessLogged) {
            fsSuccessLogged = true;
            (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[SkyGuide] state.json written: ".concat(target));
        }
        return true;
    }
    catch (err) {
        logFsFailure(String(err));
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
    debugMode: true,
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
    // World object scanner (docs/ACCESSIBILITY-PORT.md §5.1). Sweep is
    // budgeted across update ticks; cache dies after ~100 units of movement
    // or a cell change (their RESCAN_DISTANCE).
    scannerEnabled: true,
    scanRescanDistance: 100,
    scanMaxOutput: 64,
    scanProbeBudget: 96,
    scanMaxCells: 4,
    scanRadiusUnits: 2500,
    // Autowalk bridge (W6). The ESP announces itself via SkyGuide_AutoWalkReady
    // (sender = quest) at OnInit and after every save load — no form-ID
    // hardcoding. Until the Ready announce arrives autowalkTo fails cleanly.
    autowalkEnabled: true,
    autowalkAckTimeoutMs: 2000,
    autowalkStopDistance: 100,
    // Menu-focus narration (ItemMenu family via Ui.getString). Disabled
    // automatically when Skyrim Access is installed. 100ms matches their poll.
    menuNarrationEnabled: true,
    menuFocusInterval: 100,
    inventoryDumpMax: 48,
};


/***/ },

/***/ "./src/diag.ts"
/*!*********************!*\
  !*** ./src/diag.ts ***!
  \*********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logDiag: () => (/* binding */ logDiag)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./skyrimPlatform */ "./src/skyrimPlatform.ts");

/**
 * Dual-channel diagnostics: in-game console + skyrim-platform.log file.
 * The file survives after the session ends, so post-mortem analysis does not
 * depend on the user copying console text. Use for startup/fs/ESP-wiring
 * proofs — not for per-tick chatter.
 */
function logDiag() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var line = args.map(function (a) { return (typeof a === "string" ? a : JSON.stringify(a)); }).join(" ");
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)(line);
    try {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.writeLogs)("skyguide-plugin", line);
    }
    catch (_a) {
        // Log file may be unavailable in some SP versions — console still works.
    }
}


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
/* harmony import */ var _collectors_input_collector__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./collectors/input-collector */ "./src/game-state/collectors/input-collector.ts");
/* harmony import */ var _collectors_menu_collector__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./collectors/menu-collector */ "./src/game-state/collectors/menu-collector.ts");
/* harmony import */ var _collectors_environment_collector__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./collectors/environment-collector */ "./src/game-state/collectors/environment-collector.ts");
/* harmony import */ var _collectors_world_scanner__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./collectors/world-scanner */ "./src/game-state/collectors/world-scanner.ts");
/* harmony import */ var _world_stuck_detection__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../world/stuck-detection */ "./src/world/stuck-detection.ts");
/* harmony import */ var _world_autowalk__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../world/autowalk */ "./src/world/autowalk.ts");
/* harmony import */ var _collectors_effects_tracker__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./collectors/effects-tracker */ "./src/game-state/collectors/effects-tracker.ts");
/* harmony import */ var _menu_state__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./menu-state */ "./src/game-state/menu-state.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../events */ "./src/events.ts");
/* harmony import */ var _collectors_menu_focus__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./collectors/menu-focus */ "./src/game-state/collectors/menu-focus.ts");
/* harmony import */ var _collectors_item_events__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./collectors/item-events */ "./src/game-state/collectors/item-events.ts");
/* harmony import */ var _collectors_inventory_collector__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./collectors/inventory-collector */ "./src/game-state/collectors/inventory-collector.ts");



















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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (playerAnimation === void 0) { playerAnimation = ""; }
    if (eventType === void 0) { eventType = "tick"; }
    var player = collectPlayerState();
    if (!player)
        return null;
    var nearbyNpcs = (_a = safeCall(_collectors_nearby_collector__WEBPACK_IMPORTED_MODULE_2__.collectNearbyNpcs)) !== null && _a !== void 0 ? _a : [];
    var worldObjects = (_b = safeCall(_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_10__.getWorldObjects)) !== null && _b !== void 0 ? _b : [];
    var combatState = (_d = (_c = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer()) === null || _c === void 0 ? void 0 : _c.getCombatState()) !== null && _d !== void 0 ? _d : 0;
    var playerFull = safeCall(_collectors_player_collector__WEBPACK_IMPORTED_MODULE_3__.collectPlayerFullState);
    var inputState = safeCall(_collectors_input_collector__WEBPACK_IMPORTED_MODULE_7__.collectInputState);
    var menuState = safeCall(_collectors_menu_collector__WEBPACK_IMPORTED_MODULE_8__.collectMenuState);
    var uiFlags = (0,_menu_state__WEBPACK_IMPORTED_MODULE_14__.computeUiFlags)((0,_events__WEBPACK_IMPORTED_MODULE_15__.getOpenMenus)());
    var menuFocus = (_f = (_e = (0,_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_16__.peekMenuFocus)()) !== null && _e !== void 0 ? _e : (0,_collectors_item_events__WEBPACK_IMPORTED_MODULE_17__.takeItemEvent)()) !== null && _f !== void 0 ? _f : undefined;
    var inventoryItems = (_g = safeCall(_collectors_inventory_collector__WEBPACK_IMPORTED_MODULE_18__.collectInventoryDump)) !== null && _g !== void 0 ? _g : [];
    // Stuck detection (W3): consumes already-collected data — zero extra
    // Papyrus probes. `excluded` resets the confirmation window.
    var stuckEval = (0,_world_stuck_detection__WEBPACK_IMPORTED_MODULE_11__.evaluateStuckNow)({
        pos: player.position,
        keysPressed: (_h = inputState === null || inputState === void 0 ? void 0 : inputState.keysPressed) !== null && _h !== void 0 ? _h : [],
        gameMs: Date.now(),
        excluded: uiFlags.menuOpen ||
            player.isDead ||
            ((_j = playerFull === null || playerFull === void 0 ? void 0 : playerFull.movement.isSwimming) !== null && _j !== void 0 ? _j : false) ||
            ((_k = playerFull === null || playerFull === void 0 ? void 0 : playerFull.movement.isOnMount) !== null && _k !== void 0 ? _k : false) ||
            (((_l = playerFull === null || playerFull === void 0 ? void 0 : playerFull.movement.sitState) !== null && _l !== void 0 ? _l : 0) > 0) ||
            nearbyNpcs.some(function (npc) { return npc.isInDialogue; }),
        worldObjects: worldObjects,
    });
    // Autowalk WASD cancel watch (W6): any movement key during a walk cancels.
    (0,_world_autowalk__WEBPACK_IMPORTED_MODULE_12__.autowalkInputTick)((_m = inputState === null || inputState === void 0 ? void 0 : inputState.keysPressed) !== null && _m !== void 0 ? _m : [], uiFlags.menuOpen || player.isDead);
    return {
        protocol: {
            player: player,
            combatState: combatState,
            enemies: enemiesFromNearby(nearbyNpcs),
            playerAnimation: playerAnimation,
            eventType: eventType,
            // Fast-lane extensions (protocol v1 additive).
            headingAngleZ: playerFull === null || playerFull === void 0 ? void 0 : playerFull.heading.angleZ,
            isStuck: stuckEval.stuck,
            stuckRelDeg: stuckEval.bearingRelDeg,
            navigation: { status: (0,_world_autowalk__WEBPACK_IMPORTED_MODULE_12__.getNavigationStatus)() },
            ui: uiFlags,
            menu: menuFocus,
        },
        snapshot: {
            player: playerFull,
            nearbyNpcs: nearbyNpcs,
            worldObjects: worldObjects,
            crosshairTarget: safeCall(_collectors_crosshair_collector__WEBPACK_IMPORTED_MODULE_6__.collectCrosshairTarget),
            location: safeCall(_collectors_location_collector__WEBPACK_IMPORTED_MODULE_4__.collectLocationState),
            quest: safeCall(_collectors_quest_collector__WEBPACK_IMPORTED_MODULE_5__.collectQuestState),
            input: inputState,
            menu: menuState,
            environment: safeCall(_collectors_environment_collector__WEBPACK_IMPORTED_MODULE_9__.collectEnvironmentState),
            effects: (_o = safeCall(_collectors_effects_tracker__WEBPACK_IMPORTED_MODULE_13__.collectActiveEffects)) !== null && _o !== void 0 ? _o : [],
            inventoryItems: inventoryItems,
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

/***/ "./src/game-state/collectors/effects-tracker.ts"
/*!******************************************************!*\
  !*** ./src/game-state/collectors/effects-tracker.ts ***!
  \******************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectActiveEffects: () => (/* binding */ collectActiveEffects),
/* harmony export */   initEffectsTracker: () => (/* binding */ initEffectsTracker),
/* harmony export */   resetEffectsTrackerForTest: () => (/* binding */ resetEffectsTrackerForTest)
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../config */ "./src/config.ts");
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");


/**
 * Active-effects tracker (W4). There is NO active-effect enumerator on the
 * Papyrus surface (`getNthActiveEffect` does not exist; `hasMagicEffect`
 * needs the effect in hand), so we track `effectStart`/`effectFinish` events
 * into a name set.
 *
 * Documented limitation (plan §W4): effects already active at save-load are
 * invisible until they re-fire — `loadGame` clears the set and the map
 * repopulates as effects change.
 */
var activeEffects = new Set();
var initialized = false;
function debugLog(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_0__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_1__.printConsole)("[effects-tracker] ".concat(message));
    }
}
function isPlayer(event) {
    var _a, _b;
    try {
        return ((_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.getFormID()) !== null && _b !== void 0 ? _b : 0) === _config__WEBPACK_IMPORTED_MODULE_0__.PLAYER_FORM_ID;
    }
    catch (_c) {
        return false;
    }
}
function effectName(event) {
    var _a, _b, _c;
    try {
        var name = (_c = (_b = (_a = event.effect) === null || _a === void 0 ? void 0 : _a.getName) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "";
        return name.length > 0 ? name : "Effet inconnu";
    }
    catch (_d) {
        return "Effet inconnu";
    }
}
function initEffectsTracker() {
    if (initialized)
        return;
    initialized = true;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_1__.on)("effectStart", function (event) {
        if (!isPlayer(event))
            return;
        var name = effectName(event);
        activeEffects.add(name);
        debugLog("effectStart: ".concat(name));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_1__.on)("effectFinish", function (event) {
        if (!isPlayer(event))
            return;
        var name = effectName(event);
        activeEffects.delete(name);
        debugLog("effectFinish: ".concat(name));
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_1__.on)("loadGame", function () {
        // Effects active at load never fired in this VM session — start clean.
        activeEffects.clear();
        debugLog("loadGame — effect set cleared");
    });
}
/** Sorted snapshot for the dump (stringList). */
function collectActiveEffects() {
    return Array.from(activeEffects).sort(function (a, b) { return a.localeCompare(b, "fr"); });
}
/** Test seam. */
function resetEffectsTrackerForTest() {
    activeEffects.clear();
    initialized = false;
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

/***/ "./src/game-state/collectors/inventory-collector.ts"
/*!**********************************************************!*\
  !*** ./src/game-state/collectors/inventory-collector.ts ***!
  \**********************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectInventoryDump: () => (/* binding */ collectInventoryDump)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.ts");
/* harmony import */ var _inventory_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../inventory-core */ "./src/game-state/inventory-core.ts");
/* harmony import */ var _menu_focus_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../menu-focus-core */ "./src/game-state/menu-focus-core.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../events */ "./src/events.ts");





var INVENTORY_DUMP_INTERVAL_MS = 2000;
var lastDumpAt = 0;
var lastDump = [];
/**
 * Player inventory as parallel-array rows for the context dump.
 * Only runs while a narratable menu is open — getNthForm over a full bag
 * every world tick is too expensive on the game thread.
 */
function collectInventoryDump() {
    var _a, _b, _c;
    if (!(0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_3__.findNarratableMenu)((0,_events__WEBPACK_IMPORTED_MODULE_4__.getOpenMenus)())) {
        lastDump = [];
        lastDumpAt = 0;
        return [];
    }
    var now = Date.now();
    if (lastDumpAt !== 0 && now - lastDumpAt < INVENTORY_DUMP_INTERVAL_MS) {
        return lastDump;
    }
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return lastDump;
    var n = 0;
    try {
        n = (_a = player.getNumItems()) !== null && _a !== void 0 ? _a : 0;
    }
    catch (_d) {
        return lastDump;
    }
    var rows = [];
    var limit = Math.min(n, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.inventoryDumpMax * 2);
    for (var i = 0; i < limit; i++) {
        try {
            var form = player.getNthForm(i);
            if (!form)
                continue;
            var name = (_b = form.getName()) !== null && _b !== void 0 ? _b : "";
            var formId = form.getFormID();
            var count = 1;
            try {
                count = (_c = player.getItemCount(form)) !== null && _c !== void 0 ? _c : 1;
            }
            catch (_e) {
                count = 1;
            }
            rows.push({ name: name, count: count, formId: formId });
        }
        catch (_f) {
            // skip broken extra data
        }
        if (rows.length >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.inventoryDumpMax)
            break;
    }
    lastDumpAt = now;
    lastDump = (0,_inventory_core__WEBPACK_IMPORTED_MODULE_2__.finalizeInventoryRows)(rows, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.inventoryDumpMax);
    return lastDump;
}


/***/ },

/***/ "./src/game-state/collectors/item-events.ts"
/*!**************************************************!*\
  !*** ./src/game-state/collectors/item-events.ts ***!
  \**************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hasPendingItemEvent: () => (/* binding */ hasPendingItemEvent),
/* harmony export */   itemEventHandlers: () => (/* binding */ itemEventHandlers),
/* harmony export */   resetItemEvents: () => (/* binding */ resetItemEvents),
/* harmony export */   takeItemEvent: () => (/* binding */ takeItemEvent)
/* harmony export */ });
/* harmony import */ var _diag__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../diag */ "./src/diag.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.ts");


/**
 * Item-action narration (equip / unequip / consume) — "Il devrait signaler
 * quand j'équipe ou utilise des items". Sits on the equip/unequip SP events
 * (player only) and stages them as pseudo menu-focus speech events so the
 * whole existing pipeline (protocol `menu` field, app formatting, TTS
 * cache, arbiter) is reused unchanged.
 *
 * Verb semantics: POTION/INGR form types are consumed on equip in Skyrim's
 * engine — narrated as "use". Everything else is equip/unequip.
 */
var PLAYER_FORM_ID = 0x14;
/** Skyrim form types narrated as consumption (46 POTION, 30 INGR). */
var CONSUMABLE_FORM_TYPES = new Set([46, 30]);
/** Same verb+item within this window is deduplicated (spam guard). */
var DEDUP_WINDOW_MS = 1500;
var queue = [];
var lastKey = "";
var lastAt = 0;
function isConsumable(baseObject) {
    var _a, _b;
    try {
        var formType = (_b = (_a = baseObject).getObjectType) === null || _b === void 0 ? void 0 : _b.call(_a);
        return formType !== undefined && CONSUMABLE_FORM_TYPES.has(formType);
    }
    catch (_c) {
        return false;
    }
}
function itemName(baseObject) {
    var _a, _b, _c;
    try {
        return (_c = (_b = (_a = baseObject).getName) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : "";
    }
    catch (_d) {
        return "";
    }
}
function pushEvent(verb, item, now) {
    var trimmed = item.trim();
    if (!trimmed)
        return;
    var key = "".concat(verb, ":").concat(trimmed);
    if (key === lastKey && now - lastAt < DEDUP_WINDOW_MS)
        return;
    lastKey = key;
    lastAt = now;
    queue.push({ verb: verb, item: trimmed });
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_diag__WEBPACK_IMPORTED_MODULE_0__.logDiag)("[item-events] staged ".concat(key));
    }
}
function handleEquipEvent(event, now) {
    var _a, _b;
    var e = event;
    if (!e.actor || ((_b = (_a = e.actor).getFormId) === null || _b === void 0 ? void 0 : _b.call(_a)) !== PLAYER_FORM_ID)
        return;
    var item = itemName(e.baseObject);
    if (!item)
        return;
    pushEvent(isConsumable(e.baseObject) ? "use" : "equip", item, now);
}
function handleUnequipEvent(event, now) {
    var _a, _b;
    var e = event;
    if (!e.actor || ((_b = (_a = e.actor).getFormId) === null || _b === void 0 ? void 0 : _b.call(_a)) !== PLAYER_FORM_ID)
        return;
    var item = itemName(e.baseObject);
    if (!item)
        return;
    pushEvent("unequip", item, now);
}
/** Handlers to merge into `registerAllEvents({ ...itemEventHandlers() })`. */
function itemEventHandlers() {
    return {
        equip: function (event) { return handleEquipEvent(event, Date.now()); },
        unequip: function (event) { return handleUnequipEvent(event, Date.now()); },
    };
}
/** Any staged item event waiting to ride the next POST? */
function hasPendingItemEvent() {
    return queue.length > 0;
}
/**
 * Take the oldest staged event as a pseudo menu-focus state (drains the
 * queue — one event per POST, fire-and-forget: no commit semantics, losing
 * one line under a failed POST is acceptable for action feedback).
 */
function takeItemEvent() {
    var event = queue.shift();
    if (!event)
        return null;
    return {
        name: "",
        skyui: false,
        category: "",
        item: event.item,
        index: -1,
        count: -1,
        event: event.verb,
        firstRead: false,
        announceCategory: false,
    };
}
/** Test seam. */
function resetItemEvents() {
    queue.length = 0;
    lastKey = "";
    lastAt = 0;
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

/***/ "./src/game-state/collectors/menu-collector.ts"
/*!*****************************************************!*\
  !*** ./src/game-state/collectors/menu-collector.ts ***!
  \*****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   collectMenuState: () => (/* binding */ collectMenuState)
/* harmony export */ });
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../events */ "./src/events.ts");

/**
 * Menu collector — the open-menu set is maintained by events.ts
 * (menuOpen/menuClose); this only snapshots it. Gameplay-blocking vs
 * cosmetic menus is decided app/plugin-side by game-state/menu-state.ts.
 */
function collectMenuState() {
    return { openMenus: Array.from((0,_events__WEBPACK_IMPORTED_MODULE_0__.getOpenMenus)()) };
}


/***/ },

/***/ "./src/game-state/collectors/menu-focus.ts"
/*!*************************************************!*\
  !*** ./src/game-state/collectors/menu-focus.ts ***!
  \*************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   beginMenuFocusSend: () => (/* binding */ beginMenuFocusSend),
/* harmony export */   commitMenuFocusSend: () => (/* binding */ commitMenuFocusSend),
/* harmony export */   hasPendingMenuFocus: () => (/* binding */ hasPendingMenuFocus),
/* harmony export */   peekMenuFocus: () => (/* binding */ peekMenuFocus),
/* harmony export */   pumpMenuFocus: () => (/* binding */ pumpMenuFocus),
/* harmony export */   resetMenuFocus: () => (/* binding */ resetMenuFocus)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _diag__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../diag */ "./src/diag.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../config */ "./src/config.ts");
/* harmony import */ var _skyrim_access__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../skyrim-access */ "./src/game-state/skyrim-access.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../events */ "./src/events.ts");
/* harmony import */ var _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../menu-focus-core */ "./src/game-state/menu-focus-core.ts");
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






/**
 * GFx focus reader for the ItemMenu family. Polls Ui.getString/getInt,
 * diffs against the last snapshot, and stages at most one speech event
 * for the next protocol send. Silent when Skyrim Access owns menus.
 */
var skyui = null;
var focusProbeLogged = false;
var prev = null;
var pending = null;
var inFlight = null;
var lastPollAt = 0;
var cachedPath = {};
function detectSkyUi() {
    var _a, _b;
    if (skyui !== null)
        return skyui;
    try {
        skyui =
            ((_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.isPluginInstalled("SkyUI_SE.esp")) !== null && _a !== void 0 ? _a : false) ||
                ((_b = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.isPluginInstalled("SkyUI.esp")) !== null && _b !== void 0 ? _b : false);
    }
    catch (_c) {
        skyui = false;
    }
    if (_config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] SkyUI detected: ".concat(skyui));
    }
    return skyui;
}
function readString(menu, path) {
    var _a;
    try {
        return (_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.getString(menu, path)) !== null && _a !== void 0 ? _a : "";
    }
    catch (_b) {
        return "";
    }
}
function readInt(menu, path) {
    try {
        var value = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.getInt(menu, path);
        return typeof value === "number" && isFinite(value) ? value : NaN;
    }
    catch (_a) {
        return NaN;
    }
}
function probeString(menu, kind, paths) {
    var cacheKey = "".concat(menu, ":").concat(kind);
    var cached = cachedPath[cacheKey];
    if (cached) {
        var hit = (0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.firstNonEmpty)([readString(menu, cached)]);
        if (hit)
            return hit;
    }
    var values = [];
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var value = readString(menu, path);
        values.push(value);
        if ((0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.firstNonEmpty)([value])) {
            cachedPath[cacheKey] = path;
            break;
        }
    }
    return (0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.firstNonEmpty)(values);
}
function probeInt(menu, kind, paths) {
    var cacheKey = "".concat(menu, ":").concat(kind);
    var cached = cachedPath[cacheKey];
    if (cached) {
        var hit = readInt(menu, cached);
        if (!isNaN(hit) && hit > 0)
            return Math.floor(hit);
    }
    var sawZero = false;
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        var value = readInt(menu, path);
        if (isNaN(value) || value < 0)
            continue;
        if (value > 0) {
            cachedPath[cacheKey] = path;
            return Math.floor(value);
        }
        sawZero = true;
    }
    // 0 is a valid index AND the Papyrus default for a missing path — do not
    // cache it or later SkyUI/vanilla paths never run.
    return sawZero ? 0 : -1;
}
function readSnapshot(menu) {
    var isSkyUi = detectSkyUi();
    var itemPaths = isSkyUi ? _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.ITEM_PATHS_SKYUI : _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.ITEM_PATHS_VANILLA;
    var indexPaths = isSkyUi ? _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.INDEX_PATHS_SKYUI : _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.INDEX_PATHS_VANILLA;
    var countPaths = isSkyUi ? _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.COUNT_PATHS_SKYUI : _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.COUNT_PATHS_VANILLA;
    var categoryPaths = isSkyUi ? _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.CATEGORY_PATHS_SKYUI : _menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.CATEGORY_PATHS_VANILLA;
    // SkyUI paths first, vanilla as fallback even in skyui mode (UI mods move trees).
    var item = probeString(menu, "item", itemPaths.concat(_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.ITEM_PATHS_VANILLA));
    var category = probeString(menu, "category", categoryPaths.concat(_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.CATEGORY_PATHS_VANILLA));
    var index = probeInt(menu, "index", indexPaths.concat(_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.INDEX_PATHS_VANILLA));
    var count = probeInt(menu, "count", countPaths.concat(_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.COUNT_PATHS_VANILLA));
    // First probe of each session — proves the GFx channel works (or not).
    if (!focusProbeLogged) {
        focusProbeLogged = true;
        (0,_diag__WEBPACK_IMPORTED_MODULE_1__.logDiag)("[menu-focus] probe: menu=".concat(menu, " skyui=").concat(isSkyUi, " item=\"").concat(item, "\" category=\"").concat(category, "\" index=").concat(index, " count=").concat(count));
        // Full candidate dump once: which GFx paths answer at all?
        var raw = [];
        for (var _i = 0, _a = itemPaths.concat(_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.ITEM_PATHS_VANILLA); _i < _a.length; _i++) {
            var p = _a[_i];
            var v = readString(menu, p);
            if (v !== "")
                raw.push("".concat(p, "=\"").concat(v, "\""));
        }
        (0,_diag__WEBPACK_IMPORTED_MODULE_1__.logDiag)("[menu-focus] non-empty item paths: ".concat(raw.length ? raw.join(" | ") : "NONE"));
    }
    return {
        name: menu,
        skyui: isSkyUi,
        category: category,
        item: item,
        index: index,
        count: count,
    };
}
function snapshotOf(event) {
    if (event.event === "close")
        return null;
    return {
        name: event.name,
        skyui: event.skyui,
        category: event.category,
        item: event.item,
        index: event.index,
        count: event.count,
    };
}
function stageEvent(next) {
    var delta = (0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.diffMenuFocus)(prev, next);
    if (!delta)
        return false;
    var closedName = prev === null || prev === void 0 ? void 0 : prev.name;
    var base = next !== null && next !== void 0 ? next : {
        name: closedName !== null && closedName !== void 0 ? closedName : "",
        skyui: detectSkyUi(),
        category: "",
        item: "",
        index: -1,
        count: -1,
    };
    pending = __assign(__assign({}, base), { event: delta.event, firstRead: delta.firstRead, announceCategory: delta.announceCategory });
    return true;
}
/** Cheap GFx poll. Returns true when a speech event is waiting to POST. */
function pumpMenuFocus(now) {
    if (!_config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.menuNarrationEnabled)
        return pending !== null;
    if ((0,_skyrim_access__WEBPACK_IMPORTED_MODULE_3__.isSkyrimAccessInstalled)()) {
        if (pending === null && inFlight === null && prev !== null) {
            stageEvent(null);
        }
        return pending !== null;
    }
    // Hold the staged event until the POST acks — do not poll/restage or a
    // failed send (or a 100ms retry) drops "Inventaire ouvert." forever.
    if (pending !== null || inFlight !== null)
        return pending !== null;
    if (now - lastPollAt < _config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.menuFocusInterval) {
        return false;
    }
    lastPollAt = now;
    var menu = (0,_menu_focus_core__WEBPACK_IMPORTED_MODULE_5__.findNarratableMenu)((0,_events__WEBPACK_IMPORTED_MODULE_4__.getOpenMenus)());
    if (!menu) {
        return stageEvent(null);
    }
    return stageEvent(readSnapshot(menu));
}
function hasPendingMenuFocus() {
    return pending !== null;
}
/** Read the staged event without consuming it (dump + payload). */
function peekMenuFocus() {
    return pending !== null && pending !== void 0 ? pending : undefined;
}
/**
 * Take the event for an imminent POST. `commitMenuFocusSend` must follow:
 * success advances `prev`, failure restages so the next poll retries.
 */
function beginMenuFocusSend() {
    if (!pending)
        return undefined;
    inFlight = pending;
    pending = null;
    return inFlight;
}
function commitMenuFocusSend(ok) {
    if (!inFlight)
        return;
    if (ok) {
        prev = snapshotOf(inFlight);
    }
    else if (pending === null) {
        pending = inFlight;
    }
    inFlight = null;
}
/** Test / hot-reload seam. */
function resetMenuFocus() {
    skyui = null;
    prev = null;
    pending = null;
    inFlight = null;
    lastPollAt = 0;
    var keys = Object.keys(cachedPath);
    for (var i = 0; i < keys.length; i++) {
        delete cachedPath[keys[i]];
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

/***/ "./src/game-state/collectors/world-scanner.ts"
/*!****************************************************!*\
  !*** ./src/game-state/collectors/world-scanner.ts ***!
  \****************************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getWorldObjects: () => (/* binding */ getWorldObjects),
/* harmony export */   initWorldScanner: () => (/* binding */ initWorldScanner),
/* harmony export */   invalidateWorldScan: () => (/* binding */ invalidateWorldScan),
/* harmony export */   pumpWorldScanner: () => (/* binding */ pumpWorldScanner)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../config */ "./src/config.ts");
/* harmony import */ var _world_scanner_core__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../world/scanner-core */ "./src/world/scanner-core.ts");
/* harmony import */ var _world_loot_tracker__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../world/loot-tracker */ "./src/world/loot-tracker.ts");
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};




// Mirrors world/scanner-core.ts FORM_TYPE (runtime numbers).
var ALLOWED_TYPES = [24, 28, 29, 39, 40, 62];
var initialized = false;
var recentCells = [];
var cache = null;
var sweep = {
    active: false,
    cellIndex: 0,
    typeIndex: 0,
    refIndex: 0,
    refCount: 0,
    countKnown: false,
    candidates: [],
};
function debugLog(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[world-scanner] ".concat(message));
    }
}
function initWorldScanner() {
    if (initialized)
        return;
    initialized = true;
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("cellFullyLoaded", function (event) {
        try {
            var cell = event.cell;
            var formId_1 = typeof cell.getFormID === "function" ? cell.getFormID() : 0;
            if (!formId_1)
                return;
            recentCells = __spreadArray([
                { formId: formId_1, cell: cell }
            ], recentCells.filter(function (entry) { return entry.formId !== formId_1; }), true).slice(0, Math.max(1, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanMaxCells - 1));
        }
        catch (_a) {
            // A dead cell reference must never break the event pipeline.
        }
    });
}
function safeNumRefs(cell, formType) {
    var _a;
    try {
        return typeof cell.getNumRefs === "function" ? ((_a = cell.getNumRefs(formType)) !== null && _a !== void 0 ? _a : 0) : 0;
    }
    catch (_b) {
        return 0;
    }
}
function safeNthRef(cell, index, formType) {
    try {
        return typeof cell.getNthRef === "function" ? cell.getNthRef(index, formType) : null;
    }
    catch (_a) {
        return null;
    }
}
function currentCellIds(cells) {
    var _a;
    var ids = [];
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var cell = cells_1[_i];
        try {
            ids.push(typeof cell.getFormID === "function" ? ((_a = cell.getFormID()) !== null && _a !== void 0 ? _a : 0) : 0);
        }
        catch (_b) {
            ids.push(0);
        }
    }
    return ids;
}
function currentCellList(player) {
    var _a;
    var cells = [];
    try {
        if (typeof player.getParentCell === "function") {
            var parent = player.getParentCell();
            if (parent)
                cells.push(parent);
        }
    }
    catch (_b) {
        // No parent cell (main menu edge) — sweep the recent list only.
    }
    var parentId = cells.length > 0 ? (_a = currentCellIds([cells[0]])[0]) !== null && _a !== void 0 ? _a : 0 : 0;
    for (var _i = 0, recentCells_1 = recentCells; _i < recentCells_1.length; _i++) {
        var entry = recentCells_1[_i];
        if (cells.length >= _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanMaxCells)
            break;
        if (entry.formId === parentId)
            continue;
        cells.push(entry.cell);
    }
    return cells;
}
function getPlayerPos(player) {
    var p = player;
    if (!p ||
        typeof p.getPositionX !== "function" ||
        typeof p.getPositionY !== "function" ||
        typeof p.getPositionZ !== "function") {
        return null;
    }
    try {
        return { x: p.getPositionX(), y: p.getPositionY(), z: p.getPositionZ() };
    }
    catch (_a) {
        return null;
    }
}
/**
 * Probe one reference into `out`. Returns the Papyrus-probe cost so the sweep
 * budget stays honest (checked between objects — worst-case overshoot is one
 * object's worth of probes, ~12).
 */
function probeCandidate(ref, formType, playerPos, out) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var cost = 0;
    var refLike = ref;
    if (!refLike || typeof refLike.getFormID !== "function")
        return cost;
    var formId = 0;
    try {
        formId = (_a = refLike.getFormID()) !== null && _a !== void 0 ? _a : 0;
        cost++;
    }
    catch (_m) {
        return cost;
    }
    if (!formId || formId === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID)
        return cost;
    var disabled = false;
    var deleted = false;
    try {
        disabled = typeof refLike.isDisabled === "function" ? ((_b = refLike.isDisabled()) !== null && _b !== void 0 ? _b : false) : false;
        cost++;
    }
    catch (_o) {
        cost++;
    }
    try {
        deleted = typeof refLike.isDeleted === "function" ? ((_c = refLike.isDeleted()) !== null && _c !== void 0 ? _c : false) : false;
        cost++;
    }
    catch (_p) {
        cost++;
    }
    if (disabled || deleted)
        return cost;
    var x = 0;
    var y = 0;
    var z = 0;
    try {
        if (typeof refLike.getPositionX !== "function" ||
            typeof refLike.getPositionY !== "function" ||
            typeof refLike.getPositionZ !== "function") {
            return cost;
        }
        x = refLike.getPositionX();
        y = refLike.getPositionY();
        z = refLike.getPositionZ();
        cost += 3;
    }
    catch (_q) {
        return cost;
    }
    var dx = x - playerPos.x;
    var dy = y - playerPos.y;
    var dzFlat = 0; // radius gate is 2D — altitude must not hide a nearby door
    if ((0,_world_scanner_core__WEBPACK_IMPORTED_MODULE_2__.distanceUnits)(dx, dy, dzFlat) > _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanRadiusUnits)
        return cost;
    var name = "";
    try {
        var base = typeof refLike.getBaseObject === "function" ? refLike.getBaseObject() : null;
        if (base && typeof base.getName === "function")
            name = (_d = base.getName()) !== null && _d !== void 0 ? _d : "";
        cost += 2;
    }
    catch (_r) {
        cost += 2;
    }
    if (!name)
        return cost;
    var isLocked = false;
    var lockLevel = 0;
    var numItems = null;
    var openState = null;
    var isDead = false;
    var isHarvested = false;
    // Pure map lookup (loot-tracker) — no Papyrus probes, cost stays 0.
    var isLooted = formType === 28 ? (0,_world_loot_tracker__WEBPACK_IMPORTED_MODULE_3__.isContainerLooted)(formId) : false;
    if (formType === 24 || formType === 28 || formType === 29) {
        try {
            isLocked = typeof refLike.isLocked === "function" ? ((_e = refLike.isLocked()) !== null && _e !== void 0 ? _e : false) : false;
            cost++;
        }
        catch (_s) {
            cost++;
        }
        if (isLocked) {
            try {
                lockLevel = typeof refLike.getLockLevel === "function" ? ((_f = refLike.getLockLevel()) !== null && _f !== void 0 ? _f : 0) : 0;
                cost++;
            }
            catch (_t) {
                cost++;
            }
        }
    }
    if (formType === 28) {
        var loaded = false;
        try {
            loaded = typeof refLike.is3DLoaded === "function" ? ((_g = refLike.is3DLoaded()) !== null && _g !== void 0 ? _g : false) : false;
            cost++;
        }
        catch (_u) {
            cost++;
        }
        if (loaded) {
            try {
                numItems = typeof refLike.getNumItems === "function" ? ((_h = refLike.getNumItems()) !== null && _h !== void 0 ? _h : 0) : null;
                cost++;
            }
            catch (_v) {
                cost++;
            }
        }
    }
    if (formType === 29) {
        try {
            openState = typeof refLike.getOpenState === "function" ? ((_j = refLike.getOpenState()) !== null && _j !== void 0 ? _j : 0) : null;
            cost++;
        }
        catch (_w) {
            cost++;
        }
    }
    if (formType === 39) {
        try {
            isHarvested = typeof refLike.isHarvested === "function" ? ((_k = refLike.isHarvested()) !== null && _k !== void 0 ? _k : false) : false;
            cost++;
        }
        catch (_x) {
            cost++;
        }
    }
    if (formType === 62) {
        try {
            var actor = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Actor.from(ref);
            isDead = actor ? ((_l = actor.isDead()) !== null && _l !== void 0 ? _l : false) : false;
            cost++;
        }
        catch (_y) {
            cost++;
        }
    }
    out.push({ formId: formId, name: name, formType: formType, x: x, y: y, z: z, isLocked: isLocked, lockLevel: lockLevel, numItems: numItems, openState: openState, isDead: isDead, isHarvested: isHarvested, isLooted: isLooted });
    return cost;
}
function finishSweep(player, playerPos) {
    var _a, _b, _c;
    var facing = 0;
    try {
        facing = (_c = (_b = (_a = player).getAngleZ) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
    }
    catch (_d) {
        facing = 0;
    }
    var objects = (0,_world_scanner_core__WEBPACK_IMPORTED_MODULE_2__.finalizeCandidates)(sweep.candidates, playerPos, facing, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanMaxOutput);
    var cells = currentCellList(player);
    cache = { objects: objects, pos: playerPos, cellIds: currentCellIds(cells) };
    sweep = { active: false, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
    debugLog("sweep done: ".concat(objects.length, " objects cached"));
}
/**
 * One budgeted sweep pass. Call once per update tick (500ms throttle in
 * index.ts). Cheap early-out when the cache is fresh: no Papyrus calls.
 */
function pumpWorldScanner() {
    var _a;
    if (!_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scannerEnabled)
        return;
    var player = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getPlayer();
    if (!player)
        return;
    var inLoading = false;
    try {
        inLoading = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Ui.isMenuOpen("Loading Menu");
    }
    catch (_b) {
        inLoading = false;
    }
    if (inLoading)
        return;
    var playerPos = getPlayerPos(player);
    if (!playerPos)
        return;
    var cells = currentCellList(player);
    var cellIds = currentCellIds(cells);
    if (cache && !(0,_world_scanner_core__WEBPACK_IMPORTED_MODULE_2__.isScanCacheStale)(cache, { pos: playerPos, cellIds: cellIds }, _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanRescanDistance)) {
        return;
    }
    if (!sweep.active) {
        sweep = { active: true, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
        debugLog("sweep started");
    }
    var budget = _config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.scanProbeBudget;
    while (budget > 0 && sweep.active) {
        var cell = cells[sweep.cellIndex];
        if (!cell) {
            finishSweep(player, playerPos);
            break;
        }
        var formType = (_a = ALLOWED_TYPES[sweep.typeIndex]) !== null && _a !== void 0 ? _a : 0;
        if (!formType) {
            // Defensive: bad index — abort this sweep instead of spinning.
            sweep = { active: false, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
            break;
        }
        if (!sweep.countKnown) {
            sweep.refCount = safeNumRefs(cell, formType);
            sweep.countKnown = true;
            budget--;
            continue;
        }
        if (sweep.refIndex >= sweep.refCount) {
            sweep.typeIndex++;
            sweep.refIndex = 0;
            sweep.refCount = 0;
            sweep.countKnown = false;
            if (sweep.typeIndex >= ALLOWED_TYPES.length) {
                sweep.typeIndex = 0;
                sweep.cellIndex++;
            }
            continue;
        }
        var ref = safeNthRef(cell, sweep.refIndex, formType);
        sweep.refIndex++;
        budget--;
        if (ref) {
            budget -= probeCandidate(ref, formType, playerPos, sweep.candidates);
        }
    }
}
/** Cached, distance-sorted, capped objects. Empty until the first sweep lands. */
function getWorldObjects() {
    var _a;
    return (_a = cache === null || cache === void 0 ? void 0 : cache.objects) !== null && _a !== void 0 ? _a : [];
}
/** `{type:"scan"}` action — drop the cache so the next pump re-sweeps now. */
function invalidateWorldScan() {
    cache = null;
    debugLog("cache invalidated (scan action)");
}


/***/ },

/***/ "./src/game-state/inventory-core.ts"
/*!******************************************!*\
  !*** ./src/game-state/inventory-core.ts ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   INVENTORY_DUMP_MAX: () => (/* binding */ INVENTORY_DUMP_MAX),
/* harmony export */   finalizeInventoryRows: () => (/* binding */ finalizeInventoryRows)
/* harmony export */ });
/**
 * Pure inventory-dump helpers — NO skyrimPlatform imports.
 *
 * Parallel-array rows for the context-lane dump so Composer/STT can name
 * items without reading Scaleform. Cap is a game-thread budget, not a
 * gameplay limit.
 */
var INVENTORY_DUMP_MAX = 48;
function finalizeInventoryRows(rows, max) {
    if (max === void 0) { max = INVENTORY_DUMP_MAX; }
    var out = [];
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row.name)
            continue;
        if (row.count <= 0)
            continue;
        out.push(row);
        if (out.length >= max)
            break;
    }
    return out;
}


/***/ },

/***/ "./src/game-state/menu-focus-core.ts"
/*!*******************************************!*\
  !*** ./src/game-state/menu-focus-core.ts ***!
  \*******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CATEGORY_PATHS_SKYUI: () => (/* binding */ CATEGORY_PATHS_SKYUI),
/* harmony export */   CATEGORY_PATHS_VANILLA: () => (/* binding */ CATEGORY_PATHS_VANILLA),
/* harmony export */   COUNT_PATHS_SKYUI: () => (/* binding */ COUNT_PATHS_SKYUI),
/* harmony export */   COUNT_PATHS_VANILLA: () => (/* binding */ COUNT_PATHS_VANILLA),
/* harmony export */   INDEX_PATHS_SKYUI: () => (/* binding */ INDEX_PATHS_SKYUI),
/* harmony export */   INDEX_PATHS_VANILLA: () => (/* binding */ INDEX_PATHS_VANILLA),
/* harmony export */   ITEM_PATHS_SKYUI: () => (/* binding */ ITEM_PATHS_SKYUI),
/* harmony export */   ITEM_PATHS_VANILLA: () => (/* binding */ ITEM_PATHS_VANILLA),
/* harmony export */   NARRATABLE_MENUS: () => (/* binding */ NARRATABLE_MENUS),
/* harmony export */   cleanUiText: () => (/* binding */ cleanUiText),
/* harmony export */   diffMenuFocus: () => (/* binding */ diffMenuFocus),
/* harmony export */   findNarratableMenu: () => (/* binding */ findNarratableMenu),
/* harmony export */   firstNonEmpty: () => (/* binding */ firstNonEmpty),
/* harmony export */   focusSignature: () => (/* binding */ focusSignature),
/* harmony export */   isNarratableMenu: () => (/* binding */ isNarratableMenu)
/* harmony export */ });
/**
 * Pure menu-focus logic — NO skyrimPlatform imports.
 *
 * Behavioural port of Skyrim Access's inventory/magic/container reader
 * (poll + snapshot diff + firstRead), reimplemented against SKSE-style
 * Ui.getString paths. GFx path strings are public Scaleform facts, not
 * copied from their GPL sources.
 */
var NARRATABLE_MENUS = [
    "InventoryMenu",
    "MagicMenu",
    "ContainerMenu",
    "BarterMenu",
    "GiftMenu",
];
/** SkyUI ItemMenu family (inventory / magic / container / barter / gift). */
var ITEM_PATHS_SKYUI = [
    "_root.Menu_mc.inventoryLists.itemList.selectedEntry.text",
    "_root.Menu_mc.inventoryLists.itemList.selectedName",
];
var ITEM_PATHS_VANILLA = [
    // Verified against Skyrim Access (GPL) src/menu_*.cpp — the vanilla
    // InventoryMenu hierarchy uses InventoryLists_mc/ItemsList (capital
    // letters), unlike the lowercase SkyUI layout.
    "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedEntry.text",
    "_root.Menu_mc.ItemCardFadeHolder_mc.ItemCard_mc.itemInfo.text",
    "_root.Menu_mc.itemCard.itemInfo.text",
    "_root.Menu_mc.itemCard.itemName",
];
var INDEX_PATHS_SKYUI = [
    "_root.Menu_mc.inventoryLists.itemList.selectedIndex",
];
var INDEX_PATHS_VANILLA = [
    "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedIndex",
    "_root.Menu_mc.InventoryLists_mc.CategoriesList.selectedIndex",
    "_root.Menu_mc.InventoryLists_mc.CategoriesList.dividerIndex",
];
var COUNT_PATHS_SKYUI = [
    "_root.Menu_mc.inventoryLists.itemList.itemCount",
];
var COUNT_PATHS_VANILLA = [
    "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedEntry.count",
];
var CATEGORY_PATHS_SKYUI = [
    "_root.Menu_mc.inventoryLists.categoryList.selectedEntry.text",
    "_root.Menu_mc.inventoryLists.categoryList.selectedName",
];
var CATEGORY_PATHS_VANILLA = [
    "_root.Menu_mc.InventoryLists_mc.CategoriesList.centeredEntry.text",
];
function isNarratableMenu(name) {
    for (var i = 0; i < NARRATABLE_MENUS.length; i++) {
        if (NARRATABLE_MENUS[i] === name)
            return true;
    }
    return false;
}
/**
 * Highest-priority narratable menu currently open. Inventory wins over
 * container when both exist (they should not).
 */
function findNarratableMenu(openMenus) {
    var open = new Set();
    var listed = Array.from(openMenus);
    for (var i = 0; i < listed.length; i++) {
        open.add(listed[i]);
    }
    for (var i = 0; i < NARRATABLE_MENUS.length; i++) {
        var name = NARRATABLE_MENUS[i];
        if (open.has(name))
            return name;
    }
    return null;
}
/** Strip Scaleform $keys and underscores so "$weapon_one_hand" speaks. */
function cleanUiText(raw) {
    var text = raw.trim();
    if (text.charAt(0) === "$") {
        text = text.slice(1);
    }
    text = text.split("_").join(" ");
    return text.trim();
}
function firstNonEmpty(values) {
    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (typeof value !== "string")
            continue;
        var cleaned = cleanUiText(value);
        if (!cleaned)
            continue;
        var lower = cleaned.toLowerCase();
        if (lower === "undefined" || lower === "null")
            continue;
        return cleaned;
    }
    return "";
}
function focusSignature(snapshot) {
    if (!snapshot)
        return "";
    // Index/count fill in a tick later than the name; they must not re-speak.
    return "".concat(snapshot.name, "|").concat(snapshot.category, "|").concat(snapshot.item);
}
/**
 * Diff two snapshots into a speech event. Empty-item flickers while the
 * menu stays open are ignored (Scaleform briefly blanks on tab change).
 */
function diffMenuFocus(prev, next) {
    var _a, _b, _c;
    var prevName = (_a = prev === null || prev === void 0 ? void 0 : prev.name) !== null && _a !== void 0 ? _a : null;
    var nextName = (_b = next === null || next === void 0 ? void 0 : next.name) !== null && _b !== void 0 ? _b : null;
    if (!prevName && nextName) {
        return { event: "open", firstRead: false, announceCategory: !!(next === null || next === void 0 ? void 0 : next.category) };
    }
    if (prevName && !nextName) {
        return { event: "close", firstRead: false, announceCategory: false };
    }
    if (!next || !nextName)
        return null;
    if (prevName !== nextName) {
        return { event: "open", firstRead: false, announceCategory: !!next.category };
    }
    if (focusSignature(prev) === focusSignature(next))
        return null;
    if (!next.item)
        return null;
    var firstRead = !(prev === null || prev === void 0 ? void 0 : prev.item);
    var announceCategory = ((_c = prev === null || prev === void 0 ? void 0 : prev.category) !== null && _c !== void 0 ? _c : "") !== next.category && !!next.category;
    return { event: "focus", firstRead: firstRead, announceCategory: announceCategory };
}


/***/ },

/***/ "./src/game-state/menu-state.ts"
/*!**************************************!*\
  !*** ./src/game-state/menu-state.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GAME_MENUS: () => (/* binding */ GAME_MENUS),
/* harmony export */   computeUiFlags: () => (/* binding */ computeUiFlags)
/* harmony export */ });
/**
 * Pure menu-state logic — NO skyrimPlatform imports.
 *
 * `ui.menuOpen` means "a gameplay-blocking menu is open" (inventory, map,
 * crafting…), NOT "any menu is open": the HUD/Fader/Cursor/Mist menus are
 * open for the entire play session and would mute SkyGuide forever if
 * counted. The denylist is skymp5-client's `browserService.badMenus` set
 * (services/services/browserService.ts) — the battle-tested list of menus
 * that hide a CEF overlay, i.e. exactly the menus where the game UI owns
 * the screen.
 */
var GAME_MENUS = new Set([
    "BarterMenu",
    "Book Menu",
    "ContainerMenu",
    "Crafting Menu",
    "GiftMenu",
    "InventoryMenu",
    "Journal Menu",
    "Lockpicking Menu",
    "Loading Menu",
    "MapMenu",
    "RaceSex Menu",
    "StatsMenu",
    "Tween Menu",
    "Console",
    "Main Menu",
    "Dialogue Menu",
    "MessageBoxMenu",
    "LevelUp Menu",
    "Sleep/Wait Menu",
    "FavoritesMenu",
    "Quantity Menu",
    "MagicMenu",
    "Training Menu",
]);
function computeUiFlags(openMenus) {
    var menuOpen = false;
    var consoleOpen = false;
    // Array.from: the plugin compiles to ES5, where bare for-of over an
    // Iterable needs downlevelIteration.
    for (var _i = 0, _a = Array.from(openMenus); _i < _a.length; _i++) {
        var menu = _a[_i];
        if (GAME_MENUS.has(menu)) {
            menuOpen = true;
            if (menu === "Console")
                consoleOpen = true;
        }
    }
    return { menuOpen: menuOpen, consoleOpen: consoleOpen };
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
/**
 * Parallel-array dump matching skydive-app `parseSkyrimState`
 * (`server/utils/skyrim-state-parser.ts`). The Gate/Composer read this via
 * SkyrimFileConnector — they do NOT see the HTTP protocol-v1 payload.
 *
 * Distance conversion: 70 Skyrim units ≈ 1 meter (community convention).
 *
 * Dump schema version 2 (ADR: skydive-app/docs/adr/0003-state-channels.md):
 *  - `dump.timestamp` (float, ms epoch) — the app drops context older than
 *    ~10s so a quit game cannot whisper stale state into Gemini forever;
 *  - `world.objects.*` parallel arrays from the world scanner (always push
 *    every array in lock-step — lengths must never desync).
 */
var UNITS_PER_METER = 70;
var OBSTACLE_FRONT_UNITS = 150;
var DUMP_VERSION = 2;
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
function buildModContext(snapshot, protocol, options) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
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
    // Coexistence flag (W2): when their ESP is present, the app suppresses
    // object/radar narration (they own those channels) but keeps tactical
    // reflex — see docs/ACCESSIBILITY.md §4 and ADR 0003. Injected by the
    // caller (game probe) so this builder stays pure for tests.
    ints["skyrim_access.installed"] = flag((_k = options === null || options === void 0 ? void 0 : options.skyrimAccessInstalled) !== null && _k !== void 0 ? _k : false);
    var living = snapshot.nearbyNpcs
        .filter(function (npc) { return !npc.isDead; })
        .slice()
        .sort(function (a, b) { return a.distance - b.distance; });
    var hostiles = living.filter(function (npc) { return npc.isHostile; });
    ints["enemies.count"] = hostiles.length;
    ints["npcs.count"] = living.length;
    // World scanner output (v2). Atomic pushes: every world.objects.* array
    // is written from the same objects list so parallel-array lengths stay
    // in lock-step. (count lives in the ints map below.)
    var objects = (_l = snapshot.worldObjects) !== null && _l !== void 0 ? _l : [];
    var objectNames = [];
    var objectCategories = [];
    var objectFlags = [];
    var objectCompass = [];
    var objectDistanceM = [];
    var objectDistanceU = [];
    var objectId = [];
    var objectBearing = [];
    var objectLockLevel = [];
    var objectDz = [];
    for (var _i = 0, objects_1 = objects; _i < objects_1.length; _i++) {
        var object = objects_1[_i];
        objectNames.push(object.name);
        objectCategories.push(object.category);
        objectFlags.push(object.flags.join("|"));
        objectCompass.push(compassFromAngleZ(object.bearingDeg));
        objectDistanceM.push(object.distance / UNITS_PER_METER);
        objectDistanceU.push(object.distance);
        objectId.push(object.formId);
        objectBearing.push(object.bearingDeg);
        objectLockLevel.push(object.lockLevel);
        objectDz.push(object.dz);
    }
    var inventory = (_m = snapshot.inventoryItems) !== null && _m !== void 0 ? _m : [];
    var floatList = {
        "npcs.distance_m": living.map(function (npc) { return npc.distance / UNITS_PER_METER; }),
        "world.objects.distance_m": objectDistanceM,
        "world.objects.distance_u": objectDistanceU,
        "world.objects.form_id": objectId,
        "world.objects.bearing_deg": objectBearing,
        "world.objects.lock_level": objectLockLevel,
        "world.objects.dz": objectDz,
    };
    var stringList = {
        "npcs.name": living.map(function (npc) { return npc.name; }),
        "npcs.clock": living.map(function (npc) { return clockFromHeadingAngle(npc.headingAngle); }),
        "world.objects.name": objectNames,
        "world.objects.category": objectCategories,
        "world.objects.flags": objectFlags,
        "world.objects.compass": objectCompass,
        // Active player effects (W4) — sorted, deduped by the tracker.
        "effects.active": (_o = snapshot.effects) !== null && _o !== void 0 ? _o : [],
    };
    if (inventory.length > 0) {
        ints["inventory.size"] = inventory.length;
        floatList["inventory.count"] = inventory.map(function (row) { return row.count; });
        floatList["inventory.form_id"] = inventory.map(function (row) { return row.formId; });
        stringList["inventory.name"] = inventory.map(function (row) { return row.name; });
    }
    return {
        float: __assign(__assign({}, floats), { "dump.timestamp": Date.now() }),
        int: __assign(__assign({}, ints), { "dump.version": DUMP_VERSION, "world.objects.count": objects.length }),
        string: strings,
        floatList: floatList,
        stringList: stringList,
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
 * The extra `data` fields (headingAngleZ, isStuck, navigation, ui) are
 * protocol-v1 ADDITIVE extensions — `game-state.post.ts` validates only the
 * envelope, and the app tolerates absent fields (old plugins keep working;
 * JSON.stringify drops undefined).
 */
function serializeState(state, priority) {
    var _a, _b, _c;
    var payload = {
        protocolVersion: 1,
        priority: priority,
        source: "skyguide",
        data: {
            player: state.player,
            combatState: state.combatState,
            enemies: state.enemies.map(function (enemy) { return (__assign(__assign({}, enemy), { animation: "" })); }),
            playerAnimation: state.playerAnimation,
            eventType: normalizeEventType(state.eventType),
            headingAngleZ: state.headingAngleZ,
            isStuck: (_a = state.isStuck) !== null && _a !== void 0 ? _a : false,
            stuckRelDeg: state.stuckRelDeg,
            navigation: (_b = state.navigation) !== null && _b !== void 0 ? _b : { status: "idle" },
            ui: (_c = state.ui) !== null && _c !== void 0 ? _c : { menuOpen: false, consoleOpen: false },
            menu: state.menu,
        },
        timestamp: Date.now()
    };
    return JSON.stringify(payload);
}


/***/ },

/***/ "./src/game-state/skyrim-access.ts"
/*!*****************************************!*\
  !*** ./src/game-state/skyrim-access.ts ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isSkyrimAccessInstalled: () => (/* binding */ isSkyrimAccessInstalled),
/* harmony export */   resetSkyrimAccessDetection: () => (/* binding */ resetSkyrimAccessDetection)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");


/**
 * Skyrim Access coexistence detection (W2 / docs/ACCESSIBILITY.md §4).
 *
 * Standalone-first means SkyGuide works when Skyrim Access is ABSENT — not
 * that it should speak over it when present. Their object scanner and
 * ambient radar own those channels (Nexus 181131); when their ESP is
 * installed, the app suppresses our object/radar announcements and keeps
 * tactical reflex only.
 *
 * `Game.isPluginInstalled` is the robust probe (no form-id guesswork);
 * `getFormFromFile(0x13A6BD, "SkyrimAccess.esp")` stays as the documented
 * fallback. Detection is cached — plugin load order cannot change mid-session.
 */
var SKYRIM_ACCESS_ESP = "SkyrimAccess.esp";
var detected = null;
function probePluginInstalled() {
    var _a;
    try {
        return (_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.isPluginInstalled(SKYRIM_ACCESS_ESP)) !== null && _a !== void 0 ? _a : false;
    }
    catch (_b) {
        return null;
    }
}
function probeFormFromFile() {
    try {
        return _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.getFormFromFile(0x13a6bd, SKYRIM_ACCESS_ESP) !== null;
    }
    catch (_a) {
        return false;
    }
}
/** Cached detection: true = defer world-object/radar narration to them. */
function isSkyrimAccessInstalled() {
    var _a;
    if (detected !== null)
        return detected;
    detected = (_a = probePluginInstalled()) !== null && _a !== void 0 ? _a : probeFormFromFile();
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] SkyrimAccess.esp detected: ".concat(detected));
    }
    return detected;
}
/** Test seam. */
function resetSkyrimAccessDetection() {
    detected = null;
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
/* harmony export */   Quest: () => (/* binding */ Quest),
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
/* harmony export */   printConsole: () => (/* binding */ printConsole),
/* harmony export */   storage: () => (/* binding */ storage),
/* harmony export */   writeLogs: () => (/* binding */ writeLogs)
/* harmony export */ });
var runtime = globalThis;
if (!runtime.skyrimPlatform) {
    throw new Error('skyrimPlatform global is not available');
}
var skyrimPlatform = runtime.skyrimPlatform;
var once = skyrimPlatform.once, on = skyrimPlatform.on, printConsole = skyrimPlatform.printConsole, writeLogs = skyrimPlatform.writeLogs, Debug = skyrimPlatform.Debug, hooks = skyrimPlatform.hooks, findConsoleCommand = skyrimPlatform.findConsoleCommand, ObjectReference = skyrimPlatform.ObjectReference, Actor = skyrimPlatform.Actor, HttpClient = skyrimPlatform.HttpClient, Ui = skyrimPlatform.Ui, Game = skyrimPlatform.Game, Input = skyrimPlatform.Input, DxScanCode = skyrimPlatform.DxScanCode, FormType = skyrimPlatform.FormType, Utility = skyrimPlatform.Utility, Weather = skyrimPlatform.Weather, browser = skyrimPlatform.browser, getPlatformVersion = skyrimPlatform.getPlatformVersion, Quest = skyrimPlatform.Quest, storage = skyrimPlatform.storage;
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

/***/ "./src/world/autowalk.ts"
/*!*******************************!*\
  !*** ./src/world/autowalk.ts ***!
  \*******************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autowalkInputTick: () => (/* binding */ autowalkInputTick),
/* harmony export */   cancelAutowalk: () => (/* binding */ cancelAutowalk),
/* harmony export */   getNavigationStatus: () => (/* binding */ getNavigationStatus),
/* harmony export */   initAutowalk: () => (/* binding */ initAutowalk),
/* harmony export */   requestAutowalk: () => (/* binding */ requestAutowalk),
/* harmony export */   resetAutowalkForTest: () => (/* binding */ resetAutowalkForTest)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _diag__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../diag */ "./src/diag.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../game-state/collectors/world-scanner */ "./src/game-state/collectors/world-scanner.ts");
/* harmony import */ var _navigation_core__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./navigation-core */ "./src/world/navigation-core.ts");





/**
 * Autowalk bridge (W6) — the JS half of the two-runtime handshake. The ESP
 * (CK-built, see esp/README.md) owns the quest, the Travel package and
 * Papyrus execution; JS decides WHERE and watches for cancellation.
 *
 * Contract (see navigation-core.ts + plan W6):
 *  - JS → ESP: `questRef.sendModEvent(CmdEvent, jsonStrArg, 0)` where the
 *    JSON carries {f: hexFormId, d: stopDistance} (numArg is float32).
 *  - ESP → JS: Ack / Arrived / (CancelEcho) mod events.
 *  - Cleanup of `SetPlayerAIDriven(false)` on: deathStart, loadGame,
 *    fastTravelEnd, dialogue menu, WASD cancel, hard timeout, and HOT
 *    RELOAD — the engine flag survives JS reloads, tracked in `sp.storage`.
 *  - 2s ack timeout (HTTP-timeout state-machine pattern): a missing/broken
 *    ESP fails the command instead of hanging the status on "walking".
 */
var AI_DRIVEN_STORAGE_KEY = "skyguide.aiDrivenByUs";
var state = {
    status: "idle",
    drivingByUs: false,
    pendingAckDeadline: 0,
    espQuest: null,
};
var initialized = false;
function debugLog(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[autowalk] ".concat(message));
    }
}
function transition(to) {
    if (!(0,_navigation_core__WEBPACK_IMPORTED_MODULE_4__.canTransition)(state.status, to)) {
        debugLog("illegal transition ".concat(state.status, " \u2192 ").concat(to, " \u2014 ignored"));
        return;
    }
    state.status = to;
}
function setPlayerAiDriven(driven) {
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Game.setPlayerAIDriven(driven);
    }
    catch (err) {
        debugLog("setPlayerAIDriven(".concat(String(driven), ") failed: ").concat(String(err)));
    }
}
function clearDrivingByUs() {
    if (!state.drivingByUs)
        return;
    state.drivingByUs = false;
    try {
        delete _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.storage[AI_DRIVEN_STORAGE_KEY];
    }
    catch (_a) {
        // storage unavailable (should not happen in-game)
    }
}
function cancelAutowalk(reason, announce) {
    if (announce === void 0) { announce = true; }
    if (state.status !== "walking")
        return;
    if (announce && state.espQuest) {
        try {
            state.espQuest.sendModEvent(_navigation_core__WEBPACK_IMPORTED_MODULE_4__.AUTOWALK_CANCEL_EVENT, "", 0);
        }
        catch (_a) {
            // ESP may be gone — local cleanup still applies.
        }
    }
    setPlayerAiDriven(false);
    clearDrivingByUs();
    transition(reason);
    state.pendingAckDeadline = 0;
    debugLog("cancelled/failed \u2192 ".concat(reason));
}
/** Called every collection pass — WASD cancel watch + ack timeout. */
function autowalkInputTick(keysPressed, excluded) {
    if (state.status !== "walking")
        return;
    if (state.pendingAckDeadline !== 0 && Date.now() > state.pendingAckDeadline) {
        // ESP never acked — fail the command, restore player control.
        cancelAutowalk("failed", false);
        return;
    }
    if (excluded)
        return; // dialogue/menu handled by their own cancel hooks
    var movementKey = keysPressed.some(function (key) { return key === "W" || key === "A" || key === "S" || key === "D"; });
    if (movementKey) {
        debugLog("movement key during autowalk — cancelling");
        cancelAutowalk("cancelled");
    }
}
/** `{type:"autowalkTo", formId, stopDistance}` executor entry point. */
function requestAutowalk(command) {
    if (!_config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.autowalkEnabled) {
        debugLog("autowalk disabled (CONFIG)");
        return false;
    }
    // Same hallucination guard as activate{formId}: only scanner-seen targets.
    var inCache = (0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_3__.getWorldObjects)().some(function (object) { return object.formId === command.formId; });
    if (!inCache) {
        debugLog("autowalk blocked: formId ".concat(command.formId, " not in scanner cache"));
        return false;
    }
    if (!state.espQuest) {
        // SkyGuide.esp absent, or installed-but-not-yet-Ready (OnInit not seen).
        transition("failed");
        debugLog("autowalk blocked: ESP quest not Ready (no SkyGuide_AutoWalkReady yet)");
        return false;
    }
    try {
        state.espQuest.sendModEvent(_navigation_core__WEBPACK_IMPORTED_MODULE_4__.AUTOWALK_CMD_EVENT, (0,_navigation_core__WEBPACK_IMPORTED_MODULE_4__.encodeAutowalkCommand)(command), 0);
    }
    catch (err) {
        transition("failed");
        debugLog("sendModEvent failed: ".concat(String(err)));
        return false;
    }
    transition("walking");
    state.drivingByUs = true;
    try {
        _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.storage[AI_DRIVEN_STORAGE_KEY] = true;
    }
    catch (_a) {
        // storage unavailable — hot-reload guard degrades to best-effort
    }
    state.pendingAckDeadline = Date.now() + _config__WEBPACK_IMPORTED_MODULE_2__.CONFIG.autowalkAckTimeoutMs;
    debugLog("autowalk request sent (formId ".concat(command.formId, ", stop ").concat(command.stopDistance, ")"));
    return true;
}
function getNavigationStatus() {
    return state.status;
}
function initAutowalk() {
    if (initialized)
        return;
    initialized = true;
    // Hot-reload guard: the engine AI-driven flag survives JS reloads. If a
    // previous VM instance was driving, restore player control now.
    try {
        if (_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.storage[AI_DRIVEN_STORAGE_KEY] === true) {
            setPlayerAiDriven(false);
            delete _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.storage[AI_DRIVEN_STORAGE_KEY];
            debugLog("hot-reload recovery: AI-driven flag cleared");
        }
    }
    catch (_a) {
        // storage unavailable (non-game context)
    }
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("modEvent", function (event) {
        if (event.eventName === _navigation_core__WEBPACK_IMPORTED_MODULE_4__.AUTOWALK_READY_EVENT) {
            // ESP announce: `sender` is the quest form itself (Papyrus SendModEvent
            // called on the quest). Store the reference — no form-ID hardcoding.
            state.espQuest = event.sender
                ? _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Quest.from(event.sender)
                : null;
            // Always printed: this is the once-per-session ESP wiring proof.
            (0,_diag__WEBPACK_IMPORTED_MODULE_1__.logDiag)("[autowalk] ESP ready \u2014 quest stored (".concat(state.espQuest ? "ok" : "sender cast failed", ")"));
            return;
        }
        if (event.eventName === _navigation_core__WEBPACK_IMPORTED_MODULE_4__.AUTOWALK_ACK_EVENT && state.status === "walking") {
            state.pendingAckDeadline = 0;
            debugLog("ESP ack received");
            return;
        }
        if (event.eventName === _navigation_core__WEBPACK_IMPORTED_MODULE_4__.AUTOWALK_ARRIVED_EVENT && state.status === "walking") {
            state.pendingAckDeadline = 0;
            state.drivingByUs = false;
            try {
                delete _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.storage[AI_DRIVEN_STORAGE_KEY];
            }
            catch (_a) {
                // best-effort
            }
            transition("arrived");
            debugLog("arrived");
            return;
        }
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("deathStart", function () { return cancelAutowalk("failed", false); });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("loadGame", function () {
        if (state.drivingByUs)
            cancelAutowalk("failed", false);
        else if (state.status !== "idle")
            transition("idle");
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("fastTravelEnd", function () { return cancelAutowalk("failed", false); });
}
/** Test seam. */
function resetAutowalkForTest() {
    state = { status: "idle", drivingByUs: false, pendingAckDeadline: 0, espQuest: null };
    initialized = false;
}


/***/ },

/***/ "./src/world/loot-core.ts"
/*!********************************!*\
  !*** ./src/world/loot-core.ts ***!
  \********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LOOT_EXPIRY_DAYS: () => (/* binding */ LOOT_EXPIRY_DAYS),
/* harmony export */   clearLooted: () => (/* binding */ clearLooted),
/* harmony export */   isLooted: () => (/* binding */ isLooted),
/* harmony export */   lootKey: () => (/* binding */ lootKey),
/* harmony export */   markLooted: () => (/* binding */ markLooted),
/* harmony export */   parseLoot: () => (/* binding */ parseLoot),
/* harmony export */   pruneLooted: () => (/* binding */ pruneLooted),
/* harmony export */   serializeLoot: () => (/* binding */ serializeLoot)
/* harmony export */ });
/**
 * Pure loot-tracker logic — NO skyrimPlatform imports (vitest-testable).
 * Ported from Skyrim Access's loot_tracker behavior (§5.3): a cross-session
 * "already searched" memory keyed by container REF formId, with a respawn
 * assumption and per-ref clearing.
 *
 * Unit decision: `Utility.getCurrentGameTime()` returns game DAYS (the
 * environment collector already derives `gameHour = gameTime*24 % 24`), so
 * the ported "720 in-game hours (30 days)" expiry becomes 30 DAYS. Probe
 * item §4 confirms this in game before tuning.
 */
var LOOT_EXPIRY_DAYS = 30;
function lootKey(formId) {
    return String(formId);
}
function markLooted(store, formId, gameDays) {
    store[lootKey(formId)] = gameDays;
}
/** True while the respawn assumption holds (searched < expiryDays ago). */
function isLooted(store, formId, gameDays, expiryDays) {
    if (expiryDays === void 0) { expiryDays = LOOT_EXPIRY_DAYS; }
    var at = store[lootKey(formId)];
    if (at === undefined)
        return false;
    return gameDays - at < expiryDays;
}
/** The container respawned now (TESResetEvent) — forget its searched state. */
function clearLooted(store, formId) {
    var key = lootKey(formId);
    if (store[key] === undefined)
        return false;
    delete store[key];
    return true;
}
/** Drop expired entries; returns how many were removed. */
function pruneLooted(store, gameDays, expiryDays) {
    if (expiryDays === void 0) { expiryDays = LOOT_EXPIRY_DAYS; }
    var pruned = 0;
    for (var _i = 0, _a = Object.keys(store); _i < _a.length; _i++) {
        var key = _a[_i];
        if (gameDays - store[key] >= expiryDays) {
            delete store[key];
            pruned++;
        }
    }
    return pruned;
}
function serializeLoot(store) {
    return JSON.stringify(store);
}
/** Tolerant parse — a corrupt sidecar must never crash the plugin. */
function parseLoot(json) {
    try {
        var raw = JSON.parse(json);
        if (!raw || typeof raw !== "object" || Array.isArray(raw))
            return {};
        var store = {};
        for (var _i = 0, _a = Object.entries(raw); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (typeof value === "number" && Number.isFinite(value)) {
                store[key] = value;
            }
        }
        return store;
    }
    catch (_c) {
        return {};
    }
}


/***/ },

/***/ "./src/world/loot-tracker.ts"
/*!***********************************!*\
  !*** ./src/world/loot-tracker.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initLootTracker: () => (/* binding */ initLootTracker),
/* harmony export */   isContainerLooted: () => (/* binding */ isContainerLooted),
/* harmony export */   resetLootTrackerForTest: () => (/* binding */ resetLootTrackerForTest)
/* harmony export */ });
/* harmony import */ var _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../skyrimPlatform */ "./src/skyrimPlatform.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config */ "./src/config.ts");
/* harmony import */ var _events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events */ "./src/events.ts");
/* harmony import */ var _loot_core__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./loot-core */ "./src/world/loot-core.ts");




/**
 * Game-facing loot tracker (W3, plan D8). Attribution per the review fix:
 *  - PRIMARY: `containerChanged` with `newContainer === player` → the
 *    `oldContainer` was just searched (`menuOpen` carries NO target ref —
 *    it cannot identify the chest; skymp5-client containersService idiom).
 *  - SECONDARY (best effort): snapshot the last activated ref at
 *    ContainerMenu open and mark it at close — catches opened-but-empty
 *    containers, where no transfer ever fires.
 *  - `reset` (TESResetEvent) clears the entry: the container respawned.
 *  - `loadGame` prunes expired entries (the JS VM survives save/load, the
 *    file matters across game restarts).
 *
 * Persistence: `Data/Platform/SkyGuide/loot.json` sidecar, atomic write
 * (file-dump.ts pattern) — `sp.storage` dies on game restart, the sidecar
 * does not.
 */
var LOOT_PATH = "Data/Platform/SkyGuide/loot.json";
var fsModule;
function loadFs() {
    if (fsModule !== undefined)
        return fsModule;
    try {
        fsModule = __webpack_require__(/*! fs */ "fs");
    }
    catch (_a) {
        fsModule = null;
    }
    return fsModule;
}
var store = {};
var menuHint;
var initialized = false;
function debugLog(message) {
    if (_config__WEBPACK_IMPORTED_MODULE_1__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[loot-tracker] ".concat(message));
    }
}
function nowDays() {
    var _a;
    try {
        return (_a = _skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.Utility.getCurrentGameTime()) !== null && _a !== void 0 ? _a : 0;
    }
    catch (_b) {
        return 0;
    }
}
function persist() {
    var fs = loadFs();
    if (!fs)
        return;
    var tmp = "".concat(LOOT_PATH, ".tmp");
    try {
        var idx = Math.max(LOOT_PATH.lastIndexOf("/"), LOOT_PATH.lastIndexOf("\\"));
        if (idx > 0) {
            try {
                fs.mkdirSync(LOOT_PATH.slice(0, idx), { recursive: true });
            }
            catch (_a) {
                // Directory may already exist.
            }
        }
        fs.writeFileSync(tmp, (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.serializeLoot)(store));
        fs.renameSync(tmp, LOOT_PATH);
    }
    catch (err) {
        debugLog("persist failed: ".concat(String(err)));
    }
}
function restore() {
    var fs = loadFs();
    if (!fs || typeof fs.readFileSync !== "function")
        return;
    try {
        store = (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.parseLoot)(fs.readFileSync(LOOT_PATH, "utf-8"));
        debugLog("restored ".concat(Object.keys(store).length, " looted entries"));
    }
    catch (_a) {
        store = {};
    }
}
function initLootTracker() {
    if (initialized)
        return;
    initialized = true;
    restore();
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("containerChanged", function (event) {
        var _a, _b, _c, _d;
        try {
            var newId = (_b = (_a = event.newContainer) === null || _a === void 0 ? void 0 : _a.getFormID()) !== null && _b !== void 0 ? _b : 0;
            var oldId = (_d = (_c = event.oldContainer) === null || _c === void 0 ? void 0 : _c.getFormID()) !== null && _d !== void 0 ? _d : 0;
            if (newId === _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID && oldId && oldId !== _config__WEBPACK_IMPORTED_MODULE_1__.PLAYER_FORM_ID) {
                (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.markLooted)(store, oldId, nowDays());
                debugLog("container ".concat(oldId, " looted via transfer"));
                persist();
            }
        }
        catch (_e) {
            // Bad refs must never break the event pipeline.
        }
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuOpen", function (event) {
        if (event.name === "ContainerMenu") {
            menuHint = (0,_events__WEBPACK_IMPORTED_MODULE_2__.getLastActivatedRef)();
        }
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("menuClose", function (event) {
        if (event.name === "ContainerMenu") {
            if (menuHint !== undefined) {
                (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.markLooted)(store, menuHint, nowDays());
                debugLog("container ".concat(menuHint, " looted via menu close"));
                persist();
            }
            menuHint = undefined;
        }
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("reset", function (event) {
        var _a, _b;
        try {
            var formId = (_b = (_a = event.object) === null || _a === void 0 ? void 0 : _a.getFormID()) !== null && _b !== void 0 ? _b : 0;
            if (formId && (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.clearLooted)(store, formId)) {
                debugLog("container ".concat(formId, " respawned \u2014 entry cleared"));
                persist();
            }
        }
        catch (_c) {
            // Ignore bad refs.
        }
    });
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("loadGame", function () {
        var pruned = (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.pruneLooted)(store, nowDays());
        if (pruned > 0) {
            debugLog("loadGame: pruned ".concat(pruned, " expired entries"));
        }
        persist();
    });
}
/** Scanner hook: pure map lookup, no Papyrus cost. */
function isContainerLooted(formId) {
    return (0,_loot_core__WEBPACK_IMPORTED_MODULE_3__.isLooted)(store, formId, nowDays());
}
/** Test seam. */
function resetLootTrackerForTest() {
    store = {};
    menuHint = undefined;
    initialized = false;
}


/***/ },

/***/ "./src/world/navigation-core.ts"
/*!**************************************!*\
  !*** ./src/world/navigation-core.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AUTOWALK_ACK_EVENT: () => (/* binding */ AUTOWALK_ACK_EVENT),
/* harmony export */   AUTOWALK_ARRIVED_EVENT: () => (/* binding */ AUTOWALK_ARRIVED_EVENT),
/* harmony export */   AUTOWALK_CANCEL_EVENT: () => (/* binding */ AUTOWALK_CANCEL_EVENT),
/* harmony export */   AUTOWALK_CMD_EVENT: () => (/* binding */ AUTOWALK_CMD_EVENT),
/* harmony export */   AUTOWALK_READY_EVENT: () => (/* binding */ AUTOWALK_READY_EVENT),
/* harmony export */   canTransition: () => (/* binding */ canTransition),
/* harmony export */   decodeAutowalkCommand: () => (/* binding */ decodeAutowalkCommand),
/* harmony export */   encodeAutowalkCommand: () => (/* binding */ encodeAutowalkCommand)
/* harmony export */ });
/**
 * Pure autowalk/navigation logic — NO skyrimPlatform imports.
 *
 * Mod-event contract (verified against the skymp sources, 2026-11-16 — see
 * plan W6 evidence): JS calls `questRef.sendModEvent(eventName, strArg,
 * numArg)`; the ESP script's `RegisterForModEvent` callback receives
 * `(string strArg, float numArg)`. numArg is packed float32 (~7 digits) so
 * the formId MUST travel in strArg — here: JSON. Names are UNIQUE (D5) —
 * sharing Skyrim Access's event names would trigger both mods' autowalk.
 */
var AUTOWALK_CMD_EVENT = "SkyGuide_AutoWalkCmd";
var AUTOWALK_ACK_EVENT = "SkyGuide_AutoWalkAck";
var AUTOWALK_ARRIVED_EVENT = "SkyGuide_AutoWalkArrived";
var AUTOWALK_CANCEL_EVENT = "SkyGuide_AutoWalkCancel";
/**
 * ESP announce: the quest script sends this at OnInit (game launch) and on
 * every save-load re-register. `event.sender` IS the quest form — the JS
 * side stores it and never needs the quest's form ID (any CK-built form id
 * works).
 */
var AUTOWALK_READY_EVENT = "SkyGuide_AutoWalkReady";
/** JSON payload in strArg — formIds ≥ 0xFF000000 survive (float32 would not). */
function encodeAutowalkCommand(command) {
    return JSON.stringify({ f: command.formId.toString(16), d: command.stopDistance });
}
/** Tolerant decode — a malformed payload must fail the action, not the VM. */
function decodeAutowalkCommand(strArg) {
    try {
        var raw = JSON.parse(strArg);
        if (!raw || typeof raw !== "object")
            return null;
        var record = raw;
        if (typeof record.f !== "string")
            return null;
        var formId = Number.parseInt(record.f, 16);
        if (!Number.isFinite(formId) || formId <= 0)
            return null;
        var stopDistance = typeof record.d === "number" && Number.isFinite(record.d) && record.d > 0
            ? record.d
            : 100;
        return { formId: formId, stopDistance: stopDistance };
    }
    catch (_a) {
        return null;
    }
}
/**
 * Status transitions (pure) — the glue owns timers/events, this owns the
 * legality of each hop. Any status may reset to "idle".
 */
function canTransition(from, to) {
    if (to === "idle")
        return true;
    switch (from) {
        case "idle":
            return to === "walking" || to === "failed";
        case "walking":
            return to === "arrived" || to === "cancelled" || to === "failed";
        default:
            // arrived/cancelled/failed are terminal until the next command resets.
            return false;
    }
}


/***/ },

/***/ "./src/world/scanner-core.ts"
/*!***********************************!*\
  !*** ./src/world/scanner-core.ts ***!
  \***********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FORM_TYPE: () => (/* binding */ FORM_TYPE),
/* harmony export */   SCAN_DEFAULTS: () => (/* binding */ SCAN_DEFAULTS),
/* harmony export */   absoluteBearingDeg: () => (/* binding */ absoluteBearingDeg),
/* harmony export */   assembleFlags: () => (/* binding */ assembleFlags),
/* harmony export */   classifyCategory: () => (/* binding */ classifyCategory),
/* harmony export */   distanceUnits: () => (/* binding */ distanceUnits),
/* harmony export */   finalizeCandidates: () => (/* binding */ finalizeCandidates),
/* harmony export */   isOpenState: () => (/* binding */ isOpenState),
/* harmony export */   isScanCacheStale: () => (/* binding */ isScanCacheStale),
/* harmony export */   relativeBearingDeg: () => (/* binding */ relativeBearingDeg)
/* harmony export */ });
/**
 * Pure world-scanner logic — NO skyrimPlatform imports. Everything here must
 * stay runnable under plain Node (vitest) so the cache/flag/bearing math can
 * be regression-tested without the game.
 *
 * FormType numeric values are mirrored from the installed typings
 * (`@skyrim-platform/skyrim-platform/index.d.ts`, `export const enum FormType`):
 * Activator=24, Container=28, Door=29, Flora=39, Furniture=40, Character=62.
 * (Never copy the numeric table in crosshair-collector.ts — 26/27 are
 * Armor/Book there, which is wrong.)
 */
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var FORM_TYPE = {
    activator: 24,
    container: 28,
    door: 29,
    flora: 39,
    furniture: 40,
    character: 62,
};
/** Tuning constants ported from Skyrim Access (docs/ACCESSIBILITY-PORT.md §5.6). */
var SCAN_DEFAULTS = {
    /** Re-sweep after the player moved this far (their RESCAN_DISTANCE). */
    rescanDistanceUnits: 100,
    /** Maximum objects kept in the cache (sorted nearest-first). */
    maxOutput: 64,
    /** Papyrus probes allowed per update pass (hitch protection). */
    probeBudgetPerPass: 96,
    /** Parent cell + N recently cellFullyLoaded cells. */
    maxCells: 4,
    /** Sweep radius in world units. */
    radiusUnits: 2500,
};
function classifyCategory(formType) {
    switch (formType) {
        case FORM_TYPE.character:
            return "npc";
        case FORM_TYPE.door:
            return "door";
        case FORM_TYPE.container:
            return "container";
        case FORM_TYPE.activator:
            return "activator";
        case FORM_TYPE.flora:
            return "flora";
        case FORM_TYPE.furniture:
            return "furniture";
        default:
            return "other";
    }
}
/**
 * ObjectReference.getOpenState(): 1/2 = open or opening, 3/4 = closed or
 * closing, 0 = not an open/close ref (CK wiki semantics).
 */
function isOpenState(openState) {
    return openState === 1 || openState === 2;
}
function assembleFlags(input) {
    var flags = [];
    if (input.isLocked)
        flags.push("locked");
    if (input.formType === FORM_TYPE.container &&
        input.numItems !== null &&
        input.numItems === 0) {
        flags.push("empty");
    }
    if (input.formType === FORM_TYPE.character && input.isDead)
        flags.push("corpse");
    if (input.formType === FORM_TYPE.door && isOpenState(input.openState))
        flags.push("open");
    if (input.formType === FORM_TYPE.flora && input.isHarvested)
        flags.push("harvested");
    if (input.formType === FORM_TYPE.container && input.isLooted)
        flags.push("looted");
    return flags;
}
/** Absolute world bearing: 0 = north (+Y), 90 = east (+X), clockwise. */
function absoluteBearingDeg(dx, dy) {
    return (Math.atan2(dx, dy) * 180) / Math.PI;
}
function relativeBearingDeg(absoluteDeg, playerFacingDeg) {
    return ((absoluteDeg - playerFacingDeg + 540) % 360) - 180;
}
function distanceUnits(dx, dy, dz) {
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
/**
 * Cache invalidation, ported from their scanner: re-sweep after the player
 * moved RESCAN_DISTANCE units or changed cells.
 */
function isScanCacheStale(cache, current, rescanDistanceUnits) {
    if (rescanDistanceUnits === void 0) { rescanDistanceUnits = SCAN_DEFAULTS.rescanDistanceUnits; }
    if (cache.cellIds.length !== current.cellIds.length)
        return true;
    var a = __spreadArray([], cache.cellIds, true).sort(function (x, y) { return x - y; }).join(",");
    var b = __spreadArray([], current.cellIds, true).sort(function (x, y) { return x - y; }).join(",");
    if (a !== b)
        return true;
    var dx = current.pos.x - cache.pos.x;
    var dy = current.pos.y - cache.pos.y;
    var dz = current.pos.z - cache.pos.z;
    return distanceUnits(dx, dy, dz) >= rescanDistanceUnits;
}
/**
 * Sort nearest-first, cap the output, and derive distance/bearing/dz/flags
 * from the raw probes. This is the only place candidate math happens so the
 * sweep stays a dumb probe collector.
 */
function finalizeCandidates(candidates, playerPos, playerFacingDeg, maxOutput) {
    if (maxOutput === void 0) { maxOutput = SCAN_DEFAULTS.maxOutput; }
    var objects = [];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var candidate = candidates_1[_i];
        var dx = candidate.x - playerPos.x;
        var dy = candidate.y - playerPos.y;
        var dz = candidate.z - playerPos.z;
        var distance = distanceUnits(dx, dy, dz);
        var bearing = ((absoluteBearingDeg(dx, dy) % 360) + 360) % 360;
        objects.push({
            formId: candidate.formId,
            name: candidate.name,
            category: classifyCategory(candidate.formType),
            distance: distance,
            bearingDeg: Math.round(bearing * 10) / 10,
            relativeDeg: Math.round(relativeBearingDeg(bearing, playerFacingDeg) * 10) / 10,
            lockLevel: candidate.isLocked ? candidate.lockLevel : 0,
            dz: Math.round(dz * 10) / 10,
            flags: assembleFlags(candidate),
        });
    }
    objects.sort(function (a, b) { return a.distance - b.distance; });
    return objects.slice(0, Math.max(0, maxOutput));
}


/***/ },

/***/ "./src/world/stuck-core.ts"
/*!*********************************!*\
  !*** ./src/world/stuck-core.ts ***!
  \*********************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   STUCK_DEFAULTS: () => (/* binding */ STUCK_DEFAULTS),
/* harmony export */   evaluateStuck: () => (/* binding */ evaluateStuck),
/* harmony export */   nearestObstacleRelBearing: () => (/* binding */ nearestObstacleRelBearing),
/* harmony export */   pushStuckSample: () => (/* binding */ pushStuckSample)
/* harmony export */ });
/* harmony import */ var _scanner_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./scanner-core */ "./src/world/scanner-core.ts");
/**
 * Pure stuck-detection logic — NO skyrimPlatform imports.
 * Ported from Skyrim Access's blocked_stop state machine (§5.5): movement
 * input held + position delta below threshold over a confirmation window.
 * We cannot neutralise the input events (needs the ProcessEvent hook), so we
 * DETECT and REPORT — the app turns it into "Vous êtes bloqué. Tourne à…".
 *
 * Thresholds (§5.6): position delta < ~8 units; ~0.5 s confirmation. At our
 * 500 ms tick, a 1200 ms window holds ~3 samples — the 0.5 s confirm demands
 * at least 2. Movement keys come from the input collector (no extra Papyrus
 * polls); mapped-key probing (§4) is a later refinement.
 */
var __spreadArray = (undefined && undefined.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};

var STUCK_DEFAULTS = {
    /** Position window: |pos − pos(windowMs ago)| decides "not moving". */
    windowMs: 1200,
    /** Below this delta over the window, the player is not making progress. */
    minMovementUnits: 8,
    /** Minimum window occupancy before declaring stuck (their ~0.5 s confirm). */
    confirmMs: 500,
    maxSamples: 16,
    /** Nearest scanner object within this range counts as the obstacle. */
    obstacleRangeUnits: 500,
};
/** Append + time-prune. Returns a new array (pure). */
function pushStuckSample(history, sample, nowMs, maxSamples) {
    if (maxSamples === void 0) { maxSamples = STUCK_DEFAULTS.maxSamples; }
    var next = __spreadArray(__spreadArray([], history, true), [sample], false);
    var cutoff = nowMs - STUCK_DEFAULTS.windowMs * 4;
    return next.filter(function (entry) { return entry.tMs >= cutoff; }).slice(-maxSamples);
}
function evaluateStuck(history, nowMs, config) {
    if (config === void 0) { config = STUCK_DEFAULTS; }
    var newest = history[history.length - 1];
    if (!newest)
        return { stuck: false, confirmMs: 0 };
    if (!newest.keysHeld || newest.excluded)
        return { stuck: false, confirmMs: 0 };
    // Reference sample: the oldest sample inside the window (or the oldest we
    // kept if the window is not yet full).
    var reference = history[0];
    for (var _i = 0, history_1 = history; _i < history_1.length; _i++) {
        var entry = history_1[_i];
        if (nowMs - entry.tMs <= config.windowMs) {
            reference = entry;
            break;
        }
    }
    var span = newest.tMs - reference.tMs;
    if (span < config.confirmMs)
        return { stuck: false, confirmMs: span };
    // Every sample in the window must show held keys and a non-excluded state —
    // one menu blip or swim tick resets the confirmation.
    for (var _a = 0, history_2 = history; _a < history_2.length; _a++) {
        var entry = history_2[_a];
        if (entry.tMs < reference.tMs)
            continue;
        if (!entry.keysHeld || entry.excluded) {
            return { stuck: false, confirmMs: span };
        }
    }
    var delta = (0,_scanner_core__WEBPACK_IMPORTED_MODULE_0__.distanceUnits)(newest.pos.x - reference.pos.x, newest.pos.y - reference.pos.y, newest.pos.z - reference.pos.z);
    return {
        stuck: delta < config.minMovementUnits,
        confirmMs: span,
    };
}
/**
 * Nearest scanner object within range becomes "the obstacle" — its
 * player-relative bearing drives the reflex's turn direction.
 * Returns undefined when the scanner sees nothing (state gap).
 */
function nearestObstacleRelBearing(worldObjects, rangeUnits) {
    if (rangeUnits === void 0) { rangeUnits = STUCK_DEFAULTS.obstacleRangeUnits; }
    for (var _i = 0, worldObjects_1 = worldObjects; _i < worldObjects_1.length; _i++) {
        var object = worldObjects_1[_i];
        // The scanner cache is distance-sorted nearest-first.
        if (object.distance <= rangeUnits)
            return object.relativeDeg;
        break; // first entry is the nearest; if it's out of range, all are
    }
    return undefined;
}


/***/ },

/***/ "./src/world/stuck-detection.ts"
/*!**************************************!*\
  !*** ./src/world/stuck-detection.ts ***!
  \**************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   evaluateStuckNow: () => (/* binding */ evaluateStuckNow),
/* harmony export */   resetStuckDetectionForTest: () => (/* binding */ resetStuckDetectionForTest)
/* harmony export */ });
/* harmony import */ var _world_stuck_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../world/stuck-core */ "./src/world/stuck-core.ts");

/**
 * Game-facing stuck detection (W3). Pure window math lives in
 * stuck-core.ts; this glue is called once per collection pass with data the
 * collectors already gathered (player position, WASD from the input
 * collector, scanner cache) — zero extra Papyrus probes.
 *
 * `excluded` resets the confirmation window: menus/loading (denylist),
 * death, swimming, mounted, seated, dialogue, autowalk.
 */
var history = [];
function evaluateStuckNow(input) {
    var keysHeld = input.keysPressed.some(function (key) { return key === "W" || key === "A" || key === "S" || key === "D"; });
    history = (0,_world_stuck_core__WEBPACK_IMPORTED_MODULE_0__.pushStuckSample)(history, {
        tMs: input.gameMs,
        pos: input.pos,
        keysHeld: keysHeld,
        excluded: input.excluded,
    }, input.gameMs);
    var evaluation = (0,_world_stuck_core__WEBPACK_IMPORTED_MODULE_0__.evaluateStuck)(history, input.gameMs);
    var bearing = evaluation.stuck
        ? (0,_world_stuck_core__WEBPACK_IMPORTED_MODULE_0__.nearestObstacleRelBearing)(input.worldObjects, _world_stuck_core__WEBPACK_IMPORTED_MODULE_0__.STUCK_DEFAULTS.obstacleRangeUnits)
        : undefined;
    return { stuck: evaluation.stuck, bearingRelDeg: bearing };
}
/** Test seam. */
function resetStuckDetectionForTest() {
    history = [];
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
/* harmony import */ var _game_state_collectors_item_events__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./game-state/collectors/item-events */ "./src/game-state/collectors/item-events.ts");
/* harmony import */ var _actions_polling__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./actions/polling */ "./src/actions/polling.ts");
/* harmony import */ var _arbitration_priority__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./arbitration/priority */ "./src/arbitration/priority.ts");
/* harmony import */ var _game_state_serializer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./game-state/serializer */ "./src/game-state/serializer.ts");
/* harmony import */ var _game_state_collector__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./game-state/collector */ "./src/game-state/collector.ts");
/* harmony import */ var _game_state_mod_context__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./game-state/mod-context */ "./src/game-state/mod-context.ts");
/* harmony import */ var _communication_file_dump__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./communication/file-dump */ "./src/communication/file-dump.ts");
/* harmony import */ var _game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./game-state/collectors/world-scanner */ "./src/game-state/collectors/world-scanner.ts");
/* harmony import */ var _world_loot_tracker__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./world/loot-tracker */ "./src/world/loot-tracker.ts");
/* harmony import */ var _game_state_collectors_effects_tracker__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./game-state/collectors/effects-tracker */ "./src/game-state/collectors/effects-tracker.ts");
/* harmony import */ var _world_autowalk__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./world/autowalk */ "./src/world/autowalk.ts");
/* harmony import */ var _communication_http_client__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./communication/http-client */ "./src/communication/http-client.ts");
/* harmony import */ var _bridge__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./bridge */ "./src/bridge.ts");
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./config */ "./src/config.ts");
/* harmony import */ var _diag__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./diag */ "./src/diag.ts");
/* harmony import */ var _game_state_skyrim_access__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./game-state/skyrim-access */ "./src/game-state/skyrim-access.ts");
/* harmony import */ var _game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./game-state/collectors/menu-focus */ "./src/game-state/collectors/menu-focus.ts");
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
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Connected: ".concat((0,_communication_http_client__WEBPACK_IMPORTED_MODULE_13__.isConnected)()));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Polling status: ".concat(pollingStarted ? "active" : "inactive"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Events registered: ".concat(eventsRegistered ? "yes" : "no"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Collectors count: ".concat(COLLECTORS_COUNT));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.tickInterval, "ms (on update)"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Debug mode: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode));
        var heartbeat = (0,_bridge__WEBPACK_IMPORTED_MODULE_14__.heartbeatAgeMs)();
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Companion bridge: ".concat((0,_bridge__WEBPACK_IMPORTED_MODULE_14__.isCompanionReady)() ? "ready (heartbeat ".concat(heartbeat, "ms ago)") : "not ready", ", overlay ").concat((0,_bridge__WEBPACK_IMPORTED_MODULE_14__.isOverlayVisible)() ? "visible" : "hidden"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Companion URL: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.companionUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  Mod-context dump: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.modContextDumpEnabled ? _config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.modContextPath : "off"));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("  World scanner: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.scannerEnabled ? "on (".concat((0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_9__.getWorldObjects)().length, " objects cached)") : "off"));
        // Returning false avoids running the original host command implementation.
        return false;
    };
    if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] Console: ~".concat(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE, " is now ~skyguide"));
    }
}
/**
 * Embed the parallel-array mod context into the serialized protocol payload
 * as the additive `context` field (ADR 0003 context lane over HTTP). The
 * payload is a JSON string; parse/re-stringify only when a context exists.
 */
function attachContext(payload, modContext) {
    if (modContext === null || modContext === undefined)
        return payload;
    try {
        var obj = JSON.parse(payload);
        obj.context = modContext;
        return JSON.stringify(obj);
    }
    catch (_a) {
        return payload;
    }
}
function processAndSend(eventType, animation) {
    var _a;
    if (animation === void 0) { animation = ""; }
    var bundle = (0,_game_state_collector__WEBPACK_IMPORTED_MODULE_6__.collectBundle)(animation, eventType);
    if (!bundle) {
        if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] collectBundle returned null; skip send");
        }
        return;
    }
    // Mod-context dump: file lane when Node fs allows it (disabled in the SP
    // runtime), ALWAYS attached to the POST as the additive `context` field —
    // the app's connector falls back to it when the file never appears.
    var state = bundle.protocol;
    var modContext = null;
    try {
        modContext = (0,_game_state_mod_context__WEBPACK_IMPORTED_MODULE_7__.buildModContext)(bundle.snapshot, state, { skyrimAccessInstalled: (0,_game_state_skyrim_access__WEBPACK_IMPORTED_MODULE_17__.isSkyrimAccessInstalled)() });
        (0,_communication_file_dump__WEBPACK_IMPORTED_MODULE_8__.dumpModContext)(modContext);
    }
    catch (err) {
        if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] mod-context dump threw: ".concat(String(err)));
        }
    }
    if (!(0,_communication_http_client__WEBPACK_IMPORTED_MODULE_13__.isConnected)()) {
        return;
    }
    var priority = (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_4__.evaluatePriority)(state);
    var menuEvent = (_a = state.menu) === null || _a === void 0 ? void 0 : _a.event;
    // Item-action events have no commit semantics (fire-and-forget) — only a
    // real staged menu-focus event enters the pending/inFlight handshake.
    var stagedMenuFocus = (0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.peekMenuFocus)() !== undefined;
    var menuPosted = Boolean(menuEvent) && stagedMenuFocus;
    if (!menuEvent && !(0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_4__.shouldSend)(priority, state)) {
        return;
    }
    var payload = attachContext((0,_game_state_serializer__WEBPACK_IMPORTED_MODULE_5__.serializeState)(state, priority), modContext);
    if (menuPosted) {
        (0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.beginMenuFocusSend)();
    }
    (0,_communication_http_client__WEBPACK_IMPORTED_MODULE_13__.sendGameState)(payload)
        .then(function (sent) {
        if (menuPosted) {
            (0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.commitMenuFocusSend)(sent);
        }
        if (sent) {
            (0,_arbitration_priority__WEBPACK_IMPORTED_MODULE_4__.recordSentState)(state);
            if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Sent state: ".concat(priority, " priority (").concat(eventType, ")"));
            }
        }
    })
        .catch(function (err) {
        if (menuPosted) {
            (0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.commitMenuFocusSend)(false);
        }
        var msg = err instanceof Error ? err.message : String(err);
        if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
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
        if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
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
    (0,_diag__WEBPACK_IMPORTED_MODULE_16__.logDiag)("[SkyGuide] plugin init \u2014 dump=".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.modContextDumpEnabled ? _config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.modContextPath : "off", " server=").concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.serverUrl, " menuNarration=").concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.menuNarrationEnabled, " autowalk=").concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.autowalkEnabled));
    // Game settings can only be touched once a game world exists — calling this
    // at the main menu throws. See the once("update") hook below.
    (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
        applyGameQolSettings();
    });
    (0,_events__WEBPACK_IMPORTED_MODULE_1__.registerAllEvents)(__assign({}, (0,_game_state_collectors_item_events__WEBPACK_IMPORTED_MODULE_2__.itemEventHandlers)()));
    eventsRegistered = true;
    (0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_9__.initWorldScanner)();
    (0,_world_loot_tracker__WEBPACK_IMPORTED_MODULE_10__.initLootTracker)();
    (0,_game_state_collectors_effects_tracker__WEBPACK_IMPORTED_MODULE_11__.initEffectsTracker)();
    (0,_world_autowalk__WEBPACK_IMPORTED_MODULE_12__.initAutowalk)();
    (0,_actions_polling__WEBPACK_IMPORTED_MODULE_3__.startPolling)();
    pollingStarted = _config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.pollingEnabled;
    (0,_bridge__WEBPACK_IMPORTED_MODULE_14__.initBridge)();
    if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Server: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.serverUrl));
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Send interval: ".concat(_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.tickInterval, "ms (on update)"));
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
        }, _config__WEBPACK_IMPORTED_MODULE_15__.PLAYER_FORM_ID, _config__WEBPACK_IMPORTED_MODULE_15__.PLAYER_FORM_ID, "Attack*");
    }
    catch (err) {
        var msg = err instanceof Error ? err.message : String(err);
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] sendAnimationEvent hook failed (non-fatal): ".concat(msg));
    }
    isLoaded = true;
}
// Skyrim Platform only emits "update" once a game world exists (JsTick passes
// gameFunctionsAvailable=false at the main menu, where only "tick" fires).
// Initialize on whichever arrives first so the console command and the
// mod-context dump exist before the player loads a save.
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("tick", function () {
    init();
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.once)("update", function () {
    init();
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("update", function () {
    var now = Date.now();
    try {
        (0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.pumpMenuFocus)(now);
    }
    catch (err) {
        if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
            (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] menu focus pump threw: ".concat(String(err)));
        }
    }
    var menuDue = ((0,_game_state_collectors_menu_focus__WEBPACK_IMPORTED_MODULE_18__.hasPendingMenuFocus)() || (0,_game_state_collectors_item_events__WEBPACK_IMPORTED_MODULE_2__.hasPendingItemEvent)()) && (0,_communication_http_client__WEBPACK_IMPORTED_MODULE_13__.isConnected)();
    var fullTick = now - lastTickTime >= _config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.tickInterval;
    if (!fullTick && !menuDue) {
        return;
    }
    if (fullTick) {
        lastTickTime = now;
    }
    // Budgeted world-scanner pass — skip on menu-only sends so arrowing a
    // list does not hitch the game thread with a cell sweep.
    if (fullTick) {
        try {
            (0,_game_state_collectors_world_scanner__WEBPACK_IMPORTED_MODULE_9__.pumpWorldScanner)();
        }
        catch (err) {
            if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
                (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("[SkyGuide] world scanner pump threw: ".concat(String(err)));
            }
        }
    }
    var animation = playerAnimation;
    playerAnimation = "";
    safeProcessAndSend("tick", animation);
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("combatState", function (event) {
    var actor = event.actor.getFormID();
    if (actor !== _config__WEBPACK_IMPORTED_MODULE_15__.PLAYER_FORM_ID)
        return;
    var newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
    var oldState = lastCombatState;
    lastCombatState = newState;
    safeProcessAndSend("combatState_".concat(newState));
    if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Combat state changed: ".concat(oldState, " -> ").concat(newState));
    }
});
(0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.on)("hit", function (event) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var target = (_c = (_b = (_a = event.target) === null || _a === void 0 ? void 0 : _a.getFormID) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 0;
    var source = (_f = (_e = (_d = event.aggressor) === null || _d === void 0 ? void 0 : _d.getFormID) === null || _e === void 0 ? void 0 : _e.call(_d)) !== null && _f !== void 0 ? _f : 0;
    var sourceBaseForm = (_h = (_g = event.source) === null || _g === void 0 ? void 0 : _g.getFormID) === null || _h === void 0 ? void 0 : _h.call(_g);
    if (target !== _config__WEBPACK_IMPORTED_MODULE_15__.PLAYER_FORM_ID && source !== _config__WEBPACK_IMPORTED_MODULE_15__.PLAYER_FORM_ID)
        return;
    safeProcessAndSend("hit");
    if (_config__WEBPACK_IMPORTED_MODULE_15__.CONFIG.debugMode) {
        (0,_skyrimPlatform__WEBPACK_IMPORTED_MODULE_0__.printConsole)("Hit event: target=".concat(target, ", source=").concat(source, ", sourceForm=").concat(String(sourceBaseForm)));
    }
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOLDRCQUE0QjtBQUM1QjtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTiw0QkFBNEI7QUFDNUI7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ04sNEJBQTRCO0FBQzVCO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLElBQUksbURBQUU7QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsSUFBSSxtREFBRTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ047QUFDQTtBQUNBLEtBQUs7QUFDTCxJQUFJLG1EQUFFO0FBQ04sOEJBQThCO0FBQzlCO0FBQ0E7QUFD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RSxvREFBYztBQUN6QztBQUNBO0FBQ0E7QUFDQSxRQUFRLDZEQUFZO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQUk7QUFDSjtBQUNBLENBQUM7QUFDRCxxREFBSTtBQUNKO0FBQ0EsQ0FBQztBQUNELG1EQUFFO0FBQ0Y7QUFDQTtBQUNBLFFBQVEsaUZBQWE7QUFDckI7QUFDQTtBQUNBLFlBQVksNENBQU07QUFDbEIsWUFBWSw2REFBWTtBQUN4QjtBQUNBO0FBQ0EsbUJBQW1CLHVGQUFtQixNQUFNLHVGQUFtQixPQUFPLHdFQUFXO0FBQ2pGLHlDQUF5Qyw0Q0FBTTtBQUMvQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFlBQVksc0ZBQWdCO0FBQzVCO0FBQ0E7QUFDQSxnQkFBZ0IsNENBQU07QUFDdEIsZ0JBQWdCLDZEQUFZO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0Esa0JBQWtCLG9EQUFjO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLDRDQUFNO0FBQ2QsUUFBUSw2REFBWTtBQUNwQjtBQUNBLENBQUM7QUFDRCxtREFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLG9EQUFjLGVBQWUsb0RBQWM7QUFDOUQ7QUFDQTtBQUNBLFFBQVEsNENBQU07QUFDZCxRQUFRLDZEQUFZO0FBQ3BCO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL2V4ZWN1dG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hY3Rpb25zL3BhcnNlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvYWN0aW9ucy9wb2xsaW5nLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9hcmJpdHJhdGlvbi9wcmlvcml0eS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvYnJpZGdlLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9jb21tdW5pY2F0aW9uL2ZpbGUtZHVtcC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29tbXVuaWNhdGlvbi9odHRwLWNsaWVudC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvY29uZmlnLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9kaWFnLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9ldmVudHMudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvY3Jvc3NoYWlyLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2VmZmVjdHMtdHJhY2tlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2Vudmlyb25tZW50LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2lucHV0LWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2ludmVudG9yeS1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9pdGVtLWV2ZW50cy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL2xvY2F0aW9uLWNvbGxlY3Rvci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL21lbnUtY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvbWVudS1mb2N1cy50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL25lYXJieS1jb2xsZWN0b3IudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9wbGF5ZXItY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvcXVlc3QtY29sbGVjdG9yLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvd29ybGQtc2Nhbm5lci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9pbnZlbnRvcnktY29yZS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9tZW51LWZvY3VzLWNvcmUudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL2dhbWUtc3RhdGUvbWVudS1zdGF0ZS50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9tb2QtY29udGV4dC50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvZ2FtZS1zdGF0ZS9zZXJpYWxpemVyLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9nYW1lLXN0YXRlL3NreXJpbS1hY2Nlc3MudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3NreXJpbVBsYXRmb3JtLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy90aW1lcnMudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3dvcmxkL2F1dG93YWxrLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy93b3JsZC9sb290LWNvcmUudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3dvcmxkL2xvb3QtdHJhY2tlci50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vLi9zcmMvd29ybGQvbmF2aWdhdGlvbi1jb3JlLnRzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy93b3JsZC9zY2FubmVyLWNvcmUudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3dvcmxkL3N0dWNrLWNvcmUudHMiLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luLy4vc3JjL3dvcmxkL3N0dWNrLWRldGVjdGlvbi50cyIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vZXh0ZXJuYWwgY29tbW9uanMgXCJmc1wiIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi9leHRlcm5hbCB2YXIgW1wic2t5cmltUGxhdGZvcm1cIl0iLCJ3ZWJwYWNrOi8vc2t5Z3VpZGUtcGx1Z2luL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9za3lndWlkZS1wbHVnaW4vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3NreWd1aWRlLXBsdWdpbi8uL3NyYy9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEZWJ1ZywgRHhTY2FuQ29kZSwgRm9ybVR5cGUsIEdhbWUsIElucHV0LCBPYmplY3RSZWZlcmVuY2UsIFVpLCBwcmludENvbnNvbGUsIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgc2V0R2FtZVRpbWVvdXQgfSBmcm9tIFwiLi4vdGltZXJzXCI7XG5pbXBvcnQgeyBnZXRXb3JsZE9iamVjdHMsIGludmFsaWRhdGVXb3JsZFNjYW4gfSBmcm9tIFwiLi4vZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL3dvcmxkLXNjYW5uZXJcIjtcbmltcG9ydCB7IHJlcXVlc3RBdXRvd2FsaywgY2FuY2VsQXV0b3dhbGsgfSBmcm9tIFwiLi4vd29ybGQvYXV0b3dhbGtcIjtcbmZ1bmN0aW9uIGxvZ0RlYnVnKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbYWN0aW9ucy9leGVjdXRvcl0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpc1ZhbGlkRm9ybShmb3JtKSB7XG4gICAgaWYgKGZvcm0gPT09IG51bGwgfHwgZm9ybSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBmb3JtICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGNhbmRpZGF0ZSA9IGZvcm07XG4gICAgdmFyIGRlbGV0ZWQgPSB0eXBlb2YgY2FuZGlkYXRlLmlzRGVsZXRlZCA9PT0gXCJmdW5jdGlvblwiID8gY2FuZGlkYXRlLmlzRGVsZXRlZCgpIDogZmFsc2U7XG4gICAgdmFyIGRpc2FibGVkID0gdHlwZW9mIGNhbmRpZGF0ZS5pc0Rpc2FibGVkID09PSBcImZ1bmN0aW9uXCIgPyBjYW5kaWRhdGUuaXNEaXNhYmxlZCgpIDogZmFsc2U7XG4gICAgcmV0dXJuICFkZWxldGVkICYmICFkaXNhYmxlZDtcbn1cbmZ1bmN0aW9uIGdldFJlZmVyZW5jZUZvcm1JZChyZWYpIHtcbiAgICBpZiAocmVmID09PSBudWxsIHx8IHJlZiA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiByZWYgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBjYW5kaWRhdGUgPSByZWY7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUuZ2V0Rm9ybUlEID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdmFyIGlkID0gY2FuZGlkYXRlLmdldEZvcm1JRCgpO1xuICAgICAgICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiID8gaWQgOiBudWxsO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZS5nZXRGb3JtSWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB2YXIgaWQgPSBjYW5kaWRhdGUuZ2V0Rm9ybUlkKCk7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgPyBpZCA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gaXNWYWxpZFJlZmVyZW5jZShyZWYpIHtcbiAgICBpZiAocmVmID09PSBudWxsIHx8IHJlZiA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiByZWYgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgY2FuZGlkYXRlID0gcmVmO1xuICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlLmFjdGl2YXRlICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZm9ybUlkID0gZ2V0UmVmZXJlbmNlRm9ybUlkKHJlZik7XG4gICAgaWYgKGZvcm1JZCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmb3JtID0gR2FtZS5nZXRGb3JtRXgoZm9ybUlkKTtcbiAgICByZXR1cm4gaXNWYWxpZEZvcm0oZm9ybSk7XG59XG5mdW5jdGlvbiBnZXRQbGF5ZXJQb3NpdGlvbihwbGF5ZXIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB4OiBwbGF5ZXIuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgejogcGxheWVyLmdldFBvc2l0aW9uWigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBpc0FjdGlvbkJsb2NrZWRCeVVpKCkge1xuICAgIGlmIChVaS5pc01lbnVPcGVuKFwiTG9hZGluZyBNZW51XCIpKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiQWN0aW9uIGJsb2NrZWQ6IExvYWRpbmcgTWVudSBpcyBvcGVuXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKFVpLmlzTWVudU9wZW4oXCJNZXNzYWdlQm94TWVudVwiKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBNZXNzYWdlQm94TWVudSBpcyBvcGVuXCIpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuLyoqXG4gKiBOZWFyZXN0IGxvYWRlZCByZWZlcmVuY2Ugb2YgYSBnaXZlbiBmb3JtIHR5cGUgaW4gdGhlIHBsYXllcidzIGNlbGwsIGZvdW5kIGJ5XG4gKiBjZWxsIGVudW1lcmF0aW9uIChDZWxsLmdldE51bVJlZnMvZ2V0TnRoUmVmIOKAlCB2ZXJpZmllZCBBUElzOyB0aGUgb2xkXG4gKiBgR2FtZS5maW5kQ2xvc2VzdFJlZmVyZW5jZWAgY2FsbCBoZXJlIHdhcyBOT1QgYSByZWFsIEFQSSkuIENlbGwgb3JkZXIgaXMgbm90XG4gKiBkaXN0YW5jZS1vcmRlcmVkLCBzbyB3ZSBzY2FuIGFuZCBwaWNrIHRoZSBjbG9zZXN0IHZhbGlkIG9uZS5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdFJlZmVyZW5jZU9mVHlwZShwbGF5ZXIsIGZvcm1UeXBlLCBwbGF5ZXJGb3JtSWQpIHtcbiAgICB2YXIgX2E7XG4gICAgdmFyIGNlbGwgPSBwbGF5ZXIuZ2V0UGFyZW50Q2VsbCgpO1xuICAgIGlmICghY2VsbCB8fCB0eXBlb2YgY2VsbC5nZXROdW1SZWZzICE9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGNlbGwuZ2V0TnRoUmVmICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBjb3VudCA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgY291bnQgPSAoX2EgPSBjZWxsLmdldE51bVJlZnMoZm9ybVR5cGUpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBiZXN0ID0gbnVsbDtcbiAgICB2YXIgYmVzdERpc3RhbmNlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIHZhciBvcmlnaW4gPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICB2YXIgcmVmID0gY2VsbC5nZXROdGhSZWYoaSwgZm9ybVR5cGUpO1xuICAgICAgICBpZiAoIXJlZiB8fCAhaXNWYWxpZFJlZmVyZW5jZShyZWYpKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBnZXRSZWZlcmVuY2VGb3JtSWQocmVmKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gbnVsbCB8fCBmb3JtSWQgPT09IHBsYXllckZvcm1JZClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAoIW9yaWdpbikge1xuICAgICAgICAgICAgb3JpZ2luID0gZ2V0UGxheWVyUG9zaXRpb24ocGxheWVyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW9yaWdpbilcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgY2FuZGlkYXRlID0gcmVmO1xuICAgICAgICB2YXIgZHggPSBjYW5kaWRhdGUuZ2V0UG9zaXRpb25YKCkgLSBvcmlnaW4ueDtcbiAgICAgICAgdmFyIGR5ID0gY2FuZGlkYXRlLmdldFBvc2l0aW9uWSgpIC0gb3JpZ2luLnk7XG4gICAgICAgIHZhciBkeiA9IGNhbmRpZGF0ZS5nZXRQb3NpdGlvblooKSAtIG9yaWdpbi56O1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG4gICAgICAgIGlmIChkaXN0YW5jZSA8IGJlc3REaXN0YW5jZSkge1xuICAgICAgICAgICAgYmVzdERpc3RhbmNlID0gZGlzdGFuY2U7XG4gICAgICAgICAgICBiZXN0ID0gcmVmO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBiZXN0O1xufVxuZnVuY3Rpb24gZXhlY3V0ZVNhZmVseShhY3Rpb25UeXBlLCBvcGVyYXRpb24pIHtcbiAgICB0cnkge1xuICAgICAgICBvcGVyYXRpb24oKTtcbiAgICAgICAgbG9nRGVidWcoXCJFeGVjdXRlZCBhY3Rpb246IFwiLmNvbmNhdChhY3Rpb25UeXBlKSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gZmFpbGVkOiBcIi5jb25jYXQoYWN0aW9uVHlwZSwgXCIgKFwiKS5jb25jYXQoU3RyaW5nKGVycm9yKSwgXCIpXCIpKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbGVhc2VCbG9ja0FmdGVyRGVsYXkoZGVsYXlNcykge1xuICAgIC8vIEdhbWUtbG9vcCB0aW1lcjogcnVucyBvbiBgdXBkYXRlYCwgc28gaXQgc2VsZi1zdXNwZW5kcyBkdXJpbmcgbG9hZGluZ1xuICAgIC8vIHNjcmVlbnMgaW5zdGVhZCBvZiByZWxlYXNpbmcgaW50byBhIGxvYWRpbmcgZnJhbWUgbGlrZSBhIE5vZGUgdGltZXIgY291bGQuXG4gICAgc2V0R2FtZVRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIElucHV0LnJlbGVhc2VLZXkoNDIgLyogRHhTY2FuQ29kZS5MZWZ0U2hpZnQgKi8pO1xuICAgIH0sIGRlbGF5TXMpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgbG9nRGVidWcoXCJBY3Rpb24gYmxvY2tlZDogcGxheWVyIGlzIG51bGxcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIHBsYXllckZvcm0gPSBHYW1lLmdldEZvcm1FeChQTEFZRVJfRk9STV9JRCk7XG4gICAgaWYgKCFpc1ZhbGlkRm9ybShwbGF5ZXJGb3JtKSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBibG9ja2VkOiBwbGF5ZXIgZm9ybSBpbnZhbGlkL2RlbGV0ZWQvZGlzYWJsZWRcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQWN0aW9uQmxvY2tlZEJ5VWkoKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwbGF5ZXIuc2V0UG9zaXRpb24oYWN0aW9uLngsIGFjdGlvbi55LCBhY3Rpb24ueik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZmFjZVwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zZXRBbmdsZSgwLCAwLCBhY3Rpb24uYW5nbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGl2YXRlXCI6IHtcbiAgICAgICAgICAgIGlmIChcImZvcm1JZFwiIGluIGFjdGlvbikge1xuICAgICAgICAgICAgICAgIC8vIFc0IGZvcm1JZCB0YXJnZXRpbmc6IHRoZSBMTE0gbWF5IG9ubHkgYWN0aXZhdGUgb2JqZWN0cyB0aGUgc2Nhbm5lclxuICAgICAgICAgICAgICAgIC8vIGFjdHVhbGx5IHNhdyAoY2FjaGUgPSBhbGxvd2xpc3RlZCB0eXBlcywgZGlzdGFuY2UtY2FwcGVkLCBmcmVzaCkuXG4gICAgICAgICAgICAgICAgLy8gQ2FjaGUgcHJlc2VuY2UgZG91YmxlcyBhcyB0aGUgZGlzdGFuY2Ugc2FuaXR5IGNoZWNrLlxuICAgICAgICAgICAgICAgIHZhciBpbkNhY2hlID0gZ2V0V29ybGRPYmplY3RzKCkuc29tZShmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QuZm9ybUlkID09PSBhY3Rpb24uZm9ybUlkOyB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIWluQ2FjaGUpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBmb3JtSWQgXCIuY29uY2F0KGFjdGlvbi5mb3JtSWQsIFwiIG5vdCBpbiBzY2FubmVyIGNhY2hlXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgZm9ybSA9IEdhbWUuZ2V0Rm9ybUV4KGFjdGlvbi5mb3JtSWQpO1xuICAgICAgICAgICAgICAgIHZhciByZWZfMSA9IE9iamVjdFJlZmVyZW5jZS5mcm9tKGZvcm0pO1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZFJlZmVyZW5jZShyZWZfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBmb3JtSWQgXCIuY29uY2F0KGFjdGlvbi5mb3JtSWQsIFwiIGludmFsaWQvZGVsZXRlZC9kaXNhYmxlZFwiKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVmXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBfYSA9IGdldFBsYXllclBvc2l0aW9uKHBsYXllciksIHggPSBfYS54LCB5ID0gX2EueSwgeiA9IF9hLno7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnRhcmdldCA9PT0gXCJjcm9zc2hhaXJcIikge1xuICAgICAgICAgICAgICAgIHZhciBjcm9zc2hhaXJSZWZfMSA9IEdhbWUuZ2V0Q3VycmVudENyb3NzaGFpclJlZigpO1xuICAgICAgICAgICAgICAgIGlmICghaXNWYWxpZFJlZmVyZW5jZShjcm9zc2hhaXJSZWZfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBpbnZhbGlkIGNyb3NzaGFpciByZWZlcmVuY2VcIik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY3Jvc3NoYWlyUmVmXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3ROUENcIikge1xuICAgICAgICAgICAgICAgIHZhciBuZWFyZXN0TnBjXzEgPSBHYW1lLmZpbmRDbG9zZXN0QWN0b3IoeCwgeSwgeiwgMjAwMCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3ROcGNfMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJBY3RpdmF0ZSBibG9ja2VkOiBubyB2YWxpZCBuZWFyZXN0IE5QQ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyZXN0TnBjXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhY3Rpb24udGFyZ2V0ID09PSBcIm5lYXJlc3REb29yXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmVhcmVzdERvb3JfMSA9IGdldENsb3Nlc3RSZWZlcmVuY2VPZlR5cGUocGxheWVyLCAyOSAvKiBGb3JtVHlwZS5Eb29yICovLCBQTEFZRVJfRk9STV9JRCk7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkUmVmZXJlbmNlKG5lYXJlc3REb29yXzEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBkb29yXCIpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIG5lYXJlc3REb29yXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuZWFyZXN0Q29udGFpbmVyXzEgPSBnZXRDbG9zZXN0UmVmZXJlbmNlT2ZUeXBlKHBsYXllciwgMjggLyogRm9ybVR5cGUuQ29udGFpbmVyICovLCBQTEFZRVJfRk9STV9JRCk7XG4gICAgICAgICAgICBpZiAoIWlzVmFsaWRSZWZlcmVuY2UobmVhcmVzdENvbnRhaW5lcl8xKSkge1xuICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiQWN0aXZhdGUgYmxvY2tlZDogbm8gdmFsaWQgbmVhcmVzdCBjb250YWluZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZWFyZXN0Q29udGFpbmVyXzEuYWN0aXZhdGUocGxheWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJmYXN0VHJhdmVsXCI6IHtcbiAgICAgICAgICAgIERlYnVnLm5vdGlmaWNhdGlvbihcIkZhc3QgdHJhdmVsIG5vdCBzdXBwb3J0ZWQgdmlhIEFQSVwiKTtcbiAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFzdCB0cmF2ZWwgYmxvY2tlZCBmb3IgbG9jYXRpb246IFwiLmNvbmNhdChhY3Rpb24ubG9jYXRpb24pKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZHJhd1dlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5kcmF3V2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwic2hlYXRoZVdlYXBvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHBsYXllci5zaGVhdGhlV2VhcG9uKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXR0YWNrXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIElucHV0LnRhcEtleSg1Nyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYmxvY2tcIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgSW5wdXQuaG9sZEtleSg0Mik7XG4gICAgICAgICAgICAgICAgcmVsZWFzZUJsb2NrQWZ0ZXJEZWxheSg1MDApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImVxdWlwXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiRXF1aXA6IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJ1c2VJdGVtXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKFwiVXNlIGl0ZW06IFwiLmNvbmNhdChhY3Rpb24uaXRlbU5hbWUpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJoZWFsXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGxheWVyLnJlc3RvcmVBY3RvclZhbHVlKFwiaGVhbHRoXCIsIGFjdGlvbi5hbW91bnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNhdmVHYW1lXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgR2FtZS5zYXZlR2FtZShhY3Rpb24ubmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgRGVidWcubm90aWZpY2F0aW9uKGFjdGlvbi5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJzY2FuXCI6IHtcbiAgICAgICAgICAgIC8vIERyb3AgdGhlIHNjYW5uZXIgY2FjaGU7IHRoZSBuZXh0IHVwZGF0ZSB0aWNrIHJlLXN3ZWVwcyB3aXRoaW4gaXRzXG4gICAgICAgICAgICAvLyBwcm9iZSBidWRnZXQuIFNhZmUgZnJvbSBtZW51cyDigJQgbm8gZ2FtZSByZWZzIGFyZSB0b3VjaGVkIGhlcmUuXG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGludmFsaWRhdGVXb3JsZFNjYW4oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhdXRvd2Fsa1RvXCI6IHtcbiAgICAgICAgICAgIC8vIFc2OiBzY2FubmVyLWNhY2hlIHZhbGlkYXRpb24gKyBFU1AgaGFuZHNoYWtlIGxpdmUgaW4gd29ybGQvYXV0b3dhbGsuXG4gICAgICAgICAgICAvLyBGYWlscyBjbGVhbmx5IChzdGF0dXMgXCJmYWlsZWRcIikgd2hlbiBTa3lHdWlkZS5lc3AgaXMgYWJzZW50LlxuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAgICAgdmFyIG9rID0gcmVxdWVzdEF1dG93YWxrKHsgZm9ybUlkOiBhY3Rpb24uZm9ybUlkLCBzdG9wRGlzdGFuY2U6IChfYSA9IGFjdGlvbi5zdG9wRGlzdGFuY2UpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IENPTkZJRy5hdXRvd2Fsa1N0b3BEaXN0YW5jZSB9KTtcbiAgICAgICAgICAgICAgICBpZiAoIW9rKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJhdXRvd2FsayByZXF1ZXN0IHJlamVjdGVkXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImF1dG93YWxrQ2FuY2VsXCI6IHtcbiAgICAgICAgICAgIHJldHVybiBleGVjdXRlU2FmZWx5KGFjdGlvbi50eXBlLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY2FuY2VsQXV0b3dhbGsoXCJjYW5jZWxsZWRcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZm9yY2VUaGlyZFBlcnNvblwiOiB7XG4gICAgICAgICAgICByZXR1cm4gZXhlY3V0ZVNhZmVseShhY3Rpb24udHlwZSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEdhbWUuZm9yY2VUaGlyZFBlcnNvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjoge1xuICAgICAgICAgICAgcmV0dXJuIGV4ZWN1dGVTYWZlbHkoYWN0aW9uLnR5cGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBHYW1lLmZvcmNlRmlyc3RQZXJzb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwidmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbnZhciBBQ1RJT05fVFlQRVMgPSBuZXcgU2V0KFtcbiAgICBcIm1vdmVcIixcbiAgICBcImZhY2VcIixcbiAgICBcImFjdGl2YXRlXCIsXG4gICAgXCJmYXN0VHJhdmVsXCIsXG4gICAgXCJkcmF3V2VhcG9uXCIsXG4gICAgXCJzaGVhdGhlV2VhcG9uXCIsXG4gICAgXCJhdHRhY2tcIixcbiAgICBcImJsb2NrXCIsXG4gICAgXCJlcXVpcFwiLFxuICAgIFwidXNlSXRlbVwiLFxuICAgIFwiaGVhbFwiLFxuICAgIFwic2F2ZUdhbWVcIixcbiAgICBcIm5vdGlmaWNhdGlvblwiLFxuICAgIFwic2NhblwiLFxuICAgIFwiYXV0b3dhbGtUb1wiLFxuICAgIFwiYXV0b3dhbGtDYW5jZWxcIixcbiAgICBcImZvcmNlVGhpcmRQZXJzb25cIixcbiAgICBcImZvcmNlRmlyc3RQZXJzb25cIixcbl0pO1xudmFyIEFDVElWQVRFX1RBUkdFVFMgPSBuZXcgU2V0KFtcbiAgICBcImNyb3NzaGFpclwiLFxuICAgIFwibmVhcmVzdE5QQ1wiLFxuICAgIFwibmVhcmVzdERvb3JcIixcbiAgICBcIm5lYXJlc3RDb250YWluZXJcIixcbl0pO1xuZnVuY3Rpb24gaXNBY3RpdmF0ZVRhcmdldCh2YWx1ZSkge1xuICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgQUNUSVZBVEVfVEFSR0VUUy5oYXModmFsdWUpO1xufVxuLyoqXG4gKiBBY2NlcHRzIGEgZGVjaW1hbCBudW1iZXIsIGEgZGVjaW1hbCBzdHJpbmcsIG9yIGFuIGV4cGxpY2l0IGhleCBzdHJpbmdcbiAqIChcIjB4MTRcIikg4oCUIGNvbXBvc2VyIHBhcmFtcyBhcmUgYSBmcmVlIHJlY29yZCBhbmQgTExNcyBsaWtlIHRvIGVtaXQgaGV4XG4gKiBmb3JtIGlkcy4gQmFyZSBzdHJpbmdzIHBhcnNlIGFzIERFQ0lNQUwgKG9ubHkgdGhlIDB4IHByZWZpeCBtZWFucyBoZXgpLlxuICovXG5mdW5jdGlvbiBwYXJzZUZvcm1JZCh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiB2YWx1ZSA+IDApIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHZhciB0cmltbWVkID0gdmFsdWUudHJpbSgpO1xuICAgICAgICBpZiAoL14weFswLTlhLWZdKyQvaS50ZXN0KHRyaW1tZWQpKSB7XG4gICAgICAgICAgICB2YXIgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHRyaW1tZWQuc2xpY2UoMiksIDE2KTtcbiAgICAgICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUocGFyc2VkKSAmJiBwYXJzZWQgPiAwKVxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJzZWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoL15cXGQrJC8udGVzdCh0cmltbWVkKSkge1xuICAgICAgICAgICAgdmFyIHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh0cmltbWVkLCAxMCk7XG4gICAgICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgJiYgcGFyc2VkID4gMClcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyc2VkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gaXNSZWNvcmQodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsO1xufVxuZnVuY3Rpb24gaXNGaW5pdGVOdW1iZXIodmFsdWUpIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSk7XG59XG5mdW5jdGlvbiBpc05vbkVtcHR5U3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiB2YWx1ZS50cmltKCkubGVuZ3RoID4gMDtcbn1cbi8qKlxuICogVGhlIGNvbXBhbmlvbiBvdXRib3ggKGBHRVQgL2FwaS9hY3Rpb25zYCkgd3JhcHMgZmllbGRzIGFzXG4gKiBgeyB0eXBlLCBwYXJhbXMsIGlkLCBzb3VyY2UgfWAuIEZsYXR0ZW4gc28gYm90aCB0aGF0IHNoYXBlIGFuZCBhIGZsYXRcbiAqIGB7IHR5cGUsIGFtb3VudCwgLi4uIH1gIHBhcnNlLlxuICovXG5mdW5jdGlvbiBmbGF0dGVuT3V0Ym94U2hhcGUocmF3KSB7XG4gICAgdmFyIHBhcmFtcyA9IHJhdy5wYXJhbXM7XG4gICAgaWYgKCFpc1JlY29yZChwYXJhbXMpKSB7XG4gICAgICAgIHJldHVybiByYXc7XG4gICAgfVxuICAgIHJldHVybiBfX2Fzc2lnbihfX2Fzc2lnbih7fSwgcGFyYW1zKSwgeyB0eXBlOiByYXcudHlwZSwgaWQ6IHJhdy5pZCB9KTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUFjdGlvbihyYXcpIHtcbiAgICBpZiAoIWlzUmVjb3JkKHJhdykpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHZhciBmbGF0ID0gZmxhdHRlbk91dGJveFNoYXBlKHJhdyk7XG4gICAgdmFyIGFjdGlvblR5cGUgPSBmbGF0LnR5cGU7XG4gICAgaWYgKHR5cGVvZiBhY3Rpb25UeXBlICE9PSBcInN0cmluZ1wiIHx8ICFBQ1RJT05fVFlQRVMuaGFzKGFjdGlvblR5cGUpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzd2l0Y2ggKGFjdGlvblR5cGUpIHtcbiAgICAgICAgY2FzZSBcIm1vdmVcIjoge1xuICAgICAgICAgICAgdmFyIHggPSBmbGF0LngsIHkgPSBmbGF0LnksIHogPSBmbGF0Lno7XG4gICAgICAgICAgICBpZiAoIWlzRmluaXRlTnVtYmVyKHgpIHx8ICFpc0Zpbml0ZU51bWJlcih5KSB8fCAhaXNGaW5pdGVOdW1iZXIoeikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwibW92ZVwiLCB4OiB4LCB5OiB5LCB6OiB6IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhY2VcIjoge1xuICAgICAgICAgICAgdmFyIGFuZ2xlID0gZmxhdC5hbmdsZTtcbiAgICAgICAgICAgIGlmICghaXNGaW5pdGVOdW1iZXIoYW5nbGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImZhY2VcIiwgYW5nbGU6IGFuZ2xlIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImFjdGl2YXRlXCI6IHtcbiAgICAgICAgICAgIC8vIFc0IGZvcm1JZCB0YXJnZXRpbmcg4oCUIHZhbGlkYXRlZCBhZ2FpbnN0IHRoZSBzY2FubmVyIGNhY2hlIGluIHRoZVxuICAgICAgICAgICAgLy8gZXhlY3V0b3IgKGFuIExMTSBtdXN0IG5vdCBhY3RpdmF0ZSBhcmJpdHJhcnkgZm9ybXMpLlxuICAgICAgICAgICAgdmFyIGZvcm1JZCA9IHBhcnNlRm9ybUlkKGZsYXQuZm9ybUlkKTtcbiAgICAgICAgICAgIGlmIChmb3JtSWQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcImFjdGl2YXRlXCIsIGZvcm1JZDogZm9ybUlkIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZmxhdC50YXJnZXQ7XG4gICAgICAgICAgICBpZiAoIWlzQWN0aXZhdGVUYXJnZXQodGFyZ2V0KSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJhY3RpdmF0ZVwiLCB0YXJnZXQ6IHRhcmdldCB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhdXRvd2Fsa1RvXCI6IHtcbiAgICAgICAgICAgIC8vIFJldXNlcyBwYXJzZUZvcm1JZCAoaGV4L2RlY2ltYWwgZm9ybXMgZnJvbSB0aGUgY29tcG9zZXIpIGFuZCBmYWxsc1xuICAgICAgICAgICAgLy8gYmFjayB0byB0aGUgQ09ORklHIHN0b3AgZGlzdGFuY2Ugd2hlbiB0aGUgTExNIG9taXRzIGl0LlxuICAgICAgICAgICAgdmFyIGZvcm1JZCA9IHBhcnNlRm9ybUlkKGZsYXQuZm9ybUlkKTtcbiAgICAgICAgICAgIGlmIChmb3JtSWQgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByYXdEaXN0YW5jZSA9IGZsYXQuc3RvcERpc3RhbmNlO1xuICAgICAgICAgICAgdmFyIHN0b3BEaXN0YW5jZSA9IHR5cGVvZiByYXdEaXN0YW5jZSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNGaW5pdGUocmF3RGlzdGFuY2UpICYmIHJhd0Rpc3RhbmNlID4gMFxuICAgICAgICAgICAgICAgID8gcmF3RGlzdGFuY2VcbiAgICAgICAgICAgICAgICA6IDEwMDtcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiYXV0b3dhbGtUb1wiLCBmb3JtSWQ6IGZvcm1JZCwgc3RvcERpc3RhbmNlOiBzdG9wRGlzdGFuY2UgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXV0b3dhbGtDYW5jZWxcIjoge1xuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJhdXRvd2Fsa0NhbmNlbFwiIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImZhc3RUcmF2ZWxcIjoge1xuICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gZmxhdC5sb2NhdGlvbjtcbiAgICAgICAgICAgIGlmICghaXNOb25FbXB0eVN0cmluZyhsb2NhdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiZmFzdFRyYXZlbFwiLCBsb2NhdGlvbjogbG9jYXRpb24gfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwiZXF1aXBcIjpcbiAgICAgICAgY2FzZSBcInVzZUl0ZW1cIjoge1xuICAgICAgICAgICAgdmFyIGl0ZW1OYW1lID0gZmxhdC5pdGVtTmFtZTtcbiAgICAgICAgICAgIGlmICghaXNOb25FbXB0eVN0cmluZyhpdGVtTmFtZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGFjdGlvblR5cGUsIGl0ZW1OYW1lOiBpdGVtTmFtZSB9O1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJoZWFsXCI6IHtcbiAgICAgICAgICAgIHZhciBhbW91bnQgPSBmbGF0LmFtb3VudDtcbiAgICAgICAgICAgIGlmICghaXNGaW5pdGVOdW1iZXIoYW1vdW50KSB8fCBhbW91bnQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHsgdHlwZTogXCJoZWFsXCIsIGFtb3VudDogYW1vdW50IH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNhdmVHYW1lXCI6IHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gZmxhdC5uYW1lO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcInNhdmVHYW1lXCIsIG5hbWU6IG5hbWUgfTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFwibm90aWZpY2F0aW9uXCI6IHtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gZmxhdC5tZXNzYWdlO1xuICAgICAgICAgICAgaWYgKCFpc05vbkVtcHR5U3RyaW5nKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIm5vdGlmaWNhdGlvblwiLCBtZXNzYWdlOiBtZXNzYWdlIH07XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImRyYXdXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcInNoZWF0aGVXZWFwb25cIjpcbiAgICAgICAgY2FzZSBcImF0dGFja1wiOlxuICAgICAgICBjYXNlIFwiYmxvY2tcIjpcbiAgICAgICAgY2FzZSBcInNjYW5cIjpcbiAgICAgICAgY2FzZSBcImZvcmNlVGhpcmRQZXJzb25cIjpcbiAgICAgICAgY2FzZSBcImZvcmNlRmlyc3RQZXJzb25cIjpcbiAgICAgICAgICAgIHJldHVybiB7IHR5cGU6IGFjdGlvblR5cGUgfTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZEFjdGlvbihhY3Rpb24pIHtcbiAgICB2b2lkIGFjdGlvbjtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbiIsInZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGFkb3B0KHJlc3VsdC52YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xudmFyIF9fZ2VuZXJhdG9yID0gKHRoaXMgJiYgdGhpcy5fX2dlbmVyYXRvcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIGJvZHkpIHtcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnID0gT2JqZWN0LmNyZWF0ZSgodHlwZW9mIEl0ZXJhdG9yID09PSBcImZ1bmN0aW9uXCIgPyBJdGVyYXRvciA6IE9iamVjdCkucHJvdG90eXBlKTtcbiAgICByZXR1cm4gZy5uZXh0ID0gdmVyYigwKSwgZ1tcInRocm93XCJdID0gdmVyYigxKSwgZ1tcInJldHVyblwiXSA9IHZlcmIoMiksIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZztcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cbiAgICBmdW5jdGlvbiBzdGVwKG9wKSB7XG4gICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLlwiKTtcbiAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHtcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcbiAgICAgICAgICAgIGlmICh5ID0gMCwgdCkgb3AgPSBbb3BbMF0gJiAyLCB0LnZhbHVlXTtcbiAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDQ6IF8ubGFiZWwrKzsgcmV0dXJuIHsgdmFsdWU6IG9wWzFdLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gNiAmJiBfLmxhYmVsIDwgdFsxXSkgeyBfLmxhYmVsID0gdFsxXTsgdCA9IG9wOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgXy50cnlzLnBvcCgpOyBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xuICAgICAgICB9IGNhdGNoIChlKSB7IG9wID0gWzYsIGVdOyB5ID0gMDsgfSBmaW5hbGx5IHsgZiA9IHQgPSAwOyB9XG4gICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cbn07XG5pbXBvcnQgKiBhcyBTa1QgZnJvbSAnQHNreXJpbS1wbGF0Zm9ybS9za3lyaW0tcGxhdGZvcm0nO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgcGFyc2VBY3Rpb24gfSBmcm9tIFwiLi9wYXJzZXJcIjtcbmltcG9ydCB7IGV4ZWN1dGVBY3Rpb24gfSBmcm9tIFwiLi9leGVjdXRvclwiO1xuaW1wb3J0IHsgY2xlYXJHYW1lVGltZW91dCwgc2V0R2FtZVRpbWVvdXQgfSBmcm9tIFwiLi4vdGltZXJzXCI7XG52YXIgSU5JVElBTF9CQUNLT0ZGX01TID0gQ09ORklHLnBvbGxpbmdJbnRlcnZhbDtcbnZhciBwb2xsaW5nQ2xpZW50ID0gbnVsbDtcbnZhciBiYWNrb2ZmTXMgPSBJTklUSUFMX0JBQ0tPRkZfTVM7XG52YXIgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG52YXIgcG9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xudmFyIHBvbGxUaW1lcklkID0gbnVsbDtcbi8qKiBPdXRib3ggY3Vyc29yIOKAlCBoaWdoZXN0IGFjdGlvbiBpZCB3ZSBoYXZlIHB1bGxlZCBmcm9tIHRoZSBzZXJ2ZXIuICovXG52YXIgbGFzdFNlZW5JZCA9IDA7XG5mdW5jdGlvbiBsb2dEZWJ1ZyhtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgU2tULnByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBwb2xsRm9yQWN0aW9ucygpIHtcbiAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbmRwb2ludCwgcmVzcG9uc2UsIHBhcnNlZCwgYWN0aW9ucywgX2ksIGFjdGlvbnNfMSwgcmF3LCBpZCwgYWN0aW9uLCBlcnJfMSwgbXNnO1xuICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKF9hLmxhYmVsKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgICAgICAgICBpZiAoIXBvbGxpbmdDbGllbnQgfHwgIXBvbGxpbmdBY3RpdmUpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgICAgIGlmIChTa1QuVWkuaXNNZW51T3BlbihcIkxvYWRpbmcgTWVudVwiKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nRGVidWcoXCJMb2FkaW5nIHNjcmVlbiBvcGVuIOKAlCBza2lwcGluZyBhY3Rpb24gcG9sbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVkdWxlTmV4dFBvbGwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbmRwb2ludCA9IFwiXCIuY29uY2F0KENPTkZJRy5wb2xsaW5nRW5kcG9pbnQsIFwiP3NpbmNlPVwiKS5jb25jYXQobGFzdFNlZW5JZCk7XG4gICAgICAgICAgICAgICAgICAgIF9hLmxhYmVsID0gMTtcbiAgICAgICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgICAgIF9hLnRyeXMucHVzaChbMSwgMywgLCA0XSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbNCAvKnlpZWxkKi8sIHBvbGxpbmdDbGllbnQuZ2V0KGVuZHBvaW50KV07XG4gICAgICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zZWN1dGl2ZUZhaWx1cmVzID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tvZmZNcyA9IElOSVRJQUxfQkFDS09GRl9NUztcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlZCA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VkID0gSlNPTi5wYXJzZShyZXNwb25zZS5ib2R5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoIChfYikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvZ0RlYnVnKFwiRmFpbGVkIHRvIHBhcnNlIGFjdGlvbiByZXNwb25zZSBib2R5IGFzIEpTT05cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVOZXh0UG9sbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbnMgPSBBcnJheS5pc0FycmF5KHBhcnNlZCkgPyBwYXJzZWQgOiBbcGFyc2VkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoX2kgPSAwLCBhY3Rpb25zXzEgPSBhY3Rpb25zOyBfaSA8IGFjdGlvbnNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXcgPSBhY3Rpb25zXzFbX2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRyYWNrIHRoZSBvdXRib3ggY3Vyc29yIGJlZm9yZSBleGVjdXRpbmcg4oCUIGVhY2ggZW50cnkgY2FycmllcyBhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbW9ub3RvbmljIGlkOyB1bmtub3duIHR5cGVzIHN0aWxsIGFkdmFuY2UgaXQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByYXcgPT09IFwib2JqZWN0XCIgJiYgcmF3ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkID0gcmF3LmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGlkID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZShpZCkgJiYgaWQgPiBsYXN0U2VlbklkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0U2VlbklkID0gaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gcGFyc2VBY3Rpb24ocmF3KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVBY3Rpb24oYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVGYWlsdXJlKFwiSFRUUCBcIi5jb25jYXQocmVzcG9uc2Uuc3RhdHVzKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgICAgICAgICBlcnJfMSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgbXNnID0gZXJyXzEgaW5zdGFuY2VvZiBFcnJvciA/IGVycl8xLm1lc3NhZ2UgOiBTdHJpbmcoZXJyXzEpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVGYWlsdXJlKG1zZyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDRdO1xuICAgICAgICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgICAgICAgICAgc2NoZWR1bGVOZXh0UG9sbCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gaGFuZGxlRmFpbHVyZShyZWFzb24pIHtcbiAgICBjb25zZWN1dGl2ZUZhaWx1cmVzKys7XG4gICAgbG9nRGVidWcoXCJQb2xsIGZhaWxlZCAoXCIuY29uY2F0KGNvbnNlY3V0aXZlRmFpbHVyZXMsIFwiL1wiKS5jb25jYXQoQ09ORklHLm1heFBvbGxpbmdSZXRyaWVzLCBcIik6IFwiKS5jb25jYXQocmVhc29uKSk7XG4gICAgaWYgKGNvbnNlY3V0aXZlRmFpbHVyZXMgPj0gQ09ORklHLm1heFBvbGxpbmdSZXRyaWVzKSB7XG4gICAgICAgIGxvZ0RlYnVnKFwiTWF4IHJldHJpZXMgcmVhY2hlZCBcXHUyMDE0IHBhdXNpbmcgZm9yIFwiLmNvbmNhdChDT05GSUcucG9sbGluZ01heEJhY2tvZmYsIFwibXNcIikpO1xuICAgICAgICBiYWNrb2ZmTXMgPSBDT05GSUcucG9sbGluZ01heEJhY2tvZmY7XG4gICAgICAgIGNvbnNlY3V0aXZlRmFpbHVyZXMgPSAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYmFja29mZk1zID0gTWF0aC5taW4oYmFja29mZk1zICogMiwgQ09ORklHLnBvbGxpbmdNYXhCYWNrb2ZmKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzY2hlZHVsZU5leHRQb2xsKCkge1xuICAgIGlmICghcG9sbGluZ0FjdGl2ZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHBvbGxUaW1lcklkID0gc2V0R2FtZVRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBwb2xsVGltZXJJZCA9IG51bGw7XG4gICAgICAgIHBvbGxGb3JBY3Rpb25zKCk7XG4gICAgfSwgYmFja29mZk1zKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzdGFydFBvbGxpbmcoKSB7XG4gICAgaWYgKCFDT05GSUcucG9sbGluZ0VuYWJsZWQpIHtcbiAgICAgICAgbG9nRGVidWcoXCJQb2xsaW5nIGRpc2FibGVkIGJ5IGNvbmZpZ1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocG9sbGluZ0FjdGl2ZSkge1xuICAgICAgICBsb2dEZWJ1ZyhcIlBvbGxpbmcgYWxyZWFkeSBhY3RpdmVcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcG9sbGluZ0NsaWVudCA9IG5ldyBTa1QuSHR0cENsaWVudChDT05GSUcuc2VydmVyVXJsKTtcbiAgICBwb2xsaW5nQWN0aXZlID0gdHJ1ZTtcbiAgICBiYWNrb2ZmTXMgPSBJTklUSUFMX0JBQ0tPRkZfTVM7XG4gICAgY29uc2VjdXRpdmVGYWlsdXJlcyA9IDA7XG4gICAgbG9nRGVidWcoXCJTdGFydGluZyBhY3Rpb24gcG9sbGluZ1wiKTtcbiAgICBTa1Qub25jZShcInVwZGF0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHBvbGxGb3JBY3Rpb25zKCk7XG4gICAgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc3RvcFBvbGxpbmcoKSB7XG4gICAgcG9sbGluZ0FjdGl2ZSA9IGZhbHNlO1xuICAgIGlmIChwb2xsVGltZXJJZCAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhckdhbWVUaW1lb3V0KHBvbGxUaW1lcklkKTtcbiAgICAgICAgcG9sbFRpbWVySWQgPSBudWxsO1xuICAgIH1cbiAgICBwb2xsaW5nQ2xpZW50ID0gbnVsbDtcbiAgICBsb2dEZWJ1ZyhcIkFjdGlvbiBwb2xsaW5nIHN0b3BwZWRcIik7XG59XG4iLCJ2YXIgbGFzdFN0YXRlID0gbnVsbDtcbnZhciBsYXN0U2VuZFRpbWVzID0ge1xuICAgIGNyaXRpY2FsOiAwLFxuICAgIGhpZ2g6IDAsXG4gICAgbWVkaXVtOiAwLFxuICAgIGxvdzogMCxcbiAgICBzdXBwcmVzc2VkOiAwXG59O1xudmFyIHJhdGVMaW1pdHMgPSB7XG4gICAgY3JpdGljYWw6IDIwMCxcbiAgICBoaWdoOiA1MDAsXG4gICAgbWVkaXVtOiAxMDAwLFxuICAgIGxvdzogMjAwMCxcbiAgICBzdXBwcmVzc2VkOiA1MDAwXG59O1xuZXhwb3J0IGZ1bmN0aW9uIGlzU3RhdGVVbmNoYW5nZWQobmV3U3RhdGUpIHtcbiAgICBpZiAoIWxhc3RTdGF0ZSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChuZXdTdGF0ZS5ldmVudFR5cGUgIT09IFwidGlja1wiKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG5ld1N0YXRlLmNvbWJhdFN0YXRlICE9PSBsYXN0U3RhdGUuY29tYmF0U3RhdGUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBpZiAobmV3U3RhdGUuZW5lbWllcy5sZW5ndGggIT09IGxhc3RTdGF0ZS5lbmVtaWVzLmxlbmd0aClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHZhciBwbGF5ZXJDaGFuZ2VkID0gbmV3U3RhdGUucGxheWVyLmhlYWx0aCAhPT0gbGFzdFN0YXRlLnBsYXllci5oZWFsdGggfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLnBvc2l0aW9uLnggIT09IGxhc3RTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueCB8fFxuICAgICAgICBuZXdTdGF0ZS5wbGF5ZXIucG9zaXRpb24ueSAhPT0gbGFzdFN0YXRlLnBsYXllci5wb3NpdGlvbi55IHx8XG4gICAgICAgIG5ld1N0YXRlLnBsYXllci5wb3NpdGlvbi56ICE9PSBsYXN0U3RhdGUucGxheWVyLnBvc2l0aW9uLnogfHxcbiAgICAgICAgbmV3U3RhdGUucGxheWVyLmlzU25lYWtpbmcgIT09IGxhc3RTdGF0ZS5wbGF5ZXIuaXNTbmVha2luZztcbiAgICByZXR1cm4gIXBsYXllckNoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZXZhbHVhdGVQcmlvcml0eShzdGF0ZSkge1xuICAgIGlmIChzdGF0ZS5wbGF5ZXIuaXNEZWFkKSB7XG4gICAgICAgIHJldHVybiBcImNyaXRpY2FsXCI7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5wbGF5ZXIuaGVhbHRoIDwgc3RhdGUucGxheWVyLm1heEhlYWx0aCAqIDAuMjUpIHtcbiAgICAgICAgcmV0dXJuIFwiY3JpdGljYWxcIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmV2ZW50VHlwZSA9PT0gXCJoaXRcIikge1xuICAgICAgICByZXR1cm4gXCJoaWdoXCI7XG4gICAgfVxuICAgIGlmIChzdGF0ZS5jb21iYXRTdGF0ZSA9PT0gMSkge1xuICAgICAgICBpZiAoc3RhdGUuZW5lbWllcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB2YXIgY2xvc2VzdEVuZW15ID0gc3RhdGUuZW5lbWllc1swXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgc3RhdGUuZW5lbWllcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChzdGF0ZS5lbmVtaWVzW2ldLmRpc3RhbmNlIDwgY2xvc2VzdEVuZW15LmRpc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNsb3Nlc3RFbmVteSA9IHN0YXRlLmVuZW1pZXNbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGNsb3Nlc3RFbmVteS5kaXN0YW5jZSA8IDUwMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcImhpZ2hcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXCJtZWRpdW1cIjtcbiAgICB9XG4gICAgaWYgKHN0YXRlLmV2ZW50VHlwZSAhPT0gXCJ0aWNrXCIpIHtcbiAgICAgICAgcmV0dXJuIFwibWVkaXVtXCI7XG4gICAgfVxuICAgIC8vIFN1cHByZXNzIGlmIG5vdGhpbmcgaW50ZXJlc3RpbmcgaXMgaGFwcGVuaW5nXG4gICAgaWYgKGxhc3RTdGF0ZSAmJiBpc1N0YXRlVW5jaGFuZ2VkKHN0YXRlKSkge1xuICAgICAgICByZXR1cm4gXCJzdXBwcmVzc2VkXCI7XG4gICAgfVxuICAgIHJldHVybiBcImxvd1wiO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNob3VsZFNlbmQocHJpb3JpdHksIHN0YXRlKSB7XG4gICAgdm9pZCBzdGF0ZTtcbiAgICBpZiAocHJpb3JpdHkgPT09IFwic3VwcHJlc3NlZFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGxhc3RTZW5kID0gbGFzdFNlbmRUaW1lc1twcmlvcml0eV07XG4gICAgdmFyIG1pbkludGVydmFsID0gcmF0ZUxpbWl0c1twcmlvcml0eV07XG4gICAgaWYgKG5vdyAtIGxhc3RTZW5kIDwgbWluSW50ZXJ2YWwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAvLyBSYXRlLWxpbWl0IGlzIGF0dGVtcHQtYmFzZWQgdG8gYXZvaWQgaGFtbWVyaW5nIHRyYW5zcG9ydCBvbiByZXBlYXRlZCBmYWlsdXJlcy5cbiAgICBsYXN0U2VuZFRpbWVzW3ByaW9yaXR5XSA9IG5vdztcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZWNvcmRTZW50U3RhdGUoc3RhdGUpIHtcbiAgICBsYXN0U3RhdGUgPSBzdGF0ZTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIsIG9uLCBwcmludENvbnNvbGUsIFVpLCB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi9jb25maWdcIjtcbmltcG9ydCB7IHBhcnNlQWN0aW9uIH0gZnJvbSBcIi4vYWN0aW9ucy9wYXJzZXJcIjtcbmltcG9ydCB7IGV4ZWN1dGVBY3Rpb24gfSBmcm9tIFwiLi9hY3Rpb25zL2V4ZWN1dG9yXCI7XG5pbXBvcnQgeyBzZXRHYW1lSW50ZXJ2YWwgfSBmcm9tIFwiLi90aW1lcnNcIjtcbi8qKlxuICogQ29tcGFuaW9uIGJyb3dzZXIgYnJpZGdlIChjb252ZXJnZWQgZGVzaWduIGZyb20gZG9jcy9yZXNlYXJjaC9cbiAqIGJyYWluc3Rvcm0tcGF0aEEtYnJpZGdlLm1kIGFuZCBicmFpbnN0b3JtLXBhdGhCLWRpcmVjdC13cy5tZCk6XG4gKlxuICogIC0gVGhlIGluLWdhbWUgQ0VGIHBhZ2UgKGxvYWRlZCBmcm9tIHRoZSBjb21wYW5pb24gYXBwKSBvd25zIHRoZSBXZWJTb2NrZXRcbiAqICAgIHRvIHRoZSBhcHAg4oCUIHRoZSBwbHVnaW4gTkVWRVIgdG91Y2hlcyBXZWJTb2NrZXRzIChTUCBKUyBoYXMgbm9uZSkuXG4gKiAgLSBUaGUgcGx1Z2luIHJlY2VpdmVzIHBhZ2UgaW50ZW50cyB2aWEgYGJyb3dzZXJNZXNzYWdlYFxuICogICAgKHBhZ2UgY2FsbHMgYHdpbmRvdy5za3lyaW1QbGF0Zm9ybS5zZW5kTWVzc2FnZSguLi4pYCkuXG4gKiAgLSBUaGUgcGx1Z2luIHB1c2hlcyBvbmx5IFJBUkUgZXZlbnRzIGludG8gdGhlIHBhZ2UgdmlhXG4gKiAgICBgYnJvd3Nlci5leGVjdXRlSmF2YVNjcmlwdGAg4oCUIG5ldmVyIHBlci10aWNrIHN0YXRlICh0aGUgZW5naW5lIGFscmVhZHlcbiAqICAgIGJyb2FkY2FzdHMgZ2FtZVN0YXRlIHRvIFdTIHBlZXJzOyB0aGUgcGFnZSByZWFkcyBpdCBmcm9tIHRoZXJlKS5cbiAqICAtIGBjb21wYW5pb24tcmVhZHlgIGhhbmRzaGFrZSArIGhlYXJ0YmVhdDogYGV4ZWN1dGVKYXZhU2NyaXB0YCBpbmplY3Rpb25zXG4gKiAgICBhcmUgc2lsZW50bHkgZHJvcHBlZCBiZWZvcmUgdGhlIHBhZ2UncyBmaXJzdCBsb2FkLWVuZCAodmVyaWZpZWQgaW5cbiAqICAgIEJyb3dzZXJBcGlUaWx0ZWQuY3BwIOKAlCBubyBxdWV1ZSksIHNvIG5vdGhpbmcgaXMgcHVzaGVkIHVudGlsIHJlYWR5LlxuICovXG4vKiogTWVudXMgZHVyaW5nIHdoaWNoIHRoZSBvdmVybGF5IGlzIGhpZGRlbiAoYnJvd3NlclNlcnZpY2UudHMgYmFkLW1lbnUgbGlzdCkuICovXG52YXIgQkFEX01FTlVTID0gW1xuICAgIFwiTG9hZGluZyBNZW51XCIsXG4gICAgXCJNYWluIE1lbnVcIixcbiAgICBcIkNvbnNvbGVcIixcbiAgICBcIlR3ZWVuTWVudVwiLFxuICAgIFwiUmFjZVNleCBNZW51XCIsXG4gICAgXCIgY3JhZnRpbmcgXCIsIC8vIG1hdGNoZXMgQ3JhZnRpbmcvU21pdGhpbmcvRW5jaGFudGluZyBtZW51c1xuXTtcbnZhciBIRUFSVEJFQVRfVElNRU9VVF9NUyA9IDE1MDAwO1xudmFyIFdBVENIRE9HX0lOVEVSVkFMX01TID0gNTAwMDtcbnZhciBNQVhfVFJBQ0tFRF9BQ1RJT05fSURTID0gNjQ7XG52YXIgYnJpZGdlQWN0aXZlID0gZmFsc2U7XG52YXIgY29tcGFuaW9uUmVhZHkgPSBmYWxzZTtcbnZhciBsYXN0SGVhcnRiZWF0QXQgPSAwO1xudmFyIG92ZXJsYXlWaXNpYmxlID0gZmFsc2U7XG52YXIgcmVjZW50QWN0aW9uSWRzID0gW107XG5mdW5jdGlvbiBsb2dCcmlkZ2UobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV1bYnJpZGdlXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbi8qKlxuICogU2VyaWFsaXplLXRoZW4tZW1iZWQtaW4tc291cmNlLiBgZXhlY3V0ZUphdmFTY3JpcHRgIHRha2VzIFNPVVJDRSBDT0RFLCBub3RcbiAqIGRhdGEgKE15Q2hyb21pdW1BcHAuY3BwOjI3Mi0yNzgpIOKAlCBhIHJhdyBKU09OIGludGVycG9sYXRpb24gb2YgZ2FtZSBzdHJpbmdzXG4gKiAoYWN0b3IgbmFtZXMgYXJlIG1vZGRlci1jb250cm9sbGVkIGRhdGEpIHdvdWxkIGJyZWFrIHRoZSBpbmplY3Rpb24gb3JcbiAqIGV4ZWN1dGUgYXJiaXRyYXJ5IEpTIGluIHRoZSBwYWdlLiBIZW5jZSB0aGUgZG91YmxlIGBKU09OLnN0cmluZ2lmeWAuXG4gKiBJbmplY3Rpb25zIGJlZm9yZSB0aGUgcGFnZSBpcyBsb2FkZWQgYXJlIHNpbGVudGx5IGRyb3BwZWQgb24gdGhlIFRpbHRlZFxuICogYmFja2VuZCDigJQgY2FsbGVycyBtdXN0IG9ubHkgaW5qZWN0IGFmdGVyIGBjb21wYW5pb25SZWFkeWAuXG4gKi9cbmZ1bmN0aW9uIGluamVjdE1lc3NhZ2UobWVzc2FnZSkge1xuICAgIGlmICghY29tcGFuaW9uUmVhZHkpIHtcbiAgICAgICAgbG9nQnJpZGdlKFwiaW5qZWN0IHNraXBwZWQ6IHBhZ2Ugbm90IHJlYWR5IHlldFwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICB2YXIgcGF5bG9hZCA9IEpTT04uc3RyaW5naWZ5KEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcbiAgICAgICAgYnJvd3Nlci5leGVjdXRlSmF2YVNjcmlwdChcIndpbmRvdy5fX3NreWd1aWRlUmVjZWl2ZShcIi5jb25jYXQocGF5bG9hZCwgXCIpXCIpKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nQnJpZGdlKFwiaW5qZWN0IGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiByZW1lbWJlckFjdGlvbklkKGlkKSB7XG4gICAgaWYgKCFpZClcbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIHVudHJhY2tlZCBhY3Rpb25zIGFsd2F5cyBydW4gKEhUVFAgcGFyaXR5KVxuICAgIGlmIChyZWNlbnRBY3Rpb25JZHMuaW5jbHVkZXMoaWQpKSB7XG4gICAgICAgIGxvZ0JyaWRnZShcImR1cGxpY2F0ZSBhY3Rpb24gaWQgaWdub3JlZDogXCIuY29uY2F0KGlkKSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmVjZW50QWN0aW9uSWRzLnB1c2goaWQpO1xuICAgIGlmIChyZWNlbnRBY3Rpb25JZHMubGVuZ3RoID4gTUFYX1RSQUNLRURfQUNUSU9OX0lEUykge1xuICAgICAgICByZWNlbnRBY3Rpb25JZHMuc2hpZnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBoYW5kbGVBY3Rpb25Bcmd1bWVudChyYXcpIHtcbiAgICAvLyBQYWdlIG1heSBzZW5kIHRoZSBhY3Rpb24gYXMgYW4gb2JqZWN0IG9yIGFzIGEgSlNPTiBzdHJpbmcg4oCUIGFjY2VwdCBib3RoLlxuICAgIHZhciBjYW5kaWRhdGUgPSByYXc7XG4gICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IEpTT04ucGFyc2UoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgICAgIGxvZ0JyaWRnZShcImJyaWRnZSBhY3Rpb24gcmVqZWN0ZWQ6IG5vbi1KU09OIHN0cmluZyBwYXlsb2FkXCIpO1xuICAgICAgICAgICAgaW5qZWN0TWVzc2FnZSh7IHR5cGU6IFwiYWN0aW9uLXJlc3VsdFwiLCBvazogZmFsc2UgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGFjdGlvbiA9IHBhcnNlQWN0aW9uKGNhbmRpZGF0ZSk7XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgICAgbG9nQnJpZGdlKFwiYnJpZGdlIGFjdGlvbiByZWplY3RlZDogXCIuY29uY2F0KEpTT04uc3RyaW5naWZ5KGNhbmRpZGF0ZSkpKTtcbiAgICAgICAgaW5qZWN0TWVzc2FnZSh7IHR5cGU6IFwiYWN0aW9uLXJlc3VsdFwiLCBvazogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGlkID0gY2FuZGlkYXRlLmlkO1xuICAgIHZhciBhY3Rpb25JZCA9IHR5cGVvZiBpZCA9PT0gXCJzdHJpbmdcIiA/IGlkIDogdW5kZWZpbmVkO1xuICAgIGlmICghcmVtZW1iZXJBY3Rpb25JZChhY3Rpb25JZCkpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgb2sgPSBleGVjdXRlQWN0aW9uKGFjdGlvbik7XG4gICAgaW5qZWN0TWVzc2FnZSh7IHR5cGU6IFwiYWN0aW9uLXJlc3VsdFwiLCBpZDogYWN0aW9uSWQsIG9rOiBvayB9KTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdW2JyaWRnZV0gYWN0aW9uIFwiLmNvbmNhdChhY3Rpb24udHlwZSwgXCI6IFwiKS5jb25jYXQob2sgPyBcIm9rXCIgOiBcImZhaWxlZFwiKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNCYWRNZW51T3BlbigpIHtcbiAgICBmb3IgKHZhciBfaSA9IDAsIEJBRF9NRU5VU18xID0gQkFEX01FTlVTOyBfaSA8IEJBRF9NRU5VU18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgbWVudSA9IEJBRF9NRU5VU18xW19pXTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChVaS5pc01lbnVPcGVuKG1lbnUpKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgLy8gTWVudSBuYW1lIG5vdCByZWNvZ25pemVkIGJ5IHRoaXMgYnVpbGQg4oCUIHRyZWF0IGFzIG9wZW4gdG8gc3RheSBoaWRkZW4uXG4gICAgICAgICAgICByZXR1cm4gbWVudSA9PT0gXCJMb2FkaW5nIE1lbnVcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG5mdW5jdGlvbiByZWZyZXNoT3ZlcmxheVZpc2liaWxpdHkoKSB7XG4gICAgaWYgKCFicmlkZ2VBY3RpdmUpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgc2hvdWxkU2hvdyA9IGNvbXBhbmlvblJlYWR5ICYmICFpc0JhZE1lbnVPcGVuKCk7XG4gICAgaWYgKHNob3VsZFNob3cgPT09IG92ZXJsYXlWaXNpYmxlKVxuICAgICAgICByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgICAgYnJvd3Nlci5zZXRWaXNpYmxlKHNob3VsZFNob3cpO1xuICAgICAgICBvdmVybGF5VmlzaWJsZSA9IHNob3VsZFNob3c7XG4gICAgICAgIGxvZ0JyaWRnZShcIm92ZXJsYXkgXCIuY29uY2F0KHNob3VsZFNob3cgPyBcInZpc2libGVcIiA6IFwiaGlkZGVuXCIpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dCcmlkZ2UoXCJzZXRWaXNpYmxlIGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaGFuZGxlQnJvd3Nlck1lc3NhZ2UoZXZlbnQpIHtcbiAgICB2YXIgYXJncyA9IGV2ZW50LmFyZ3VtZW50cztcbiAgICB2YXIga2luZCA9IGFyZ3NbMF07XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJjb21wYW5pb24tcmVhZHlcIjoge1xuICAgICAgICAgICAgY29tcGFuaW9uUmVhZHkgPSB0cnVlO1xuICAgICAgICAgICAgbGFzdEhlYXJ0YmVhdEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHJlZnJlc2hPdmVybGF5VmlzaWJpbGl0eSgpO1xuICAgICAgICAgICAgaW5qZWN0TWVzc2FnZSh7IHR5cGU6IFwiaGVsbG9cIiwgYnJpZGdlVmVyc2lvbjogMSwgZ2FtZVJlYWR5OiB0cnVlIH0pO1xuICAgICAgICAgICAgbG9nQnJpZGdlKFwiY29tcGFuaW9uIHBhZ2UgcmVhZHlcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImhlYXJ0YmVhdFwiOiB7XG4gICAgICAgICAgICBsYXN0SGVhcnRiZWF0QXQgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgXCJhY3Rpb25cIjoge1xuICAgICAgICAgICAgaGFuZGxlQWN0aW9uQXJndW1lbnQoYXJnc1sxXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcInNwaWtlLXJlc3VsdFwiOiB7XG4gICAgICAgICAgICAvLyBDRUYgbWVkaWEgc3Bpa2UgcmVwb3J0aW5nIChzZWUgc3Bpa2UvY2VmLW1lZGlhLXNwaWtlLykuXG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdW3NwaWtlXSBcIi5jb25jYXQoU3RyaW5nKGFyZ3NbMV0pLCBcIiA9IFwiKS5jb25jYXQoU3RyaW5nKGFyZ3NbMl0pKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBcImNvbXBhbmlvbi1sb2dcIjoge1xuICAgICAgICAgICAgbG9nQnJpZGdlKFwicGFnZTogXCIuY29uY2F0KFN0cmluZyhhcmdzWzFdKSkpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBsb2dCcmlkZ2UoXCJ1bmtub3duIHBhZ2UgbWVzc2FnZTogXCIuY29uY2F0KFN0cmluZyhraW5kKSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG9uTWVudU9wZW4oX2V2ZW50KSB7XG4gICAgcmVmcmVzaE92ZXJsYXlWaXNpYmlsaXR5KCk7XG59XG5mdW5jdGlvbiBvbk1lbnVDbG9zZShfZXZlbnQpIHtcbiAgICByZWZyZXNoT3ZlcmxheVZpc2liaWxpdHkoKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpbml0QnJpZGdlKCkge1xuICAgIGlmIChicmlkZ2VBY3RpdmUpXG4gICAgICAgIHJldHVybjtcbiAgICBicmlkZ2VBY3RpdmUgPSB0cnVlO1xuICAgIC8vIFBhZ2UgLT4gcGx1Z2luIGNoYW5uZWwuIFdvcmtzIGZvciBBTlkgbG9hZGVkIHBhZ2UgKHNwaWtlIHBhZ2UgaW5jbHVkZWQpIOKAlFxuICAgIC8vIHRoZSBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQgaGVyZSBldmVuIHdoZW4gYnJpZGdlIFVSTCBsb2FkaW5nIGlzIGRpc2FibGVkLlxuICAgIG9uKFwiYnJvd3Nlck1lc3NhZ2VcIiwgaGFuZGxlQnJvd3Nlck1lc3NhZ2UpO1xuICAgIGlmIChDT05GSUcuYnJpZGdlRW5hYmxlZCAmJiBDT05GSUcuY29tcGFuaW9uVXJsKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBicm93c2VyLmxvYWRVcmwoQ09ORklHLmNvbXBhbmlvblVybCk7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIGNvbXBhbmlvbiBwYWdlOiBcIi5jb25jYXQoQ09ORklHLmNvbXBhbmlvblVybCkpO1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBub3RlOiB0aGUgVVJMIGxvYWRzIGFmdGVyIHRoZSBmaXJzdCBtb3VzZSBtb3ZlIChDRUYgYmVoYXZpb3IpXCIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gYnJvd3Nlci5sb2FkVXJsIGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSGlkZSB0aGUgb3ZlcmxheSBkdXJpbmcgYmFkIG1lbnVzOyByZS1zaG93IGFmdGVyLlxuICAgIG9uKFwibWVudU9wZW5cIiwgb25NZW51T3Blbik7XG4gICAgb24oXCJtZW51Q2xvc2VcIiwgb25NZW51Q2xvc2UpO1xuICAgIC8vIEhlYXJ0YmVhdCB3YXRjaGRvZzogcGFnZSBtdXN0IHB1bHNlOyBvbiBzdGFsZW5lc3Mgd2UgZHJvcCB0byBoaWRkZW4gYW5kXG4gICAgLy8gc3RvcCBpbmplY3RpbmcgKGF2b2lkcyB0YWxraW5nIGludG8gYSBkZWFkL2NyYXNoZWQgcmVuZGVyZXIpLlxuICAgIHNldEdhbWVJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY29tcGFuaW9uUmVhZHkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmIChEYXRlLm5vdygpIC0gbGFzdEhlYXJ0YmVhdEF0ID4gSEVBUlRCRUFUX1RJTUVPVVRfTVMpIHtcbiAgICAgICAgICAgIGNvbXBhbmlvblJlYWR5ID0gZmFsc2U7XG4gICAgICAgICAgICByZWZyZXNoT3ZlcmxheVZpc2liaWxpdHkoKTtcbiAgICAgICAgICAgIGxvZ0JyaWRnZShcImNvbXBhbmlvbiBzdGFsZSAobm8gaGVhcnRiZWF0KSDigJQgYnJpZGdlIHBhdXNlZFwiKTtcbiAgICAgICAgfVxuICAgIH0sIFdBVENIRE9HX0lOVEVSVkFMX01TKTtcbiAgICBsb2dCcmlkZ2UoXCJicmlkZ2UgaW5pdGlhbGl6ZWRcIik7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNDb21wYW5pb25SZWFkeSgpIHtcbiAgICByZXR1cm4gY29tcGFuaW9uUmVhZHk7XG59XG5leHBvcnQgZnVuY3Rpb24gaGVhcnRiZWF0QWdlTXMoKSB7XG4gICAgaWYgKCFjb21wYW5pb25SZWFkeSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIERhdGUubm93KCkgLSBsYXN0SGVhcnRiZWF0QXQ7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNPdmVybGF5VmlzaWJsZSgpIHtcbiAgICByZXR1cm4gb3ZlcmxheVZpc2libGU7XG59XG4vKiogTWFudWFsIGVzY2FwZSBoYXRjaCBmb3IgZGV2IGludGVyYWN0aXZpdHkgKEY2IGFsc28gdG9nZ2xlcyBmb2N1cyBpbi1nYW1lKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRDb21wYW5pb25Gb2N1c2VkKGZvY3VzZWQpIHtcbiAgICB0cnkge1xuICAgICAgICBicm93c2VyLnNldEZvY3VzZWQoZm9jdXNlZCk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nQnJpZGdlKFwic2V0Rm9jdXNlZCBmYWlsZWQ6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IGxvZ0RpYWcgfSBmcm9tIFwiLi4vZGlhZ1wiO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xudmFyIGZzTW9kdWxlO1xudmFyIGZzRmFpbHVyZUxvZ2dlZCA9IGZhbHNlO1xudmFyIGZzU3VjY2Vzc0xvZ2dlZCA9IGZhbHNlO1xuZnVuY3Rpb24gbG9nRnNGYWlsdXJlKG1zZykge1xuICAgIGlmIChmc0ZhaWx1cmVMb2dnZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBmc0ZhaWx1cmVMb2dnZWQgPSB0cnVlO1xuICAgIGxvZ0RpYWcoXCJbU2t5R3VpZGVdIGZzIFVOQVZBSUxBQkxFIFxcdTIwMTQgc3RhdGUuanNvbiBkaXNhYmxlZDogXCIuY29uY2F0KG1zZykpO1xufVxuZnVuY3Rpb24gbG9hZEZzKCkge1xuICAgIGlmIChmc01vZHVsZSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gZnNNb2R1bGU7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1yZXF1aXJlLWltcG9ydHNcbiAgICAgICAgZnNNb2R1bGUgPSByZXF1aXJlKFwiZnNcIik7XG4gICAgICAgIC8vIFNQJ3MgaG9zdCBmcyBpcyBhIFBBUlRJQUwgTm9kZSBzaGltIOKAlCBkdW1wIHdoYXQgaXQgYWN0dWFsbHkgZXhwb3Nlcy5cbiAgICAgICAgbG9nRGlhZyhcIltTa3lHdWlkZV0gZnMga2V5czogXCIuY29uY2F0KE9iamVjdC5rZXlzKGZzTW9kdWxlKS5qb2luKFwiLFwiKSkpO1xuICAgICAgICBsb2dEaWFnKFwiW1NreUd1aWRlXSBmcyBtZXRob2RzOiB3cml0ZUZpbGVTeW5jPVwiLmNvbmNhdCh0eXBlb2YgZnNNb2R1bGUud3JpdGVGaWxlU3luYywgXCIgd3JpdGVGaWxlPVwiKS5jb25jYXQodHlwZW9mIGZzTW9kdWxlLndyaXRlRmlsZSwgXCIgcmVhZEZpbGVTeW5jPVwiKS5jb25jYXQodHlwZW9mIGZzTW9kdWxlLnJlYWRGaWxlU3luYykpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGZzTW9kdWxlID0gbnVsbDtcbiAgICAgICAgbG9nRnNGYWlsdXJlKFN0cmluZyhlcnIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGZzTW9kdWxlO1xufVxuZnVuY3Rpb24gcGFyZW50RGlyKGZpbGVQYXRoKSB7XG4gICAgdmFyIGlkeCA9IE1hdGgubWF4KGZpbGVQYXRoLmxhc3RJbmRleE9mKFwiL1wiKSwgZmlsZVBhdGgubGFzdEluZGV4T2YoXCJcXFxcXCIpKTtcbiAgICBpZiAoaWR4IDw9IDApXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiBmaWxlUGF0aC5zbGljZSgwLCBpZHgpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGR1bXBNb2RDb250ZXh0KHBheWxvYWQpIHtcbiAgICB2YXIgX2E7XG4gICAgaWYgKCFDT05GSUcubW9kQ29udGV4dER1bXBFbmFibGVkKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIGZzQW55ID0gbG9hZEZzKCk7XG4gICAgaWYgKCFmc0FueSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHZhciB0YXJnZXQgPSBDT05GSUcubW9kQ29udGV4dFBhdGg7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbiAgICAgICAgLy8gU1AncyBmcyBzaGltOiBwcmVmZXIgYXRvbWljIHdyaXRlK3JlbmFtZSwgZmFsbCBiYWNrIHRvIHdoYXRldmVyXG4gICAgICAgIC8vIHdyaXRlIHByaW1pdGl2ZSBleGlzdHMgKHN5bmMgb3IgY2FsbGJhY2stc3R5bGUpLlxuICAgICAgICBpZiAodHlwZW9mIGZzQW55LndyaXRlRmlsZVN5bmMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIHRtcCA9IFwiXCIuY29uY2F0KHRhcmdldCwgXCIudG1wXCIpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB2YXIgZGlyID0gcGFyZW50RGlyKHRhcmdldCk7XG4gICAgICAgICAgICAgICAgaWYgKGRpcikge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgKF9hID0gZnNBbnkubWtkaXJTeW5jKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuY2FsbChmc0FueSwgZGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIERpcmVjdG9yeSBtYXkgYWxyZWFkeSBleGlzdC5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmc0FueS53cml0ZUZpbGVTeW5jKHRtcCwgZGF0YSk7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmc0FueS5yZW5hbWVTeW5jID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZnNBbnkucmVuYW1lU3luYyh0bXAsIHRhcmdldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgICAgICAgICAgLy8gRGlyZWN0IHdyaXRlIGZhbGxiYWNrIChhdG9taWNpdHkgaXMgYmVzdC1lZmZvcnQpLlxuICAgICAgICAgICAgICAgIGZzQW55LndyaXRlRmlsZVN5bmModGFyZ2V0LCBkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgZnNBbnkud3JpdGVGaWxlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIC8vIENhbGxiYWNrLXN0eWxlIE5vZGUgd3JpdGVGaWxlIOKAlCB0aGUgU1AgZXZlbnQgbG9vcCBkcmFpbnMgY2FsbGJhY2tzXG4gICAgICAgICAgICAvLyBiZXR3ZWVuIGZyYW1lcyAoc2FtZSBtZWNoYW5pc20gYXMgSHR0cENsaWVudCBjYWxsYmFja3MpLlxuICAgICAgICAgICAgZnNBbnkud3JpdGVGaWxlKHRhcmdldCwgZGF0YSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpXG4gICAgICAgICAgICAgICAgICAgIGxvZ0ZzRmFpbHVyZShTdHJpbmcoZXJyKSk7XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoIWZzU3VjY2Vzc0xvZ2dlZCkge1xuICAgICAgICAgICAgICAgICAgICBmc1N1Y2Nlc3NMb2dnZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBsb2dEaWFnKFwiW1NreUd1aWRlXSBzdGF0ZS5qc29uIHdyaXR0ZW4gKGFzeW5jKTogXCIuY29uY2F0KHRhcmdldCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKCFmc0ZhaWx1cmVMb2dnZWQpIHtcbiAgICAgICAgICAgICAgICBsb2dGc0ZhaWx1cmUoXCJubyB1c2FibGUgd3JpdGUgcHJpbWl0aXZlIG9uIGZzIG1vZHVsZVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWZzU3VjY2Vzc0xvZ2dlZCkge1xuICAgICAgICAgICAgZnNTdWNjZXNzTG9nZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxvZ0RpYWcoXCJbU2t5R3VpZGVdIHN0YXRlLmpzb24gd3JpdHRlbjogXCIuY29uY2F0KHRhcmdldCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZ0ZzRmFpbHVyZShTdHJpbmcoZXJyKSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4iLCJ2YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbnZhciBfX2dlbmVyYXRvciA9ICh0aGlzICYmIHRoaXMuX19nZW5lcmF0b3IpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBib2R5KSB7XG4gICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZyA9IE9iamVjdC5jcmVhdGUoKHR5cGVvZiBJdGVyYXRvciA9PT0gXCJmdW5jdGlvblwiID8gSXRlcmF0b3IgOiBPYmplY3QpLnByb3RvdHlwZSk7XG4gICAgcmV0dXJuIGcubmV4dCA9IHZlcmIoMCksIGdbXCJ0aHJvd1wiXSA9IHZlcmIoMSksIGdbXCJyZXR1cm5cIl0gPSB2ZXJiKDIpLCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XG4gICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9XG4gICAgZnVuY3Rpb24gc3RlcChvcCkge1xuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XG4gICAgICAgIHdoaWxlIChnICYmIChnID0gMCwgb3BbMF0gJiYgKF8gPSAwKSksIF8pIHRyeSB7XG4gICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5W1wicmV0dXJuXCJdIDogb3BbMF0gPyB5W1widGhyb3dcIl0gfHwgKCh0ID0geVtcInJldHVyblwiXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7XG4gICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07XG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XG4gICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfVxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcbiAgICB9XG59O1xuaW1wb3J0IHsgSHR0cENsaWVudCwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG52YXIgTUFYX1NFTkRTX1BFUl9TRUMgPSA1O1xudmFyIFJFUVVFU1RfVElNRU9VVF9NUyA9IDMwMDA7XG52YXIgc2VuZENvdW50ID0gMDtcbnZhciBsYXN0UmVzZXQgPSBEYXRlLm5vdygpO1xuLyoqXG4gKiBIYXJkZW5pbmcgcGF0dGVybiBmcm9tIHNreW1wNS1jbGllbnQgc2V0dGluZ3NTZXJ2aWNlOiBIdHRwQ2xpZW50IGhhcyBub1xuICogdGltZW91dCBzdXBwb3J0ICh2ZXJpZmllZCDigJQgY3BwLWh0dHBsaWIgd3JhcHBlciksIGFuZCBpdHMgdGhyZWFkIHBvb2wgaXNcbiAqIG9ubHkgMywgc28gYSBodW5nIHJlcXVlc3Qgc3RhcnZlcyBldmVyeSBsYXRlciBvbmUuIFJhY2UgYSByZWplY3QgdGltZXIuXG4gKi9cbmZ1bmN0aW9uIHdpdGhUaW1lb3V0KHByb21pc2UsIHRpbWVvdXRNcywgdGFnKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgdmFyIHRpbWVyID0gZ2xvYmFsVGhpcy5zZXRUaW1lb3V0XG4gICAgICAgICAgICA/IGdsb2JhbFRoaXMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiByZWplY3QobmV3IEVycm9yKFwiXCIuY29uY2F0KHRhZywgXCI6IHRpbWVvdXQgYWZ0ZXIgXCIpLmNvbmNhdCh0aW1lb3V0TXMsIFwibXNcIikpKTsgfSwgdGltZW91dE1zKVxuICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICBwcm9taXNlLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIHJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAodGltZXIgIT09IG51bGwpXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHJlc2V0UmF0ZUxpbWl0KCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSBsYXN0UmVzZXQgPj0gMTAwMCkge1xuICAgICAgICBzZW5kQ291bnQgPSAwO1xuICAgICAgICBsYXN0UmVzZXQgPSBub3c7XG4gICAgfVxufVxudmFyIFNreUd1aWRlSHR0cENsaWVudCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTa3lHdWlkZUh0dHBDbGllbnQoYmFzZVVybCkge1xuICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IDA7XG4gICAgICAgIHRoaXMubWF4RmFpbHVyZXMgPSAzO1xuICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IDA7XG4gICAgICAgIHRoaXMuY29vbGRvd25NcyA9IDEwMDAwO1xuICAgICAgICB0aGlzLmNsaWVudCA9IG5ldyBIdHRwQ2xpZW50KGJhc2VVcmwpO1xuICAgIH1cbiAgICBTa3lHdWlkZUh0dHBDbGllbnQucHJvdG90eXBlLnNlbmRHYW1lU3RhdGUgPSBmdW5jdGlvbiAocGF5bG9hZCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UsIGVycl8xLCBtc2c7XG4gICAgICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChfYS5sYWJlbCkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNldFJhdGVMaW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbmRDb3VudCA+PSBNQVhfU0VORFNfUEVSX1NFQykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIlJhdGUgbGltaXQgZXhjZWVkZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBmYWxzZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBfYS5sYWJlbCA9IDE7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hLnRyeXMucHVzaChbMSwgMywgLCA0XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCB3aXRoVGltZW91dCh0aGlzLmNsaWVudC5wb3N0KFwiL2FwaS9nYW1lLXN0YXRlXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9keTogcGF5bG9hZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksIFJFUVVFU1RfVElNRU9VVF9NUywgXCJnYW1lLXN0YXRlIFBPU1RcIildO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZSA9IF9hLnNlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCB0cnVlXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gSFRUUCBcIi5jb25jYXQocmVzcG9uc2Uuc3RhdHVzLCBcIjogcmVxdWVzdCByZWplY3RlZCBieSBzZXJ2ZXJcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsdXJlQ291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgZmFsc2VdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFszIC8qYnJlYWsqLywgNF07XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycl8xID0gX2Euc2VudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnID0gZXJyXzEgaW5zdGFuY2VvZiBFcnJvciA/IGVycl8xLm1lc3NhZ2UgOiBTdHJpbmcoZXJyXzEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEhUVFAgUE9TVCAvYXBpL2dhbWUtc3RhdGUgZmFpbGVkOiBcIi5jb25jYXQobXNnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RGYWlsdXJlVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGZhbHNlXTtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiByZXR1cm4gWzIgLypyZXR1cm4qL107XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgU2t5R3VpZGVIdHRwQ2xpZW50LnByb3RvdHlwZS5pc0Nvbm5lY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuZmFpbHVyZUNvdW50IDwgdGhpcy5tYXhGYWlsdXJlcylcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBpZiAoRGF0ZS5ub3coKSAtIHRoaXMubGFzdEZhaWx1cmVUaW1lID4gdGhpcy5jb29sZG93bk1zKSB7XG4gICAgICAgICAgICB0aGlzLmZhaWx1cmVDb3VudCA9IHRoaXMubWF4RmFpbHVyZXMgLSAxO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgcmV0dXJuIFNreUd1aWRlSHR0cENsaWVudDtcbn0oKSk7XG5leHBvcnQgdmFyIGh0dHBDbGllbnQgPSBuZXcgU2t5R3VpZGVIdHRwQ2xpZW50KENPTkZJRy5zZXJ2ZXJVcmwpO1xuZXhwb3J0IGZ1bmN0aW9uIHNlbmRHYW1lU3RhdGUocGF5bG9hZCkge1xuICAgIHJldHVybiBfX2F3YWl0ZXIodGhpcywgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF9fZ2VuZXJhdG9yKHRoaXMsIGZ1bmN0aW9uIChfYSkge1xuICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIGh0dHBDbGllbnQuc2VuZEdhbWVTdGF0ZShwYXlsb2FkKV07XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiBodHRwQ2xpZW50LmlzQ29ubmVjdGVkKCk7XG59XG4iLCIvLyBAZW52IG5vZGVcbi8vIE5PVEU6IEZvciBwcm9kdWN0aW9uLCBjb25zaWRlciByZWFkaW5nIGZyb20gU2t5cmltIFBsYXRmb3JtIHNldHRpbmdzOlxuLy8gICBpbXBvcnQgeyBzZXR0aW5ncyB9IGZyb20gXCJza3lyaW1QbGF0Zm9ybVwiO1xuLy8gICBjb25zdCBkZWJ1Z01vZGUgPSBzZXR0aW5nc1tcInNreWd1aWRlXCJdPy5bXCJkZWJ1Z01vZGVcIl0gPT09IFwidHJ1ZVwiO1xuZXhwb3J0IHZhciBQTEFZRVJfRk9STV9JRCA9IDB4MTQ7XG5leHBvcnQgdmFyIENPTkZJRyA9IHtcbiAgICBzZXJ2ZXJVcmw6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwXCIsXG4gICAgdGlja0ludGVydmFsOiA1MDAsXG4gICAgZW5lbXlTY2FuUmFkaXVzOiA1MDAwLFxuICAgIG1heEVuZW1pZXM6IDEwLFxuICAgIGRlYnVnTW9kZTogdHJ1ZSxcbiAgICAvLyBIVFRQIGFjdGlvbiBwb2xsaW5nOiBHRVQgL2FwaS9hY3Rpb25zP3NpbmNlPTxsYXN0SWQ+IOKAlCB0aGUgc2VydmVyIGtlZXBzXG4gICAgLy8gYW4gaW4tbWVtb3J5IG91dGJveCBvZiBwaXBlbGluZSBhY3Rpb25zIChjb21wb3NlciBzdWdnZXN0aW9ucywgcXVlc3Rpb25cbiAgICAvLyBhbnN3ZXJzKSwgcHJ1bmVkIGFmdGVyIDE1cy4gRWFjaCBhY3Rpb24gY2FycmllcyBhIG1vbm90b25pYyBpZDsgd2Ugc2VuZFxuICAgIC8vID9zaW5jZT0gZm9yIGF0LW1vc3Qtb25jZSBkZWxpdmVyeS4gRW5hYmxlZCAyMDI2LTExLTE1IGFsb25nc2lkZSB0aGVcbiAgICAvLyBzZXJ2ZXItc2lkZSBlbmRwb2ludC5cbiAgICBwb2xsaW5nSW50ZXJ2YWw6IDEwMDAsXG4gICAgcG9sbGluZ0VuZHBvaW50OiBcIi9hcGkvYWN0aW9uc1wiLFxuICAgIHBvbGxpbmdNYXhCYWNrb2ZmOiAzMDAwMCxcbiAgICBwb2xsaW5nRW5hYmxlZDogdHJ1ZSxcbiAgICBtYXhQb2xsaW5nUmV0cmllczogNSxcbiAgICAvLyBDb21wYW5pb24gYnJvd3NlciBicmlkZ2UgKHNlZSBzcmMvYnJpZGdlLnRzKS4gVGhlIHBhZ2UgaXMgc2VydmVkIGJ5IHRoZVxuICAgIC8vIGNvbXBhbmlvbiBhcHA7IGBicmlkZ2VFbmFibGVkYCBvbmx5IGNvbnRyb2xzIHdoZXRoZXIgd2UgbG9hZCB0aGUgVVJMIOKAlFxuICAgIC8vIHRoZSBicm93c2VyTWVzc2FnZSBoYW5kbGVyIGlzIHJlZ2lzdGVyZWQgcmVnYXJkbGVzcyAoc3Bpa2UgcGFnZSBzdXBwb3J0KS5cbiAgICBicmlkZ2VFbmFibGVkOiBmYWxzZSxcbiAgICBjb21wYW5pb25Vcmw6IFwiaHR0cDovL2xvY2FsaG9zdDozMDAwL2NvbXBhbmlvblwiLFxuICAgIC8vIFBhcmFsbGVsLWFycmF5IGR1bXAgZm9yIHRoZSBhcHAncyBTa3lyaW1GaWxlQ29ubmVjdG9yIC8gcGFyc2VTa3lyaW1TdGF0ZVxuICAgIC8vIChHYXRlICsgQ29tcG9zZXIgbW9kIGNvbnRleHQpLiBQYXRoIGlzIHJlbGF0aXZlIHRvIFNreXJpbSdzIENXRCB1bmxlc3NcbiAgICAvLyBhYnNvbHV0ZSDigJQgc2V0IFNLWVJJTV9DT05URVhUX0ZJTEVfUEFUSCBvbiB0aGUgYXBwIHRvIHRoZSBzYW1lIGZpbGUuXG4gICAgbW9kQ29udGV4dER1bXBFbmFibGVkOiB0cnVlLFxuICAgIG1vZENvbnRleHRQYXRoOiBcIkRhdGEvUGxhdGZvcm0vU2t5R3VpZGUvc3RhdGUuanNvblwiLFxuICAgIC8vIFdvcmxkIG9iamVjdCBzY2FubmVyIChkb2NzL0FDQ0VTU0lCSUxJVFktUE9SVC5tZCDCpzUuMSkuIFN3ZWVwIGlzXG4gICAgLy8gYnVkZ2V0ZWQgYWNyb3NzIHVwZGF0ZSB0aWNrczsgY2FjaGUgZGllcyBhZnRlciB+MTAwIHVuaXRzIG9mIG1vdmVtZW50XG4gICAgLy8gb3IgYSBjZWxsIGNoYW5nZSAodGhlaXIgUkVTQ0FOX0RJU1RBTkNFKS5cbiAgICBzY2FubmVyRW5hYmxlZDogdHJ1ZSxcbiAgICBzY2FuUmVzY2FuRGlzdGFuY2U6IDEwMCxcbiAgICBzY2FuTWF4T3V0cHV0OiA2NCxcbiAgICBzY2FuUHJvYmVCdWRnZXQ6IDk2LFxuICAgIHNjYW5NYXhDZWxsczogNCxcbiAgICBzY2FuUmFkaXVzVW5pdHM6IDI1MDAsXG4gICAgLy8gQXV0b3dhbGsgYnJpZGdlIChXNikuIFRoZSBFU1AgYW5ub3VuY2VzIGl0c2VsZiB2aWEgU2t5R3VpZGVfQXV0b1dhbGtSZWFkeVxuICAgIC8vIChzZW5kZXIgPSBxdWVzdCkgYXQgT25Jbml0IGFuZCBhZnRlciBldmVyeSBzYXZlIGxvYWQg4oCUIG5vIGZvcm0tSURcbiAgICAvLyBoYXJkY29kaW5nLiBVbnRpbCB0aGUgUmVhZHkgYW5ub3VuY2UgYXJyaXZlcyBhdXRvd2Fsa1RvIGZhaWxzIGNsZWFubHkuXG4gICAgYXV0b3dhbGtFbmFibGVkOiB0cnVlLFxuICAgIGF1dG93YWxrQWNrVGltZW91dE1zOiAyMDAwLFxuICAgIGF1dG93YWxrU3RvcERpc3RhbmNlOiAxMDAsXG4gICAgLy8gTWVudS1mb2N1cyBuYXJyYXRpb24gKEl0ZW1NZW51IGZhbWlseSB2aWEgVWkuZ2V0U3RyaW5nKS4gRGlzYWJsZWRcbiAgICAvLyBhdXRvbWF0aWNhbGx5IHdoZW4gU2t5cmltIEFjY2VzcyBpcyBpbnN0YWxsZWQuIDEwMG1zIG1hdGNoZXMgdGhlaXIgcG9sbC5cbiAgICBtZW51TmFycmF0aW9uRW5hYmxlZDogdHJ1ZSxcbiAgICBtZW51Rm9jdXNJbnRlcnZhbDogMTAwLFxuICAgIGludmVudG9yeUR1bXBNYXg6IDQ4LFxufTtcbiIsImltcG9ydCB7IHByaW50Q29uc29sZSwgd3JpdGVMb2dzIH0gZnJvbSBcIi4vc2t5cmltUGxhdGZvcm1cIjtcbi8qKlxuICogRHVhbC1jaGFubmVsIGRpYWdub3N0aWNzOiBpbi1nYW1lIGNvbnNvbGUgKyBza3lyaW0tcGxhdGZvcm0ubG9nIGZpbGUuXG4gKiBUaGUgZmlsZSBzdXJ2aXZlcyBhZnRlciB0aGUgc2Vzc2lvbiBlbmRzLCBzbyBwb3N0LW1vcnRlbSBhbmFseXNpcyBkb2VzIG5vdFxuICogZGVwZW5kIG9uIHRoZSB1c2VyIGNvcHlpbmcgY29uc29sZSB0ZXh0LiBVc2UgZm9yIHN0YXJ0dXAvZnMvRVNQLXdpcmluZ1xuICogcHJvb2ZzIOKAlCBub3QgZm9yIHBlci10aWNrIGNoYXR0ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2dEaWFnKCkge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgYXJnc1tfaV0gPSBhcmd1bWVudHNbX2ldO1xuICAgIH1cbiAgICB2YXIgbGluZSA9IGFyZ3MubWFwKGZ1bmN0aW9uIChhKSB7IHJldHVybiAodHlwZW9mIGEgPT09IFwic3RyaW5nXCIgPyBhIDogSlNPTi5zdHJpbmdpZnkoYSkpOyB9KS5qb2luKFwiIFwiKTtcbiAgICBwcmludENvbnNvbGUobGluZSk7XG4gICAgdHJ5IHtcbiAgICAgICAgd3JpdGVMb2dzKFwic2t5Z3VpZGUtcGx1Z2luXCIsIGxpbmUpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgLy8gTG9nIGZpbGUgbWF5IGJlIHVuYXZhaWxhYmxlIGluIHNvbWUgU1AgdmVyc2lvbnMg4oCUIGNvbnNvbGUgc3RpbGwgd29ya3MuXG4gICAgfVxufVxuIiwidmFyIF9fc3ByZWFkQXJyYXkgPSAodGhpcyAmJiB0aGlzLl9fc3ByZWFkQXJyYXkpIHx8IGZ1bmN0aW9uICh0bywgZnJvbSwgcGFjaykge1xuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XG59O1xuaW1wb3J0IHsgb24sIHByaW50Q29uc29sZSB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi9jb25maWdcIjtcbnZhciBpc1JlZ2lzdGVyZWQgPSBmYWxzZTtcbnZhciBsYXN0Q3Jvc3NoYWlyUmVmO1xudmFyIG9wZW5NZW51cyA9IG5ldyBTZXQoKTtcbnZhciBsYXN0TG9jYXRpb247XG52YXIgbGFzdEFjdGl2YXRlZFJlZjtcbnZhciBwbGF5ZXJEZWFkID0gZmFsc2U7XG52YXIgbGFzdENvbnRhaW5lckNoYW5nZWQ7XG52YXIgbGFzdEVxdWlwQ2hhbmdlO1xudmFyIGxhc3RMZXZlbFVwO1xudmFyIGxhc3RRdWVzdFVwZGF0ZTtcbnZhciBsYXN0RmFzdFRyYXZlbEVuZDtcbnZhciBsYXN0Qm9va1JlYWQ7XG52YXIgbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG52YXIgbGFzdExvY2tDaGFuZ2VkO1xuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBydW5IYW5kbGVyKGhhbmRsZXJzLCBldmVudE5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgX2E7XG4gICAgKF9hID0gaGFuZGxlcnMgPT09IG51bGwgfHwgaGFuZGxlcnMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGhhbmRsZXJzW2V2ZW50TmFtZV0pID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5jYWxsLmFwcGx5KF9hLCBfX3NwcmVhZEFycmF5KFtoYW5kbGVyc10sIGFyZ3MsIGZhbHNlKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdENyb3NzaGFpclJlZigpIHtcbiAgICByZXR1cm4gbGFzdENyb3NzaGFpclJlZjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVuTWVudXMoKSB7XG4gICAgdmFyIHNuYXBzaG90ID0gbmV3IFNldCgpO1xuICAgIG9wZW5NZW51cy5mb3JFYWNoKGZ1bmN0aW9uIChtZW51TmFtZSkge1xuICAgICAgICBzbmFwc2hvdC5hZGQobWVudU5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBzbmFwc2hvdDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0TG9jYXRpb24oKSB7XG4gICAgcmV0dXJuIGxhc3RMb2NhdGlvbjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0QWN0aXZhdGVkUmVmKCkge1xuICAgIHJldHVybiBsYXN0QWN0aXZhdGVkUmVmO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGlzUGxheWVyRGVhZCgpIHtcbiAgICByZXR1cm4gcGxheWVyRGVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Q29udGFpbmVyQ2hhbmdlZCgpIHtcbiAgICByZXR1cm4gbGFzdENvbnRhaW5lckNoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdEVxdWlwQ2hhbmdlKCkge1xuICAgIHJldHVybiBsYXN0RXF1aXBDaGFuZ2U7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExldmVsVXAoKSB7XG4gICAgcmV0dXJuIGxhc3RMZXZlbFVwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RRdWVzdFVwZGF0ZSgpIHtcbiAgICByZXR1cm4gbGFzdFF1ZXN0VXBkYXRlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldExhc3RGYXN0VHJhdmVsRW5kKCkge1xuICAgIHJldHVybiBsYXN0RmFzdFRyYXZlbEVuZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0Qm9va1JlYWQoKSB7XG4gICAgcmV0dXJuIGxhc3RCb29rUmVhZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRMYXN0SXRlbUhhcnZlc3RlZCgpIHtcbiAgICByZXR1cm4gbGFzdEl0ZW1IYXJ2ZXN0ZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TGFzdExvY2tDaGFuZ2VkKCkge1xuICAgIHJldHVybiBsYXN0TG9ja0NoYW5nZWQ7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJBbGxFdmVudHMoaGFuZGxlcnMpIHtcbiAgICBpZiAoaXNSZWdpc3RlcmVkKSB7XG4gICAgICAgIGRlYnVnTG9nKFwicmVnaXN0ZXJBbGxFdmVudHMgY2FsbGVkIGFmdGVyIGluaXRpYWxpemF0aW9uOyBza2lwcGluZyBkdXBsaWNhdGUgc3Vic2NyaXB0aW9uc1wiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpc1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIG9uKFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0Q3Jvc3NoYWlyUmVmID0gKF9hID0gZXZlbnQucmVmZXJlbmNlKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY3Jvc3NoYWlyUmVmQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjcm9zc2hhaXJSZWZDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDcm9zc2hhaXJSZWYpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NhdGlvbkNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgbGFzdExvY2F0aW9uID0gKF9hID0gZXZlbnQubmV3TG9jKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpO1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImxvY2F0aW9uQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2NhdGlvbkNoYW5nZWQ6IFwiLmNvbmNhdChsYXN0TG9jYXRpb24gIT09IG51bGwgJiYgbGFzdExvY2F0aW9uICE9PSB2b2lkIDAgPyBsYXN0TG9jYXRpb24gOiBcInVua25vd25cIikpO1xuICAgIH0pO1xuICAgIG9uKFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9jYXRpb25EaXNjb3ZlcnlcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9jYXRpb25EaXNjb3Zlcnk6IFwiLmNvbmNhdChldmVudC5uYW1lKSk7XG4gICAgfSk7XG4gICAgb24oXCJjZWxsRnVsbHlMb2FkZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2VsbEZ1bGx5TG9hZGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImNlbGxGdWxseUxvYWRlZDogXCIuY29uY2F0KGV2ZW50LmNlbGwuZ2V0TmFtZSgpKSk7XG4gICAgfSk7XG4gICAgb24oXCJtZW51T3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5hZGQoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51T3BlblwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJtZW51T3BlbjogXCIuY29uY2F0KGV2ZW50Lm5hbWUpKTtcbiAgICB9KTtcbiAgICBvbihcIm1lbnVDbG9zZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUpIHtcbiAgICAgICAgICAgIG9wZW5NZW51cy5kZWxldGUoZXZlbnQubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJtZW51Q2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibWVudUNsb3NlOiBcIi5jb25jYXQoZXZlbnQubmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRW50ZXJcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZnVybml0dXJlRW50ZXJcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZnVybml0dXJlRW50ZXI6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZnVybml0dXJlRXhpdFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJmdXJuaXR1cmVFeGl0XCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcImZ1cm5pdHVyZUV4aXQ6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwib3BlblwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJvcGVuXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIm9wZW46IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiY2xvc2VcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY2xvc2VcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiY2xvc2U6IFwiLmNvbmNhdChTdHJpbmcoZXZlbnQudGFyZ2V0LmdldEZvcm1JRCgpKSkpO1xuICAgIH0pO1xuICAgIG9uKFwicXVlc3RTdGFnZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0YWdlXCIsIHF1ZXN0SWQ6IGV2ZW50LnF1ZXN0LmdldEZvcm1JRCgpLCBzdGFnZTogZXZlbnQuc3RhZ2UgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0YWdlXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcInF1ZXN0U3RhZ2U6IHF1ZXN0PVwiLmNvbmNhdChTdHJpbmcobGFzdFF1ZXN0VXBkYXRlLnF1ZXN0SWQpLCBcIiBzdGFnZT1cIikuY29uY2F0KFN0cmluZyhldmVudC5zdGFnZSkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RhcnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RRdWVzdFVwZGF0ZSA9IHsgZXZlbnQ6IFwicXVlc3RTdGFydFwiLCBxdWVzdElkOiBldmVudC5xdWVzdC5nZXRGb3JtSUQoKSB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInF1ZXN0U3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdGFydDogcXVlc3Q9XCIuY29uY2F0KFN0cmluZyhsYXN0UXVlc3RVcGRhdGUucXVlc3RJZCkpKTtcbiAgICB9KTtcbiAgICBvbihcInF1ZXN0U3RvcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdFF1ZXN0VXBkYXRlID0geyBldmVudDogXCJxdWVzdFN0b3BcIiwgcXVlc3RJZDogZXZlbnQucXVlc3QuZ2V0Rm9ybUlEKCkgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJxdWVzdFN0b3BcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwicXVlc3RTdG9wOiBxdWVzdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RRdWVzdFVwZGF0ZS5xdWVzdElkKSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgcGxheWVyRGVhZCA9IHRydWU7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZGVhdGhTdGFydFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aFN0YXJ0XCIpO1xuICAgIH0pO1xuICAgIG9uKFwiZGVhdGhFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHBsYXllckRlYWQgPSBmYWxzZTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJkZWF0aEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJkZWF0aEVuZFwiKTtcbiAgICB9KTtcbiAgICBvbihcImNvbnRhaW5lckNoYW5nZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0Q29udGFpbmVyQ2hhbmdlZCA9IHtcbiAgICAgICAgICAgIG9sZENvbnRhaW5lcjogKF9hID0gZXZlbnQub2xkQ29udGFpbmVyKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBuZXdDb250YWluZXI6IChfYiA9IGV2ZW50Lm5ld0NvbnRhaW5lcikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgaXRlbTogKF9jID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgY291bnQ6IGV2ZW50Lm51bUl0ZW1zXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiY29udGFpbmVyQ2hhbmdlZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJjb250YWluZXJDaGFuZ2VkOiBcIi5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm9sZENvbnRhaW5lciksIFwiIC0+IFwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLm5ld0NvbnRhaW5lciksIFwiLCBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RDb250YWluZXJDaGFuZ2VkLml0ZW0pLCBcIiwgY291bnQ9XCIpLmNvbmNhdChTdHJpbmcoZXZlbnQubnVtSXRlbXMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcImVxdWlwXCIsXG4gICAgICAgICAgICBhY3RvcjogKF9hID0gZXZlbnQuYWN0b3IpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGJhc2VPYmplY3Q6IChfYiA9IGV2ZW50LmJhc2VPYmopID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIGV4dHJhRGF0YTogZXZlbnQudW5pcXVlSWRcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJlcXVpcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJlcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwidW5lcXVpcFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgbGFzdEVxdWlwQ2hhbmdlID0ge1xuICAgICAgICAgICAgYWN0aW9uOiBcInVuZXF1aXBcIixcbiAgICAgICAgICAgIGFjdG9yOiAoX2EgPSBldmVudC5hY3RvcikgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgYmFzZU9iamVjdDogKF9iID0gZXZlbnQuYmFzZU9iaikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmdldEZvcm1JRCgpLFxuICAgICAgICAgICAgZXh0cmFEYXRhOiBldmVudC51bmlxdWVJZFxuICAgICAgICB9O1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInVuZXF1aXBcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwidW5lcXVpcDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhsYXN0RXF1aXBDaGFuZ2UuYWN0b3IpLCBcIiBpdGVtPVwiKS5jb25jYXQoU3RyaW5nKGxhc3RFcXVpcENoYW5nZS5iYXNlT2JqZWN0KSkpO1xuICAgIH0pO1xuICAgIG9uKFwibGV2ZWxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBsZXZlbDogZXZlbnQubmV3TGV2ZWwsXG4gICAgICAgICAgICBpc1NraWxsSW5jcmVhc2U6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibGV2ZWxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJsZXZlbEluY3JlYXNlOiBsZXZlbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50Lm5ld0xldmVsKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2tpbGxJbmNyZWFzZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgbGFzdExldmVsVXAgPSB7XG4gICAgICAgICAgICBza2lsbElkOiBldmVudC5hY3RvclZhbHVlLFxuICAgICAgICAgICAgaXNTa2lsbEluY3JlYXNlOiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwic2tpbGxJbmNyZWFzZVwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJza2lsbEluY3JlYXNlOiBza2lsbD1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LmFjdG9yVmFsdWUpKSk7XG4gICAgfSk7XG4gICAgb24oXCJlbnRlckJsZWVkb3V0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcImVudGVyQmxlZWRvdXRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZW50ZXJCbGVlZG91dDogYWN0b3I9XCIuY29uY2F0KFN0cmluZyhldmVudC5hY3Rvci5nZXRGb3JtSUQoKSkpKTtcbiAgICB9KTtcbiAgICBvbihcImZhc3RUcmF2ZWxFbmRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGxhc3RGYXN0VHJhdmVsRW5kID0geyB0cmF2ZWxUaW1lR2FtZUhvdXJzOiBldmVudC50cmF2ZWxUaW1lR2FtZUhvdXJzIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiZmFzdFRyYXZlbEVuZFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJmYXN0VHJhdmVsRW5kOiB0cmF2ZWxIb3Vycz1cIi5jb25jYXQoU3RyaW5nKGV2ZW50LnRyYXZlbFRpbWVHYW1lSG91cnMpKSk7XG4gICAgfSk7XG4gICAgb24oXCJzbGVlcFN0YXJ0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RhcnRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwic2xlZXBTdGFydDogZGVzaXJlZFN0b3BUaW1lPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuZGVzaXJlZFN0b3BUaW1lKSkpO1xuICAgIH0pO1xuICAgIG9uKFwic2xlZXBTdG9wXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBydW5IYW5kbGVyKGhhbmRsZXJzLCBcInNsZWVwU3RvcFwiLCBbZXZlbnRdKTtcbiAgICAgICAgZGVidWdMb2coXCJzbGVlcFN0b3A6IGludGVycnVwdGVkPVwiLmNvbmNhdChTdHJpbmcoZXZlbnQuaXNJbnRlcnJ1cHRlZCkpKTtcbiAgICB9KTtcbiAgICBvbihcImFjdGl2YXRlXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICBsYXN0QWN0aXZhdGVkUmVmID0gKF9hID0gZXZlbnQudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCk7XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYWN0aXZhdGVcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYWN0aXZhdGU6IHRhcmdldD1cIi5jb25jYXQoU3RyaW5nKGxhc3RBY3RpdmF0ZWRSZWYpLCBcIiBjYXN0ZXI9XCIpLmNvbmNhdChTdHJpbmcoKF9iID0gZXZlbnQuY2FzdGVyKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0Rm9ybUlEKCkpKSk7XG4gICAgfSk7XG4gICAgb24oXCJsb2NrQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hO1xuICAgICAgICBsYXN0TG9ja0NoYW5nZWQgPSB7XG4gICAgICAgICAgICBsb2NrZWRPYmplY3Q6IChfYSA9IGV2ZW50LmxvY2tlZE9iamVjdCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwibG9ja0NoYW5nZWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwibG9ja0NoYW5nZWQ6IG9iamVjdD1cIi5jb25jYXQoU3RyaW5nKGxhc3RMb2NrQ2hhbmdlZC5sb2NrZWRPYmplY3QpKSk7XG4gICAgfSk7XG4gICAgb24oXCJib29rUmVhZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgICAgIGxhc3RCb29rUmVhZCA9IHtcbiAgICAgICAgICAgIGJvb2tGb3JtSWQ6IChfYSA9IGV2ZW50LmJvb2spID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXRGb3JtSUQoKSxcbiAgICAgICAgICAgIHRpdGxlOiAoX2IgPSBldmVudC5ib29rKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0TmFtZSgpXG4gICAgICAgIH07XG4gICAgICAgIHJ1bkhhbmRsZXIoaGFuZGxlcnMsIFwiYm9va1JlYWRcIiwgW2V2ZW50XSk7XG4gICAgICAgIGRlYnVnTG9nKFwiYm9va1JlYWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0Qm9va1JlYWQudGl0bGUpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IFN0cmluZyhsYXN0Qm9va1JlYWQuYm9va0Zvcm1JZCkpKTtcbiAgICB9KTtcbiAgICBvbihcIml0ZW1IYXJ2ZXN0ZWRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2IsIF9jO1xuICAgICAgICBsYXN0SXRlbUhhcnZlc3RlZCA9IHtcbiAgICAgICAgICAgIGl0ZW1Gb3JtSWQ6IChfYSA9IGV2ZW50LnByb2R1Y2VJdGVtKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCksXG4gICAgICAgICAgICBpbmdyZWRpZW50TmFtZTogKF9iID0gZXZlbnQucHJvZHVjZUl0ZW0pID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5nZXROYW1lKClcbiAgICAgICAgfTtcbiAgICAgICAgcnVuSGFuZGxlcihoYW5kbGVycywgXCJpdGVtSGFydmVzdGVkXCIsIFtldmVudF0pO1xuICAgICAgICBkZWJ1Z0xvZyhcIml0ZW1IYXJ2ZXN0ZWQ6IFwiLmNvbmNhdCgoX2MgPSBsYXN0SXRlbUhhcnZlc3RlZC5pbmdyZWRpZW50TmFtZSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogU3RyaW5nKGxhc3RJdGVtSGFydmVzdGVkLml0ZW1Gb3JtSWQpKSk7XG4gICAgfSk7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBjb2xsZWN0TmVhcmJ5TnBjcyB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbmVhcmJ5LWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFBsYXllckZ1bGxTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvcGxheWVyLWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdExvY2F0aW9uU3RhdGUgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL2xvY2F0aW9uLWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdFF1ZXN0U3RhdGUgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL3F1ZXN0LWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdENyb3NzaGFpclRhcmdldCB9IGZyb20gXCIuL2NvbGxlY3RvcnMvY3Jvc3NoYWlyLWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdElucHV0U3RhdGUgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL2lucHV0LWNvbGxlY3RvclwiO1xuaW1wb3J0IHsgY29sbGVjdE1lbnVTdGF0ZSB9IGZyb20gXCIuL2NvbGxlY3RvcnMvbWVudS1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGNvbGxlY3RFbnZpcm9ubWVudFN0YXRlIH0gZnJvbSBcIi4vY29sbGVjdG9ycy9lbnZpcm9ubWVudC1jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGdldFdvcmxkT2JqZWN0cyB9IGZyb20gXCIuL2NvbGxlY3RvcnMvd29ybGQtc2Nhbm5lclwiO1xuaW1wb3J0IHsgZXZhbHVhdGVTdHVja05vdyB9IGZyb20gXCIuLi93b3JsZC9zdHVjay1kZXRlY3Rpb25cIjtcbmltcG9ydCB7IGF1dG93YWxrSW5wdXRUaWNrLCBnZXROYXZpZ2F0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL3dvcmxkL2F1dG93YWxrXCI7XG5pbXBvcnQgeyBjb2xsZWN0QWN0aXZlRWZmZWN0cyB9IGZyb20gXCIuL2NvbGxlY3RvcnMvZWZmZWN0cy10cmFja2VyXCI7XG5pbXBvcnQgeyBjb21wdXRlVWlGbGFncyB9IGZyb20gXCIuL21lbnUtc3RhdGVcIjtcbmltcG9ydCB7IGdldE9wZW5NZW51cyB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IHBlZWtNZW51Rm9jdXMgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL21lbnUtZm9jdXNcIjtcbmltcG9ydCB7IHRha2VJdGVtRXZlbnQgfSBmcm9tIFwiLi9jb2xsZWN0b3JzL2l0ZW0tZXZlbnRzXCI7XG5pbXBvcnQgeyBjb2xsZWN0SW52ZW50b3J5RHVtcCB9IGZyb20gXCIuL2NvbGxlY3RvcnMvaW52ZW50b3J5LWNvbGxlY3RvclwiO1xuZnVuY3Rpb24gY29sbGVjdFBsYXllclN0YXRlKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFsdGg6IHBsYXllci5nZXRBY3RvclZhbHVlKFwiaGVhbHRoXCIpLFxuICAgICAgICBtYXhIZWFsdGg6IHBsYXllci5nZXRCYXNlQWN0b3JWYWx1ZShcImhlYWx0aFwiKSxcbiAgICAgICAgbWFnaWNrYTogcGxheWVyLmdldEFjdG9yVmFsdWUoXCJtYWdpY2thXCIpLFxuICAgICAgICBzdGFtaW5hOiBwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcInN0YW1pbmFcIiksXG4gICAgICAgIGxldmVsOiBwbGF5ZXIuZ2V0TGV2ZWwoKSxcbiAgICAgICAgcG9zaXRpb246IHtcbiAgICAgICAgICAgIHg6IHBsYXllci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgICAgIHk6IHBsYXllci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgICAgIHo6IHBsYXllci5nZXRQb3NpdGlvblooKSxcbiAgICAgICAgfSxcbiAgICAgICAgaXNTbmVha2luZzogcGxheWVyLmlzU25lYWtpbmcoKSxcbiAgICAgICAgaXNEZWFkOiBwbGF5ZXIuaXNEZWFkKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGVuZW1pZXNGcm9tTmVhcmJ5KG5wY3MpIHtcbiAgICByZXR1cm4gbnBjc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuICFucGMuaXNEZWFkICYmIG5wYy5pc0hvc3RpbGU7IH0pXG4gICAgICAgIC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZTsgfSlcbiAgICAgICAgLnNsaWNlKDAsIENPTkZJRy5tYXhFbmVtaWVzKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuICh7XG4gICAgICAgIGZvcm1JZDogbnBjLmZvcm1JZCxcbiAgICAgICAgbmFtZTogbnBjLm5hbWUsXG4gICAgICAgIGRpc3RhbmNlOiBucGMuZGlzdGFuY2UsXG4gICAgICAgIGhlYWx0aDogbnBjLmhlYWx0aCxcbiAgICAgICAgbGV2ZWw6IG5wYy5sZXZlbCxcbiAgICB9KTsgfSk7XG59XG5mdW5jdGlvbiBzYWZlQ2FsbChmbikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBmbigpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuLyoqXG4gKiBPbmUgY29sbGVjdGlvbiBwYXNzIHBlciBzZW5kOiBwcm90b2NvbC12MSBwYXlsb2FkIChyZWZsZXggKyBkYXNoYm9hcmQpIGFuZFxuICogdGhlIHJpY2ggc25hcHNob3QgKEdhdGUvQ29tcG9zZXIgbW9kLWNvbnRleHQgZHVtcCkgc2hhcmUgdGhlIG5lYXJieS1OUEMgc2Nhbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RCdW5kbGUocGxheWVyQW5pbWF0aW9uLCBldmVudFR5cGUpIHtcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZiwgX2csIF9oLCBfaiwgX2ssIF9sLCBfbSwgX287XG4gICAgaWYgKHBsYXllckFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IHBsYXllckFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICBpZiAoZXZlbnRUeXBlID09PSB2b2lkIDApIHsgZXZlbnRUeXBlID0gXCJ0aWNrXCI7IH1cbiAgICB2YXIgcGxheWVyID0gY29sbGVjdFBsYXllclN0YXRlKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHZhciBuZWFyYnlOcGNzID0gKF9hID0gc2FmZUNhbGwoY29sbGVjdE5lYXJieU5wY3MpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBbXTtcbiAgICB2YXIgd29ybGRPYmplY3RzID0gKF9iID0gc2FmZUNhbGwoZ2V0V29ybGRPYmplY3RzKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogW107XG4gICAgdmFyIGNvbWJhdFN0YXRlID0gKF9kID0gKF9jID0gR2FtZS5nZXRQbGF5ZXIoKSkgPT09IG51bGwgfHwgX2MgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9jLmdldENvbWJhdFN0YXRlKCkpICE9PSBudWxsICYmIF9kICE9PSB2b2lkIDAgPyBfZCA6IDA7XG4gICAgdmFyIHBsYXllckZ1bGwgPSBzYWZlQ2FsbChjb2xsZWN0UGxheWVyRnVsbFN0YXRlKTtcbiAgICB2YXIgaW5wdXRTdGF0ZSA9IHNhZmVDYWxsKGNvbGxlY3RJbnB1dFN0YXRlKTtcbiAgICB2YXIgbWVudVN0YXRlID0gc2FmZUNhbGwoY29sbGVjdE1lbnVTdGF0ZSk7XG4gICAgdmFyIHVpRmxhZ3MgPSBjb21wdXRlVWlGbGFncyhnZXRPcGVuTWVudXMoKSk7XG4gICAgdmFyIG1lbnVGb2N1cyA9IChfZiA9IChfZSA9IHBlZWtNZW51Rm9jdXMoKSkgIT09IG51bGwgJiYgX2UgIT09IHZvaWQgMCA/IF9lIDogdGFrZUl0ZW1FdmVudCgpKSAhPT0gbnVsbCAmJiBfZiAhPT0gdm9pZCAwID8gX2YgOiB1bmRlZmluZWQ7XG4gICAgdmFyIGludmVudG9yeUl0ZW1zID0gKF9nID0gc2FmZUNhbGwoY29sbGVjdEludmVudG9yeUR1bXApKSAhPT0gbnVsbCAmJiBfZyAhPT0gdm9pZCAwID8gX2cgOiBbXTtcbiAgICAvLyBTdHVjayBkZXRlY3Rpb24gKFczKTogY29uc3VtZXMgYWxyZWFkeS1jb2xsZWN0ZWQgZGF0YSDigJQgemVybyBleHRyYVxuICAgIC8vIFBhcHlydXMgcHJvYmVzLiBgZXhjbHVkZWRgIHJlc2V0cyB0aGUgY29uZmlybWF0aW9uIHdpbmRvdy5cbiAgICB2YXIgc3R1Y2tFdmFsID0gZXZhbHVhdGVTdHVja05vdyh7XG4gICAgICAgIHBvczogcGxheWVyLnBvc2l0aW9uLFxuICAgICAgICBrZXlzUHJlc3NlZDogKF9oID0gaW5wdXRTdGF0ZSA9PT0gbnVsbCB8fCBpbnB1dFN0YXRlID09PSB2b2lkIDAgPyB2b2lkIDAgOiBpbnB1dFN0YXRlLmtleXNQcmVzc2VkKSAhPT0gbnVsbCAmJiBfaCAhPT0gdm9pZCAwID8gX2ggOiBbXSxcbiAgICAgICAgZ2FtZU1zOiBEYXRlLm5vdygpLFxuICAgICAgICBleGNsdWRlZDogdWlGbGFncy5tZW51T3BlbiB8fFxuICAgICAgICAgICAgcGxheWVyLmlzRGVhZCB8fFxuICAgICAgICAgICAgKChfaiA9IHBsYXllckZ1bGwgPT09IG51bGwgfHwgcGxheWVyRnVsbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogcGxheWVyRnVsbC5tb3ZlbWVudC5pc1N3aW1taW5nKSAhPT0gbnVsbCAmJiBfaiAhPT0gdm9pZCAwID8gX2ogOiBmYWxzZSkgfHxcbiAgICAgICAgICAgICgoX2sgPSBwbGF5ZXJGdWxsID09PSBudWxsIHx8IHBsYXllckZ1bGwgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHBsYXllckZ1bGwubW92ZW1lbnQuaXNPbk1vdW50KSAhPT0gbnVsbCAmJiBfayAhPT0gdm9pZCAwID8gX2sgOiBmYWxzZSkgfHxcbiAgICAgICAgICAgICgoKF9sID0gcGxheWVyRnVsbCA9PT0gbnVsbCB8fCBwbGF5ZXJGdWxsID09PSB2b2lkIDAgPyB2b2lkIDAgOiBwbGF5ZXJGdWxsLm1vdmVtZW50LnNpdFN0YXRlKSAhPT0gbnVsbCAmJiBfbCAhPT0gdm9pZCAwID8gX2wgOiAwKSA+IDApIHx8XG4gICAgICAgICAgICBuZWFyYnlOcGNzLnNvbWUoZnVuY3Rpb24gKG5wYykgeyByZXR1cm4gbnBjLmlzSW5EaWFsb2d1ZTsgfSksXG4gICAgICAgIHdvcmxkT2JqZWN0czogd29ybGRPYmplY3RzLFxuICAgIH0pO1xuICAgIC8vIEF1dG93YWxrIFdBU0QgY2FuY2VsIHdhdGNoIChXNik6IGFueSBtb3ZlbWVudCBrZXkgZHVyaW5nIGEgd2FsayBjYW5jZWxzLlxuICAgIGF1dG93YWxrSW5wdXRUaWNrKChfbSA9IGlucHV0U3RhdGUgPT09IG51bGwgfHwgaW5wdXRTdGF0ZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogaW5wdXRTdGF0ZS5rZXlzUHJlc3NlZCkgIT09IG51bGwgJiYgX20gIT09IHZvaWQgMCA/IF9tIDogW10sIHVpRmxhZ3MubWVudU9wZW4gfHwgcGxheWVyLmlzRGVhZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcHJvdG9jb2w6IHtcbiAgICAgICAgICAgIHBsYXllcjogcGxheWVyLFxuICAgICAgICAgICAgY29tYmF0U3RhdGU6IGNvbWJhdFN0YXRlLFxuICAgICAgICAgICAgZW5lbWllczogZW5lbWllc0Zyb21OZWFyYnkobmVhcmJ5TnBjcyksXG4gICAgICAgICAgICBwbGF5ZXJBbmltYXRpb246IHBsYXllckFuaW1hdGlvbixcbiAgICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnRUeXBlLFxuICAgICAgICAgICAgLy8gRmFzdC1sYW5lIGV4dGVuc2lvbnMgKHByb3RvY29sIHYxIGFkZGl0aXZlKS5cbiAgICAgICAgICAgIGhlYWRpbmdBbmdsZVo6IHBsYXllckZ1bGwgPT09IG51bGwgfHwgcGxheWVyRnVsbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogcGxheWVyRnVsbC5oZWFkaW5nLmFuZ2xlWixcbiAgICAgICAgICAgIGlzU3R1Y2s6IHN0dWNrRXZhbC5zdHVjayxcbiAgICAgICAgICAgIHN0dWNrUmVsRGVnOiBzdHVja0V2YWwuYmVhcmluZ1JlbERlZyxcbiAgICAgICAgICAgIG5hdmlnYXRpb246IHsgc3RhdHVzOiBnZXROYXZpZ2F0aW9uU3RhdHVzKCkgfSxcbiAgICAgICAgICAgIHVpOiB1aUZsYWdzLFxuICAgICAgICAgICAgbWVudTogbWVudUZvY3VzLFxuICAgICAgICB9LFxuICAgICAgICBzbmFwc2hvdDoge1xuICAgICAgICAgICAgcGxheWVyOiBwbGF5ZXJGdWxsLFxuICAgICAgICAgICAgbmVhcmJ5TnBjczogbmVhcmJ5TnBjcyxcbiAgICAgICAgICAgIHdvcmxkT2JqZWN0czogd29ybGRPYmplY3RzLFxuICAgICAgICAgICAgY3Jvc3NoYWlyVGFyZ2V0OiBzYWZlQ2FsbChjb2xsZWN0Q3Jvc3NoYWlyVGFyZ2V0KSxcbiAgICAgICAgICAgIGxvY2F0aW9uOiBzYWZlQ2FsbChjb2xsZWN0TG9jYXRpb25TdGF0ZSksXG4gICAgICAgICAgICBxdWVzdDogc2FmZUNhbGwoY29sbGVjdFF1ZXN0U3RhdGUpLFxuICAgICAgICAgICAgaW5wdXQ6IGlucHV0U3RhdGUsXG4gICAgICAgICAgICBtZW51OiBtZW51U3RhdGUsXG4gICAgICAgICAgICBlbnZpcm9ubWVudDogc2FmZUNhbGwoY29sbGVjdEVudmlyb25tZW50U3RhdGUpLFxuICAgICAgICAgICAgZWZmZWN0czogKF9vID0gc2FmZUNhbGwoY29sbGVjdEFjdGl2ZUVmZmVjdHMpKSAhPT0gbnVsbCAmJiBfbyAhPT0gdm9pZCAwID8gX28gOiBbXSxcbiAgICAgICAgICAgIGludmVudG9yeUl0ZW1zOiBpbnZlbnRvcnlJdGVtcyxcbiAgICAgICAgICAgIGV2ZW50VHlwZTogZXZlbnRUeXBlLFxuICAgICAgICB9LFxuICAgIH07XG59XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEZ1bGxTdGF0ZShwbGF5ZXJBbmltYXRpb24sIGV2ZW50VHlwZSkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgaWYgKHBsYXllckFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IHBsYXllckFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICBpZiAoZXZlbnRUeXBlID09PSB2b2lkIDApIHsgZXZlbnRUeXBlID0gXCJ0aWNrXCI7IH1cbiAgICByZXR1cm4gKF9iID0gKF9hID0gY29sbGVjdEJ1bmRsZShwbGF5ZXJBbmltYXRpb24sIGV2ZW50VHlwZSkpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5wcm90b2NvbCkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbDtcbn1cbiIsImltcG9ydCB7IEdhbWUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ1wiO1xudmFyIEZPUk1fVFlQRV9OQU1FUyA9IHtcbiAgICAyNDogXCJBY3RpdmF0b3JcIixcbiAgICAyNjogXCJGbG9yYVwiLFxuICAgIDI3OiBcIktleVwiLFxuICAgIDI4OiBcIkNvbnRhaW5lclwiLFxuICAgIDI5OiBcIkRvb3JcIixcbiAgICA0MDogXCJGdXJuaXR1cmVcIixcbiAgICA0MTogXCJJbmdyZWRpZW50XCIsXG4gICAgNDI6IFwiQXBwYXJhdHVzXCIsXG4gICAgNjI6IFwiTlBDXCIsXG59O1xuZnVuY3Rpb24gbWFwRm9ybVR5cGUodHlwZUlkKSB7XG4gICAgdmFyIF9hO1xuICAgIGlmICh0eXBlSWQgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIChfYSA9IEZPUk1fVFlQRV9OQU1FU1t0eXBlSWRdKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBcIkZvcm1UeXBlX1wiLmNvbmNhdCh0eXBlSWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RDcm9zc2hhaXJUYXJnZXQoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2MsIF9kO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciByZWYgPSBHYW1lLmdldEN1cnJlbnRDcm9zc2hhaXJSZWYoKTtcbiAgICAgICAgaWYgKHJlZiA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZm9ybUlkID0gcmVmLmdldEZvcm1JRCgpO1xuICAgICAgICB2YXIgYmFzZU9iamVjdCA9IHJlZi5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgIHZhciB0eXBlSWQgPSBiYXNlT2JqZWN0ID09PSBudWxsIHx8IGJhc2VPYmplY3QgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2VPYmplY3QuZ2V0VHlwZSgpO1xuICAgICAgICB2YXIgdHlwZSA9IG1hcEZvcm1UeXBlKHR5cGVJZCk7XG4gICAgICAgIHZhciBpc09wZW4gPSBudWxsO1xuICAgICAgICBpZiAodHlwZUlkID09PSAyOSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBpc09wZW4gPSByZWYuZ2V0T3BlblN0YXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICBpc09wZW4gPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gKF9iID0gKF9hID0gcmVmLmdldERpc3BsYXlOYW1lKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IGJhc2VPYmplY3QgPT09IG51bGwgfHwgYmFzZU9iamVjdCA9PT0gdm9pZCAwID8gdm9pZCAwIDogYmFzZU9iamVjdC5nZXROYW1lKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IG51bGw7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IChfZCA9IChfYyA9IEdhbWUuZ2V0UGxheWVyKCkpID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5nZXREaXN0YW5jZShyZWYpKSAhPT0gbnVsbCAmJiBfZCAhPT0gdm9pZCAwID8gX2QgOiAwO1xuICAgICAgICBpZiAoZm9ybUlkID09PSBQTEFZRVJfRk9STV9JRCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgZm9ybUlkOiBmb3JtSWQsXG4gICAgICAgICAgICBkaXN0YW5jZTogZGlzdGFuY2UsXG4gICAgICAgICAgICBpc09wZW46IGlzT3BlbixcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY2F0Y2ggKF9mKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi4vLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBvbiwgcHJpbnRDb25zb2xlLCB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuLyoqXG4gKiBBY3RpdmUtZWZmZWN0cyB0cmFja2VyIChXNCkuIFRoZXJlIGlzIE5PIGFjdGl2ZS1lZmZlY3QgZW51bWVyYXRvciBvbiB0aGVcbiAqIFBhcHlydXMgc3VyZmFjZSAoYGdldE50aEFjdGl2ZUVmZmVjdGAgZG9lcyBub3QgZXhpc3Q7IGBoYXNNYWdpY0VmZmVjdGBcbiAqIG5lZWRzIHRoZSBlZmZlY3QgaW4gaGFuZCksIHNvIHdlIHRyYWNrIGBlZmZlY3RTdGFydGAvYGVmZmVjdEZpbmlzaGAgZXZlbnRzXG4gKiBpbnRvIGEgbmFtZSBzZXQuXG4gKlxuICogRG9jdW1lbnRlZCBsaW1pdGF0aW9uIChwbGFuIMKnVzQpOiBlZmZlY3RzIGFscmVhZHkgYWN0aXZlIGF0IHNhdmUtbG9hZCBhcmVcbiAqIGludmlzaWJsZSB1bnRpbCB0aGV5IHJlLWZpcmUg4oCUIGBsb2FkR2FtZWAgY2xlYXJzIHRoZSBzZXQgYW5kIHRoZSBtYXBcbiAqIHJlcG9wdWxhdGVzIGFzIGVmZmVjdHMgY2hhbmdlLlxuICovXG52YXIgYWN0aXZlRWZmZWN0cyA9IG5ldyBTZXQoKTtcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltlZmZlY3RzLXRyYWNrZXJdIFwiLmNvbmNhdChtZXNzYWdlKSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNQbGF5ZXIoZXZlbnQpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAoKF9iID0gKF9hID0gZXZlbnQudGFyZ2V0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IDApID09PSBQTEFZRVJfRk9STV9JRDtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiBlZmZlY3ROYW1lKGV2ZW50KSB7XG4gICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIG5hbWUgPSAoX2MgPSAoX2IgPSAoX2EgPSBldmVudC5lZmZlY3QpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5nZXROYW1lKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuY2FsbChfYSkpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IFwiXCI7XG4gICAgICAgIHJldHVybiBuYW1lLmxlbmd0aCA+IDAgPyBuYW1lIDogXCJFZmZldCBpbmNvbm51XCI7XG4gICAgfVxuICAgIGNhdGNoIChfZCkge1xuICAgICAgICByZXR1cm4gXCJFZmZldCBpbmNvbm51XCI7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGluaXRFZmZlY3RzVHJhY2tlcigpIHtcbiAgICBpZiAoaW5pdGlhbGl6ZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgb24oXCJlZmZlY3RTdGFydFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKCFpc1BsYXllcihldmVudCkpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHZhciBuYW1lID0gZWZmZWN0TmFtZShldmVudCk7XG4gICAgICAgIGFjdGl2ZUVmZmVjdHMuYWRkKG5hbWUpO1xuICAgICAgICBkZWJ1Z0xvZyhcImVmZmVjdFN0YXJ0OiBcIi5jb25jYXQobmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwiZWZmZWN0RmluaXNoXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBpZiAoIWlzUGxheWVyKGV2ZW50KSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdmFyIG5hbWUgPSBlZmZlY3ROYW1lKGV2ZW50KTtcbiAgICAgICAgYWN0aXZlRWZmZWN0cy5kZWxldGUobmFtZSk7XG4gICAgICAgIGRlYnVnTG9nKFwiZWZmZWN0RmluaXNoOiBcIi5jb25jYXQobmFtZSkpO1xuICAgIH0pO1xuICAgIG9uKFwibG9hZEdhbWVcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBFZmZlY3RzIGFjdGl2ZSBhdCBsb2FkIG5ldmVyIGZpcmVkIGluIHRoaXMgVk0gc2Vzc2lvbiDigJQgc3RhcnQgY2xlYW4uXG4gICAgICAgIGFjdGl2ZUVmZmVjdHMuY2xlYXIoKTtcbiAgICAgICAgZGVidWdMb2coXCJsb2FkR2FtZSDigJQgZWZmZWN0IHNldCBjbGVhcmVkXCIpO1xuICAgIH0pO1xufVxuLyoqIFNvcnRlZCBzbmFwc2hvdCBmb3IgdGhlIGR1bXAgKHN0cmluZ0xpc3QpLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RBY3RpdmVFZmZlY3RzKCkge1xuICAgIHJldHVybiBBcnJheS5mcm9tKGFjdGl2ZUVmZmVjdHMpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEubG9jYWxlQ29tcGFyZShiLCBcImZyXCIpOyB9KTtcbn1cbi8qKiBUZXN0IHNlYW0uICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRFZmZlY3RzVHJhY2tlckZvclRlc3QoKSB7XG4gICAgYWN0aXZlRWZmZWN0cy5jbGVhcigpO1xuICAgIGluaXRpYWxpemVkID0gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyBHYW1lLCBVdGlsaXR5LCBXZWF0aGVyIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdEVudmlyb25tZW50U3RhdGUoKSB7XG4gICAgdmFyIF9hLCBfYjtcbiAgICB2YXIgZ2FtZVRpbWUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGdhbWVUaW1lID0gVXRpbGl0eS5nZXRDdXJyZW50R2FtZVRpbWUoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIGdhbWVUaW1lID0gMDtcbiAgICB9XG4gICAgdmFyIGdhbWVIb3VyID0gMDtcbiAgICB0cnkge1xuICAgICAgICBnYW1lSG91ciA9ICgoZ2FtZVRpbWUgKiAyNCkgJSAyNCArIDI0KSAlIDI0O1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgZ2FtZUhvdXIgPSAwO1xuICAgIH1cbiAgICB2YXIgY2FtZXJhU3RhdGUgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIGNhbWVyYVN0YXRlID0gR2FtZS5nZXRDYW1lcmFTdGF0ZSgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgY2FtZXJhU3RhdGUgPSAwO1xuICAgIH1cbiAgICB2YXIgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHdlYXRoZXJOYW1lID0gKF9iID0gKF9hID0gV2VhdGhlci5nZXRDdXJyZW50V2VhdGhlcigpKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgIH1cbiAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgd2VhdGhlck5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBzdW5Qb3NpdGlvblggPSBHYW1lLmdldFN1blBvc2l0aW9uWCgpO1xuICAgIH1cbiAgICBjYXRjaCAoX2cpIHtcbiAgICAgICAgc3VuUG9zaXRpb25YID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgc3VuUG9zaXRpb25ZID0gR2FtZS5nZXRTdW5Qb3NpdGlvblkoKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9oKSB7XG4gICAgICAgIHN1blBvc2l0aW9uWSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHN1blBvc2l0aW9uWiA9IEdhbWUuZ2V0U3VuUG9zaXRpb25aKCk7XG4gICAgfVxuICAgIGNhdGNoIChfaikge1xuICAgICAgICBzdW5Qb3NpdGlvblogPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBnYW1lVGltZTogZ2FtZVRpbWUsXG4gICAgICAgIGdhbWVIb3VyOiBnYW1lSG91cixcbiAgICAgICAgd2VhdGhlck5hbWU6IHdlYXRoZXJOYW1lLFxuICAgICAgICBjYW1lcmFTdGF0ZTogY2FtZXJhU3RhdGUsXG4gICAgICAgIHN1blBvc2l0aW9uWDogc3VuUG9zaXRpb25YLFxuICAgICAgICBzdW5Qb3NpdGlvblk6IHN1blBvc2l0aW9uWSxcbiAgICAgICAgc3VuUG9zaXRpb25aOiBzdW5Qb3NpdGlvblpcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgSW5wdXQgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbnZhciBNT1ZFX0ZPUldBUkQgPSAxNztcbnZhciBNT1ZFX0xFRlQgPSAzMDtcbnZhciBNT1ZFX0JBQ0tXQVJEID0gMzE7XG52YXIgTU9WRV9SSUdIVCA9IDMyO1xudmFyIFNQUklOVCA9IDQyO1xudmFyIENST1VDSCA9IDI5O1xudmFyIEpVTVBfT1JfQUNUSVZBVEUgPSA1NztcbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0SW5wdXRTdGF0ZSgpIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIga2V5c1ByZXNzZWQgPSBbXTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChNT1ZFX0ZPUldBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIldcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9MRUZUKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJBXCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKE1PVkVfQkFDS1dBUkQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNcIik7XG4gICAgICAgIGlmIChJbnB1dC5pc0tleVByZXNzZWQoTU9WRV9SSUdIVCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiRFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChTUFJJTlQpKVxuICAgICAgICAgICAga2V5c1ByZXNzZWQucHVzaChcIlNoaWZ0XCIpO1xuICAgICAgICBpZiAoSW5wdXQuaXNLZXlQcmVzc2VkKENST1VDSCkpXG4gICAgICAgICAgICBrZXlzUHJlc3NlZC5wdXNoKFwiQ3RybFwiKTtcbiAgICAgICAgaWYgKElucHV0LmlzS2V5UHJlc3NlZChKVU1QX09SX0FDVElWQVRFKSlcbiAgICAgICAgICAgIGtleXNQcmVzc2VkLnB1c2goXCJTcGFjZVwiKTtcbiAgICAgICAgcmV0dXJuIHsga2V5c1ByZXNzZWQ6IGtleXNQcmVzc2VkIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4geyBrZXlzUHJlc3NlZDogW10gfTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBmaW5hbGl6ZUludmVudG9yeVJvd3MsIH0gZnJvbSBcIi4uL2ludmVudG9yeS1jb3JlXCI7XG5pbXBvcnQgeyBmaW5kTmFycmF0YWJsZU1lbnUgfSBmcm9tIFwiLi4vbWVudS1mb2N1cy1jb3JlXCI7XG5pbXBvcnQgeyBnZXRPcGVuTWVudXMgfSBmcm9tIFwiLi4vLi4vZXZlbnRzXCI7XG52YXIgSU5WRU5UT1JZX0RVTVBfSU5URVJWQUxfTVMgPSAyMDAwO1xudmFyIGxhc3REdW1wQXQgPSAwO1xudmFyIGxhc3REdW1wID0gW107XG4vKipcbiAqIFBsYXllciBpbnZlbnRvcnkgYXMgcGFyYWxsZWwtYXJyYXkgcm93cyBmb3IgdGhlIGNvbnRleHQgZHVtcC5cbiAqIE9ubHkgcnVucyB3aGlsZSBhIG5hcnJhdGFibGUgbWVudSBpcyBvcGVuIOKAlCBnZXROdGhGb3JtIG92ZXIgYSBmdWxsIGJhZ1xuICogZXZlcnkgd29ybGQgdGljayBpcyB0b28gZXhwZW5zaXZlIG9uIHRoZSBnYW1lIHRocmVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RJbnZlbnRvcnlEdW1wKCkge1xuICAgIHZhciBfYSwgX2IsIF9jO1xuICAgIGlmICghZmluZE5hcnJhdGFibGVNZW51KGdldE9wZW5NZW51cygpKSkge1xuICAgICAgICBsYXN0RHVtcCA9IFtdO1xuICAgICAgICBsYXN0RHVtcEF0ID0gMDtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAobGFzdER1bXBBdCAhPT0gMCAmJiBub3cgLSBsYXN0RHVtcEF0IDwgSU5WRU5UT1JZX0RVTVBfSU5URVJWQUxfTVMpIHtcbiAgICAgICAgcmV0dXJuIGxhc3REdW1wO1xuICAgIH1cbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcilcbiAgICAgICAgcmV0dXJuIGxhc3REdW1wO1xuICAgIHZhciBuID0gMDtcbiAgICB0cnkge1xuICAgICAgICBuID0gKF9hID0gcGxheWVyLmdldE51bUl0ZW1zKCkpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IDA7XG4gICAgfVxuICAgIGNhdGNoIChfZCkge1xuICAgICAgICByZXR1cm4gbGFzdER1bXA7XG4gICAgfVxuICAgIHZhciByb3dzID0gW107XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5taW4obiwgQ09ORklHLmludmVudG9yeUR1bXBNYXggKiAyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbWl0OyBpKyspIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBmb3JtID0gcGxheWVyLmdldE50aEZvcm0oaSk7XG4gICAgICAgICAgICBpZiAoIWZvcm0pXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IChfYiA9IGZvcm0uZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBcIlwiO1xuICAgICAgICAgICAgdmFyIGZvcm1JZCA9IGZvcm0uZ2V0Rm9ybUlEKCk7XG4gICAgICAgICAgICB2YXIgY291bnQgPSAxO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb3VudCA9IChfYyA9IHBsYXllci5nZXRJdGVtQ291bnQoZm9ybSkpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoX2UpIHtcbiAgICAgICAgICAgICAgICBjb3VudCA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb3dzLnB1c2goeyBuYW1lOiBuYW1lLCBjb3VudDogY291bnQsIGZvcm1JZDogZm9ybUlkIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfZikge1xuICAgICAgICAgICAgLy8gc2tpcCBicm9rZW4gZXh0cmEgZGF0YVxuICAgICAgICB9XG4gICAgICAgIGlmIChyb3dzLmxlbmd0aCA+PSBDT05GSUcuaW52ZW50b3J5RHVtcE1heClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBsYXN0RHVtcEF0ID0gbm93O1xuICAgIGxhc3REdW1wID0gZmluYWxpemVJbnZlbnRvcnlSb3dzKHJvd3MsIENPTkZJRy5pbnZlbnRvcnlEdW1wTWF4KTtcbiAgICByZXR1cm4gbGFzdER1bXA7XG59XG4iLCJpbXBvcnQgeyBsb2dEaWFnIH0gZnJvbSBcIi4uLy4uL2RpYWdcIjtcbmltcG9ydCB7IENPTkZJRyB9IGZyb20gXCIuLi8uLi9jb25maWdcIjtcbi8qKlxuICogSXRlbS1hY3Rpb24gbmFycmF0aW9uIChlcXVpcCAvIHVuZXF1aXAgLyBjb25zdW1lKSDigJQgXCJJbCBkZXZyYWl0IHNpZ25hbGVyXG4gKiBxdWFuZCBqJ8OpcXVpcGUgb3UgdXRpbGlzZSBkZXMgaXRlbXNcIi4gU2l0cyBvbiB0aGUgZXF1aXAvdW5lcXVpcCBTUCBldmVudHNcbiAqIChwbGF5ZXIgb25seSkgYW5kIHN0YWdlcyB0aGVtIGFzIHBzZXVkbyBtZW51LWZvY3VzIHNwZWVjaCBldmVudHMgc28gdGhlXG4gKiB3aG9sZSBleGlzdGluZyBwaXBlbGluZSAocHJvdG9jb2wgYG1lbnVgIGZpZWxkLCBhcHAgZm9ybWF0dGluZywgVFRTXG4gKiBjYWNoZSwgYXJiaXRlcikgaXMgcmV1c2VkIHVuY2hhbmdlZC5cbiAqXG4gKiBWZXJiIHNlbWFudGljczogUE9USU9OL0lOR1IgZm9ybSB0eXBlcyBhcmUgY29uc3VtZWQgb24gZXF1aXAgaW4gU2t5cmltJ3NcbiAqIGVuZ2luZSDigJQgbmFycmF0ZWQgYXMgXCJ1c2VcIi4gRXZlcnl0aGluZyBlbHNlIGlzIGVxdWlwL3VuZXF1aXAuXG4gKi9cbnZhciBQTEFZRVJfRk9STV9JRCA9IDB4MTQ7XG4vKiogU2t5cmltIGZvcm0gdHlwZXMgbmFycmF0ZWQgYXMgY29uc3VtcHRpb24gKDQ2IFBPVElPTiwgMzAgSU5HUikuICovXG52YXIgQ09OU1VNQUJMRV9GT1JNX1RZUEVTID0gbmV3IFNldChbNDYsIDMwXSk7XG4vKiogU2FtZSB2ZXJiK2l0ZW0gd2l0aGluIHRoaXMgd2luZG93IGlzIGRlZHVwbGljYXRlZCAoc3BhbSBndWFyZCkuICovXG52YXIgREVEVVBfV0lORE9XX01TID0gMTUwMDtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGxhc3RLZXkgPSBcIlwiO1xudmFyIGxhc3RBdCA9IDA7XG5mdW5jdGlvbiBpc0NvbnN1bWFibGUoYmFzZU9iamVjdCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIGZvcm1UeXBlID0gKF9iID0gKF9hID0gYmFzZU9iamVjdCkuZ2V0T2JqZWN0VHlwZSkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoX2EpO1xuICAgICAgICByZXR1cm4gZm9ybVR5cGUgIT09IHVuZGVmaW5lZCAmJiBDT05TVU1BQkxFX0ZPUk1fVFlQRVMuaGFzKGZvcm1UeXBlKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5mdW5jdGlvbiBpdGVtTmFtZShiYXNlT2JqZWN0KSB7XG4gICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChfYyA9IChfYiA9IChfYSA9IGJhc2VPYmplY3QpLmdldE5hbWUpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jYWxsKF9hKSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogXCJcIjtcbiAgICB9XG4gICAgY2F0Y2ggKF9kKSB7XG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHB1c2hFdmVudCh2ZXJiLCBpdGVtLCBub3cpIHtcbiAgICB2YXIgdHJpbW1lZCA9IGl0ZW0udHJpbSgpO1xuICAgIGlmICghdHJpbW1lZClcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBrZXkgPSBcIlwiLmNvbmNhdCh2ZXJiLCBcIjpcIikuY29uY2F0KHRyaW1tZWQpO1xuICAgIGlmIChrZXkgPT09IGxhc3RLZXkgJiYgbm93IC0gbGFzdEF0IDwgREVEVVBfV0lORE9XX01TKVxuICAgICAgICByZXR1cm47XG4gICAgbGFzdEtleSA9IGtleTtcbiAgICBsYXN0QXQgPSBub3c7XG4gICAgcXVldWUucHVzaCh7IHZlcmI6IHZlcmIsIGl0ZW06IHRyaW1tZWQgfSk7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgbG9nRGlhZyhcIltpdGVtLWV2ZW50c10gc3RhZ2VkIFwiLmNvbmNhdChrZXkpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBoYW5kbGVFcXVpcEV2ZW50KGV2ZW50LCBub3cpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIHZhciBlID0gZXZlbnQ7XG4gICAgaWYgKCFlLmFjdG9yIHx8ICgoX2IgPSAoX2EgPSBlLmFjdG9yKS5nZXRGb3JtSWQpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi5jYWxsKF9hKSkgIT09IFBMQVlFUl9GT1JNX0lEKVxuICAgICAgICByZXR1cm47XG4gICAgdmFyIGl0ZW0gPSBpdGVtTmFtZShlLmJhc2VPYmplY3QpO1xuICAgIGlmICghaXRlbSlcbiAgICAgICAgcmV0dXJuO1xuICAgIHB1c2hFdmVudChpc0NvbnN1bWFibGUoZS5iYXNlT2JqZWN0KSA/IFwidXNlXCIgOiBcImVxdWlwXCIsIGl0ZW0sIG5vdyk7XG59XG5mdW5jdGlvbiBoYW5kbGVVbmVxdWlwRXZlbnQoZXZlbnQsIG5vdykge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdmFyIGUgPSBldmVudDtcbiAgICBpZiAoIWUuYWN0b3IgfHwgKChfYiA9IChfYSA9IGUuYWN0b3IpLmdldEZvcm1JZCkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoX2EpKSAhPT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgaXRlbSA9IGl0ZW1OYW1lKGUuYmFzZU9iamVjdCk7XG4gICAgaWYgKCFpdGVtKVxuICAgICAgICByZXR1cm47XG4gICAgcHVzaEV2ZW50KFwidW5lcXVpcFwiLCBpdGVtLCBub3cpO1xufVxuLyoqIEhhbmRsZXJzIHRvIG1lcmdlIGludG8gYHJlZ2lzdGVyQWxsRXZlbnRzKHsgLi4uaXRlbUV2ZW50SGFuZGxlcnMoKSB9KWAuICovXG5leHBvcnQgZnVuY3Rpb24gaXRlbUV2ZW50SGFuZGxlcnMoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZXF1aXA6IGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gaGFuZGxlRXF1aXBFdmVudChldmVudCwgRGF0ZS5ub3coKSk7IH0sXG4gICAgICAgIHVuZXF1aXA6IGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gaGFuZGxlVW5lcXVpcEV2ZW50KGV2ZW50LCBEYXRlLm5vdygpKTsgfSxcbiAgICB9O1xufVxuLyoqIEFueSBzdGFnZWQgaXRlbSBldmVudCB3YWl0aW5nIHRvIHJpZGUgdGhlIG5leHQgUE9TVD8gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYXNQZW5kaW5nSXRlbUV2ZW50KCkge1xuICAgIHJldHVybiBxdWV1ZS5sZW5ndGggPiAwO1xufVxuLyoqXG4gKiBUYWtlIHRoZSBvbGRlc3Qgc3RhZ2VkIGV2ZW50IGFzIGEgcHNldWRvIG1lbnUtZm9jdXMgc3RhdGUgKGRyYWlucyB0aGVcbiAqIHF1ZXVlIOKAlCBvbmUgZXZlbnQgcGVyIFBPU1QsIGZpcmUtYW5kLWZvcmdldDogbm8gY29tbWl0IHNlbWFudGljcywgbG9zaW5nXG4gKiBvbmUgbGluZSB1bmRlciBhIGZhaWxlZCBQT1NUIGlzIGFjY2VwdGFibGUgZm9yIGFjdGlvbiBmZWVkYmFjaykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0YWtlSXRlbUV2ZW50KCkge1xuICAgIHZhciBldmVudCA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgaWYgKCFldmVudClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogXCJcIixcbiAgICAgICAgc2t5dWk6IGZhbHNlLFxuICAgICAgICBjYXRlZ29yeTogXCJcIixcbiAgICAgICAgaXRlbTogZXZlbnQuaXRlbSxcbiAgICAgICAgaW5kZXg6IC0xLFxuICAgICAgICBjb3VudDogLTEsXG4gICAgICAgIGV2ZW50OiBldmVudC52ZXJiLFxuICAgICAgICBmaXJzdFJlYWQ6IGZhbHNlLFxuICAgICAgICBhbm5vdW5jZUNhdGVnb3J5OiBmYWxzZSxcbiAgICB9O1xufVxuLyoqIFRlc3Qgc2VhbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldEl0ZW1FdmVudHMoKSB7XG4gICAgcXVldWUubGVuZ3RoID0gMDtcbiAgICBsYXN0S2V5ID0gXCJcIjtcbiAgICBsYXN0QXQgPSAwO1xufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RMb2NhdGlvblN0YXRlKCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2UsIF9mLCBfZywgX2g7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBsb2NhdGlvbk5hbWU6IG51bGwsXG4gICAgICAgIGlzSW50ZXJpb3I6IGZhbHNlLFxuICAgICAgICBjZWxsTmFtZTogbnVsbCxcbiAgICAgICAgd29ybGRzcGFjZU5hbWU6IG51bGxcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgICAgICBpZiAoIXBsYXllcikge1xuICAgICAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsb2NhdGlvbk5hbWU6IChfYiA9IChfYSA9IHBsYXllci5nZXRDdXJyZW50TG9jYXRpb24oKSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldE5hbWUoKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbCxcbiAgICAgICAgICAgIGlzSW50ZXJpb3I6IChfZCA9IChfYyA9IHBsYXllci5nZXRQYXJlbnRDZWxsKCkpID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5pc0ludGVyaW9yKCkpICE9PSBudWxsICYmIF9kICE9PSB2b2lkIDAgPyBfZCA6IGZhbHNlLFxuICAgICAgICAgICAgY2VsbE5hbWU6IChfZiA9IChfZSA9IHBsYXllci5nZXRQYXJlbnRDZWxsKCkpID09PSBudWxsIHx8IF9lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9mICE9PSB2b2lkIDAgPyBfZiA6IG51bGwsXG4gICAgICAgICAgICB3b3JsZHNwYWNlTmFtZTogKF9oID0gKF9nID0gcGxheWVyLmdldFdvcmxkU3BhY2UoKSkgPT09IG51bGwgfHwgX2cgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9nLmdldE5hbWUoKSkgIT09IG51bGwgJiYgX2ggIT09IHZvaWQgMCA/IF9oIDogbnVsbFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjYXRjaCAoX2opIHtcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IGdldE9wZW5NZW51cyB9IGZyb20gXCIuLi8uLi9ldmVudHNcIjtcbi8qKlxuICogTWVudSBjb2xsZWN0b3Ig4oCUIHRoZSBvcGVuLW1lbnUgc2V0IGlzIG1haW50YWluZWQgYnkgZXZlbnRzLnRzXG4gKiAobWVudU9wZW4vbWVudUNsb3NlKTsgdGhpcyBvbmx5IHNuYXBzaG90cyBpdC4gR2FtZXBsYXktYmxvY2tpbmcgdnNcbiAqIGNvc21ldGljIG1lbnVzIGlzIGRlY2lkZWQgYXBwL3BsdWdpbi1zaWRlIGJ5IGdhbWUtc3RhdGUvbWVudS1zdGF0ZS50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RNZW51U3RhdGUoKSB7XG4gICAgcmV0dXJuIHsgb3Blbk1lbnVzOiBBcnJheS5mcm9tKGdldE9wZW5NZW51cygpKSB9O1xufVxuIiwidmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbmltcG9ydCB7IEdhbWUsIFVpLCBwcmludENvbnNvbGUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IGxvZ0RpYWcgfSBmcm9tIFwiLi4vLi4vZGlhZ1wiO1xuaW1wb3J0IHsgQ09ORklHIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgaXNTa3lyaW1BY2Nlc3NJbnN0YWxsZWQgfSBmcm9tIFwiLi4vc2t5cmltLWFjY2Vzc1wiO1xuaW1wb3J0IHsgZ2V0T3Blbk1lbnVzIH0gZnJvbSBcIi4uLy4uL2V2ZW50c1wiO1xuaW1wb3J0IHsgQ0FURUdPUllfUEFUSFNfU0tZVUksIENBVEVHT1JZX1BBVEhTX1ZBTklMTEEsIENPVU5UX1BBVEhTX1NLWVVJLCBDT1VOVF9QQVRIU19WQU5JTExBLCBJTkRFWF9QQVRIU19TS1lVSSwgSU5ERVhfUEFUSFNfVkFOSUxMQSwgSVRFTV9QQVRIU19TS1lVSSwgSVRFTV9QQVRIU19WQU5JTExBLCBkaWZmTWVudUZvY3VzLCBmaW5kTmFycmF0YWJsZU1lbnUsIGZpcnN0Tm9uRW1wdHksIH0gZnJvbSBcIi4uL21lbnUtZm9jdXMtY29yZVwiO1xuLyoqXG4gKiBHRnggZm9jdXMgcmVhZGVyIGZvciB0aGUgSXRlbU1lbnUgZmFtaWx5LiBQb2xscyBVaS5nZXRTdHJpbmcvZ2V0SW50LFxuICogZGlmZnMgYWdhaW5zdCB0aGUgbGFzdCBzbmFwc2hvdCwgYW5kIHN0YWdlcyBhdCBtb3N0IG9uZSBzcGVlY2ggZXZlbnRcbiAqIGZvciB0aGUgbmV4dCBwcm90b2NvbCBzZW5kLiBTaWxlbnQgd2hlbiBTa3lyaW0gQWNjZXNzIG93bnMgbWVudXMuXG4gKi9cbnZhciBza3l1aSA9IG51bGw7XG52YXIgZm9jdXNQcm9iZUxvZ2dlZCA9IGZhbHNlO1xudmFyIHByZXYgPSBudWxsO1xudmFyIHBlbmRpbmcgPSBudWxsO1xudmFyIGluRmxpZ2h0ID0gbnVsbDtcbnZhciBsYXN0UG9sbEF0ID0gMDtcbnZhciBjYWNoZWRQYXRoID0ge307XG5mdW5jdGlvbiBkZXRlY3RTa3lVaSgpIHtcbiAgICB2YXIgX2EsIF9iO1xuICAgIGlmIChza3l1aSAhPT0gbnVsbClcbiAgICAgICAgcmV0dXJuIHNreXVpO1xuICAgIHRyeSB7XG4gICAgICAgIHNreXVpID1cbiAgICAgICAgICAgICgoX2EgPSBHYW1lLmlzUGx1Z2luSW5zdGFsbGVkKFwiU2t5VUlfU0UuZXNwXCIpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBmYWxzZSkgfHxcbiAgICAgICAgICAgICAgICAoKF9iID0gR2FtZS5pc1BsdWdpbkluc3RhbGxlZChcIlNreVVJLmVzcFwiKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogZmFsc2UpO1xuICAgIH1cbiAgICBjYXRjaCAoX2MpIHtcbiAgICAgICAgc2t5dWkgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBTa3lVSSBkZXRlY3RlZDogXCIuY29uY2F0KHNreXVpKSk7XG4gICAgfVxuICAgIHJldHVybiBza3l1aTtcbn1cbmZ1bmN0aW9uIHJlYWRTdHJpbmcobWVudSwgcGF0aCkge1xuICAgIHZhciBfYTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKF9hID0gVWkuZ2V0U3RyaW5nKG1lbnUsIHBhdGgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBcIlwiO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgfVxufVxuZnVuY3Rpb24gcmVhZEludChtZW51LCBwYXRoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHZhbHVlID0gVWkuZ2V0SW50KG1lbnUsIHBhdGgpO1xuICAgICAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIGlzRmluaXRlKHZhbHVlKSA/IHZhbHVlIDogTmFOO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIE5hTjtcbiAgICB9XG59XG5mdW5jdGlvbiBwcm9iZVN0cmluZyhtZW51LCBraW5kLCBwYXRocykge1xuICAgIHZhciBjYWNoZUtleSA9IFwiXCIuY29uY2F0KG1lbnUsIFwiOlwiKS5jb25jYXQoa2luZCk7XG4gICAgdmFyIGNhY2hlZCA9IGNhY2hlZFBhdGhbY2FjaGVLZXldO1xuICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgdmFyIGhpdCA9IGZpcnN0Tm9uRW1wdHkoW3JlYWRTdHJpbmcobWVudSwgY2FjaGVkKV0pO1xuICAgICAgICBpZiAoaGl0KVxuICAgICAgICAgICAgcmV0dXJuIGhpdDtcbiAgICB9XG4gICAgdmFyIHZhbHVlcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBhdGggPSBwYXRoc1tpXTtcbiAgICAgICAgdmFyIHZhbHVlID0gcmVhZFN0cmluZyhtZW51LCBwYXRoKTtcbiAgICAgICAgdmFsdWVzLnB1c2godmFsdWUpO1xuICAgICAgICBpZiAoZmlyc3ROb25FbXB0eShbdmFsdWVdKSkge1xuICAgICAgICAgICAgY2FjaGVkUGF0aFtjYWNoZUtleV0gPSBwYXRoO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZpcnN0Tm9uRW1wdHkodmFsdWVzKTtcbn1cbmZ1bmN0aW9uIHByb2JlSW50KG1lbnUsIGtpbmQsIHBhdGhzKSB7XG4gICAgdmFyIGNhY2hlS2V5ID0gXCJcIi5jb25jYXQobWVudSwgXCI6XCIpLmNvbmNhdChraW5kKTtcbiAgICB2YXIgY2FjaGVkID0gY2FjaGVkUGF0aFtjYWNoZUtleV07XG4gICAgaWYgKGNhY2hlZCkge1xuICAgICAgICB2YXIgaGl0ID0gcmVhZEludChtZW51LCBjYWNoZWQpO1xuICAgICAgICBpZiAoIWlzTmFOKGhpdCkgJiYgaGl0ID4gMClcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKGhpdCk7XG4gICAgfVxuICAgIHZhciBzYXdaZXJvID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGF0aCA9IHBhdGhzW2ldO1xuICAgICAgICB2YXIgdmFsdWUgPSByZWFkSW50KG1lbnUsIHBhdGgpO1xuICAgICAgICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlIDwgMClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAodmFsdWUgPiAwKSB7XG4gICAgICAgICAgICBjYWNoZWRQYXRoW2NhY2hlS2V5XSA9IHBhdGg7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcih2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgc2F3WmVybyA9IHRydWU7XG4gICAgfVxuICAgIC8vIDAgaXMgYSB2YWxpZCBpbmRleCBBTkQgdGhlIFBhcHlydXMgZGVmYXVsdCBmb3IgYSBtaXNzaW5nIHBhdGgg4oCUIGRvIG5vdFxuICAgIC8vIGNhY2hlIGl0IG9yIGxhdGVyIFNreVVJL3ZhbmlsbGEgcGF0aHMgbmV2ZXIgcnVuLlxuICAgIHJldHVybiBzYXdaZXJvID8gMCA6IC0xO1xufVxuZnVuY3Rpb24gcmVhZFNuYXBzaG90KG1lbnUpIHtcbiAgICB2YXIgaXNTa3lVaSA9IGRldGVjdFNreVVpKCk7XG4gICAgdmFyIGl0ZW1QYXRocyA9IGlzU2t5VWkgPyBJVEVNX1BBVEhTX1NLWVVJIDogSVRFTV9QQVRIU19WQU5JTExBO1xuICAgIHZhciBpbmRleFBhdGhzID0gaXNTa3lVaSA/IElOREVYX1BBVEhTX1NLWVVJIDogSU5ERVhfUEFUSFNfVkFOSUxMQTtcbiAgICB2YXIgY291bnRQYXRocyA9IGlzU2t5VWkgPyBDT1VOVF9QQVRIU19TS1lVSSA6IENPVU5UX1BBVEhTX1ZBTklMTEE7XG4gICAgdmFyIGNhdGVnb3J5UGF0aHMgPSBpc1NreVVpID8gQ0FURUdPUllfUEFUSFNfU0tZVUkgOiBDQVRFR09SWV9QQVRIU19WQU5JTExBO1xuICAgIC8vIFNreVVJIHBhdGhzIGZpcnN0LCB2YW5pbGxhIGFzIGZhbGxiYWNrIGV2ZW4gaW4gc2t5dWkgbW9kZSAoVUkgbW9kcyBtb3ZlIHRyZWVzKS5cbiAgICB2YXIgaXRlbSA9IHByb2JlU3RyaW5nKG1lbnUsIFwiaXRlbVwiLCBpdGVtUGF0aHMuY29uY2F0KElURU1fUEFUSFNfVkFOSUxMQSkpO1xuICAgIHZhciBjYXRlZ29yeSA9IHByb2JlU3RyaW5nKG1lbnUsIFwiY2F0ZWdvcnlcIiwgY2F0ZWdvcnlQYXRocy5jb25jYXQoQ0FURUdPUllfUEFUSFNfVkFOSUxMQSkpO1xuICAgIHZhciBpbmRleCA9IHByb2JlSW50KG1lbnUsIFwiaW5kZXhcIiwgaW5kZXhQYXRocy5jb25jYXQoSU5ERVhfUEFUSFNfVkFOSUxMQSkpO1xuICAgIHZhciBjb3VudCA9IHByb2JlSW50KG1lbnUsIFwiY291bnRcIiwgY291bnRQYXRocy5jb25jYXQoQ09VTlRfUEFUSFNfVkFOSUxMQSkpO1xuICAgIC8vIEZpcnN0IHByb2JlIG9mIGVhY2ggc2Vzc2lvbiDigJQgcHJvdmVzIHRoZSBHRnggY2hhbm5lbCB3b3JrcyAob3Igbm90KS5cbiAgICBpZiAoIWZvY3VzUHJvYmVMb2dnZWQpIHtcbiAgICAgICAgZm9jdXNQcm9iZUxvZ2dlZCA9IHRydWU7XG4gICAgICAgIGxvZ0RpYWcoXCJbbWVudS1mb2N1c10gcHJvYmU6IG1lbnU9XCIuY29uY2F0KG1lbnUsIFwiIHNreXVpPVwiKS5jb25jYXQoaXNTa3lVaSwgXCIgaXRlbT1cXFwiXCIpLmNvbmNhdChpdGVtLCBcIlxcXCIgY2F0ZWdvcnk9XFxcIlwiKS5jb25jYXQoY2F0ZWdvcnksIFwiXFxcIiBpbmRleD1cIikuY29uY2F0KGluZGV4LCBcIiBjb3VudD1cIikuY29uY2F0KGNvdW50KSk7XG4gICAgICAgIC8vIEZ1bGwgY2FuZGlkYXRlIGR1bXAgb25jZTogd2hpY2ggR0Z4IHBhdGhzIGFuc3dlciBhdCBhbGw/XG4gICAgICAgIHZhciByYXcgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBfYSA9IGl0ZW1QYXRocy5jb25jYXQoSVRFTV9QQVRIU19WQU5JTExBKTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBwID0gX2FbX2ldO1xuICAgICAgICAgICAgdmFyIHYgPSByZWFkU3RyaW5nKG1lbnUsIHApO1xuICAgICAgICAgICAgaWYgKHYgIT09IFwiXCIpXG4gICAgICAgICAgICAgICAgcmF3LnB1c2goXCJcIi5jb25jYXQocCwgXCI9XFxcIlwiKS5jb25jYXQodiwgXCJcXFwiXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBsb2dEaWFnKFwiW21lbnUtZm9jdXNdIG5vbi1lbXB0eSBpdGVtIHBhdGhzOiBcIi5jb25jYXQocmF3Lmxlbmd0aCA/IHJhdy5qb2luKFwiIHwgXCIpIDogXCJOT05FXCIpKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogbWVudSxcbiAgICAgICAgc2t5dWk6IGlzU2t5VWksXG4gICAgICAgIGNhdGVnb3J5OiBjYXRlZ29yeSxcbiAgICAgICAgaXRlbTogaXRlbSxcbiAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICBjb3VudDogY291bnQsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHNuYXBzaG90T2YoZXZlbnQpIHtcbiAgICBpZiAoZXZlbnQuZXZlbnQgPT09IFwiY2xvc2VcIilcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbmFtZTogZXZlbnQubmFtZSxcbiAgICAgICAgc2t5dWk6IGV2ZW50LnNreXVpLFxuICAgICAgICBjYXRlZ29yeTogZXZlbnQuY2F0ZWdvcnksXG4gICAgICAgIGl0ZW06IGV2ZW50Lml0ZW0sXG4gICAgICAgIGluZGV4OiBldmVudC5pbmRleCxcbiAgICAgICAgY291bnQ6IGV2ZW50LmNvdW50LFxuICAgIH07XG59XG5mdW5jdGlvbiBzdGFnZUV2ZW50KG5leHQpIHtcbiAgICB2YXIgZGVsdGEgPSBkaWZmTWVudUZvY3VzKHByZXYsIG5leHQpO1xuICAgIGlmICghZGVsdGEpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB2YXIgY2xvc2VkTmFtZSA9IHByZXYgPT09IG51bGwgfHwgcHJldiA9PT0gdm9pZCAwID8gdm9pZCAwIDogcHJldi5uYW1lO1xuICAgIHZhciBiYXNlID0gbmV4dCAhPT0gbnVsbCAmJiBuZXh0ICE9PSB2b2lkIDAgPyBuZXh0IDoge1xuICAgICAgICBuYW1lOiBjbG9zZWROYW1lICE9PSBudWxsICYmIGNsb3NlZE5hbWUgIT09IHZvaWQgMCA/IGNsb3NlZE5hbWUgOiBcIlwiLFxuICAgICAgICBza3l1aTogZGV0ZWN0U2t5VWkoKSxcbiAgICAgICAgY2F0ZWdvcnk6IFwiXCIsXG4gICAgICAgIGl0ZW06IFwiXCIsXG4gICAgICAgIGluZGV4OiAtMSxcbiAgICAgICAgY291bnQ6IC0xLFxuICAgIH07XG4gICAgcGVuZGluZyA9IF9fYXNzaWduKF9fYXNzaWduKHt9LCBiYXNlKSwgeyBldmVudDogZGVsdGEuZXZlbnQsIGZpcnN0UmVhZDogZGVsdGEuZmlyc3RSZWFkLCBhbm5vdW5jZUNhdGVnb3J5OiBkZWx0YS5hbm5vdW5jZUNhdGVnb3J5IH0pO1xuICAgIHJldHVybiB0cnVlO1xufVxuLyoqIENoZWFwIEdGeCBwb2xsLiBSZXR1cm5zIHRydWUgd2hlbiBhIHNwZWVjaCBldmVudCBpcyB3YWl0aW5nIHRvIFBPU1QuICovXG5leHBvcnQgZnVuY3Rpb24gcHVtcE1lbnVGb2N1cyhub3cpIHtcbiAgICBpZiAoIUNPTkZJRy5tZW51TmFycmF0aW9uRW5hYmxlZClcbiAgICAgICAgcmV0dXJuIHBlbmRpbmcgIT09IG51bGw7XG4gICAgaWYgKGlzU2t5cmltQWNjZXNzSW5zdGFsbGVkKCkpIHtcbiAgICAgICAgaWYgKHBlbmRpbmcgPT09IG51bGwgJiYgaW5GbGlnaHQgPT09IG51bGwgJiYgcHJldiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgc3RhZ2VFdmVudChudWxsKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcGVuZGluZyAhPT0gbnVsbDtcbiAgICB9XG4gICAgLy8gSG9sZCB0aGUgc3RhZ2VkIGV2ZW50IHVudGlsIHRoZSBQT1NUIGFja3Mg4oCUIGRvIG5vdCBwb2xsL3Jlc3RhZ2Ugb3IgYVxuICAgIC8vIGZhaWxlZCBzZW5kIChvciBhIDEwMG1zIHJldHJ5KSBkcm9wcyBcIkludmVudGFpcmUgb3V2ZXJ0LlwiIGZvcmV2ZXIuXG4gICAgaWYgKHBlbmRpbmcgIT09IG51bGwgfHwgaW5GbGlnaHQgIT09IG51bGwpXG4gICAgICAgIHJldHVybiBwZW5kaW5nICE9PSBudWxsO1xuICAgIGlmIChub3cgLSBsYXN0UG9sbEF0IDwgQ09ORklHLm1lbnVGb2N1c0ludGVydmFsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgbGFzdFBvbGxBdCA9IG5vdztcbiAgICB2YXIgbWVudSA9IGZpbmROYXJyYXRhYmxlTWVudShnZXRPcGVuTWVudXMoKSk7XG4gICAgaWYgKCFtZW51KSB7XG4gICAgICAgIHJldHVybiBzdGFnZUV2ZW50KG51bGwpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhZ2VFdmVudChyZWFkU25hcHNob3QobWVudSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGhhc1BlbmRpbmdNZW51Rm9jdXMoKSB7XG4gICAgcmV0dXJuIHBlbmRpbmcgIT09IG51bGw7XG59XG4vKiogUmVhZCB0aGUgc3RhZ2VkIGV2ZW50IHdpdGhvdXQgY29uc3VtaW5nIGl0IChkdW1wICsgcGF5bG9hZCkuICovXG5leHBvcnQgZnVuY3Rpb24gcGVla01lbnVGb2N1cygpIHtcbiAgICByZXR1cm4gcGVuZGluZyAhPT0gbnVsbCAmJiBwZW5kaW5nICE9PSB2b2lkIDAgPyBwZW5kaW5nIDogdW5kZWZpbmVkO1xufVxuLyoqXG4gKiBUYWtlIHRoZSBldmVudCBmb3IgYW4gaW1taW5lbnQgUE9TVC4gYGNvbW1pdE1lbnVGb2N1c1NlbmRgIG11c3QgZm9sbG93OlxuICogc3VjY2VzcyBhZHZhbmNlcyBgcHJldmAsIGZhaWx1cmUgcmVzdGFnZXMgc28gdGhlIG5leHQgcG9sbCByZXRyaWVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmVnaW5NZW51Rm9jdXNTZW5kKCkge1xuICAgIGlmICghcGVuZGluZylcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpbkZsaWdodCA9IHBlbmRpbmc7XG4gICAgcGVuZGluZyA9IG51bGw7XG4gICAgcmV0dXJuIGluRmxpZ2h0O1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbW1pdE1lbnVGb2N1c1NlbmQob2spIHtcbiAgICBpZiAoIWluRmxpZ2h0KVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9rKSB7XG4gICAgICAgIHByZXYgPSBzbmFwc2hvdE9mKGluRmxpZ2h0KTtcbiAgICB9XG4gICAgZWxzZSBpZiAocGVuZGluZyA9PT0gbnVsbCkge1xuICAgICAgICBwZW5kaW5nID0gaW5GbGlnaHQ7XG4gICAgfVxuICAgIGluRmxpZ2h0ID0gbnVsbDtcbn1cbi8qKiBUZXN0IC8gaG90LXJlbG9hZCBzZWFtLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0TWVudUZvY3VzKCkge1xuICAgIHNreXVpID0gbnVsbDtcbiAgICBwcmV2ID0gbnVsbDtcbiAgICBwZW5kaW5nID0gbnVsbDtcbiAgICBpbkZsaWdodCA9IG51bGw7XG4gICAgbGFzdFBvbGxBdCA9IDA7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhjYWNoZWRQYXRoKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZGVsZXRlIGNhY2hlZFBhdGhba2V5c1tpXV07XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQWN0b3IsIEZvcm1UeXBlLCBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uLy4uL2NvbmZpZ1wiO1xuZnVuY3Rpb24gZ2V0UGxheWVyUG9zaXRpb24oKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHBsYXllci5nZXRQb3NpdGlvblgoKSxcbiAgICAgICAgeTogcGxheWVyLmdldFBvc2l0aW9uWSgpLFxuICAgICAgICB6OiBwbGF5ZXIuZ2V0UG9zaXRpb25aKCksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNhbGN1bGF0ZURpc3RhbmNlKHgxLCB5MSwgejEsIHgyLCB5MiwgejIpIHtcbiAgICB2YXIgZHggPSB4MiAtIHgxO1xuICAgIHZhciBkeSA9IHkyIC0geTE7XG4gICAgdmFyIGR6ID0gejIgLSB6MTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG59XG4vKipcbiAqIEVudW1lcmF0ZSBsb2FkZWQgYWN0b3JzIGluIHRoZSBwbGF5ZXIncyBjZWxsIHZpYSBDZWxsLmdldE51bVJlZnMvZ2V0TnRoUmVmXG4gKiAodmVyaWZpZWQgQVBJcyDigJQgcmVwbGFjZXMgdGhlIG9sZCA5LW9mZnNldCBmaW5kQ2xvc2VzdEFjdG9yIHNjYW4sIHdoaWNoXG4gKiBhcHByb3hpbWF0ZWQgXCJhbGwgbmVhcmJ5IGFjdG9yc1wiIGJ5IHJlLXNlYXJjaGluZyBmcm9tIG9mZnNldHMpLlxuICogYEZvcm1UeXBlLkNoYXJhY3RlcmAgKD0gNjIpIGZpbHRlcnMgdG8gbGl2ZSBhY3RvciByZWZlcmVuY2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29sbGVjdE5lYXJieU5wY3MoKSB7XG4gICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zaXRpb24oKTtcbiAgICBpZiAoIXBsYXllclBvcylcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIHZhciBjZWxsID0gcGxheWVyLmdldFBhcmVudENlbGwoKTtcbiAgICBpZiAoIWNlbGwpXG4gICAgICAgIHJldHVybiBbXTtcbiAgICB2YXIgcmVmQ291bnQgPSAwO1xuICAgIHRyeSB7XG4gICAgICAgIHJlZkNvdW50ID0gKF9hID0gY2VsbC5nZXROdW1SZWZzKDYyIC8qIEZvcm1UeXBlLkNoYXJhY3RlciAqLykpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IDA7XG4gICAgfVxuICAgIGNhdGNoIChfZCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHZhciBuZWFyYnlOcGNzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWZDb3VudDsgaSsrKSB7XG4gICAgICAgIGlmIChuZWFyYnlOcGNzLmxlbmd0aCA+PSBDT05GSUcubWF4RW5lbWllcylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB2YXIgYWN0b3JSZWYgPSBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYWN0b3JSZWYgPSBjZWxsLmdldE50aFJlZihpLCA2MiAvKiBGb3JtVHlwZS5DaGFyYWN0ZXIgKi8pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfZSkge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhY3RvclJlZilcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAvLyBnZXROdGhSZWYgeWllbGRzIE9iamVjdFJlZmVyZW5jZTsgdGhlIGRldGFpbCBwcm9iZXMgYmVsb3cgYXJlIEFjdG9yXG4gICAgICAgIC8vIG1ldGhvZHMgKGlzSG9zdGlsZVRvQWN0b3IsIGlzR3VhcmQsIC4uLikg4oCUIGNhc3QgdmlhIHRoZSB2ZXJpZmllZFxuICAgICAgICAvLyBBY3Rvci5mcm9tIGhlbHBlciAoT2JqZWN0UmVmZXJlbmNlIGV4dGVuZHMgUGFweXJ1c09iamVjdCkuXG4gICAgICAgIHZhciBhY3RvciA9IEFjdG9yLmZyb20oYWN0b3JSZWYpO1xuICAgICAgICBpZiAoIWFjdG9yKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBmb3JtSWQgPSBhY3Rvci5nZXRGb3JtSUQoKTtcbiAgICAgICAgaWYgKGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdmFyIGFjdG9yUG9zID0ge1xuICAgICAgICAgICAgeDogYWN0b3IuZ2V0UG9zaXRpb25YKCksXG4gICAgICAgICAgICB5OiBhY3Rvci5nZXRQb3NpdGlvblkoKSxcbiAgICAgICAgICAgIHo6IGFjdG9yLmdldFBvc2l0aW9uWigpLFxuICAgICAgICB9O1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBjYWxjdWxhdGVEaXN0YW5jZShwbGF5ZXJQb3MueCwgcGxheWVyUG9zLnksIHBsYXllclBvcy56LCBhY3RvclBvcy54LCBhY3RvclBvcy55LCBhY3RvclBvcy56KTtcbiAgICAgICAgdmFyIGJhc2VPYmogPSBhY3Rvci5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgIHZhciBuYW1lID0gKGJhc2VPYmogPT09IG51bGwgfHwgYmFzZU9iaiA9PT0gdm9pZCAwID8gdm9pZCAwIDogYmFzZU9iai5nZXROYW1lKCkpIHx8IFwiVW5rbm93blwiO1xuICAgICAgICB2YXIgaGVhbHRoID0gYWN0b3IuZ2V0QWN0b3JWYWx1ZShcImhlYWx0aFwiKTtcbiAgICAgICAgdmFyIGxldmVsID0gMDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldmVsID0gYWN0b3IuZ2V0TGV2ZWwoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2YpIHtcbiAgICAgICAgICAgIGxldmVsID0gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmFjZSA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByYWNlID0gKF9jID0gKF9iID0gYWN0b3IuZ2V0UmFjZSgpKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfZykge1xuICAgICAgICAgICAgcmFjZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzSG9zdGlsZSA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNIb3N0aWxlID0gYWN0b3IuaXNIb3N0aWxlVG9BY3RvcihwbGF5ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfaCkge1xuICAgICAgICAgICAgaXNIb3N0aWxlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzQWxseSA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNBbGx5ID0gYWN0b3IuaXNQbGF5ZXJUZWFtbWF0ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfaikge1xuICAgICAgICAgICAgaXNBbGx5ID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzR3VhcmQgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlzR3VhcmQgPSBhY3Rvci5pc0d1YXJkKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9rKSB7XG4gICAgICAgICAgICBpc0d1YXJkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlzTWVyY2hhbnQgPSBmYWxzZTtcbiAgICAgICAgdmFyIGlzSW5EaWFsb2d1ZSA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNJbkRpYWxvZ3VlID0gYWN0b3IuaXNJbkRpYWxvZ3VlV2l0aFBsYXllcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfbCkge1xuICAgICAgICAgICAgaXNJbkRpYWxvZ3VlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGhhc0xPUyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaGFzTE9TID0gYWN0b3IuaGFzTE9TKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9tKSB7XG4gICAgICAgICAgICBoYXNMT1MgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNEZXRlY3RlZCA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNEZXRlY3RlZCA9IGFjdG9yLmlzRGV0ZWN0ZWRCeShwbGF5ZXIpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfbykge1xuICAgICAgICAgICAgaXNEZXRlY3RlZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBSYW5rID0gMDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlbGF0aW9uc2hpcFJhbmsgPSBhY3Rvci5nZXRSZWxhdGlvbnNoaXBSYW5rKHBsYXllcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9wKSB7XG4gICAgICAgICAgICByZWxhdGlvbnNoaXBSYW5rID0gMDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaXNEZWFkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpc0RlYWQgPSBhY3Rvci5pc0RlYWQoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX3EpIHtcbiAgICAgICAgICAgIGlzRGVhZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBoZWFkaW5nQW5nbGUgPSAwO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaGVhZGluZ0FuZ2xlID0gcGxheWVyLmdldEhlYWRpbmdBbmdsZShhY3Rvcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9yKSB7XG4gICAgICAgICAgICBoZWFkaW5nQW5nbGUgPSAwO1xuICAgICAgICB9XG4gICAgICAgIG5lYXJieU5wY3MucHVzaCh7XG4gICAgICAgICAgICBmb3JtSWQ6IGZvcm1JZCxcbiAgICAgICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgICAgICBkaXN0YW5jZTogZGlzdGFuY2UsXG4gICAgICAgICAgICBoZWFkaW5nQW5nbGU6IGhlYWRpbmdBbmdsZSxcbiAgICAgICAgICAgIGhlYWx0aDogaGVhbHRoLFxuICAgICAgICAgICAgbGV2ZWw6IGxldmVsLFxuICAgICAgICAgICAgcmFjZTogcmFjZSxcbiAgICAgICAgICAgIGlzSG9zdGlsZTogaXNIb3N0aWxlLFxuICAgICAgICAgICAgaXNBbGx5OiBpc0FsbHksXG4gICAgICAgICAgICBpc0d1YXJkOiBpc0d1YXJkLFxuICAgICAgICAgICAgaXNNZXJjaGFudDogaXNNZXJjaGFudCxcbiAgICAgICAgICAgIGlzSW5EaWFsb2d1ZTogaXNJbkRpYWxvZ3VlLFxuICAgICAgICAgICAgaXNEZXRlY3RlZDogaXNEZXRlY3RlZCxcbiAgICAgICAgICAgIGhhc0xPUzogaGFzTE9TLFxuICAgICAgICAgICAgcmVsYXRpb25zaGlwUmFuazogcmVsYXRpb25zaGlwUmFuayxcbiAgICAgICAgICAgIGlzRGVhZDogaXNEZWFkLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5lYXJieU5wY3M7XG59XG4iLCJpbXBvcnQgeyBHYW1lIH0gZnJvbSBcIi4uLy4uL3NreXJpbVBsYXRmb3JtXCI7XG5mdW5jdGlvbiBzYWZlTnVtYmVyKHZhbHVlLCBmYWxsYmFjaykge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7IGZhbGxiYWNrID0gMDsgfVxuICAgIHJldHVybiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdm9pZCAwID8gdmFsdWUgOiBmYWxsYmFjaztcbn1cbmZ1bmN0aW9uIHNhZmVTdHJpbmcodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHZvaWQgMCA/IHZhbHVlIDogbnVsbDtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RIZWFkaW5nKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7IGFuZ2xlWDogMCwgYW5nbGVZOiAwLCBhbmdsZVo6IDAsIGhlYWRpbmdBbmdsZTogMCB9O1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBhbmdsZVg6IHNhZmVOdW1iZXIocGxheWVyLmdldEFuZ2xlWCgpKSxcbiAgICAgICAgYW5nbGVZOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBbmdsZVkoKSksXG4gICAgICAgIGFuZ2xlWjogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QW5nbGVaKCkpLFxuICAgICAgICBoZWFkaW5nQW5nbGU6IHNhZmVOdW1iZXIocGxheWVyLmdldEhlYWRpbmdBbmdsZShudWxsKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RNb3ZlbWVudCgpIHtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgaXNSdW5uaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3ByaW50aW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGlzU3dpbW1pbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNTbmVha2luZzogZmFsc2UsXG4gICAgICAgICAgICBpc09uTW91bnQ6IGZhbHNlLFxuICAgICAgICAgICAgaXNPdmVyRW5jdW1iZXJlZDogZmFsc2UsXG4gICAgICAgICAgICBzaXRTdGF0ZTogMCxcbiAgICAgICAgICAgIHNsZWVwU3RhdGU6IDAsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGlzUnVubmluZzogcGxheWVyLmlzUnVubmluZygpLFxuICAgICAgICBpc1NwcmludGluZzogcGxheWVyLmlzU3ByaW50aW5nKCksXG4gICAgICAgIGlzU3dpbW1pbmc6IHBsYXllci5pc1N3aW1taW5nKCksXG4gICAgICAgIGlzU25lYWtpbmc6IHBsYXllci5pc1NuZWFraW5nKCksXG4gICAgICAgIGlzT25Nb3VudDogcGxheWVyLmlzT25Nb3VudCgpLFxuICAgICAgICBpc092ZXJFbmN1bWJlcmVkOiBwbGF5ZXIuaXNPdmVyRW5jdW1iZXJlZCgpLFxuICAgICAgICBzaXRTdGF0ZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0U2l0U3RhdGUoKSksXG4gICAgICAgIHNsZWVwU3RhdGU6IHNhZmVOdW1iZXIocGxheWVyLmdldFNsZWVwU3RhdGUoKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGNvbGxlY3RDb21iYXQoKSB7XG4gICAgdmFyIHBsYXllciA9IEdhbWUuZ2V0UGxheWVyKCk7XG4gICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGlzSW5Db21iYXQ6IGZhbHNlLFxuICAgICAgICAgICAgY29tYmF0VGFyZ2V0TmFtZTogbnVsbCxcbiAgICAgICAgICAgIGlzQmxvY2tpbmc6IGZhbHNlLFxuICAgICAgICAgICAgaXNXZWFwb25EcmF3bjogZmFsc2UsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBjb21iYXRUYXJnZXROYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gcGxheWVyLmdldENvbWJhdFRhcmdldCgpO1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICB2YXIgYmFzZSA9IHRhcmdldC5nZXRCYXNlT2JqZWN0KCk7XG4gICAgICAgICAgICBjb21iYXRUYXJnZXROYW1lID0gc2FmZVN0cmluZyhiYXNlID09PSBudWxsIHx8IGJhc2UgPT09IHZvaWQgMCA/IHZvaWQgMCA6IGJhc2UuZ2V0TmFtZSgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgY29tYmF0VGFyZ2V0TmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBpc0Jsb2NraW5nID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgaXNCbG9ja2luZyA9IHBsYXllci5nZXRBbmltYXRpb25WYXJpYWJsZUJvb2woXCJJc0Jsb2NraW5nXCIpO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgaXNCbG9ja2luZyA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBpc0luQ29tYmF0OiBwbGF5ZXIuaXNJbkNvbWJhdCgpLFxuICAgICAgICBjb21iYXRUYXJnZXROYW1lOiBjb21iYXRUYXJnZXROYW1lLFxuICAgICAgICBpc0Jsb2NraW5nOiBpc0Jsb2NraW5nLFxuICAgICAgICBpc1dlYXBvbkRyYXduOiBwbGF5ZXIuaXNXZWFwb25EcmF3bigpLFxuICAgIH07XG59XG5mdW5jdGlvbiBjb2xsZWN0RXF1aXBtZW50KCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3ZWFwb25OYW1lOiBudWxsLFxuICAgICAgICAgICAgd2VhcG9uU2xvdDogMCxcbiAgICAgICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICAgICAgc2hvdXROYW1lOiBudWxsLFxuICAgICAgICAgICAgc3BlbGxOYW1lOiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHdlYXBvbiA9IHBsYXllci5nZXRFcXVpcHBlZFdlYXBvbihmYWxzZSk7XG4gICAgICAgIHdlYXBvbk5hbWUgPSBzYWZlU3RyaW5nKHdlYXBvbiA9PT0gbnVsbCB8fCB3ZWFwb24gPT09IHZvaWQgMCA/IHZvaWQgMCA6IHdlYXBvbi5nZXROYW1lKCkpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgd2VhcG9uTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHZhciBzaG91dE5hbWUgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBzaG91dCA9IHBsYXllci5nZXRFcXVpcHBlZFNob3V0KCk7XG4gICAgICAgIHNob3V0TmFtZSA9IHNhZmVTdHJpbmcoc2hvdXQgPT09IG51bGwgfHwgc2hvdXQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IHNob3V0LmdldE5hbWUoKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICBzaG91dE5hbWUgPSBudWxsO1xuICAgIH1cbiAgICB2YXIgc3BlbGxOYW1lID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgc3BlbGwgPSBwbGF5ZXIuZ2V0RXF1aXBwZWRTcGVsbCgwKTtcbiAgICAgICAgc3BlbGxOYW1lID0gc2FmZVN0cmluZyhzcGVsbCA9PT0gbnVsbCB8fCBzcGVsbCA9PT0gdm9pZCAwID8gdm9pZCAwIDogc3BlbGwuZ2V0TmFtZSgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9jKSB7XG4gICAgICAgIHNwZWxsTmFtZSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHdlYXBvbk5hbWU6IHdlYXBvbk5hbWUsXG4gICAgICAgIHdlYXBvblNsb3Q6IDAsXG4gICAgICAgIGFybW9yU2xvdHM6IHt9LFxuICAgICAgICBzaG91dE5hbWU6IHNob3V0TmFtZSxcbiAgICAgICAgc3BlbGxOYW1lOiBzcGVsbE5hbWUsXG4gICAgfTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb2xsZWN0UGxheWVyRnVsbFN0YXRlKCkge1xuICAgIHZhciBwbGF5ZXIgPSBHYW1lLmdldFBsYXllcigpO1xuICAgIGlmICghcGxheWVyKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFkaW5nOiBjb2xsZWN0SGVhZGluZygpLFxuICAgICAgICBtb3ZlbWVudDogY29sbGVjdE1vdmVtZW50KCksXG4gICAgICAgIGNvbWJhdDogY29sbGVjdENvbWJhdCgpLFxuICAgICAgICBlcXVpcG1lbnQ6IGNvbGxlY3RFcXVpcG1lbnQoKSxcbiAgICAgICAgZ29sZEFtb3VudDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0R29sZEFtb3VudCgpKSxcbiAgICAgICAgY2FycnlXZWlnaHQ6IHNhZmVOdW1iZXIocGxheWVyLmdldEFjdG9yVmFsdWUoXCJDYXJyeVdlaWdodFwiKSksXG4gICAgICAgIGludmVudG9yeVdlaWdodDogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZShcIkludmVudG9yeVdlaWdodFwiKSksXG4gICAgICAgIG1hZ2lja2FQZXJjZW50YWdlOiBzYWZlTnVtYmVyKHBsYXllci5nZXRBY3RvclZhbHVlUGVyY2VudGFnZShcIm1hZ2lja2FcIikpLFxuICAgICAgICBzdGFtaW5hUGVyY2VudGFnZTogc2FmZU51bWJlcihwbGF5ZXIuZ2V0QWN0b3JWYWx1ZVBlcmNlbnRhZ2UoXCJzdGFtaW5hXCIpKSxcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgR2FtZSB9IGZyb20gXCIuLi8uLi9za3lyaW1QbGF0Zm9ybVwiO1xuZXhwb3J0IGZ1bmN0aW9uIGNvbGxlY3RRdWVzdFN0YXRlKCkge1xuICAgIHZhciBfYSwgX2I7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHF1ZXN0ID0gR2FtZS5nZXRRdWVzdChcIk1RMTAxXCIpO1xuICAgICAgICBpZiAoIXF1ZXN0KSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqZWN0aXZlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSAxMDsgaSArPSAxKSB7XG4gICAgICAgICAgICB2YXIgZGlzcGxheWVkID0gcXVlc3QuaXNPYmplY3RpdmVEaXNwbGF5ZWQoaSk7XG4gICAgICAgICAgICBpZiAoIWRpc3BsYXllZCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb2JqZWN0aXZlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5ZWQ6IGRpc3BsYXllZCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZWQ6IHF1ZXN0LmlzT2JqZWN0aXZlQ29tcGxldGVkKGkpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcXVlc3RXaXRoRWRpdG9ySWQgPSBxdWVzdDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHF1ZXN0TmFtZTogKF9hID0gcXVlc3QuZ2V0TmFtZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBudWxsLFxuICAgICAgICAgICAgZWRpdG9ySWQ6IHR5cGVvZiBxdWVzdFdpdGhFZGl0b3JJZC5nZXRFZGl0b3JJZCA9PT0gXCJmdW5jdGlvblwiID8gKF9iID0gcXVlc3RXaXRoRWRpdG9ySWQuZ2V0RWRpdG9ySWQoKSkgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogbnVsbCA6IG51bGwsXG4gICAgICAgICAgICBjdXJyZW50U3RhZ2U6IHF1ZXN0LmdldEN1cnJlbnRTdGFnZUlEKCksXG4gICAgICAgICAgICBvYmplY3RpdmVzOiBvYmplY3RpdmVzXG4gICAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChfYykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJ2YXIgX19zcHJlYWRBcnJheSA9ICh0aGlzICYmIHRoaXMuX19zcHJlYWRBcnJheSkgfHwgZnVuY3Rpb24gKHRvLCBmcm9tLCBwYWNrKSB7XG4gICAgaWYgKHBhY2sgfHwgYXJndW1lbnRzLmxlbmd0aCA9PT0gMikgZm9yICh2YXIgaSA9IDAsIGwgPSBmcm9tLmxlbmd0aCwgYXI7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgaWYgKGFyIHx8ICEoaSBpbiBmcm9tKSkge1xuICAgICAgICAgICAgaWYgKCFhcikgYXIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tLCAwLCBpKTtcbiAgICAgICAgICAgIGFyW2ldID0gZnJvbVtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdG8uY29uY2F0KGFyIHx8IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20pKTtcbn07XG5pbXBvcnQgeyBBY3RvciwgR2FtZSwgVWksIG9uLCBwcmludENvbnNvbGUgfSBmcm9tIFwiLi4vLi4vc2t5cmltUGxhdGZvcm1cIjtcbmltcG9ydCB7IENPTkZJRywgUExBWUVSX0ZPUk1fSUQgfSBmcm9tIFwiLi4vLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBmaW5hbGl6ZUNhbmRpZGF0ZXMsIGlzU2NhbkNhY2hlU3RhbGUsIGRpc3RhbmNlVW5pdHMsIH0gZnJvbSBcIi4uLy4uL3dvcmxkL3NjYW5uZXItY29yZVwiO1xuaW1wb3J0IHsgaXNDb250YWluZXJMb290ZWQgfSBmcm9tIFwiLi4vLi4vd29ybGQvbG9vdC10cmFja2VyXCI7XG4vLyBNaXJyb3JzIHdvcmxkL3NjYW5uZXItY29yZS50cyBGT1JNX1RZUEUgKHJ1bnRpbWUgbnVtYmVycykuXG52YXIgQUxMT1dFRF9UWVBFUyA9IFsyNCwgMjgsIDI5LCAzOSwgNDAsIDYyXTtcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xudmFyIHJlY2VudENlbGxzID0gW107XG52YXIgY2FjaGUgPSBudWxsO1xudmFyIHN3ZWVwID0ge1xuICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgY2VsbEluZGV4OiAwLFxuICAgIHR5cGVJbmRleDogMCxcbiAgICByZWZJbmRleDogMCxcbiAgICByZWZDb3VudDogMCxcbiAgICBjb3VudEtub3duOiBmYWxzZSxcbiAgICBjYW5kaWRhdGVzOiBbXSxcbn07XG5mdW5jdGlvbiBkZWJ1Z0xvZyhtZXNzYWdlKSB7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW3dvcmxkLXNjYW5uZXJdIFwiLmNvbmNhdChtZXNzYWdlKSk7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGluaXRXb3JsZFNjYW5uZXIoKSB7XG4gICAgaWYgKGluaXRpYWxpemVkKVxuICAgICAgICByZXR1cm47XG4gICAgaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIG9uKFwiY2VsbEZ1bGx5TG9hZGVkXCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGNlbGwgPSBldmVudC5jZWxsO1xuICAgICAgICAgICAgdmFyIGZvcm1JZF8xID0gdHlwZW9mIGNlbGwuZ2V0Rm9ybUlEID09PSBcImZ1bmN0aW9uXCIgPyBjZWxsLmdldEZvcm1JRCgpIDogMDtcbiAgICAgICAgICAgIGlmICghZm9ybUlkXzEpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgcmVjZW50Q2VsbHMgPSBfX3NwcmVhZEFycmF5KFtcbiAgICAgICAgICAgICAgICB7IGZvcm1JZDogZm9ybUlkXzEsIGNlbGw6IGNlbGwgfVxuICAgICAgICAgICAgXSwgcmVjZW50Q2VsbHMuZmlsdGVyKGZ1bmN0aW9uIChlbnRyeSkgeyByZXR1cm4gZW50cnkuZm9ybUlkICE9PSBmb3JtSWRfMTsgfSksIHRydWUpLnNsaWNlKDAsIE1hdGgubWF4KDEsIENPTkZJRy5zY2FuTWF4Q2VsbHMgLSAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgICAgICAvLyBBIGRlYWQgY2VsbCByZWZlcmVuY2UgbXVzdCBuZXZlciBicmVhayB0aGUgZXZlbnQgcGlwZWxpbmUuXG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIHNhZmVOdW1SZWZzKGNlbGwsIGZvcm1UeXBlKSB7XG4gICAgdmFyIF9hO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgY2VsbC5nZXROdW1SZWZzID09PSBcImZ1bmN0aW9uXCIgPyAoKF9hID0gY2VsbC5nZXROdW1SZWZzKGZvcm1UeXBlKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMCkgOiAwO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuZnVuY3Rpb24gc2FmZU50aFJlZihjZWxsLCBpbmRleCwgZm9ybVR5cGUpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGNlbGwuZ2V0TnRoUmVmID09PSBcImZ1bmN0aW9uXCIgPyBjZWxsLmdldE50aFJlZihpbmRleCwgZm9ybVR5cGUpIDogbnVsbDtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGN1cnJlbnRDZWxsSWRzKGNlbGxzKSB7XG4gICAgdmFyIF9hO1xuICAgIHZhciBpZHMgPSBbXTtcbiAgICBmb3IgKHZhciBfaSA9IDAsIGNlbGxzXzEgPSBjZWxsczsgX2kgPCBjZWxsc18xLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgY2VsbCA9IGNlbGxzXzFbX2ldO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWRzLnB1c2godHlwZW9mIGNlbGwuZ2V0Rm9ybUlEID09PSBcImZ1bmN0aW9uXCIgPyAoKF9hID0gY2VsbC5nZXRGb3JtSUQoKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMCkgOiAwKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgICAgIGlkcy5wdXNoKDApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpZHM7XG59XG5mdW5jdGlvbiBjdXJyZW50Q2VsbExpc3QocGxheWVyKSB7XG4gICAgdmFyIF9hO1xuICAgIHZhciBjZWxscyA9IFtdO1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGxheWVyLmdldFBhcmVudENlbGwgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdmFyIHBhcmVudCA9IHBsYXllci5nZXRQYXJlbnRDZWxsKCk7XG4gICAgICAgICAgICBpZiAocGFyZW50KVxuICAgICAgICAgICAgICAgIGNlbGxzLnB1c2gocGFyZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgLy8gTm8gcGFyZW50IGNlbGwgKG1haW4gbWVudSBlZGdlKSDigJQgc3dlZXAgdGhlIHJlY2VudCBsaXN0IG9ubHkuXG4gICAgfVxuICAgIHZhciBwYXJlbnRJZCA9IGNlbGxzLmxlbmd0aCA+IDAgPyAoX2EgPSBjdXJyZW50Q2VsbElkcyhbY2VsbHNbMF1dKVswXSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMCA6IDA7XG4gICAgZm9yICh2YXIgX2kgPSAwLCByZWNlbnRDZWxsc18xID0gcmVjZW50Q2VsbHM7IF9pIDwgcmVjZW50Q2VsbHNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gcmVjZW50Q2VsbHNfMVtfaV07XG4gICAgICAgIGlmIChjZWxscy5sZW5ndGggPj0gQ09ORklHLnNjYW5NYXhDZWxscylcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBpZiAoZW50cnkuZm9ybUlkID09PSBwYXJlbnRJZClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBjZWxscy5wdXNoKGVudHJ5LmNlbGwpO1xuICAgIH1cbiAgICByZXR1cm4gY2VsbHM7XG59XG5mdW5jdGlvbiBnZXRQbGF5ZXJQb3MocGxheWVyKSB7XG4gICAgdmFyIHAgPSBwbGF5ZXI7XG4gICAgaWYgKCFwIHx8XG4gICAgICAgIHR5cGVvZiBwLmdldFBvc2l0aW9uWCAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiBwLmdldFBvc2l0aW9uWSAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiBwLmdldFBvc2l0aW9uWiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4geyB4OiBwLmdldFBvc2l0aW9uWCgpLCB5OiBwLmdldFBvc2l0aW9uWSgpLCB6OiBwLmdldFBvc2l0aW9uWigpIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4vKipcbiAqIFByb2JlIG9uZSByZWZlcmVuY2UgaW50byBgb3V0YC4gUmV0dXJucyB0aGUgUGFweXJ1cy1wcm9iZSBjb3N0IHNvIHRoZSBzd2VlcFxuICogYnVkZ2V0IHN0YXlzIGhvbmVzdCAoY2hlY2tlZCBiZXR3ZWVuIG9iamVjdHMg4oCUIHdvcnN0LWNhc2Ugb3ZlcnNob290IGlzIG9uZVxuICogb2JqZWN0J3Mgd29ydGggb2YgcHJvYmVzLCB+MTIpLlxuICovXG5mdW5jdGlvbiBwcm9iZUNhbmRpZGF0ZShyZWYsIGZvcm1UeXBlLCBwbGF5ZXJQb3MsIG91dCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2UsIF9mLCBfZywgX2gsIF9qLCBfaywgX2w7XG4gICAgdmFyIGNvc3QgPSAwO1xuICAgIHZhciByZWZMaWtlID0gcmVmO1xuICAgIGlmICghcmVmTGlrZSB8fCB0eXBlb2YgcmVmTGlrZS5nZXRGb3JtSUQgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgdmFyIGZvcm1JZCA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgZm9ybUlkID0gKF9hID0gcmVmTGlrZS5nZXRGb3JtSUQoKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMDtcbiAgICAgICAgY29zdCsrO1xuICAgIH1cbiAgICBjYXRjaCAoX20pIHtcbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgfVxuICAgIGlmICghZm9ybUlkIHx8IGZvcm1JZCA9PT0gUExBWUVSX0ZPUk1fSUQpXG4gICAgICAgIHJldHVybiBjb3N0O1xuICAgIHZhciBkaXNhYmxlZCA9IGZhbHNlO1xuICAgIHZhciBkZWxldGVkID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZGlzYWJsZWQgPSB0eXBlb2YgcmVmTGlrZS5pc0Rpc2FibGVkID09PSBcImZ1bmN0aW9uXCIgPyAoKF9iID0gcmVmTGlrZS5pc0Rpc2FibGVkKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IGZhbHNlKSA6IGZhbHNlO1xuICAgICAgICBjb3N0Kys7XG4gICAgfVxuICAgIGNhdGNoIChfbykge1xuICAgICAgICBjb3N0Kys7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGRlbGV0ZWQgPSB0eXBlb2YgcmVmTGlrZS5pc0RlbGV0ZWQgPT09IFwiZnVuY3Rpb25cIiA/ICgoX2MgPSByZWZMaWtlLmlzRGVsZXRlZCgpKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiBmYWxzZSkgOiBmYWxzZTtcbiAgICAgICAgY29zdCsrO1xuICAgIH1cbiAgICBjYXRjaCAoX3ApIHtcbiAgICAgICAgY29zdCsrO1xuICAgIH1cbiAgICBpZiAoZGlzYWJsZWQgfHwgZGVsZXRlZClcbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgdmFyIHggPSAwO1xuICAgIHZhciB5ID0gMDtcbiAgICB2YXIgeiA9IDA7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWZMaWtlLmdldFBvc2l0aW9uWCAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgICAgICB0eXBlb2YgcmVmTGlrZS5nZXRQb3NpdGlvblkgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICAgICAgdHlwZW9mIHJlZkxpa2UuZ2V0UG9zaXRpb25aICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb3N0O1xuICAgICAgICB9XG4gICAgICAgIHggPSByZWZMaWtlLmdldFBvc2l0aW9uWCgpO1xuICAgICAgICB5ID0gcmVmTGlrZS5nZXRQb3NpdGlvblkoKTtcbiAgICAgICAgeiA9IHJlZkxpa2UuZ2V0UG9zaXRpb25aKCk7XG4gICAgICAgIGNvc3QgKz0gMztcbiAgICB9XG4gICAgY2F0Y2ggKF9xKSB7XG4gICAgICAgIHJldHVybiBjb3N0O1xuICAgIH1cbiAgICB2YXIgZHggPSB4IC0gcGxheWVyUG9zLng7XG4gICAgdmFyIGR5ID0geSAtIHBsYXllclBvcy55O1xuICAgIHZhciBkekZsYXQgPSAwOyAvLyByYWRpdXMgZ2F0ZSBpcyAyRCDigJQgYWx0aXR1ZGUgbXVzdCBub3QgaGlkZSBhIG5lYXJieSBkb29yXG4gICAgaWYgKGRpc3RhbmNlVW5pdHMoZHgsIGR5LCBkekZsYXQpID4gQ09ORklHLnNjYW5SYWRpdXNVbml0cylcbiAgICAgICAgcmV0dXJuIGNvc3Q7XG4gICAgdmFyIG5hbWUgPSBcIlwiO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBiYXNlID0gdHlwZW9mIHJlZkxpa2UuZ2V0QmFzZU9iamVjdCA9PT0gXCJmdW5jdGlvblwiID8gcmVmTGlrZS5nZXRCYXNlT2JqZWN0KCkgOiBudWxsO1xuICAgICAgICBpZiAoYmFzZSAmJiB0eXBlb2YgYmFzZS5nZXROYW1lID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICBuYW1lID0gKF9kID0gYmFzZS5nZXROYW1lKCkpICE9PSBudWxsICYmIF9kICE9PSB2b2lkIDAgPyBfZCA6IFwiXCI7XG4gICAgICAgIGNvc3QgKz0gMjtcbiAgICB9XG4gICAgY2F0Y2ggKF9yKSB7XG4gICAgICAgIGNvc3QgKz0gMjtcbiAgICB9XG4gICAgaWYgKCFuYW1lKVxuICAgICAgICByZXR1cm4gY29zdDtcbiAgICB2YXIgaXNMb2NrZWQgPSBmYWxzZTtcbiAgICB2YXIgbG9ja0xldmVsID0gMDtcbiAgICB2YXIgbnVtSXRlbXMgPSBudWxsO1xuICAgIHZhciBvcGVuU3RhdGUgPSBudWxsO1xuICAgIHZhciBpc0RlYWQgPSBmYWxzZTtcbiAgICB2YXIgaXNIYXJ2ZXN0ZWQgPSBmYWxzZTtcbiAgICAvLyBQdXJlIG1hcCBsb29rdXAgKGxvb3QtdHJhY2tlcikg4oCUIG5vIFBhcHlydXMgcHJvYmVzLCBjb3N0IHN0YXlzIDAuXG4gICAgdmFyIGlzTG9vdGVkID0gZm9ybVR5cGUgPT09IDI4ID8gaXNDb250YWluZXJMb290ZWQoZm9ybUlkKSA6IGZhbHNlO1xuICAgIGlmIChmb3JtVHlwZSA9PT0gMjQgfHwgZm9ybVR5cGUgPT09IDI4IHx8IGZvcm1UeXBlID09PSAyOSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNMb2NrZWQgPSB0eXBlb2YgcmVmTGlrZS5pc0xvY2tlZCA9PT0gXCJmdW5jdGlvblwiID8gKChfZSA9IHJlZkxpa2UuaXNMb2NrZWQoKSkgIT09IG51bGwgJiYgX2UgIT09IHZvaWQgMCA/IF9lIDogZmFsc2UpIDogZmFsc2U7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9zKSB7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzTG9ja2VkKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGxvY2tMZXZlbCA9IHR5cGVvZiByZWZMaWtlLmdldExvY2tMZXZlbCA9PT0gXCJmdW5jdGlvblwiID8gKChfZiA9IHJlZkxpa2UuZ2V0TG9ja0xldmVsKCkpICE9PSBudWxsICYmIF9mICE9PSB2b2lkIDAgPyBfZiA6IDApIDogMDtcbiAgICAgICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoX3QpIHtcbiAgICAgICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvcm1UeXBlID09PSAyOCkge1xuICAgICAgICB2YXIgbG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsb2FkZWQgPSB0eXBlb2YgcmVmTGlrZS5pczNETG9hZGVkID09PSBcImZ1bmN0aW9uXCIgPyAoKF9nID0gcmVmTGlrZS5pczNETG9hZGVkKCkpICE9PSBudWxsICYmIF9nICE9PSB2b2lkIDAgPyBfZyA6IGZhbHNlKSA6IGZhbHNlO1xuICAgICAgICAgICAgY29zdCsrO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfdSkge1xuICAgICAgICAgICAgY29zdCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsb2FkZWQpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgbnVtSXRlbXMgPSB0eXBlb2YgcmVmTGlrZS5nZXROdW1JdGVtcyA9PT0gXCJmdW5jdGlvblwiID8gKChfaCA9IHJlZkxpa2UuZ2V0TnVtSXRlbXMoKSkgIT09IG51bGwgJiYgX2ggIT09IHZvaWQgMCA/IF9oIDogMCkgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNvc3QrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfdikge1xuICAgICAgICAgICAgICAgIGNvc3QrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZm9ybVR5cGUgPT09IDI5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBvcGVuU3RhdGUgPSB0eXBlb2YgcmVmTGlrZS5nZXRPcGVuU3RhdGUgPT09IFwiZnVuY3Rpb25cIiA/ICgoX2ogPSByZWZMaWtlLmdldE9wZW5TdGF0ZSgpKSAhPT0gbnVsbCAmJiBfaiAhPT0gdm9pZCAwID8gX2ogOiAwKSA6IG51bGw7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF93KSB7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvcm1UeXBlID09PSAzOSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaXNIYXJ2ZXN0ZWQgPSB0eXBlb2YgcmVmTGlrZS5pc0hhcnZlc3RlZCA9PT0gXCJmdW5jdGlvblwiID8gKChfayA9IHJlZkxpa2UuaXNIYXJ2ZXN0ZWQoKSkgIT09IG51bGwgJiYgX2sgIT09IHZvaWQgMCA/IF9rIDogZmFsc2UpIDogZmFsc2U7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF94KSB7XG4gICAgICAgICAgICBjb3N0Kys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZvcm1UeXBlID09PSA2Mikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGFjdG9yID0gQWN0b3IuZnJvbShyZWYpO1xuICAgICAgICAgICAgaXNEZWFkID0gYWN0b3IgPyAoKF9sID0gYWN0b3IuaXNEZWFkKCkpICE9PSBudWxsICYmIF9sICE9PSB2b2lkIDAgPyBfbCA6IGZhbHNlKSA6IGZhbHNlO1xuICAgICAgICAgICAgY29zdCsrO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfeSkge1xuICAgICAgICAgICAgY29zdCsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIG91dC5wdXNoKHsgZm9ybUlkOiBmb3JtSWQsIG5hbWU6IG5hbWUsIGZvcm1UeXBlOiBmb3JtVHlwZSwgeDogeCwgeTogeSwgejogeiwgaXNMb2NrZWQ6IGlzTG9ja2VkLCBsb2NrTGV2ZWw6IGxvY2tMZXZlbCwgbnVtSXRlbXM6IG51bUl0ZW1zLCBvcGVuU3RhdGU6IG9wZW5TdGF0ZSwgaXNEZWFkOiBpc0RlYWQsIGlzSGFydmVzdGVkOiBpc0hhcnZlc3RlZCwgaXNMb290ZWQ6IGlzTG9vdGVkIH0pO1xuICAgIHJldHVybiBjb3N0O1xufVxuZnVuY3Rpb24gZmluaXNoU3dlZXAocGxheWVyLCBwbGF5ZXJQb3MpIHtcbiAgICB2YXIgX2EsIF9iLCBfYztcbiAgICB2YXIgZmFjaW5nID0gMDtcbiAgICB0cnkge1xuICAgICAgICBmYWNpbmcgPSAoX2MgPSAoX2IgPSAoX2EgPSBwbGF5ZXIpLmdldEFuZ2xlWikgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoX2EpKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiAwO1xuICAgIH1cbiAgICBjYXRjaCAoX2QpIHtcbiAgICAgICAgZmFjaW5nID0gMDtcbiAgICB9XG4gICAgdmFyIG9iamVjdHMgPSBmaW5hbGl6ZUNhbmRpZGF0ZXMoc3dlZXAuY2FuZGlkYXRlcywgcGxheWVyUG9zLCBmYWNpbmcsIENPTkZJRy5zY2FuTWF4T3V0cHV0KTtcbiAgICB2YXIgY2VsbHMgPSBjdXJyZW50Q2VsbExpc3QocGxheWVyKTtcbiAgICBjYWNoZSA9IHsgb2JqZWN0czogb2JqZWN0cywgcG9zOiBwbGF5ZXJQb3MsIGNlbGxJZHM6IGN1cnJlbnRDZWxsSWRzKGNlbGxzKSB9O1xuICAgIHN3ZWVwID0geyBhY3RpdmU6IGZhbHNlLCBjZWxsSW5kZXg6IDAsIHR5cGVJbmRleDogMCwgcmVmSW5kZXg6IDAsIHJlZkNvdW50OiAwLCBjb3VudEtub3duOiBmYWxzZSwgY2FuZGlkYXRlczogW10gfTtcbiAgICBkZWJ1Z0xvZyhcInN3ZWVwIGRvbmU6IFwiLmNvbmNhdChvYmplY3RzLmxlbmd0aCwgXCIgb2JqZWN0cyBjYWNoZWRcIikpO1xufVxuLyoqXG4gKiBPbmUgYnVkZ2V0ZWQgc3dlZXAgcGFzcy4gQ2FsbCBvbmNlIHBlciB1cGRhdGUgdGljayAoNTAwbXMgdGhyb3R0bGUgaW5cbiAqIGluZGV4LnRzKS4gQ2hlYXAgZWFybHktb3V0IHdoZW4gdGhlIGNhY2hlIGlzIGZyZXNoOiBubyBQYXB5cnVzIGNhbGxzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHVtcFdvcmxkU2Nhbm5lcigpIHtcbiAgICB2YXIgX2E7XG4gICAgaWYgKCFDT05GSUcuc2Nhbm5lckVuYWJsZWQpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgcGxheWVyID0gR2FtZS5nZXRQbGF5ZXIoKTtcbiAgICBpZiAoIXBsYXllcilcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBpbkxvYWRpbmcgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICBpbkxvYWRpbmcgPSBVaS5pc01lbnVPcGVuKFwiTG9hZGluZyBNZW51XCIpO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgaW5Mb2FkaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChpbkxvYWRpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgcGxheWVyUG9zID0gZ2V0UGxheWVyUG9zKHBsYXllcik7XG4gICAgaWYgKCFwbGF5ZXJQb3MpXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgY2VsbHMgPSBjdXJyZW50Q2VsbExpc3QocGxheWVyKTtcbiAgICB2YXIgY2VsbElkcyA9IGN1cnJlbnRDZWxsSWRzKGNlbGxzKTtcbiAgICBpZiAoY2FjaGUgJiYgIWlzU2NhbkNhY2hlU3RhbGUoY2FjaGUsIHsgcG9zOiBwbGF5ZXJQb3MsIGNlbGxJZHM6IGNlbGxJZHMgfSwgQ09ORklHLnNjYW5SZXNjYW5EaXN0YW5jZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXN3ZWVwLmFjdGl2ZSkge1xuICAgICAgICBzd2VlcCA9IHsgYWN0aXZlOiB0cnVlLCBjZWxsSW5kZXg6IDAsIHR5cGVJbmRleDogMCwgcmVmSW5kZXg6IDAsIHJlZkNvdW50OiAwLCBjb3VudEtub3duOiBmYWxzZSwgY2FuZGlkYXRlczogW10gfTtcbiAgICAgICAgZGVidWdMb2coXCJzd2VlcCBzdGFydGVkXCIpO1xuICAgIH1cbiAgICB2YXIgYnVkZ2V0ID0gQ09ORklHLnNjYW5Qcm9iZUJ1ZGdldDtcbiAgICB3aGlsZSAoYnVkZ2V0ID4gMCAmJiBzd2VlcC5hY3RpdmUpIHtcbiAgICAgICAgdmFyIGNlbGwgPSBjZWxsc1tzd2VlcC5jZWxsSW5kZXhdO1xuICAgICAgICBpZiAoIWNlbGwpIHtcbiAgICAgICAgICAgIGZpbmlzaFN3ZWVwKHBsYXllciwgcGxheWVyUG9zKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmb3JtVHlwZSA9IChfYSA9IEFMTE9XRURfVFlQRVNbc3dlZXAudHlwZUluZGV4XSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogMDtcbiAgICAgICAgaWYgKCFmb3JtVHlwZSkge1xuICAgICAgICAgICAgLy8gRGVmZW5zaXZlOiBiYWQgaW5kZXgg4oCUIGFib3J0IHRoaXMgc3dlZXAgaW5zdGVhZCBvZiBzcGlubmluZy5cbiAgICAgICAgICAgIHN3ZWVwID0geyBhY3RpdmU6IGZhbHNlLCBjZWxsSW5kZXg6IDAsIHR5cGVJbmRleDogMCwgcmVmSW5kZXg6IDAsIHJlZkNvdW50OiAwLCBjb3VudEtub3duOiBmYWxzZSwgY2FuZGlkYXRlczogW10gfTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICghc3dlZXAuY291bnRLbm93bikge1xuICAgICAgICAgICAgc3dlZXAucmVmQ291bnQgPSBzYWZlTnVtUmVmcyhjZWxsLCBmb3JtVHlwZSk7XG4gICAgICAgICAgICBzd2VlcC5jb3VudEtub3duID0gdHJ1ZTtcbiAgICAgICAgICAgIGJ1ZGdldC0tO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN3ZWVwLnJlZkluZGV4ID49IHN3ZWVwLnJlZkNvdW50KSB7XG4gICAgICAgICAgICBzd2VlcC50eXBlSW5kZXgrKztcbiAgICAgICAgICAgIHN3ZWVwLnJlZkluZGV4ID0gMDtcbiAgICAgICAgICAgIHN3ZWVwLnJlZkNvdW50ID0gMDtcbiAgICAgICAgICAgIHN3ZWVwLmNvdW50S25vd24gPSBmYWxzZTtcbiAgICAgICAgICAgIGlmIChzd2VlcC50eXBlSW5kZXggPj0gQUxMT1dFRF9UWVBFUy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBzd2VlcC50eXBlSW5kZXggPSAwO1xuICAgICAgICAgICAgICAgIHN3ZWVwLmNlbGxJbmRleCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlZiA9IHNhZmVOdGhSZWYoY2VsbCwgc3dlZXAucmVmSW5kZXgsIGZvcm1UeXBlKTtcbiAgICAgICAgc3dlZXAucmVmSW5kZXgrKztcbiAgICAgICAgYnVkZ2V0LS07XG4gICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICAgIGJ1ZGdldCAtPSBwcm9iZUNhbmRpZGF0ZShyZWYsIGZvcm1UeXBlLCBwbGF5ZXJQb3MsIHN3ZWVwLmNhbmRpZGF0ZXMpO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqIENhY2hlZCwgZGlzdGFuY2Utc29ydGVkLCBjYXBwZWQgb2JqZWN0cy4gRW1wdHkgdW50aWwgdGhlIGZpcnN0IHN3ZWVwIGxhbmRzLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFdvcmxkT2JqZWN0cygpIHtcbiAgICB2YXIgX2E7XG4gICAgcmV0dXJuIChfYSA9IGNhY2hlID09PSBudWxsIHx8IGNhY2hlID09PSB2b2lkIDAgPyB2b2lkIDAgOiBjYWNoZS5vYmplY3RzKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBbXTtcbn1cbi8qKiBge3R5cGU6XCJzY2FuXCJ9YCBhY3Rpb24g4oCUIGRyb3AgdGhlIGNhY2hlIHNvIHRoZSBuZXh0IHB1bXAgcmUtc3dlZXBzIG5vdy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZhbGlkYXRlV29ybGRTY2FuKCkge1xuICAgIGNhY2hlID0gbnVsbDtcbiAgICBkZWJ1Z0xvZyhcImNhY2hlIGludmFsaWRhdGVkIChzY2FuIGFjdGlvbilcIik7XG59XG4iLCIvKipcbiAqIFB1cmUgaW52ZW50b3J5LWR1bXAgaGVscGVycyDigJQgTk8gc2t5cmltUGxhdGZvcm0gaW1wb3J0cy5cbiAqXG4gKiBQYXJhbGxlbC1hcnJheSByb3dzIGZvciB0aGUgY29udGV4dC1sYW5lIGR1bXAgc28gQ29tcG9zZXIvU1RUIGNhbiBuYW1lXG4gKiBpdGVtcyB3aXRob3V0IHJlYWRpbmcgU2NhbGVmb3JtLiBDYXAgaXMgYSBnYW1lLXRocmVhZCBidWRnZXQsIG5vdCBhXG4gKiBnYW1lcGxheSBsaW1pdC5cbiAqL1xuZXhwb3J0IHZhciBJTlZFTlRPUllfRFVNUF9NQVggPSA0ODtcbmV4cG9ydCBmdW5jdGlvbiBmaW5hbGl6ZUludmVudG9yeVJvd3Mocm93cywgbWF4KSB7XG4gICAgaWYgKG1heCA9PT0gdm9pZCAwKSB7IG1heCA9IElOVkVOVE9SWV9EVU1QX01BWDsgfVxuICAgIHZhciBvdXQgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHJvdyA9IHJvd3NbaV07XG4gICAgICAgIGlmICghcm93Lm5hbWUpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHJvdy5jb3VudCA8PSAwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIG91dC5wdXNoKHJvdyk7XG4gICAgICAgIGlmIChvdXQubGVuZ3RoID49IG1heClcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xufVxuIiwiLyoqXG4gKiBQdXJlIG1lbnUtZm9jdXMgbG9naWMg4oCUIE5PIHNreXJpbVBsYXRmb3JtIGltcG9ydHMuXG4gKlxuICogQmVoYXZpb3VyYWwgcG9ydCBvZiBTa3lyaW0gQWNjZXNzJ3MgaW52ZW50b3J5L21hZ2ljL2NvbnRhaW5lciByZWFkZXJcbiAqIChwb2xsICsgc25hcHNob3QgZGlmZiArIGZpcnN0UmVhZCksIHJlaW1wbGVtZW50ZWQgYWdhaW5zdCBTS1NFLXN0eWxlXG4gKiBVaS5nZXRTdHJpbmcgcGF0aHMuIEdGeCBwYXRoIHN0cmluZ3MgYXJlIHB1YmxpYyBTY2FsZWZvcm0gZmFjdHMsIG5vdFxuICogY29waWVkIGZyb20gdGhlaXIgR1BMIHNvdXJjZXMuXG4gKi9cbmV4cG9ydCB2YXIgTkFSUkFUQUJMRV9NRU5VUyA9IFtcbiAgICBcIkludmVudG9yeU1lbnVcIixcbiAgICBcIk1hZ2ljTWVudVwiLFxuICAgIFwiQ29udGFpbmVyTWVudVwiLFxuICAgIFwiQmFydGVyTWVudVwiLFxuICAgIFwiR2lmdE1lbnVcIixcbl07XG4vKiogU2t5VUkgSXRlbU1lbnUgZmFtaWx5IChpbnZlbnRvcnkgLyBtYWdpYyAvIGNvbnRhaW5lciAvIGJhcnRlciAvIGdpZnQpLiAqL1xuZXhwb3J0IHZhciBJVEVNX1BBVEhTX1NLWVVJID0gW1xuICAgIFwiX3Jvb3QuTWVudV9tYy5pbnZlbnRvcnlMaXN0cy5pdGVtTGlzdC5zZWxlY3RlZEVudHJ5LnRleHRcIixcbiAgICBcIl9yb290Lk1lbnVfbWMuaW52ZW50b3J5TGlzdHMuaXRlbUxpc3Quc2VsZWN0ZWROYW1lXCIsXG5dO1xuZXhwb3J0IHZhciBJVEVNX1BBVEhTX1ZBTklMTEEgPSBbXG4gICAgLy8gVmVyaWZpZWQgYWdhaW5zdCBTa3lyaW0gQWNjZXNzIChHUEwpIHNyYy9tZW51XyouY3BwIOKAlCB0aGUgdmFuaWxsYVxuICAgIC8vIEludmVudG9yeU1lbnUgaGllcmFyY2h5IHVzZXMgSW52ZW50b3J5TGlzdHNfbWMvSXRlbXNMaXN0IChjYXBpdGFsXG4gICAgLy8gbGV0dGVycyksIHVubGlrZSB0aGUgbG93ZXJjYXNlIFNreVVJIGxheW91dC5cbiAgICBcIl9yb290Lk1lbnVfbWMuSW52ZW50b3J5TGlzdHNfbWMuSXRlbXNMaXN0LnNlbGVjdGVkRW50cnkudGV4dFwiLFxuICAgIFwiX3Jvb3QuTWVudV9tYy5JdGVtQ2FyZEZhZGVIb2xkZXJfbWMuSXRlbUNhcmRfbWMuaXRlbUluZm8udGV4dFwiLFxuICAgIFwiX3Jvb3QuTWVudV9tYy5pdGVtQ2FyZC5pdGVtSW5mby50ZXh0XCIsXG4gICAgXCJfcm9vdC5NZW51X21jLml0ZW1DYXJkLml0ZW1OYW1lXCIsXG5dO1xuZXhwb3J0IHZhciBJTkRFWF9QQVRIU19TS1lVSSA9IFtcbiAgICBcIl9yb290Lk1lbnVfbWMuaW52ZW50b3J5TGlzdHMuaXRlbUxpc3Quc2VsZWN0ZWRJbmRleFwiLFxuXTtcbmV4cG9ydCB2YXIgSU5ERVhfUEFUSFNfVkFOSUxMQSA9IFtcbiAgICBcIl9yb290Lk1lbnVfbWMuSW52ZW50b3J5TGlzdHNfbWMuSXRlbXNMaXN0LnNlbGVjdGVkSW5kZXhcIixcbiAgICBcIl9yb290Lk1lbnVfbWMuSW52ZW50b3J5TGlzdHNfbWMuQ2F0ZWdvcmllc0xpc3Quc2VsZWN0ZWRJbmRleFwiLFxuICAgIFwiX3Jvb3QuTWVudV9tYy5JbnZlbnRvcnlMaXN0c19tYy5DYXRlZ29yaWVzTGlzdC5kaXZpZGVySW5kZXhcIixcbl07XG5leHBvcnQgdmFyIENPVU5UX1BBVEhTX1NLWVVJID0gW1xuICAgIFwiX3Jvb3QuTWVudV9tYy5pbnZlbnRvcnlMaXN0cy5pdGVtTGlzdC5pdGVtQ291bnRcIixcbl07XG5leHBvcnQgdmFyIENPVU5UX1BBVEhTX1ZBTklMTEEgPSBbXG4gICAgXCJfcm9vdC5NZW51X21jLkludmVudG9yeUxpc3RzX21jLkl0ZW1zTGlzdC5zZWxlY3RlZEVudHJ5LmNvdW50XCIsXG5dO1xuZXhwb3J0IHZhciBDQVRFR09SWV9QQVRIU19TS1lVSSA9IFtcbiAgICBcIl9yb290Lk1lbnVfbWMuaW52ZW50b3J5TGlzdHMuY2F0ZWdvcnlMaXN0LnNlbGVjdGVkRW50cnkudGV4dFwiLFxuICAgIFwiX3Jvb3QuTWVudV9tYy5pbnZlbnRvcnlMaXN0cy5jYXRlZ29yeUxpc3Quc2VsZWN0ZWROYW1lXCIsXG5dO1xuZXhwb3J0IHZhciBDQVRFR09SWV9QQVRIU19WQU5JTExBID0gW1xuICAgIFwiX3Jvb3QuTWVudV9tYy5JbnZlbnRvcnlMaXN0c19tYy5DYXRlZ29yaWVzTGlzdC5jZW50ZXJlZEVudHJ5LnRleHRcIixcbl07XG5leHBvcnQgZnVuY3Rpb24gaXNOYXJyYXRhYmxlTWVudShuYW1lKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBOQVJSQVRBQkxFX01FTlVTLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChOQVJSQVRBQkxFX01FTlVTW2ldID09PSBuYW1lKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cbi8qKlxuICogSGlnaGVzdC1wcmlvcml0eSBuYXJyYXRhYmxlIG1lbnUgY3VycmVudGx5IG9wZW4uIEludmVudG9yeSB3aW5zIG92ZXJcbiAqIGNvbnRhaW5lciB3aGVuIGJvdGggZXhpc3QgKHRoZXkgc2hvdWxkIG5vdCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kTmFycmF0YWJsZU1lbnUob3Blbk1lbnVzKSB7XG4gICAgdmFyIG9wZW4gPSBuZXcgU2V0KCk7XG4gICAgdmFyIGxpc3RlZCA9IEFycmF5LmZyb20ob3Blbk1lbnVzKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpc3RlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICBvcGVuLmFkZChsaXN0ZWRbaV0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IE5BUlJBVEFCTEVfTUVOVVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBOQVJSQVRBQkxFX01FTlVTW2ldO1xuICAgICAgICBpZiAob3Blbi5oYXMobmFtZSkpXG4gICAgICAgICAgICByZXR1cm4gbmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG4vKiogU3RyaXAgU2NhbGVmb3JtICRrZXlzIGFuZCB1bmRlcnNjb3JlcyBzbyBcIiR3ZWFwb25fb25lX2hhbmRcIiBzcGVha3MuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5VaVRleHQocmF3KSB7XG4gICAgdmFyIHRleHQgPSByYXcudHJpbSgpO1xuICAgIGlmICh0ZXh0LmNoYXJBdCgwKSA9PT0gXCIkXCIpIHtcbiAgICAgICAgdGV4dCA9IHRleHQuc2xpY2UoMSk7XG4gICAgfVxuICAgIHRleHQgPSB0ZXh0LnNwbGl0KFwiX1wiKS5qb2luKFwiIFwiKTtcbiAgICByZXR1cm4gdGV4dC50cmltKCk7XG59XG5leHBvcnQgZnVuY3Rpb24gZmlyc3ROb25FbXB0eSh2YWx1ZXMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgdmFyIGNsZWFuZWQgPSBjbGVhblVpVGV4dCh2YWx1ZSk7XG4gICAgICAgIGlmICghY2xlYW5lZClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB2YXIgbG93ZXIgPSBjbGVhbmVkLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChsb3dlciA9PT0gXCJ1bmRlZmluZWRcIiB8fCBsb3dlciA9PT0gXCJudWxsXCIpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgcmV0dXJuIGNsZWFuZWQ7XG4gICAgfVxuICAgIHJldHVybiBcIlwiO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvY3VzU2lnbmF0dXJlKHNuYXBzaG90KSB7XG4gICAgaWYgKCFzbmFwc2hvdClcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgLy8gSW5kZXgvY291bnQgZmlsbCBpbiBhIHRpY2sgbGF0ZXIgdGhhbiB0aGUgbmFtZTsgdGhleSBtdXN0IG5vdCByZS1zcGVhay5cbiAgICByZXR1cm4gXCJcIi5jb25jYXQoc25hcHNob3QubmFtZSwgXCJ8XCIpLmNvbmNhdChzbmFwc2hvdC5jYXRlZ29yeSwgXCJ8XCIpLmNvbmNhdChzbmFwc2hvdC5pdGVtKTtcbn1cbi8qKlxuICogRGlmZiB0d28gc25hcHNob3RzIGludG8gYSBzcGVlY2ggZXZlbnQuIEVtcHR5LWl0ZW0gZmxpY2tlcnMgd2hpbGUgdGhlXG4gKiBtZW51IHN0YXlzIG9wZW4gYXJlIGlnbm9yZWQgKFNjYWxlZm9ybSBicmllZmx5IGJsYW5rcyBvbiB0YWIgY2hhbmdlKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmZNZW51Rm9jdXMocHJldiwgbmV4dCkge1xuICAgIHZhciBfYSwgX2IsIF9jO1xuICAgIHZhciBwcmV2TmFtZSA9IChfYSA9IHByZXYgPT09IG51bGwgfHwgcHJldiA9PT0gdm9pZCAwID8gdm9pZCAwIDogcHJldi5uYW1lKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBudWxsO1xuICAgIHZhciBuZXh0TmFtZSA9IChfYiA9IG5leHQgPT09IG51bGwgfHwgbmV4dCA9PT0gdm9pZCAwID8gdm9pZCAwIDogbmV4dC5uYW1lKSAhPT0gbnVsbCAmJiBfYiAhPT0gdm9pZCAwID8gX2IgOiBudWxsO1xuICAgIGlmICghcHJldk5hbWUgJiYgbmV4dE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHsgZXZlbnQ6IFwib3BlblwiLCBmaXJzdFJlYWQ6IGZhbHNlLCBhbm5vdW5jZUNhdGVnb3J5OiAhIShuZXh0ID09PSBudWxsIHx8IG5leHQgPT09IHZvaWQgMCA/IHZvaWQgMCA6IG5leHQuY2F0ZWdvcnkpIH07XG4gICAgfVxuICAgIGlmIChwcmV2TmFtZSAmJiAhbmV4dE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHsgZXZlbnQ6IFwiY2xvc2VcIiwgZmlyc3RSZWFkOiBmYWxzZSwgYW5ub3VuY2VDYXRlZ29yeTogZmFsc2UgfTtcbiAgICB9XG4gICAgaWYgKCFuZXh0IHx8ICFuZXh0TmFtZSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgaWYgKHByZXZOYW1lICE9PSBuZXh0TmFtZSkge1xuICAgICAgICByZXR1cm4geyBldmVudDogXCJvcGVuXCIsIGZpcnN0UmVhZDogZmFsc2UsIGFubm91bmNlQ2F0ZWdvcnk6ICEhbmV4dC5jYXRlZ29yeSB9O1xuICAgIH1cbiAgICBpZiAoZm9jdXNTaWduYXR1cmUocHJldikgPT09IGZvY3VzU2lnbmF0dXJlKG5leHQpKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICBpZiAoIW5leHQuaXRlbSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgdmFyIGZpcnN0UmVhZCA9ICEocHJldiA9PT0gbnVsbCB8fCBwcmV2ID09PSB2b2lkIDAgPyB2b2lkIDAgOiBwcmV2Lml0ZW0pO1xuICAgIHZhciBhbm5vdW5jZUNhdGVnb3J5ID0gKChfYyA9IHByZXYgPT09IG51bGwgfHwgcHJldiA9PT0gdm9pZCAwID8gdm9pZCAwIDogcHJldi5jYXRlZ29yeSkgIT09IG51bGwgJiYgX2MgIT09IHZvaWQgMCA/IF9jIDogXCJcIikgIT09IG5leHQuY2F0ZWdvcnkgJiYgISFuZXh0LmNhdGVnb3J5O1xuICAgIHJldHVybiB7IGV2ZW50OiBcImZvY3VzXCIsIGZpcnN0UmVhZDogZmlyc3RSZWFkLCBhbm5vdW5jZUNhdGVnb3J5OiBhbm5vdW5jZUNhdGVnb3J5IH07XG59XG4iLCIvKipcbiAqIFB1cmUgbWVudS1zdGF0ZSBsb2dpYyDigJQgTk8gc2t5cmltUGxhdGZvcm0gaW1wb3J0cy5cbiAqXG4gKiBgdWkubWVudU9wZW5gIG1lYW5zIFwiYSBnYW1lcGxheS1ibG9ja2luZyBtZW51IGlzIG9wZW5cIiAoaW52ZW50b3J5LCBtYXAsXG4gKiBjcmFmdGluZ+KApiksIE5PVCBcImFueSBtZW51IGlzIG9wZW5cIjogdGhlIEhVRC9GYWRlci9DdXJzb3IvTWlzdCBtZW51cyBhcmVcbiAqIG9wZW4gZm9yIHRoZSBlbnRpcmUgcGxheSBzZXNzaW9uIGFuZCB3b3VsZCBtdXRlIFNreUd1aWRlIGZvcmV2ZXIgaWZcbiAqIGNvdW50ZWQuIFRoZSBkZW55bGlzdCBpcyBza3ltcDUtY2xpZW50J3MgYGJyb3dzZXJTZXJ2aWNlLmJhZE1lbnVzYCBzZXRcbiAqIChzZXJ2aWNlcy9zZXJ2aWNlcy9icm93c2VyU2VydmljZS50cykg4oCUIHRoZSBiYXR0bGUtdGVzdGVkIGxpc3Qgb2YgbWVudXNcbiAqIHRoYXQgaGlkZSBhIENFRiBvdmVybGF5LCBpLmUuIGV4YWN0bHkgdGhlIG1lbnVzIHdoZXJlIHRoZSBnYW1lIFVJIG93bnNcbiAqIHRoZSBzY3JlZW4uXG4gKi9cbmV4cG9ydCB2YXIgR0FNRV9NRU5VUyA9IG5ldyBTZXQoW1xuICAgIFwiQmFydGVyTWVudVwiLFxuICAgIFwiQm9vayBNZW51XCIsXG4gICAgXCJDb250YWluZXJNZW51XCIsXG4gICAgXCJDcmFmdGluZyBNZW51XCIsXG4gICAgXCJHaWZ0TWVudVwiLFxuICAgIFwiSW52ZW50b3J5TWVudVwiLFxuICAgIFwiSm91cm5hbCBNZW51XCIsXG4gICAgXCJMb2NrcGlja2luZyBNZW51XCIsXG4gICAgXCJMb2FkaW5nIE1lbnVcIixcbiAgICBcIk1hcE1lbnVcIixcbiAgICBcIlJhY2VTZXggTWVudVwiLFxuICAgIFwiU3RhdHNNZW51XCIsXG4gICAgXCJUd2VlbiBNZW51XCIsXG4gICAgXCJDb25zb2xlXCIsXG4gICAgXCJNYWluIE1lbnVcIixcbiAgICBcIkRpYWxvZ3VlIE1lbnVcIixcbiAgICBcIk1lc3NhZ2VCb3hNZW51XCIsXG4gICAgXCJMZXZlbFVwIE1lbnVcIixcbiAgICBcIlNsZWVwL1dhaXQgTWVudVwiLFxuICAgIFwiRmF2b3JpdGVzTWVudVwiLFxuICAgIFwiUXVhbnRpdHkgTWVudVwiLFxuICAgIFwiTWFnaWNNZW51XCIsXG4gICAgXCJUcmFpbmluZyBNZW51XCIsXG5dKTtcbmV4cG9ydCBmdW5jdGlvbiBjb21wdXRlVWlGbGFncyhvcGVuTWVudXMpIHtcbiAgICB2YXIgbWVudU9wZW4gPSBmYWxzZTtcbiAgICB2YXIgY29uc29sZU9wZW4gPSBmYWxzZTtcbiAgICAvLyBBcnJheS5mcm9tOiB0aGUgcGx1Z2luIGNvbXBpbGVzIHRvIEVTNSwgd2hlcmUgYmFyZSBmb3Itb2Ygb3ZlciBhblxuICAgIC8vIEl0ZXJhYmxlIG5lZWRzIGRvd25sZXZlbEl0ZXJhdGlvbi5cbiAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gQXJyYXkuZnJvbShvcGVuTWVudXMpOyBfaSA8IF9hLmxlbmd0aDsgX2krKykge1xuICAgICAgICB2YXIgbWVudSA9IF9hW19pXTtcbiAgICAgICAgaWYgKEdBTUVfTUVOVVMuaGFzKG1lbnUpKSB7XG4gICAgICAgICAgICBtZW51T3BlbiA9IHRydWU7XG4gICAgICAgICAgICBpZiAobWVudSA9PT0gXCJDb25zb2xlXCIpXG4gICAgICAgICAgICAgICAgY29uc29sZU9wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7IG1lbnVPcGVuOiBtZW51T3BlbiwgY29uc29sZU9wZW46IGNvbnNvbGVPcGVuIH07XG59XG4iLCJ2YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuLyoqXG4gKiBQYXJhbGxlbC1hcnJheSBkdW1wIG1hdGNoaW5nIHNreWRpdmUtYXBwIGBwYXJzZVNreXJpbVN0YXRlYFxuICogKGBzZXJ2ZXIvdXRpbHMvc2t5cmltLXN0YXRlLXBhcnNlci50c2ApLiBUaGUgR2F0ZS9Db21wb3NlciByZWFkIHRoaXMgdmlhXG4gKiBTa3lyaW1GaWxlQ29ubmVjdG9yIOKAlCB0aGV5IGRvIE5PVCBzZWUgdGhlIEhUVFAgcHJvdG9jb2wtdjEgcGF5bG9hZC5cbiAqXG4gKiBEaXN0YW5jZSBjb252ZXJzaW9uOiA3MCBTa3lyaW0gdW5pdHMg4omIIDEgbWV0ZXIgKGNvbW11bml0eSBjb252ZW50aW9uKS5cbiAqXG4gKiBEdW1wIHNjaGVtYSB2ZXJzaW9uIDIgKEFEUjogc2t5ZGl2ZS1hcHAvZG9jcy9hZHIvMDAwMy1zdGF0ZS1jaGFubmVscy5tZCk6XG4gKiAgLSBgZHVtcC50aW1lc3RhbXBgIChmbG9hdCwgbXMgZXBvY2gpIOKAlCB0aGUgYXBwIGRyb3BzIGNvbnRleHQgb2xkZXIgdGhhblxuICogICAgfjEwcyBzbyBhIHF1aXQgZ2FtZSBjYW5ub3Qgd2hpc3BlciBzdGFsZSBzdGF0ZSBpbnRvIEdlbWluaSBmb3JldmVyO1xuICogIC0gYHdvcmxkLm9iamVjdHMuKmAgcGFyYWxsZWwgYXJyYXlzIGZyb20gdGhlIHdvcmxkIHNjYW5uZXIgKGFsd2F5cyBwdXNoXG4gKiAgICBldmVyeSBhcnJheSBpbiBsb2NrLXN0ZXAg4oCUIGxlbmd0aHMgbXVzdCBuZXZlciBkZXN5bmMpLlxuICovXG52YXIgVU5JVFNfUEVSX01FVEVSID0gNzA7XG52YXIgT0JTVEFDTEVfRlJPTlRfVU5JVFMgPSAxNTA7XG52YXIgRFVNUF9WRVJTSU9OID0gMjtcbmZ1bmN0aW9uIGNvbXBhc3NGcm9tQW5nbGVaKGFuZ2xlWikge1xuICAgIHZhciBkaXJzID0gW1xuICAgICAgICBcIk5vcmRcIixcbiAgICAgICAgXCJOb3JkLUVzdFwiLFxuICAgICAgICBcIkVzdFwiLFxuICAgICAgICBcIlN1ZC1Fc3RcIixcbiAgICAgICAgXCJTdWRcIixcbiAgICAgICAgXCJTdWQtT3Vlc3RcIixcbiAgICAgICAgXCJPdWVzdFwiLFxuICAgICAgICBcIk5vcmQtT3Vlc3RcIixcbiAgICBdO1xuICAgIHZhciBub3JtYWxpemVkID0gKChhbmdsZVogJSAzNjApICsgMzYwKSAlIDM2MDtcbiAgICByZXR1cm4gZGlyc1tNYXRoLnJvdW5kKG5vcm1hbGl6ZWQgLyA0NSkgJSA4XTtcbn1cbmZ1bmN0aW9uIGNsb2NrRnJvbUhlYWRpbmdBbmdsZShoZWFkaW5nQW5nbGUpIHtcbiAgICB2YXIgbm9ybWFsaXplZCA9ICgoaGVhZGluZ0FuZ2xlICUgMzYwKSArIDM2MCkgJSAzNjA7XG4gICAgdmFyIGhvdXIgPSBNYXRoLnJvdW5kKG5vcm1hbGl6ZWQgLyAzMCkgJSAxMjtcbiAgICByZXR1cm4gXCJcIi5jb25jYXQoaG91ciA9PT0gMCA/IDEyIDogaG91ciwgXCJoXCIpO1xufVxuZnVuY3Rpb24gZmxhZyh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA/IDEgOiAwO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTW9kQ29udGV4dChzbmFwc2hvdCwgcHJvdG9jb2wsIG9wdGlvbnMpIHtcbiAgICB2YXIgX2EsIF9iLCBfYywgX2QsIF9lLCBfZiwgX2csIF9oLCBfaiwgX2ssIF9sLCBfbSwgX287XG4gICAgdmFyIGZsb2F0cyA9IHtcbiAgICAgICAgXCJwbGF5ZXIuaGVhbHRoXCI6IHByb3RvY29sLnBsYXllci5oZWFsdGgsXG4gICAgICAgIFwicGxheWVyLmhlYWx0aF9tYXhcIjogcHJvdG9jb2wucGxheWVyLm1heEhlYWx0aCxcbiAgICAgICAgXCJwbGF5ZXIubWFnaWNrYVwiOiBwcm90b2NvbC5wbGF5ZXIubWFnaWNrYSxcbiAgICAgICAgXCJwbGF5ZXIuc3RhbWluYVwiOiBwcm90b2NvbC5wbGF5ZXIuc3RhbWluYSxcbiAgICB9O1xuICAgIHZhciBpbnRzID0ge1xuICAgICAgICBcInBsYXllci5pc19pbl9pbnRlcmlvclwiOiBmbGFnKChfYSA9IHNuYXBzaG90LmxvY2F0aW9uKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuaXNJbnRlcmlvciksXG4gICAgICAgIFwicGxheWVyLmluX2NvbWJhdFwiOiBmbGFnKHByb3RvY29sLmNvbWJhdFN0YXRlID4gMCB8fCAoKF9iID0gc25hcHNob3QucGxheWVyKSA9PT0gbnVsbCB8fCBfYiA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2IuY29tYmF0LmlzSW5Db21iYXQpKSxcbiAgICAgICAgXCJwbGF5ZXIuaW5fZGlhbG9ndWVcIjogZmxhZyhzbmFwc2hvdC5uZWFyYnlOcGNzLnNvbWUoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4uaXNJbkRpYWxvZ3VlOyB9KSksXG4gICAgICAgIFwicGxheWVyLmlzX3J1bm5pbmdcIjogZmxhZygoX2MgPSBzbmFwc2hvdC5wbGF5ZXIpID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5tb3ZlbWVudC5pc1J1bm5pbmcpLFxuICAgICAgICBcInBsYXllci5pc19zbmVha2luZ1wiOiBmbGFnKHByb3RvY29sLnBsYXllci5pc1NuZWFraW5nIHx8ICgoX2QgPSBzbmFwc2hvdC5wbGF5ZXIpID09PSBudWxsIHx8IF9kID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZC5tb3ZlbWVudC5pc1NuZWFraW5nKSksXG4gICAgICAgIFwicGxheWVyLmlzX3N3aW1taW5nXCI6IGZsYWcoKF9lID0gc25hcHNob3QucGxheWVyKSA9PT0gbnVsbCB8fCBfZSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2UubW92ZW1lbnQuaXNTd2ltbWluZyksXG4gICAgICAgIFwicGxheWVyLmlzX3dlYXBvbl9kcmF3blwiOiBmbGFnKChfZiA9IHNuYXBzaG90LnBsYXllcikgPT09IG51bGwgfHwgX2YgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9mLmNvbWJhdC5pc1dlYXBvbkRyYXduKSxcbiAgICAgICAgXCJwbGF5ZXIuaXNfc3R1Y2tcIjogMCxcbiAgICAgICAgXCJwbGF5ZXIub2JzdGFjbGVfZnJvbnRcIjogZmxhZyhzbmFwc2hvdC5jcm9zc2hhaXJUYXJnZXQgIT09IG51bGwgJiZcbiAgICAgICAgICAgIHNuYXBzaG90LmNyb3NzaGFpclRhcmdldC5kaXN0YW5jZSA8PSBPQlNUQUNMRV9GUk9OVF9VTklUUyAmJlxuICAgICAgICAgICAgc25hcHNob3QuY3Jvc3NoYWlyVGFyZ2V0LnR5cGUgIT09IFwiTlBDXCIpLFxuICAgIH07XG4gICAgdmFyIHN0cmluZ3MgPSB7fTtcbiAgICB2YXIgbG9jYXRpb25OYW1lID0gKChfZyA9IHNuYXBzaG90LmxvY2F0aW9uKSA9PT0gbnVsbCB8fCBfZyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2cubG9jYXRpb25OYW1lKSB8fCAoKF9oID0gc25hcHNob3QubG9jYXRpb24pID09PSBudWxsIHx8IF9oID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfaC5jZWxsTmFtZSk7XG4gICAgaWYgKGxvY2F0aW9uTmFtZSlcbiAgICAgICAgc3RyaW5nc1tcInBsYXllci5sb2NhdGlvblwiXSA9IGxvY2F0aW9uTmFtZTtcbiAgICBpZiAoc25hcHNob3QucGxheWVyKSB7XG4gICAgICAgIHN0cmluZ3NbXCJwbGF5ZXIuY29tcGFzc1wiXSA9IGNvbXBhc3NGcm9tQW5nbGVaKHNuYXBzaG90LnBsYXllci5oZWFkaW5nLmFuZ2xlWik7XG4gICAgfVxuICAgIGlmICgoX2ogPSBzbmFwc2hvdC5xdWVzdCkgPT09IG51bGwgfHwgX2ogPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9qLnF1ZXN0TmFtZSlcbiAgICAgICAgc3RyaW5nc1tcInF1ZXN0X2FjdGl2ZVwiXSA9IHNuYXBzaG90LnF1ZXN0LnF1ZXN0TmFtZTtcbiAgICAvLyBDb2V4aXN0ZW5jZSBmbGFnIChXMik6IHdoZW4gdGhlaXIgRVNQIGlzIHByZXNlbnQsIHRoZSBhcHAgc3VwcHJlc3Nlc1xuICAgIC8vIG9iamVjdC9yYWRhciBuYXJyYXRpb24gKHRoZXkgb3duIHRob3NlIGNoYW5uZWxzKSBidXQga2VlcHMgdGFjdGljYWxcbiAgICAvLyByZWZsZXgg4oCUIHNlZSBkb2NzL0FDQ0VTU0lCSUxJVFkubWQgwqc0IGFuZCBBRFIgMDAwMy4gSW5qZWN0ZWQgYnkgdGhlXG4gICAgLy8gY2FsbGVyIChnYW1lIHByb2JlKSBzbyB0aGlzIGJ1aWxkZXIgc3RheXMgcHVyZSBmb3IgdGVzdHMuXG4gICAgaW50c1tcInNreXJpbV9hY2Nlc3MuaW5zdGFsbGVkXCJdID0gZmxhZygoX2sgPSBvcHRpb25zID09PSBudWxsIHx8IG9wdGlvbnMgPT09IHZvaWQgMCA/IHZvaWQgMCA6IG9wdGlvbnMuc2t5cmltQWNjZXNzSW5zdGFsbGVkKSAhPT0gbnVsbCAmJiBfayAhPT0gdm9pZCAwID8gX2sgOiBmYWxzZSk7XG4gICAgdmFyIGxpdmluZyA9IHNuYXBzaG90Lm5lYXJieU5wY3NcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobnBjKSB7IHJldHVybiAhbnBjLmlzRGVhZDsgfSlcbiAgICAgICAgLnNsaWNlKClcbiAgICAgICAgLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEuZGlzdGFuY2UgLSBiLmRpc3RhbmNlOyB9KTtcbiAgICB2YXIgaG9zdGlsZXMgPSBsaXZpbmcuZmlsdGVyKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuIG5wYy5pc0hvc3RpbGU7IH0pO1xuICAgIGludHNbXCJlbmVtaWVzLmNvdW50XCJdID0gaG9zdGlsZXMubGVuZ3RoO1xuICAgIGludHNbXCJucGNzLmNvdW50XCJdID0gbGl2aW5nLmxlbmd0aDtcbiAgICAvLyBXb3JsZCBzY2FubmVyIG91dHB1dCAodjIpLiBBdG9taWMgcHVzaGVzOiBldmVyeSB3b3JsZC5vYmplY3RzLiogYXJyYXlcbiAgICAvLyBpcyB3cml0dGVuIGZyb20gdGhlIHNhbWUgb2JqZWN0cyBsaXN0IHNvIHBhcmFsbGVsLWFycmF5IGxlbmd0aHMgc3RheVxuICAgIC8vIGluIGxvY2stc3RlcC4gKGNvdW50IGxpdmVzIGluIHRoZSBpbnRzIG1hcCBiZWxvdy4pXG4gICAgdmFyIG9iamVjdHMgPSAoX2wgPSBzbmFwc2hvdC53b3JsZE9iamVjdHMpICE9PSBudWxsICYmIF9sICE9PSB2b2lkIDAgPyBfbCA6IFtdO1xuICAgIHZhciBvYmplY3ROYW1lcyA9IFtdO1xuICAgIHZhciBvYmplY3RDYXRlZ29yaWVzID0gW107XG4gICAgdmFyIG9iamVjdEZsYWdzID0gW107XG4gICAgdmFyIG9iamVjdENvbXBhc3MgPSBbXTtcbiAgICB2YXIgb2JqZWN0RGlzdGFuY2VNID0gW107XG4gICAgdmFyIG9iamVjdERpc3RhbmNlVSA9IFtdO1xuICAgIHZhciBvYmplY3RJZCA9IFtdO1xuICAgIHZhciBvYmplY3RCZWFyaW5nID0gW107XG4gICAgdmFyIG9iamVjdExvY2tMZXZlbCA9IFtdO1xuICAgIHZhciBvYmplY3REeiA9IFtdO1xuICAgIGZvciAodmFyIF9pID0gMCwgb2JqZWN0c18xID0gb2JqZWN0czsgX2kgPCBvYmplY3RzXzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBvYmplY3QgPSBvYmplY3RzXzFbX2ldO1xuICAgICAgICBvYmplY3ROYW1lcy5wdXNoKG9iamVjdC5uYW1lKTtcbiAgICAgICAgb2JqZWN0Q2F0ZWdvcmllcy5wdXNoKG9iamVjdC5jYXRlZ29yeSk7XG4gICAgICAgIG9iamVjdEZsYWdzLnB1c2gob2JqZWN0LmZsYWdzLmpvaW4oXCJ8XCIpKTtcbiAgICAgICAgb2JqZWN0Q29tcGFzcy5wdXNoKGNvbXBhc3NGcm9tQW5nbGVaKG9iamVjdC5iZWFyaW5nRGVnKSk7XG4gICAgICAgIG9iamVjdERpc3RhbmNlTS5wdXNoKG9iamVjdC5kaXN0YW5jZSAvIFVOSVRTX1BFUl9NRVRFUik7XG4gICAgICAgIG9iamVjdERpc3RhbmNlVS5wdXNoKG9iamVjdC5kaXN0YW5jZSk7XG4gICAgICAgIG9iamVjdElkLnB1c2gob2JqZWN0LmZvcm1JZCk7XG4gICAgICAgIG9iamVjdEJlYXJpbmcucHVzaChvYmplY3QuYmVhcmluZ0RlZyk7XG4gICAgICAgIG9iamVjdExvY2tMZXZlbC5wdXNoKG9iamVjdC5sb2NrTGV2ZWwpO1xuICAgICAgICBvYmplY3REei5wdXNoKG9iamVjdC5keik7XG4gICAgfVxuICAgIHZhciBpbnZlbnRvcnkgPSAoX20gPSBzbmFwc2hvdC5pbnZlbnRvcnlJdGVtcykgIT09IG51bGwgJiYgX20gIT09IHZvaWQgMCA/IF9tIDogW107XG4gICAgdmFyIGZsb2F0TGlzdCA9IHtcbiAgICAgICAgXCJucGNzLmRpc3RhbmNlX21cIjogbGl2aW5nLm1hcChmdW5jdGlvbiAobnBjKSB7IHJldHVybiBucGMuZGlzdGFuY2UgLyBVTklUU19QRVJfTUVURVI7IH0pLFxuICAgICAgICBcIndvcmxkLm9iamVjdHMuZGlzdGFuY2VfbVwiOiBvYmplY3REaXN0YW5jZU0sXG4gICAgICAgIFwid29ybGQub2JqZWN0cy5kaXN0YW5jZV91XCI6IG9iamVjdERpc3RhbmNlVSxcbiAgICAgICAgXCJ3b3JsZC5vYmplY3RzLmZvcm1faWRcIjogb2JqZWN0SWQsXG4gICAgICAgIFwid29ybGQub2JqZWN0cy5iZWFyaW5nX2RlZ1wiOiBvYmplY3RCZWFyaW5nLFxuICAgICAgICBcIndvcmxkLm9iamVjdHMubG9ja19sZXZlbFwiOiBvYmplY3RMb2NrTGV2ZWwsXG4gICAgICAgIFwid29ybGQub2JqZWN0cy5kelwiOiBvYmplY3REeixcbiAgICB9O1xuICAgIHZhciBzdHJpbmdMaXN0ID0ge1xuICAgICAgICBcIm5wY3MubmFtZVwiOiBsaXZpbmcubWFwKGZ1bmN0aW9uIChucGMpIHsgcmV0dXJuIG5wYy5uYW1lOyB9KSxcbiAgICAgICAgXCJucGNzLmNsb2NrXCI6IGxpdmluZy5tYXAoZnVuY3Rpb24gKG5wYykgeyByZXR1cm4gY2xvY2tGcm9tSGVhZGluZ0FuZ2xlKG5wYy5oZWFkaW5nQW5nbGUpOyB9KSxcbiAgICAgICAgXCJ3b3JsZC5vYmplY3RzLm5hbWVcIjogb2JqZWN0TmFtZXMsXG4gICAgICAgIFwid29ybGQub2JqZWN0cy5jYXRlZ29yeVwiOiBvYmplY3RDYXRlZ29yaWVzLFxuICAgICAgICBcIndvcmxkLm9iamVjdHMuZmxhZ3NcIjogb2JqZWN0RmxhZ3MsXG4gICAgICAgIFwid29ybGQub2JqZWN0cy5jb21wYXNzXCI6IG9iamVjdENvbXBhc3MsXG4gICAgICAgIC8vIEFjdGl2ZSBwbGF5ZXIgZWZmZWN0cyAoVzQpIOKAlCBzb3J0ZWQsIGRlZHVwZWQgYnkgdGhlIHRyYWNrZXIuXG4gICAgICAgIFwiZWZmZWN0cy5hY3RpdmVcIjogKF9vID0gc25hcHNob3QuZWZmZWN0cykgIT09IG51bGwgJiYgX28gIT09IHZvaWQgMCA/IF9vIDogW10sXG4gICAgfTtcbiAgICBpZiAoaW52ZW50b3J5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgaW50c1tcImludmVudG9yeS5zaXplXCJdID0gaW52ZW50b3J5Lmxlbmd0aDtcbiAgICAgICAgZmxvYXRMaXN0W1wiaW52ZW50b3J5LmNvdW50XCJdID0gaW52ZW50b3J5Lm1hcChmdW5jdGlvbiAocm93KSB7IHJldHVybiByb3cuY291bnQ7IH0pO1xuICAgICAgICBmbG9hdExpc3RbXCJpbnZlbnRvcnkuZm9ybV9pZFwiXSA9IGludmVudG9yeS5tYXAoZnVuY3Rpb24gKHJvdykgeyByZXR1cm4gcm93LmZvcm1JZDsgfSk7XG4gICAgICAgIHN0cmluZ0xpc3RbXCJpbnZlbnRvcnkubmFtZVwiXSA9IGludmVudG9yeS5tYXAoZnVuY3Rpb24gKHJvdykgeyByZXR1cm4gcm93Lm5hbWU7IH0pO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBmbG9hdDogX19hc3NpZ24oX19hc3NpZ24oe30sIGZsb2F0cyksIHsgXCJkdW1wLnRpbWVzdGFtcFwiOiBEYXRlLm5vdygpIH0pLFxuICAgICAgICBpbnQ6IF9fYXNzaWduKF9fYXNzaWduKHt9LCBpbnRzKSwgeyBcImR1bXAudmVyc2lvblwiOiBEVU1QX1ZFUlNJT04sIFwid29ybGQub2JqZWN0cy5jb3VudFwiOiBvYmplY3RzLmxlbmd0aCB9KSxcbiAgICAgICAgc3RyaW5nOiBzdHJpbmdzLFxuICAgICAgICBmbG9hdExpc3Q6IGZsb2F0TGlzdCxcbiAgICAgICAgc3RyaW5nTGlzdDogc3RyaW5nTGlzdCxcbiAgICB9O1xufVxuIiwidmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbmZ1bmN0aW9uIG5vcm1hbGl6ZUV2ZW50VHlwZShldmVudFR5cGUpIHtcbiAgICBpZiAoZXZlbnRUeXBlID09PSBcImhpdFwiKVxuICAgICAgICByZXR1cm4gXCJoaXRcIjtcbiAgICBpZiAoZXZlbnRUeXBlID09PSBcInRpY2tcIilcbiAgICAgICAgcmV0dXJuIFwidGlja1wiO1xuICAgIGlmIChldmVudFR5cGUuc3RhcnRzV2l0aChcImNvbWJhdFN0YXRlXCIpKVxuICAgICAgICByZXR1cm4gXCJjb21iYXRTdGF0ZVwiO1xuICAgIHJldHVybiBcImFuaW1hdGlvblwiO1xufVxuLyoqXG4gKiBTaW5nbGUgb3V0Ym91bmQgcGF5bG9hZCBmb3JtYXQ6IHNreWRpdmUtYXBwIHByb3RvY29sLlxuICogVGhlIGV4dHJhIGBkYXRhYCBmaWVsZHMgKGhlYWRpbmdBbmdsZVosIGlzU3R1Y2ssIG5hdmlnYXRpb24sIHVpKSBhcmVcbiAqIHByb3RvY29sLXYxIEFERElUSVZFIGV4dGVuc2lvbnMg4oCUIGBnYW1lLXN0YXRlLnBvc3QudHNgIHZhbGlkYXRlcyBvbmx5IHRoZVxuICogZW52ZWxvcGUsIGFuZCB0aGUgYXBwIHRvbGVyYXRlcyBhYnNlbnQgZmllbGRzIChvbGQgcGx1Z2lucyBrZWVwIHdvcmtpbmc7XG4gKiBKU09OLnN0cmluZ2lmeSBkcm9wcyB1bmRlZmluZWQpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplU3RhdGUoc3RhdGUsIHByaW9yaXR5KSB7XG4gICAgdmFyIF9hLCBfYiwgX2M7XG4gICAgdmFyIHBheWxvYWQgPSB7XG4gICAgICAgIHByb3RvY29sVmVyc2lvbjogMSxcbiAgICAgICAgcHJpb3JpdHk6IHByaW9yaXR5LFxuICAgICAgICBzb3VyY2U6IFwic2t5Z3VpZGVcIixcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgcGxheWVyOiBzdGF0ZS5wbGF5ZXIsXG4gICAgICAgICAgICBjb21iYXRTdGF0ZTogc3RhdGUuY29tYmF0U3RhdGUsXG4gICAgICAgICAgICBlbmVtaWVzOiBzdGF0ZS5lbmVtaWVzLm1hcChmdW5jdGlvbiAoZW5lbXkpIHsgcmV0dXJuIChfX2Fzc2lnbihfX2Fzc2lnbih7fSwgZW5lbXkpLCB7IGFuaW1hdGlvbjogXCJcIiB9KSk7IH0pLFxuICAgICAgICAgICAgcGxheWVyQW5pbWF0aW9uOiBzdGF0ZS5wbGF5ZXJBbmltYXRpb24sXG4gICAgICAgICAgICBldmVudFR5cGU6IG5vcm1hbGl6ZUV2ZW50VHlwZShzdGF0ZS5ldmVudFR5cGUpLFxuICAgICAgICAgICAgaGVhZGluZ0FuZ2xlWjogc3RhdGUuaGVhZGluZ0FuZ2xlWixcbiAgICAgICAgICAgIGlzU3R1Y2s6IChfYSA9IHN0YXRlLmlzU3R1Y2spICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IGZhbHNlLFxuICAgICAgICAgICAgc3R1Y2tSZWxEZWc6IHN0YXRlLnN0dWNrUmVsRGVnLFxuICAgICAgICAgICAgbmF2aWdhdGlvbjogKF9iID0gc3RhdGUubmF2aWdhdGlvbikgIT09IG51bGwgJiYgX2IgIT09IHZvaWQgMCA/IF9iIDogeyBzdGF0dXM6IFwiaWRsZVwiIH0sXG4gICAgICAgICAgICB1aTogKF9jID0gc3RhdGUudWkpICE9PSBudWxsICYmIF9jICE9PSB2b2lkIDAgPyBfYyA6IHsgbWVudU9wZW46IGZhbHNlLCBjb25zb2xlT3BlbjogZmFsc2UgfSxcbiAgICAgICAgICAgIG1lbnU6IHN0YXRlLm1lbnUsXG4gICAgICAgIH0sXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxuICAgIH07XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHBheWxvYWQpO1xufVxuIiwiaW1wb3J0IHsgR2FtZSwgcHJpbnRDb25zb2xlIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG4vKipcbiAqIFNreXJpbSBBY2Nlc3MgY29leGlzdGVuY2UgZGV0ZWN0aW9uIChXMiAvIGRvY3MvQUNDRVNTSUJJTElUWS5tZCDCpzQpLlxuICpcbiAqIFN0YW5kYWxvbmUtZmlyc3QgbWVhbnMgU2t5R3VpZGUgd29ya3Mgd2hlbiBTa3lyaW0gQWNjZXNzIGlzIEFCU0VOVCDigJQgbm90XG4gKiB0aGF0IGl0IHNob3VsZCBzcGVhayBvdmVyIGl0IHdoZW4gcHJlc2VudC4gVGhlaXIgb2JqZWN0IHNjYW5uZXIgYW5kXG4gKiBhbWJpZW50IHJhZGFyIG93biB0aG9zZSBjaGFubmVscyAoTmV4dXMgMTgxMTMxKTsgd2hlbiB0aGVpciBFU1AgaXNcbiAqIGluc3RhbGxlZCwgdGhlIGFwcCBzdXBwcmVzc2VzIG91ciBvYmplY3QvcmFkYXIgYW5ub3VuY2VtZW50cyBhbmQga2VlcHNcbiAqIHRhY3RpY2FsIHJlZmxleCBvbmx5LlxuICpcbiAqIGBHYW1lLmlzUGx1Z2luSW5zdGFsbGVkYCBpcyB0aGUgcm9idXN0IHByb2JlIChubyBmb3JtLWlkIGd1ZXNzd29yayk7XG4gKiBgZ2V0Rm9ybUZyb21GaWxlKDB4MTNBNkJELCBcIlNreXJpbUFjY2Vzcy5lc3BcIilgIHN0YXlzIGFzIHRoZSBkb2N1bWVudGVkXG4gKiBmYWxsYmFjay4gRGV0ZWN0aW9uIGlzIGNhY2hlZCDigJQgcGx1Z2luIGxvYWQgb3JkZXIgY2Fubm90IGNoYW5nZSBtaWQtc2Vzc2lvbi5cbiAqL1xudmFyIFNLWVJJTV9BQ0NFU1NfRVNQID0gXCJTa3lyaW1BY2Nlc3MuZXNwXCI7XG52YXIgZGV0ZWN0ZWQgPSBudWxsO1xuZnVuY3Rpb24gcHJvYmVQbHVnaW5JbnN0YWxsZWQoKSB7XG4gICAgdmFyIF9hO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAoX2EgPSBHYW1lLmlzUGx1Z2luSW5zdGFsbGVkKFNLWVJJTV9BQ0NFU1NfRVNQKSkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogZmFsc2U7XG4gICAgfVxuICAgIGNhdGNoIChfYikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5mdW5jdGlvbiBwcm9iZUZvcm1Gcm9tRmlsZSgpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gR2FtZS5nZXRGb3JtRnJvbUZpbGUoMHgxM2E2YmQsIFNLWVJJTV9BQ0NFU1NfRVNQKSAhPT0gbnVsbDtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG4vKiogQ2FjaGVkIGRldGVjdGlvbjogdHJ1ZSA9IGRlZmVyIHdvcmxkLW9iamVjdC9yYWRhciBuYXJyYXRpb24gdG8gdGhlbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NreXJpbUFjY2Vzc0luc3RhbGxlZCgpIHtcbiAgICB2YXIgX2E7XG4gICAgaWYgKGRldGVjdGVkICE9PSBudWxsKVxuICAgICAgICByZXR1cm4gZGV0ZWN0ZWQ7XG4gICAgZGV0ZWN0ZWQgPSAoX2EgPSBwcm9iZVBsdWdpbkluc3RhbGxlZCgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiBwcm9iZUZvcm1Gcm9tRmlsZSgpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gU2t5cmltQWNjZXNzLmVzcCBkZXRlY3RlZDogXCIuY29uY2F0KGRldGVjdGVkKSk7XG4gICAgfVxuICAgIHJldHVybiBkZXRlY3RlZDtcbn1cbi8qKiBUZXN0IHNlYW0uICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTa3lyaW1BY2Nlc3NEZXRlY3Rpb24oKSB7XG4gICAgZGV0ZWN0ZWQgPSBudWxsO1xufVxuIiwidmFyIHJ1bnRpbWUgPSBnbG9iYWxUaGlzO1xuaWYgKCFydW50aW1lLnNreXJpbVBsYXRmb3JtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdza3lyaW1QbGF0Zm9ybSBnbG9iYWwgaXMgbm90IGF2YWlsYWJsZScpO1xufVxudmFyIHNreXJpbVBsYXRmb3JtID0gcnVudGltZS5za3lyaW1QbGF0Zm9ybTtcbmV4cG9ydCB2YXIgb25jZSA9IHNreXJpbVBsYXRmb3JtLm9uY2UsIG9uID0gc2t5cmltUGxhdGZvcm0ub24sIHByaW50Q29uc29sZSA9IHNreXJpbVBsYXRmb3JtLnByaW50Q29uc29sZSwgd3JpdGVMb2dzID0gc2t5cmltUGxhdGZvcm0ud3JpdGVMb2dzLCBEZWJ1ZyA9IHNreXJpbVBsYXRmb3JtLkRlYnVnLCBob29rcyA9IHNreXJpbVBsYXRmb3JtLmhvb2tzLCBmaW5kQ29uc29sZUNvbW1hbmQgPSBza3lyaW1QbGF0Zm9ybS5maW5kQ29uc29sZUNvbW1hbmQsIE9iamVjdFJlZmVyZW5jZSA9IHNreXJpbVBsYXRmb3JtLk9iamVjdFJlZmVyZW5jZSwgQWN0b3IgPSBza3lyaW1QbGF0Zm9ybS5BY3RvciwgSHR0cENsaWVudCA9IHNreXJpbVBsYXRmb3JtLkh0dHBDbGllbnQsIFVpID0gc2t5cmltUGxhdGZvcm0uVWksIEdhbWUgPSBza3lyaW1QbGF0Zm9ybS5HYW1lLCBJbnB1dCA9IHNreXJpbVBsYXRmb3JtLklucHV0LCBEeFNjYW5Db2RlID0gc2t5cmltUGxhdGZvcm0uRHhTY2FuQ29kZSwgRm9ybVR5cGUgPSBza3lyaW1QbGF0Zm9ybS5Gb3JtVHlwZSwgVXRpbGl0eSA9IHNreXJpbVBsYXRmb3JtLlV0aWxpdHksIFdlYXRoZXIgPSBza3lyaW1QbGF0Zm9ybS5XZWF0aGVyLCBicm93c2VyID0gc2t5cmltUGxhdGZvcm0uYnJvd3NlciwgZ2V0UGxhdGZvcm1WZXJzaW9uID0gc2t5cmltUGxhdGZvcm0uZ2V0UGxhdGZvcm1WZXJzaW9uLCBRdWVzdCA9IHNreXJpbVBsYXRmb3JtLlF1ZXN0LCBzdG9yYWdlID0gc2t5cmltUGxhdGZvcm0uc3RvcmFnZTtcbmV4cG9ydCBkZWZhdWx0IHNreXJpbVBsYXRmb3JtO1xuIiwiaW1wb3J0IHsgb24sIHByaW50Q29uc29sZSB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG52YXIgdGltZXJzID0gbmV3IE1hcCgpO1xudmFyIG5leHRUaW1lcklkID0gMTtcbnZhciBsYXN0RnJhbWVBdCA9IDA7XG52YXIgcHVtcEluc3RhbGxlZCA9IGZhbHNlO1xuZnVuY3Rpb24gcHVtcCgpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZWxhcHNlZCA9IGxhc3RGcmFtZUF0ID09PSAwID8gMCA6IG5vdyAtIGxhc3RGcmFtZUF0O1xuICAgIGxhc3RGcmFtZUF0ID0gbm93O1xuICAgIGlmICh0aW1lcnMuc2l6ZSA9PT0gMClcbiAgICAgICAgcmV0dXJuO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBBcnJheS5mcm9tKHRpbWVycy52YWx1ZXMoKSk7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciB0aW1lciA9IF9hW19pXTtcbiAgICAgICAgdGltZXIucmVtYWluaW5nTXMgLT0gZWxhcHNlZDtcbiAgICAgICAgaWYgKHRpbWVyLnJlbWFpbmluZ01zID4gMClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICBpZiAodGltZXIuaW50ZXJ2YWxNcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gUmUtYXJtIGZpcnN0IHNvIHRoZSBjYWxsYmFjayBjYW4gY2xlYXIvcmVwbGFjZSBpdHNlbGYgc2FmZWx5LlxuICAgICAgICAgICAgdGltZXIucmVtYWluaW5nTXMgPSB0aW1lci5pbnRlcnZhbE1zO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aW1lci5jYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIC8vIE5ldmVyIGxldCBvbmUgdGltZXIgYnJlYWsgdGhlIHB1bXA7IHVwZGF0ZSBoYW5kbGVycyBydW4gZXZlcnkgZnJhbWUuXG4gICAgICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBnYW1lLXRpbWVyIGNhbGxiYWNrIGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICB0aW1lcnMuZGVsZXRlKHRpbWVyLmlkKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRpbWVyLmNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBnYW1lLXRpbWVyIGNhbGxiYWNrIGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBpbnN0YWxsUHVtcCgpIHtcbiAgICBpZiAocHVtcEluc3RhbGxlZClcbiAgICAgICAgcmV0dXJuO1xuICAgIHB1bXBJbnN0YWxsZWQgPSB0cnVlO1xuICAgIG9uKFwidXBkYXRlXCIsIHB1bXApO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldEdhbWVUaW1lb3V0KGNhbGxiYWNrLCB0aW1lb3V0TXMpIHtcbiAgICBpbnN0YWxsUHVtcCgpO1xuICAgIHZhciBpZCA9IG5leHRUaW1lcklkKys7XG4gICAgdGltZXJzLnNldChpZCwge1xuICAgICAgICBpZDogaWQsXG4gICAgICAgIGNhbGxiYWNrOiBjYWxsYmFjayxcbiAgICAgICAgcmVtYWluaW5nTXM6IE1hdGgubWF4KDAsIHRpbWVvdXRNcyksXG4gICAgICAgIGludGVydmFsTXM6IG51bGwsXG4gICAgfSk7XG4gICAgcmV0dXJuIGlkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldEdhbWVJbnRlcnZhbChjYWxsYmFjaywgaW50ZXJ2YWxNcykge1xuICAgIGluc3RhbGxQdW1wKCk7XG4gICAgdmFyIGlkID0gbmV4dFRpbWVySWQrKztcbiAgICB0aW1lcnMuc2V0KGlkLCB7XG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrLFxuICAgICAgICByZW1haW5pbmdNczogTWF0aC5tYXgoMCwgaW50ZXJ2YWxNcyksXG4gICAgICAgIGludGVydmFsTXM6IE1hdGgubWF4KDAsIGludGVydmFsTXMpLFxuICAgIH0pO1xuICAgIHJldHVybiBpZDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjbGVhckdhbWVUaW1lb3V0KGlkKSB7XG4gICAgdGltZXJzLmRlbGV0ZShpZCk7XG59XG5leHBvcnQgZnVuY3Rpb24gY2xlYXJHYW1lSW50ZXJ2YWwoaWQpIHtcbiAgICB0aW1lcnMuZGVsZXRlKGlkKTtcbn1cbiIsImltcG9ydCB7IEdhbWUsIFF1ZXN0LCBzdG9yYWdlLCBvbiwgcHJpbnRDb25zb2xlLCB9IGZyb20gXCIuLi9za3lyaW1QbGF0Zm9ybVwiO1xuaW1wb3J0IHsgbG9nRGlhZyB9IGZyb20gXCIuLi9kaWFnXCI7XG5pbXBvcnQgeyBDT05GSUcgfSBmcm9tIFwiLi4vY29uZmlnXCI7XG5pbXBvcnQgeyBnZXRXb3JsZE9iamVjdHMgfSBmcm9tIFwiLi4vZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL3dvcmxkLXNjYW5uZXJcIjtcbmltcG9ydCB7IEFVVE9XQUxLX0FDS19FVkVOVCwgQVVUT1dBTEtfQVJSSVZFRF9FVkVOVCwgQVVUT1dBTEtfQ0FOQ0VMX0VWRU5ULCBBVVRPV0FMS19DTURfRVZFTlQsIEFVVE9XQUxLX1JFQURZX0VWRU5ULCBjYW5UcmFuc2l0aW9uLCBlbmNvZGVBdXRvd2Fsa0NvbW1hbmQsIH0gZnJvbSBcIi4vbmF2aWdhdGlvbi1jb3JlXCI7XG4vKipcbiAqIEF1dG93YWxrIGJyaWRnZSAoVzYpIOKAlCB0aGUgSlMgaGFsZiBvZiB0aGUgdHdvLXJ1bnRpbWUgaGFuZHNoYWtlLiBUaGUgRVNQXG4gKiAoQ0stYnVpbHQsIHNlZSBlc3AvUkVBRE1FLm1kKSBvd25zIHRoZSBxdWVzdCwgdGhlIFRyYXZlbCBwYWNrYWdlIGFuZFxuICogUGFweXJ1cyBleGVjdXRpb247IEpTIGRlY2lkZXMgV0hFUkUgYW5kIHdhdGNoZXMgZm9yIGNhbmNlbGxhdGlvbi5cbiAqXG4gKiBDb250cmFjdCAoc2VlIG5hdmlnYXRpb24tY29yZS50cyArIHBsYW4gVzYpOlxuICogIC0gSlMg4oaSIEVTUDogYHF1ZXN0UmVmLnNlbmRNb2RFdmVudChDbWRFdmVudCwganNvblN0ckFyZywgMClgIHdoZXJlIHRoZVxuICogICAgSlNPTiBjYXJyaWVzIHtmOiBoZXhGb3JtSWQsIGQ6IHN0b3BEaXN0YW5jZX0gKG51bUFyZyBpcyBmbG9hdDMyKS5cbiAqICAtIEVTUCDihpIgSlM6IEFjayAvIEFycml2ZWQgLyAoQ2FuY2VsRWNobykgbW9kIGV2ZW50cy5cbiAqICAtIENsZWFudXAgb2YgYFNldFBsYXllckFJRHJpdmVuKGZhbHNlKWAgb246IGRlYXRoU3RhcnQsIGxvYWRHYW1lLFxuICogICAgZmFzdFRyYXZlbEVuZCwgZGlhbG9ndWUgbWVudSwgV0FTRCBjYW5jZWwsIGhhcmQgdGltZW91dCwgYW5kIEhPVFxuICogICAgUkVMT0FEIOKAlCB0aGUgZW5naW5lIGZsYWcgc3Vydml2ZXMgSlMgcmVsb2FkcywgdHJhY2tlZCBpbiBgc3Auc3RvcmFnZWAuXG4gKiAgLSAycyBhY2sgdGltZW91dCAoSFRUUC10aW1lb3V0IHN0YXRlLW1hY2hpbmUgcGF0dGVybik6IGEgbWlzc2luZy9icm9rZW5cbiAqICAgIEVTUCBmYWlscyB0aGUgY29tbWFuZCBpbnN0ZWFkIG9mIGhhbmdpbmcgdGhlIHN0YXR1cyBvbiBcIndhbGtpbmdcIi5cbiAqL1xudmFyIEFJX0RSSVZFTl9TVE9SQUdFX0tFWSA9IFwic2t5Z3VpZGUuYWlEcml2ZW5CeVVzXCI7XG52YXIgc3RhdGUgPSB7XG4gICAgc3RhdHVzOiBcImlkbGVcIixcbiAgICBkcml2aW5nQnlVczogZmFsc2UsXG4gICAgcGVuZGluZ0Fja0RlYWRsaW5lOiAwLFxuICAgIGVzcFF1ZXN0OiBudWxsLFxufTtcbnZhciBpbml0aWFsaXplZCA9IGZhbHNlO1xuZnVuY3Rpb24gZGVidWdMb2cobWVzc2FnZSkge1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIlthdXRvd2Fsa10gXCIuY29uY2F0KG1lc3NhZ2UpKTtcbiAgICB9XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uKHRvKSB7XG4gICAgaWYgKCFjYW5UcmFuc2l0aW9uKHN0YXRlLnN0YXR1cywgdG8pKSB7XG4gICAgICAgIGRlYnVnTG9nKFwiaWxsZWdhbCB0cmFuc2l0aW9uIFwiLmNvbmNhdChzdGF0ZS5zdGF0dXMsIFwiIFxcdTIxOTIgXCIpLmNvbmNhdCh0bywgXCIgXFx1MjAxNCBpZ25vcmVkXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzdGF0ZS5zdGF0dXMgPSB0bztcbn1cbmZ1bmN0aW9uIHNldFBsYXllckFpRHJpdmVuKGRyaXZlbikge1xuICAgIHRyeSB7XG4gICAgICAgIEdhbWUuc2V0UGxheWVyQUlEcml2ZW4oZHJpdmVuKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBkZWJ1Z0xvZyhcInNldFBsYXllckFJRHJpdmVuKFwiLmNvbmNhdChTdHJpbmcoZHJpdmVuKSwgXCIpIGZhaWxlZDogXCIpLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFyRHJpdmluZ0J5VXMoKSB7XG4gICAgaWYgKCFzdGF0ZS5kcml2aW5nQnlVcylcbiAgICAgICAgcmV0dXJuO1xuICAgIHN0YXRlLmRyaXZpbmdCeVVzID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgZGVsZXRlIHN0b3JhZ2VbQUlfRFJJVkVOX1NUT1JBR0VfS0VZXTtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIC8vIHN0b3JhZ2UgdW5hdmFpbGFibGUgKHNob3VsZCBub3QgaGFwcGVuIGluLWdhbWUpXG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbEF1dG93YWxrKHJlYXNvbiwgYW5ub3VuY2UpIHtcbiAgICBpZiAoYW5ub3VuY2UgPT09IHZvaWQgMCkgeyBhbm5vdW5jZSA9IHRydWU7IH1cbiAgICBpZiAoc3RhdGUuc3RhdHVzICE9PSBcIndhbGtpbmdcIilcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChhbm5vdW5jZSAmJiBzdGF0ZS5lc3BRdWVzdCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc3RhdGUuZXNwUXVlc3Quc2VuZE1vZEV2ZW50KEFVVE9XQUxLX0NBTkNFTF9FVkVOVCwgXCJcIiwgMCk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgICAgICAvLyBFU1AgbWF5IGJlIGdvbmUg4oCUIGxvY2FsIGNsZWFudXAgc3RpbGwgYXBwbGllcy5cbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRQbGF5ZXJBaURyaXZlbihmYWxzZSk7XG4gICAgY2xlYXJEcml2aW5nQnlVcygpO1xuICAgIHRyYW5zaXRpb24ocmVhc29uKTtcbiAgICBzdGF0ZS5wZW5kaW5nQWNrRGVhZGxpbmUgPSAwO1xuICAgIGRlYnVnTG9nKFwiY2FuY2VsbGVkL2ZhaWxlZCBcXHUyMTkyIFwiLmNvbmNhdChyZWFzb24pKTtcbn1cbi8qKiBDYWxsZWQgZXZlcnkgY29sbGVjdGlvbiBwYXNzIOKAlCBXQVNEIGNhbmNlbCB3YXRjaCArIGFjayB0aW1lb3V0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGF1dG93YWxrSW5wdXRUaWNrKGtleXNQcmVzc2VkLCBleGNsdWRlZCkge1xuICAgIGlmIChzdGF0ZS5zdGF0dXMgIT09IFwid2Fsa2luZ1wiKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKHN0YXRlLnBlbmRpbmdBY2tEZWFkbGluZSAhPT0gMCAmJiBEYXRlLm5vdygpID4gc3RhdGUucGVuZGluZ0Fja0RlYWRsaW5lKSB7XG4gICAgICAgIC8vIEVTUCBuZXZlciBhY2tlZCDigJQgZmFpbCB0aGUgY29tbWFuZCwgcmVzdG9yZSBwbGF5ZXIgY29udHJvbC5cbiAgICAgICAgY2FuY2VsQXV0b3dhbGsoXCJmYWlsZWRcIiwgZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChleGNsdWRlZClcbiAgICAgICAgcmV0dXJuOyAvLyBkaWFsb2d1ZS9tZW51IGhhbmRsZWQgYnkgdGhlaXIgb3duIGNhbmNlbCBob29rc1xuICAgIHZhciBtb3ZlbWVudEtleSA9IGtleXNQcmVzc2VkLnNvbWUoZnVuY3Rpb24gKGtleSkgeyByZXR1cm4ga2V5ID09PSBcIldcIiB8fCBrZXkgPT09IFwiQVwiIHx8IGtleSA9PT0gXCJTXCIgfHwga2V5ID09PSBcIkRcIjsgfSk7XG4gICAgaWYgKG1vdmVtZW50S2V5KSB7XG4gICAgICAgIGRlYnVnTG9nKFwibW92ZW1lbnQga2V5IGR1cmluZyBhdXRvd2FsayDigJQgY2FuY2VsbGluZ1wiKTtcbiAgICAgICAgY2FuY2VsQXV0b3dhbGsoXCJjYW5jZWxsZWRcIik7XG4gICAgfVxufVxuLyoqIGB7dHlwZTpcImF1dG93YWxrVG9cIiwgZm9ybUlkLCBzdG9wRGlzdGFuY2V9YCBleGVjdXRvciBlbnRyeSBwb2ludC4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXF1ZXN0QXV0b3dhbGsoY29tbWFuZCkge1xuICAgIGlmICghQ09ORklHLmF1dG93YWxrRW5hYmxlZCkge1xuICAgICAgICBkZWJ1Z0xvZyhcImF1dG93YWxrIGRpc2FibGVkIChDT05GSUcpXCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIC8vIFNhbWUgaGFsbHVjaW5hdGlvbiBndWFyZCBhcyBhY3RpdmF0ZXtmb3JtSWR9OiBvbmx5IHNjYW5uZXItc2VlbiB0YXJnZXRzLlxuICAgIHZhciBpbkNhY2hlID0gZ2V0V29ybGRPYmplY3RzKCkuc29tZShmdW5jdGlvbiAob2JqZWN0KSB7IHJldHVybiBvYmplY3QuZm9ybUlkID09PSBjb21tYW5kLmZvcm1JZDsgfSk7XG4gICAgaWYgKCFpbkNhY2hlKSB7XG4gICAgICAgIGRlYnVnTG9nKFwiYXV0b3dhbGsgYmxvY2tlZDogZm9ybUlkIFwiLmNvbmNhdChjb21tYW5kLmZvcm1JZCwgXCIgbm90IGluIHNjYW5uZXIgY2FjaGVcIikpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmICghc3RhdGUuZXNwUXVlc3QpIHtcbiAgICAgICAgLy8gU2t5R3VpZGUuZXNwIGFic2VudCwgb3IgaW5zdGFsbGVkLWJ1dC1ub3QteWV0LVJlYWR5IChPbkluaXQgbm90IHNlZW4pLlxuICAgICAgICB0cmFuc2l0aW9uKFwiZmFpbGVkXCIpO1xuICAgICAgICBkZWJ1Z0xvZyhcImF1dG93YWxrIGJsb2NrZWQ6IEVTUCBxdWVzdCBub3QgUmVhZHkgKG5vIFNreUd1aWRlX0F1dG9XYWxrUmVhZHkgeWV0KVwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBzdGF0ZS5lc3BRdWVzdC5zZW5kTW9kRXZlbnQoQVVUT1dBTEtfQ01EX0VWRU5ULCBlbmNvZGVBdXRvd2Fsa0NvbW1hbmQoY29tbWFuZCksIDApO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRyYW5zaXRpb24oXCJmYWlsZWRcIik7XG4gICAgICAgIGRlYnVnTG9nKFwic2VuZE1vZEV2ZW50IGZhaWxlZDogXCIuY29uY2F0KFN0cmluZyhlcnIpKSk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdHJhbnNpdGlvbihcIndhbGtpbmdcIik7XG4gICAgc3RhdGUuZHJpdmluZ0J5VXMgPSB0cnVlO1xuICAgIHRyeSB7XG4gICAgICAgIHN0b3JhZ2VbQUlfRFJJVkVOX1NUT1JBR0VfS0VZXSA9IHRydWU7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICAvLyBzdG9yYWdlIHVuYXZhaWxhYmxlIOKAlCBob3QtcmVsb2FkIGd1YXJkIGRlZ3JhZGVzIHRvIGJlc3QtZWZmb3J0XG4gICAgfVxuICAgIHN0YXRlLnBlbmRpbmdBY2tEZWFkbGluZSA9IERhdGUubm93KCkgKyBDT05GSUcuYXV0b3dhbGtBY2tUaW1lb3V0TXM7XG4gICAgZGVidWdMb2coXCJhdXRvd2FsayByZXF1ZXN0IHNlbnQgKGZvcm1JZCBcIi5jb25jYXQoY29tbWFuZC5mb3JtSWQsIFwiLCBzdG9wIFwiKS5jb25jYXQoY29tbWFuZC5zdG9wRGlzdGFuY2UsIFwiKVwiKSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0TmF2aWdhdGlvblN0YXR1cygpIHtcbiAgICByZXR1cm4gc3RhdGUuc3RhdHVzO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGluaXRBdXRvd2FsaygpIHtcbiAgICBpZiAoaW5pdGlhbGl6ZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgLy8gSG90LXJlbG9hZCBndWFyZDogdGhlIGVuZ2luZSBBSS1kcml2ZW4gZmxhZyBzdXJ2aXZlcyBKUyByZWxvYWRzLiBJZiBhXG4gICAgLy8gcHJldmlvdXMgVk0gaW5zdGFuY2Ugd2FzIGRyaXZpbmcsIHJlc3RvcmUgcGxheWVyIGNvbnRyb2wgbm93LlxuICAgIHRyeSB7XG4gICAgICAgIGlmIChzdG9yYWdlW0FJX0RSSVZFTl9TVE9SQUdFX0tFWV0gPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNldFBsYXllckFpRHJpdmVuKGZhbHNlKTtcbiAgICAgICAgICAgIGRlbGV0ZSBzdG9yYWdlW0FJX0RSSVZFTl9TVE9SQUdFX0tFWV07XG4gICAgICAgICAgICBkZWJ1Z0xvZyhcImhvdC1yZWxvYWQgcmVjb3Zlcnk6IEFJLWRyaXZlbiBmbGFnIGNsZWFyZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIC8vIHN0b3JhZ2UgdW5hdmFpbGFibGUgKG5vbi1nYW1lIGNvbnRleHQpXG4gICAgfVxuICAgIG9uKFwibW9kRXZlbnRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5ldmVudE5hbWUgPT09IEFVVE9XQUxLX1JFQURZX0VWRU5UKSB7XG4gICAgICAgICAgICAvLyBFU1AgYW5ub3VuY2U6IGBzZW5kZXJgIGlzIHRoZSBxdWVzdCBmb3JtIGl0c2VsZiAoUGFweXJ1cyBTZW5kTW9kRXZlbnRcbiAgICAgICAgICAgIC8vIGNhbGxlZCBvbiB0aGUgcXVlc3QpLiBTdG9yZSB0aGUgcmVmZXJlbmNlIOKAlCBubyBmb3JtLUlEIGhhcmRjb2RpbmcuXG4gICAgICAgICAgICBzdGF0ZS5lc3BRdWVzdCA9IGV2ZW50LnNlbmRlclxuICAgICAgICAgICAgICAgID8gUXVlc3QuZnJvbShldmVudC5zZW5kZXIpXG4gICAgICAgICAgICAgICAgOiBudWxsO1xuICAgICAgICAgICAgLy8gQWx3YXlzIHByaW50ZWQ6IHRoaXMgaXMgdGhlIG9uY2UtcGVyLXNlc3Npb24gRVNQIHdpcmluZyBwcm9vZi5cbiAgICAgICAgICAgIGxvZ0RpYWcoXCJbYXV0b3dhbGtdIEVTUCByZWFkeSBcXHUyMDE0IHF1ZXN0IHN0b3JlZCAoXCIuY29uY2F0KHN0YXRlLmVzcFF1ZXN0ID8gXCJva1wiIDogXCJzZW5kZXIgY2FzdCBmYWlsZWRcIiwgXCIpXCIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuZXZlbnROYW1lID09PSBBVVRPV0FMS19BQ0tfRVZFTlQgJiYgc3RhdGUuc3RhdHVzID09PSBcIndhbGtpbmdcIikge1xuICAgICAgICAgICAgc3RhdGUucGVuZGluZ0Fja0RlYWRsaW5lID0gMDtcbiAgICAgICAgICAgIGRlYnVnTG9nKFwiRVNQIGFjayByZWNlaXZlZFwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXZlbnQuZXZlbnROYW1lID09PSBBVVRPV0FMS19BUlJJVkVEX0VWRU5UICYmIHN0YXRlLnN0YXR1cyA9PT0gXCJ3YWxraW5nXCIpIHtcbiAgICAgICAgICAgIHN0YXRlLnBlbmRpbmdBY2tEZWFkbGluZSA9IDA7XG4gICAgICAgICAgICBzdGF0ZS5kcml2aW5nQnlVcyA9IGZhbHNlO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBkZWxldGUgc3RvcmFnZVtBSV9EUklWRU5fU1RPUkFHRV9LRVldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgICAgICAgICAgLy8gYmVzdC1lZmZvcnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRyYW5zaXRpb24oXCJhcnJpdmVkXCIpO1xuICAgICAgICAgICAgZGVidWdMb2coXCJhcnJpdmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgb24oXCJkZWF0aFN0YXJ0XCIsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIGNhbmNlbEF1dG93YWxrKFwiZmFpbGVkXCIsIGZhbHNlKTsgfSk7XG4gICAgb24oXCJsb2FkR2FtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzdGF0ZS5kcml2aW5nQnlVcylcbiAgICAgICAgICAgIGNhbmNlbEF1dG93YWxrKFwiZmFpbGVkXCIsIGZhbHNlKTtcbiAgICAgICAgZWxzZSBpZiAoc3RhdGUuc3RhdHVzICE9PSBcImlkbGVcIilcbiAgICAgICAgICAgIHRyYW5zaXRpb24oXCJpZGxlXCIpO1xuICAgIH0pO1xuICAgIG9uKFwiZmFzdFRyYXZlbEVuZFwiLCBmdW5jdGlvbiAoKSB7IHJldHVybiBjYW5jZWxBdXRvd2FsayhcImZhaWxlZFwiLCBmYWxzZSk7IH0pO1xufVxuLyoqIFRlc3Qgc2VhbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldEF1dG93YWxrRm9yVGVzdCgpIHtcbiAgICBzdGF0ZSA9IHsgc3RhdHVzOiBcImlkbGVcIiwgZHJpdmluZ0J5VXM6IGZhbHNlLCBwZW5kaW5nQWNrRGVhZGxpbmU6IDAsIGVzcFF1ZXN0OiBudWxsIH07XG4gICAgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbn1cbiIsIi8qKlxuICogUHVyZSBsb290LXRyYWNrZXIgbG9naWMg4oCUIE5PIHNreXJpbVBsYXRmb3JtIGltcG9ydHMgKHZpdGVzdC10ZXN0YWJsZSkuXG4gKiBQb3J0ZWQgZnJvbSBTa3lyaW0gQWNjZXNzJ3MgbG9vdF90cmFja2VyIGJlaGF2aW9yICjCpzUuMyk6IGEgY3Jvc3Mtc2Vzc2lvblxuICogXCJhbHJlYWR5IHNlYXJjaGVkXCIgbWVtb3J5IGtleWVkIGJ5IGNvbnRhaW5lciBSRUYgZm9ybUlkLCB3aXRoIGEgcmVzcGF3blxuICogYXNzdW1wdGlvbiBhbmQgcGVyLXJlZiBjbGVhcmluZy5cbiAqXG4gKiBVbml0IGRlY2lzaW9uOiBgVXRpbGl0eS5nZXRDdXJyZW50R2FtZVRpbWUoKWAgcmV0dXJucyBnYW1lIERBWVMgKHRoZVxuICogZW52aXJvbm1lbnQgY29sbGVjdG9yIGFscmVhZHkgZGVyaXZlcyBgZ2FtZUhvdXIgPSBnYW1lVGltZSoyNCAlIDI0YCksIHNvXG4gKiB0aGUgcG9ydGVkIFwiNzIwIGluLWdhbWUgaG91cnMgKDMwIGRheXMpXCIgZXhwaXJ5IGJlY29tZXMgMzAgREFZUy4gUHJvYmVcbiAqIGl0ZW0gwqc0IGNvbmZpcm1zIHRoaXMgaW4gZ2FtZSBiZWZvcmUgdHVuaW5nLlxuICovXG5leHBvcnQgdmFyIExPT1RfRVhQSVJZX0RBWVMgPSAzMDtcbmV4cG9ydCBmdW5jdGlvbiBsb290S2V5KGZvcm1JZCkge1xuICAgIHJldHVybiBTdHJpbmcoZm9ybUlkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXJrTG9vdGVkKHN0b3JlLCBmb3JtSWQsIGdhbWVEYXlzKSB7XG4gICAgc3RvcmVbbG9vdEtleShmb3JtSWQpXSA9IGdhbWVEYXlzO1xufVxuLyoqIFRydWUgd2hpbGUgdGhlIHJlc3Bhd24gYXNzdW1wdGlvbiBob2xkcyAoc2VhcmNoZWQgPCBleHBpcnlEYXlzIGFnbykuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMb290ZWQoc3RvcmUsIGZvcm1JZCwgZ2FtZURheXMsIGV4cGlyeURheXMpIHtcbiAgICBpZiAoZXhwaXJ5RGF5cyA9PT0gdm9pZCAwKSB7IGV4cGlyeURheXMgPSBMT09UX0VYUElSWV9EQVlTOyB9XG4gICAgdmFyIGF0ID0gc3RvcmVbbG9vdEtleShmb3JtSWQpXTtcbiAgICBpZiAoYXQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiBnYW1lRGF5cyAtIGF0IDwgZXhwaXJ5RGF5cztcbn1cbi8qKiBUaGUgY29udGFpbmVyIHJlc3Bhd25lZCBub3cgKFRFU1Jlc2V0RXZlbnQpIOKAlCBmb3JnZXQgaXRzIHNlYXJjaGVkIHN0YXRlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsZWFyTG9vdGVkKHN0b3JlLCBmb3JtSWQpIHtcbiAgICB2YXIga2V5ID0gbG9vdEtleShmb3JtSWQpO1xuICAgIGlmIChzdG9yZVtrZXldID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICBkZWxldGUgc3RvcmVba2V5XTtcbiAgICByZXR1cm4gdHJ1ZTtcbn1cbi8qKiBEcm9wIGV4cGlyZWQgZW50cmllczsgcmV0dXJucyBob3cgbWFueSB3ZXJlIHJlbW92ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gcHJ1bmVMb290ZWQoc3RvcmUsIGdhbWVEYXlzLCBleHBpcnlEYXlzKSB7XG4gICAgaWYgKGV4cGlyeURheXMgPT09IHZvaWQgMCkgeyBleHBpcnlEYXlzID0gTE9PVF9FWFBJUllfREFZUzsgfVxuICAgIHZhciBwcnVuZWQgPSAwO1xuICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBPYmplY3Qua2V5cyhzdG9yZSk7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBfYVtfaV07XG4gICAgICAgIGlmIChnYW1lRGF5cyAtIHN0b3JlW2tleV0gPj0gZXhwaXJ5RGF5cykge1xuICAgICAgICAgICAgZGVsZXRlIHN0b3JlW2tleV07XG4gICAgICAgICAgICBwcnVuZWQrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcHJ1bmVkO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUxvb3Qoc3RvcmUpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3RvcmUpO1xufVxuLyoqIFRvbGVyYW50IHBhcnNlIOKAlCBhIGNvcnJ1cHQgc2lkZWNhciBtdXN0IG5ldmVyIGNyYXNoIHRoZSBwbHVnaW4uICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VMb290KGpzb24pIHtcbiAgICB0cnkge1xuICAgICAgICB2YXIgcmF3ID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgaWYgKCFyYXcgfHwgdHlwZW9mIHJhdyAhPT0gXCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KHJhdykpXG4gICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgIHZhciBzdG9yZSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gT2JqZWN0LmVudHJpZXMocmF3KTsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHZhciBfYiA9IF9hW19pXSwga2V5ID0gX2JbMF0sIHZhbHVlID0gX2JbMV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBzdG9yZVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0b3JlO1xuICAgIH1cbiAgICBjYXRjaCAoX2MpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFV0aWxpdHksIG9uLCBwcmludENvbnNvbGUsIH0gZnJvbSBcIi4uL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyBDT05GSUcsIFBMQVlFUl9GT1JNX0lEIH0gZnJvbSBcIi4uL2NvbmZpZ1wiO1xuaW1wb3J0IHsgZ2V0TGFzdEFjdGl2YXRlZFJlZiB9IGZyb20gXCIuLi9ldmVudHNcIjtcbmltcG9ydCB7IGNsZWFyTG9vdGVkLCBpc0xvb3RlZCwgbWFya0xvb3RlZCwgcGFyc2VMb290LCBwcnVuZUxvb3RlZCwgc2VyaWFsaXplTG9vdCwgfSBmcm9tIFwiLi9sb290LWNvcmVcIjtcbi8qKlxuICogR2FtZS1mYWNpbmcgbG9vdCB0cmFja2VyIChXMywgcGxhbiBEOCkuIEF0dHJpYnV0aW9uIHBlciB0aGUgcmV2aWV3IGZpeDpcbiAqICAtIFBSSU1BUlk6IGBjb250YWluZXJDaGFuZ2VkYCB3aXRoIGBuZXdDb250YWluZXIgPT09IHBsYXllcmAg4oaSIHRoZVxuICogICAgYG9sZENvbnRhaW5lcmAgd2FzIGp1c3Qgc2VhcmNoZWQgKGBtZW51T3BlbmAgY2FycmllcyBOTyB0YXJnZXQgcmVmIOKAlFxuICogICAgaXQgY2Fubm90IGlkZW50aWZ5IHRoZSBjaGVzdDsgc2t5bXA1LWNsaWVudCBjb250YWluZXJzU2VydmljZSBpZGlvbSkuXG4gKiAgLSBTRUNPTkRBUlkgKGJlc3QgZWZmb3J0KTogc25hcHNob3QgdGhlIGxhc3QgYWN0aXZhdGVkIHJlZiBhdFxuICogICAgQ29udGFpbmVyTWVudSBvcGVuIGFuZCBtYXJrIGl0IGF0IGNsb3NlIOKAlCBjYXRjaGVzIG9wZW5lZC1idXQtZW1wdHlcbiAqICAgIGNvbnRhaW5lcnMsIHdoZXJlIG5vIHRyYW5zZmVyIGV2ZXIgZmlyZXMuXG4gKiAgLSBgcmVzZXRgIChURVNSZXNldEV2ZW50KSBjbGVhcnMgdGhlIGVudHJ5OiB0aGUgY29udGFpbmVyIHJlc3Bhd25lZC5cbiAqICAtIGBsb2FkR2FtZWAgcHJ1bmVzIGV4cGlyZWQgZW50cmllcyAodGhlIEpTIFZNIHN1cnZpdmVzIHNhdmUvbG9hZCwgdGhlXG4gKiAgICBmaWxlIG1hdHRlcnMgYWNyb3NzIGdhbWUgcmVzdGFydHMpLlxuICpcbiAqIFBlcnNpc3RlbmNlOiBgRGF0YS9QbGF0Zm9ybS9Ta3lHdWlkZS9sb290Lmpzb25gIHNpZGVjYXIsIGF0b21pYyB3cml0ZVxuICogKGZpbGUtZHVtcC50cyBwYXR0ZXJuKSDigJQgYHNwLnN0b3JhZ2VgIGRpZXMgb24gZ2FtZSByZXN0YXJ0LCB0aGUgc2lkZWNhclxuICogZG9lcyBub3QuXG4gKi9cbnZhciBMT09UX1BBVEggPSBcIkRhdGEvUGxhdGZvcm0vU2t5R3VpZGUvbG9vdC5qc29uXCI7XG52YXIgZnNNb2R1bGU7XG5mdW5jdGlvbiBsb2FkRnMoKSB7XG4gICAgaWYgKGZzTW9kdWxlICE9PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBmc01vZHVsZTtcbiAgICB0cnkge1xuICAgICAgICBmc01vZHVsZSA9IHJlcXVpcmUoXCJmc1wiKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIGZzTW9kdWxlID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGZzTW9kdWxlO1xufVxudmFyIHN0b3JlID0ge307XG52YXIgbWVudUhpbnQ7XG52YXIgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbmZ1bmN0aW9uIGRlYnVnTG9nKG1lc3NhZ2UpIHtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbbG9vdC10cmFja2VyXSBcIi5jb25jYXQobWVzc2FnZSkpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5vd0RheXMoKSB7XG4gICAgdmFyIF9hO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAoX2EgPSBVdGlsaXR5LmdldEN1cnJlbnRHYW1lVGltZSgpKSAhPT0gbnVsbCAmJiBfYSAhPT0gdm9pZCAwID8gX2EgOiAwO1xuICAgIH1cbiAgICBjYXRjaCAoX2IpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxufVxuZnVuY3Rpb24gcGVyc2lzdCgpIHtcbiAgICB2YXIgZnMgPSBsb2FkRnMoKTtcbiAgICBpZiAoIWZzKVxuICAgICAgICByZXR1cm47XG4gICAgdmFyIHRtcCA9IFwiXCIuY29uY2F0KExPT1RfUEFUSCwgXCIudG1wXCIpO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBpZHggPSBNYXRoLm1heChMT09UX1BBVEgubGFzdEluZGV4T2YoXCIvXCIpLCBMT09UX1BBVEgubGFzdEluZGV4T2YoXCJcXFxcXCIpKTtcbiAgICAgICAgaWYgKGlkeCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZnMubWtkaXJTeW5jKExPT1RfUEFUSC5zbGljZSgwLCBpZHgpLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChfYSkge1xuICAgICAgICAgICAgICAgIC8vIERpcmVjdG9yeSBtYXkgYWxyZWFkeSBleGlzdC5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmcy53cml0ZUZpbGVTeW5jKHRtcCwgc2VyaWFsaXplTG9vdChzdG9yZSkpO1xuICAgICAgICBmcy5yZW5hbWVTeW5jKHRtcCwgTE9PVF9QQVRIKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBkZWJ1Z0xvZyhcInBlcnNpc3QgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG59XG5mdW5jdGlvbiByZXN0b3JlKCkge1xuICAgIHZhciBmcyA9IGxvYWRGcygpO1xuICAgIGlmICghZnMgfHwgdHlwZW9mIGZzLnJlYWRGaWxlU3luYyAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgICAgc3RvcmUgPSBwYXJzZUxvb3QoZnMucmVhZEZpbGVTeW5jKExPT1RfUEFUSCwgXCJ1dGYtOFwiKSk7XG4gICAgICAgIGRlYnVnTG9nKFwicmVzdG9yZWQgXCIuY29uY2F0KE9iamVjdC5rZXlzKHN0b3JlKS5sZW5ndGgsIFwiIGxvb3RlZCBlbnRyaWVzXCIpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIHN0b3JlID0ge307XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGluaXRMb290VHJhY2tlcigpIHtcbiAgICBpZiAoaW5pdGlhbGl6ZWQpXG4gICAgICAgIHJldHVybjtcbiAgICBpbml0aWFsaXplZCA9IHRydWU7XG4gICAgcmVzdG9yZSgpO1xuICAgIG9uKFwiY29udGFpbmVyQ2hhbmdlZFwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIF9hLCBfYiwgX2MsIF9kO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIG5ld0lkID0gKF9iID0gKF9hID0gZXZlbnQubmV3Q29udGFpbmVyKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IDA7XG4gICAgICAgICAgICB2YXIgb2xkSWQgPSAoX2QgPSAoX2MgPSBldmVudC5vbGRDb250YWluZXIpID09PSBudWxsIHx8IF9jID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYy5nZXRGb3JtSUQoKSkgIT09IG51bGwgJiYgX2QgIT09IHZvaWQgMCA/IF9kIDogMDtcbiAgICAgICAgICAgIGlmIChuZXdJZCA9PT0gUExBWUVSX0ZPUk1fSUQgJiYgb2xkSWQgJiYgb2xkSWQgIT09IFBMQVlFUl9GT1JNX0lEKSB7XG4gICAgICAgICAgICAgICAgbWFya0xvb3RlZChzdG9yZSwgb2xkSWQsIG5vd0RheXMoKSk7XG4gICAgICAgICAgICAgICAgZGVidWdMb2coXCJjb250YWluZXIgXCIuY29uY2F0KG9sZElkLCBcIiBsb290ZWQgdmlhIHRyYW5zZmVyXCIpKTtcbiAgICAgICAgICAgICAgICBwZXJzaXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKF9lKSB7XG4gICAgICAgICAgICAvLyBCYWQgcmVmcyBtdXN0IG5ldmVyIGJyZWFrIHRoZSBldmVudCBwaXBlbGluZS5cbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9uKFwibWVudU9wZW5cIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5uYW1lID09PSBcIkNvbnRhaW5lck1lbnVcIikge1xuICAgICAgICAgICAgbWVudUhpbnQgPSBnZXRMYXN0QWN0aXZhdGVkUmVmKCk7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBvbihcIm1lbnVDbG9zZVwiLCBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKGV2ZW50Lm5hbWUgPT09IFwiQ29udGFpbmVyTWVudVwiKSB7XG4gICAgICAgICAgICBpZiAobWVudUhpbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG1hcmtMb290ZWQoc3RvcmUsIG1lbnVIaW50LCBub3dEYXlzKCkpO1xuICAgICAgICAgICAgICAgIGRlYnVnTG9nKFwiY29udGFpbmVyIFwiLmNvbmNhdChtZW51SGludCwgXCIgbG9vdGVkIHZpYSBtZW51IGNsb3NlXCIpKTtcbiAgICAgICAgICAgICAgICBwZXJzaXN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZW51SGludCA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIG9uKFwicmVzZXRcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgZm9ybUlkID0gKF9iID0gKF9hID0gZXZlbnQub2JqZWN0KSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EuZ2V0Rm9ybUlEKCkpICE9PSBudWxsICYmIF9iICE9PSB2b2lkIDAgPyBfYiA6IDA7XG4gICAgICAgICAgICBpZiAoZm9ybUlkICYmIGNsZWFyTG9vdGVkKHN0b3JlLCBmb3JtSWQpKSB7XG4gICAgICAgICAgICAgICAgZGVidWdMb2coXCJjb250YWluZXIgXCIuY29uY2F0KGZvcm1JZCwgXCIgcmVzcGF3bmVkIFxcdTIwMTQgZW50cnkgY2xlYXJlZFwiKSk7XG4gICAgICAgICAgICAgICAgcGVyc2lzdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChfYykge1xuICAgICAgICAgICAgLy8gSWdub3JlIGJhZCByZWZzLlxuICAgICAgICB9XG4gICAgfSk7XG4gICAgb24oXCJsb2FkR2FtZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwcnVuZWQgPSBwcnVuZUxvb3RlZChzdG9yZSwgbm93RGF5cygpKTtcbiAgICAgICAgaWYgKHBydW5lZCA+IDApIHtcbiAgICAgICAgICAgIGRlYnVnTG9nKFwibG9hZEdhbWU6IHBydW5lZCBcIi5jb25jYXQocHJ1bmVkLCBcIiBleHBpcmVkIGVudHJpZXNcIikpO1xuICAgICAgICB9XG4gICAgICAgIHBlcnNpc3QoKTtcbiAgICB9KTtcbn1cbi8qKiBTY2FubmVyIGhvb2s6IHB1cmUgbWFwIGxvb2t1cCwgbm8gUGFweXJ1cyBjb3N0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGFpbmVyTG9vdGVkKGZvcm1JZCkge1xuICAgIHJldHVybiBpc0xvb3RlZChzdG9yZSwgZm9ybUlkLCBub3dEYXlzKCkpO1xufVxuLyoqIFRlc3Qgc2VhbS4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldExvb3RUcmFja2VyRm9yVGVzdCgpIHtcbiAgICBzdG9yZSA9IHt9O1xuICAgIG1lbnVIaW50ID0gdW5kZWZpbmVkO1xuICAgIGluaXRpYWxpemVkID0gZmFsc2U7XG59XG4iLCIvKipcbiAqIFB1cmUgYXV0b3dhbGsvbmF2aWdhdGlvbiBsb2dpYyDigJQgTk8gc2t5cmltUGxhdGZvcm0gaW1wb3J0cy5cbiAqXG4gKiBNb2QtZXZlbnQgY29udHJhY3QgKHZlcmlmaWVkIGFnYWluc3QgdGhlIHNreW1wIHNvdXJjZXMsIDIwMjYtMTEtMTYg4oCUIHNlZVxuICogcGxhbiBXNiBldmlkZW5jZSk6IEpTIGNhbGxzIGBxdWVzdFJlZi5zZW5kTW9kRXZlbnQoZXZlbnROYW1lLCBzdHJBcmcsXG4gKiBudW1BcmcpYDsgdGhlIEVTUCBzY3JpcHQncyBgUmVnaXN0ZXJGb3JNb2RFdmVudGAgY2FsbGJhY2sgcmVjZWl2ZXNcbiAqIGAoc3RyaW5nIHN0ckFyZywgZmxvYXQgbnVtQXJnKWAuIG51bUFyZyBpcyBwYWNrZWQgZmxvYXQzMiAofjcgZGlnaXRzKSBzb1xuICogdGhlIGZvcm1JZCBNVVNUIHRyYXZlbCBpbiBzdHJBcmcg4oCUIGhlcmU6IEpTT04uIE5hbWVzIGFyZSBVTklRVUUgKEQ1KSDigJRcbiAqIHNoYXJpbmcgU2t5cmltIEFjY2VzcydzIGV2ZW50IG5hbWVzIHdvdWxkIHRyaWdnZXIgYm90aCBtb2RzJyBhdXRvd2Fsay5cbiAqL1xuZXhwb3J0IHZhciBBVVRPV0FMS19DTURfRVZFTlQgPSBcIlNreUd1aWRlX0F1dG9XYWxrQ21kXCI7XG5leHBvcnQgdmFyIEFVVE9XQUxLX0FDS19FVkVOVCA9IFwiU2t5R3VpZGVfQXV0b1dhbGtBY2tcIjtcbmV4cG9ydCB2YXIgQVVUT1dBTEtfQVJSSVZFRF9FVkVOVCA9IFwiU2t5R3VpZGVfQXV0b1dhbGtBcnJpdmVkXCI7XG5leHBvcnQgdmFyIEFVVE9XQUxLX0NBTkNFTF9FVkVOVCA9IFwiU2t5R3VpZGVfQXV0b1dhbGtDYW5jZWxcIjtcbi8qKlxuICogRVNQIGFubm91bmNlOiB0aGUgcXVlc3Qgc2NyaXB0IHNlbmRzIHRoaXMgYXQgT25Jbml0IChnYW1lIGxhdW5jaCkgYW5kIG9uXG4gKiBldmVyeSBzYXZlLWxvYWQgcmUtcmVnaXN0ZXIuIGBldmVudC5zZW5kZXJgIElTIHRoZSBxdWVzdCBmb3JtIOKAlCB0aGUgSlNcbiAqIHNpZGUgc3RvcmVzIGl0IGFuZCBuZXZlciBuZWVkcyB0aGUgcXVlc3QncyBmb3JtIElEIChhbnkgQ0stYnVpbHQgZm9ybSBpZFxuICogd29ya3MpLlxuICovXG5leHBvcnQgdmFyIEFVVE9XQUxLX1JFQURZX0VWRU5UID0gXCJTa3lHdWlkZV9BdXRvV2Fsa1JlYWR5XCI7XG4vKiogSlNPTiBwYXlsb2FkIGluIHN0ckFyZyDigJQgZm9ybUlkcyDiiaUgMHhGRjAwMDAwMCBzdXJ2aXZlIChmbG9hdDMyIHdvdWxkIG5vdCkuICovXG5leHBvcnQgZnVuY3Rpb24gZW5jb2RlQXV0b3dhbGtDb21tYW5kKGNvbW1hbmQpIHtcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoeyBmOiBjb21tYW5kLmZvcm1JZC50b1N0cmluZygxNiksIGQ6IGNvbW1hbmQuc3RvcERpc3RhbmNlIH0pO1xufVxuLyoqIFRvbGVyYW50IGRlY29kZSDigJQgYSBtYWxmb3JtZWQgcGF5bG9hZCBtdXN0IGZhaWwgdGhlIGFjdGlvbiwgbm90IHRoZSBWTS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvZGVBdXRvd2Fsa0NvbW1hbmQoc3RyQXJnKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgdmFyIHJhdyA9IEpTT04ucGFyc2Uoc3RyQXJnKTtcbiAgICAgICAgaWYgKCFyYXcgfHwgdHlwZW9mIHJhdyAhPT0gXCJvYmplY3RcIilcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgcmVjb3JkID0gcmF3O1xuICAgICAgICBpZiAodHlwZW9mIHJlY29yZC5mICE9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHZhciBmb3JtSWQgPSBOdW1iZXIucGFyc2VJbnQocmVjb3JkLmYsIDE2KTtcbiAgICAgICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZm9ybUlkKSB8fCBmb3JtSWQgPD0gMClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB2YXIgc3RvcERpc3RhbmNlID0gdHlwZW9mIHJlY29yZC5kID09PSBcIm51bWJlclwiICYmIE51bWJlci5pc0Zpbml0ZShyZWNvcmQuZCkgJiYgcmVjb3JkLmQgPiAwXG4gICAgICAgICAgICA/IHJlY29yZC5kXG4gICAgICAgICAgICA6IDEwMDtcbiAgICAgICAgcmV0dXJuIHsgZm9ybUlkOiBmb3JtSWQsIHN0b3BEaXN0YW5jZTogc3RvcERpc3RhbmNlIH07XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4vKipcbiAqIFN0YXR1cyB0cmFuc2l0aW9ucyAocHVyZSkg4oCUIHRoZSBnbHVlIG93bnMgdGltZXJzL2V2ZW50cywgdGhpcyBvd25zIHRoZVxuICogbGVnYWxpdHkgb2YgZWFjaCBob3AuIEFueSBzdGF0dXMgbWF5IHJlc2V0IHRvIFwiaWRsZVwiLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuVHJhbnNpdGlvbihmcm9tLCB0bykge1xuICAgIGlmICh0byA9PT0gXCJpZGxlXCIpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIHN3aXRjaCAoZnJvbSkge1xuICAgICAgICBjYXNlIFwiaWRsZVwiOlxuICAgICAgICAgICAgcmV0dXJuIHRvID09PSBcIndhbGtpbmdcIiB8fCB0byA9PT0gXCJmYWlsZWRcIjtcbiAgICAgICAgY2FzZSBcIndhbGtpbmdcIjpcbiAgICAgICAgICAgIHJldHVybiB0byA9PT0gXCJhcnJpdmVkXCIgfHwgdG8gPT09IFwiY2FuY2VsbGVkXCIgfHwgdG8gPT09IFwiZmFpbGVkXCI7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBhcnJpdmVkL2NhbmNlbGxlZC9mYWlsZWQgYXJlIHRlcm1pbmFsIHVudGlsIHRoZSBuZXh0IGNvbW1hbmQgcmVzZXRzLlxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbiIsIi8qKlxuICogUHVyZSB3b3JsZC1zY2FubmVyIGxvZ2ljIOKAlCBOTyBza3lyaW1QbGF0Zm9ybSBpbXBvcnRzLiBFdmVyeXRoaW5nIGhlcmUgbXVzdFxuICogc3RheSBydW5uYWJsZSB1bmRlciBwbGFpbiBOb2RlICh2aXRlc3QpIHNvIHRoZSBjYWNoZS9mbGFnL2JlYXJpbmcgbWF0aCBjYW5cbiAqIGJlIHJlZ3Jlc3Npb24tdGVzdGVkIHdpdGhvdXQgdGhlIGdhbWUuXG4gKlxuICogRm9ybVR5cGUgbnVtZXJpYyB2YWx1ZXMgYXJlIG1pcnJvcmVkIGZyb20gdGhlIGluc3RhbGxlZCB0eXBpbmdzXG4gKiAoYEBza3lyaW0tcGxhdGZvcm0vc2t5cmltLXBsYXRmb3JtL2luZGV4LmQudHNgLCBgZXhwb3J0IGNvbnN0IGVudW0gRm9ybVR5cGVgKTpcbiAqIEFjdGl2YXRvcj0yNCwgQ29udGFpbmVyPTI4LCBEb29yPTI5LCBGbG9yYT0zOSwgRnVybml0dXJlPTQwLCBDaGFyYWN0ZXI9NjIuXG4gKiAoTmV2ZXIgY29weSB0aGUgbnVtZXJpYyB0YWJsZSBpbiBjcm9zc2hhaXItY29sbGVjdG9yLnRzIOKAlCAyNi8yNyBhcmVcbiAqIEFybW9yL0Jvb2sgdGhlcmUsIHdoaWNoIGlzIHdyb25nLilcbiAqL1xudmFyIF9fc3ByZWFkQXJyYXkgPSAodGhpcyAmJiB0aGlzLl9fc3ByZWFkQXJyYXkpIHx8IGZ1bmN0aW9uICh0bywgZnJvbSwgcGFjaykge1xuICAgIGlmIChwYWNrIHx8IGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIGZvciAodmFyIGkgPSAwLCBsID0gZnJvbS5sZW5ndGgsIGFyOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGlmIChhciB8fCAhKGkgaW4gZnJvbSkpIHtcbiAgICAgICAgICAgIGlmICghYXIpIGFyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSwgMCwgaSk7XG4gICAgICAgICAgICBhcltpXSA9IGZyb21baV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRvLmNvbmNhdChhciB8fCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChmcm9tKSk7XG59O1xuZXhwb3J0IHZhciBGT1JNX1RZUEUgPSB7XG4gICAgYWN0aXZhdG9yOiAyNCxcbiAgICBjb250YWluZXI6IDI4LFxuICAgIGRvb3I6IDI5LFxuICAgIGZsb3JhOiAzOSxcbiAgICBmdXJuaXR1cmU6IDQwLFxuICAgIGNoYXJhY3RlcjogNjIsXG59O1xuLyoqIFR1bmluZyBjb25zdGFudHMgcG9ydGVkIGZyb20gU2t5cmltIEFjY2VzcyAoZG9jcy9BQ0NFU1NJQklMSVRZLVBPUlQubWQgwqc1LjYpLiAqL1xuZXhwb3J0IHZhciBTQ0FOX0RFRkFVTFRTID0ge1xuICAgIC8qKiBSZS1zd2VlcCBhZnRlciB0aGUgcGxheWVyIG1vdmVkIHRoaXMgZmFyICh0aGVpciBSRVNDQU5fRElTVEFOQ0UpLiAqL1xuICAgIHJlc2NhbkRpc3RhbmNlVW5pdHM6IDEwMCxcbiAgICAvKiogTWF4aW11bSBvYmplY3RzIGtlcHQgaW4gdGhlIGNhY2hlIChzb3J0ZWQgbmVhcmVzdC1maXJzdCkuICovXG4gICAgbWF4T3V0cHV0OiA2NCxcbiAgICAvKiogUGFweXJ1cyBwcm9iZXMgYWxsb3dlZCBwZXIgdXBkYXRlIHBhc3MgKGhpdGNoIHByb3RlY3Rpb24pLiAqL1xuICAgIHByb2JlQnVkZ2V0UGVyUGFzczogOTYsXG4gICAgLyoqIFBhcmVudCBjZWxsICsgTiByZWNlbnRseSBjZWxsRnVsbHlMb2FkZWQgY2VsbHMuICovXG4gICAgbWF4Q2VsbHM6IDQsXG4gICAgLyoqIFN3ZWVwIHJhZGl1cyBpbiB3b3JsZCB1bml0cy4gKi9cbiAgICByYWRpdXNVbml0czogMjUwMCxcbn07XG5leHBvcnQgZnVuY3Rpb24gY2xhc3NpZnlDYXRlZ29yeShmb3JtVHlwZSkge1xuICAgIHN3aXRjaCAoZm9ybVR5cGUpIHtcbiAgICAgICAgY2FzZSBGT1JNX1RZUEUuY2hhcmFjdGVyOlxuICAgICAgICAgICAgcmV0dXJuIFwibnBjXCI7XG4gICAgICAgIGNhc2UgRk9STV9UWVBFLmRvb3I6XG4gICAgICAgICAgICByZXR1cm4gXCJkb29yXCI7XG4gICAgICAgIGNhc2UgRk9STV9UWVBFLmNvbnRhaW5lcjpcbiAgICAgICAgICAgIHJldHVybiBcImNvbnRhaW5lclwiO1xuICAgICAgICBjYXNlIEZPUk1fVFlQRS5hY3RpdmF0b3I6XG4gICAgICAgICAgICByZXR1cm4gXCJhY3RpdmF0b3JcIjtcbiAgICAgICAgY2FzZSBGT1JNX1RZUEUuZmxvcmE6XG4gICAgICAgICAgICByZXR1cm4gXCJmbG9yYVwiO1xuICAgICAgICBjYXNlIEZPUk1fVFlQRS5mdXJuaXR1cmU6XG4gICAgICAgICAgICByZXR1cm4gXCJmdXJuaXR1cmVcIjtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiBcIm90aGVyXCI7XG4gICAgfVxufVxuLyoqXG4gKiBPYmplY3RSZWZlcmVuY2UuZ2V0T3BlblN0YXRlKCk6IDEvMiA9IG9wZW4gb3Igb3BlbmluZywgMy80ID0gY2xvc2VkIG9yXG4gKiBjbG9zaW5nLCAwID0gbm90IGFuIG9wZW4vY2xvc2UgcmVmIChDSyB3aWtpIHNlbWFudGljcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc09wZW5TdGF0ZShvcGVuU3RhdGUpIHtcbiAgICByZXR1cm4gb3BlblN0YXRlID09PSAxIHx8IG9wZW5TdGF0ZSA9PT0gMjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBhc3NlbWJsZUZsYWdzKGlucHV0KSB7XG4gICAgdmFyIGZsYWdzID0gW107XG4gICAgaWYgKGlucHV0LmlzTG9ja2VkKVxuICAgICAgICBmbGFncy5wdXNoKFwibG9ja2VkXCIpO1xuICAgIGlmIChpbnB1dC5mb3JtVHlwZSA9PT0gRk9STV9UWVBFLmNvbnRhaW5lciAmJlxuICAgICAgICBpbnB1dC5udW1JdGVtcyAhPT0gbnVsbCAmJlxuICAgICAgICBpbnB1dC5udW1JdGVtcyA9PT0gMCkge1xuICAgICAgICBmbGFncy5wdXNoKFwiZW1wdHlcIik7XG4gICAgfVxuICAgIGlmIChpbnB1dC5mb3JtVHlwZSA9PT0gRk9STV9UWVBFLmNoYXJhY3RlciAmJiBpbnB1dC5pc0RlYWQpXG4gICAgICAgIGZsYWdzLnB1c2goXCJjb3Jwc2VcIik7XG4gICAgaWYgKGlucHV0LmZvcm1UeXBlID09PSBGT1JNX1RZUEUuZG9vciAmJiBpc09wZW5TdGF0ZShpbnB1dC5vcGVuU3RhdGUpKVxuICAgICAgICBmbGFncy5wdXNoKFwib3BlblwiKTtcbiAgICBpZiAoaW5wdXQuZm9ybVR5cGUgPT09IEZPUk1fVFlQRS5mbG9yYSAmJiBpbnB1dC5pc0hhcnZlc3RlZClcbiAgICAgICAgZmxhZ3MucHVzaChcImhhcnZlc3RlZFwiKTtcbiAgICBpZiAoaW5wdXQuZm9ybVR5cGUgPT09IEZPUk1fVFlQRS5jb250YWluZXIgJiYgaW5wdXQuaXNMb290ZWQpXG4gICAgICAgIGZsYWdzLnB1c2goXCJsb290ZWRcIik7XG4gICAgcmV0dXJuIGZsYWdzO1xufVxuLyoqIEFic29sdXRlIHdvcmxkIGJlYXJpbmc6IDAgPSBub3J0aCAoK1kpLCA5MCA9IGVhc3QgKCtYKSwgY2xvY2t3aXNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFic29sdXRlQmVhcmluZ0RlZyhkeCwgZHkpIHtcbiAgICByZXR1cm4gKE1hdGguYXRhbjIoZHgsIGR5KSAqIDE4MCkgLyBNYXRoLlBJO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlbGF0aXZlQmVhcmluZ0RlZyhhYnNvbHV0ZURlZywgcGxheWVyRmFjaW5nRGVnKSB7XG4gICAgcmV0dXJuICgoYWJzb2x1dGVEZWcgLSBwbGF5ZXJGYWNpbmdEZWcgKyA1NDApICUgMzYwKSAtIDE4MDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBkaXN0YW5jZVVuaXRzKGR4LCBkeSwgZHopIHtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkeik7XG59XG4vKipcbiAqIENhY2hlIGludmFsaWRhdGlvbiwgcG9ydGVkIGZyb20gdGhlaXIgc2Nhbm5lcjogcmUtc3dlZXAgYWZ0ZXIgdGhlIHBsYXllclxuICogbW92ZWQgUkVTQ0FOX0RJU1RBTkNFIHVuaXRzIG9yIGNoYW5nZWQgY2VsbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1NjYW5DYWNoZVN0YWxlKGNhY2hlLCBjdXJyZW50LCByZXNjYW5EaXN0YW5jZVVuaXRzKSB7XG4gICAgaWYgKHJlc2NhbkRpc3RhbmNlVW5pdHMgPT09IHZvaWQgMCkgeyByZXNjYW5EaXN0YW5jZVVuaXRzID0gU0NBTl9ERUZBVUxUUy5yZXNjYW5EaXN0YW5jZVVuaXRzOyB9XG4gICAgaWYgKGNhY2hlLmNlbGxJZHMubGVuZ3RoICE9PSBjdXJyZW50LmNlbGxJZHMubGVuZ3RoKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgYSA9IF9fc3ByZWFkQXJyYXkoW10sIGNhY2hlLmNlbGxJZHMsIHRydWUpLnNvcnQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuIHggLSB5OyB9KS5qb2luKFwiLFwiKTtcbiAgICB2YXIgYiA9IF9fc3ByZWFkQXJyYXkoW10sIGN1cnJlbnQuY2VsbElkcywgdHJ1ZSkuc29ydChmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4geCAtIHk7IH0pLmpvaW4oXCIsXCIpO1xuICAgIGlmIChhICE9PSBiKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgZHggPSBjdXJyZW50LnBvcy54IC0gY2FjaGUucG9zLng7XG4gICAgdmFyIGR5ID0gY3VycmVudC5wb3MueSAtIGNhY2hlLnBvcy55O1xuICAgIHZhciBkeiA9IGN1cnJlbnQucG9zLnogLSBjYWNoZS5wb3MuejtcbiAgICByZXR1cm4gZGlzdGFuY2VVbml0cyhkeCwgZHksIGR6KSA+PSByZXNjYW5EaXN0YW5jZVVuaXRzO1xufVxuLyoqXG4gKiBTb3J0IG5lYXJlc3QtZmlyc3QsIGNhcCB0aGUgb3V0cHV0LCBhbmQgZGVyaXZlIGRpc3RhbmNlL2JlYXJpbmcvZHovZmxhZ3NcbiAqIGZyb20gdGhlIHJhdyBwcm9iZXMuIFRoaXMgaXMgdGhlIG9ubHkgcGxhY2UgY2FuZGlkYXRlIG1hdGggaGFwcGVucyBzbyB0aGVcbiAqIHN3ZWVwIHN0YXlzIGEgZHVtYiBwcm9iZSBjb2xsZWN0b3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5hbGl6ZUNhbmRpZGF0ZXMoY2FuZGlkYXRlcywgcGxheWVyUG9zLCBwbGF5ZXJGYWNpbmdEZWcsIG1heE91dHB1dCkge1xuICAgIGlmIChtYXhPdXRwdXQgPT09IHZvaWQgMCkgeyBtYXhPdXRwdXQgPSBTQ0FOX0RFRkFVTFRTLm1heE91dHB1dDsgfVxuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgX2kgPSAwLCBjYW5kaWRhdGVzXzEgPSBjYW5kaWRhdGVzOyBfaSA8IGNhbmRpZGF0ZXNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZXNfMVtfaV07XG4gICAgICAgIHZhciBkeCA9IGNhbmRpZGF0ZS54IC0gcGxheWVyUG9zLng7XG4gICAgICAgIHZhciBkeSA9IGNhbmRpZGF0ZS55IC0gcGxheWVyUG9zLnk7XG4gICAgICAgIHZhciBkeiA9IGNhbmRpZGF0ZS56IC0gcGxheWVyUG9zLno7XG4gICAgICAgIHZhciBkaXN0YW5jZSA9IGRpc3RhbmNlVW5pdHMoZHgsIGR5LCBkeik7XG4gICAgICAgIHZhciBiZWFyaW5nID0gKChhYnNvbHV0ZUJlYXJpbmdEZWcoZHgsIGR5KSAlIDM2MCkgKyAzNjApICUgMzYwO1xuICAgICAgICBvYmplY3RzLnB1c2goe1xuICAgICAgICAgICAgZm9ybUlkOiBjYW5kaWRhdGUuZm9ybUlkLFxuICAgICAgICAgICAgbmFtZTogY2FuZGlkYXRlLm5hbWUsXG4gICAgICAgICAgICBjYXRlZ29yeTogY2xhc3NpZnlDYXRlZ29yeShjYW5kaWRhdGUuZm9ybVR5cGUpLFxuICAgICAgICAgICAgZGlzdGFuY2U6IGRpc3RhbmNlLFxuICAgICAgICAgICAgYmVhcmluZ0RlZzogTWF0aC5yb3VuZChiZWFyaW5nICogMTApIC8gMTAsXG4gICAgICAgICAgICByZWxhdGl2ZURlZzogTWF0aC5yb3VuZChyZWxhdGl2ZUJlYXJpbmdEZWcoYmVhcmluZywgcGxheWVyRmFjaW5nRGVnKSAqIDEwKSAvIDEwLFxuICAgICAgICAgICAgbG9ja0xldmVsOiBjYW5kaWRhdGUuaXNMb2NrZWQgPyBjYW5kaWRhdGUubG9ja0xldmVsIDogMCxcbiAgICAgICAgICAgIGR6OiBNYXRoLnJvdW5kKGR6ICogMTApIC8gMTAsXG4gICAgICAgICAgICBmbGFnczogYXNzZW1ibGVGbGFncyhjYW5kaWRhdGUpLFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgb2JqZWN0cy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLmRpc3RhbmNlIC0gYi5kaXN0YW5jZTsgfSk7XG4gICAgcmV0dXJuIG9iamVjdHMuc2xpY2UoMCwgTWF0aC5tYXgoMCwgbWF4T3V0cHV0KSk7XG59XG4iLCIvKipcbiAqIFB1cmUgc3R1Y2stZGV0ZWN0aW9uIGxvZ2ljIOKAlCBOTyBza3lyaW1QbGF0Zm9ybSBpbXBvcnRzLlxuICogUG9ydGVkIGZyb20gU2t5cmltIEFjY2VzcydzIGJsb2NrZWRfc3RvcCBzdGF0ZSBtYWNoaW5lICjCpzUuNSk6IG1vdmVtZW50XG4gKiBpbnB1dCBoZWxkICsgcG9zaXRpb24gZGVsdGEgYmVsb3cgdGhyZXNob2xkIG92ZXIgYSBjb25maXJtYXRpb24gd2luZG93LlxuICogV2UgY2Fubm90IG5ldXRyYWxpc2UgdGhlIGlucHV0IGV2ZW50cyAobmVlZHMgdGhlIFByb2Nlc3NFdmVudCBob29rKSwgc28gd2VcbiAqIERFVEVDVCBhbmQgUkVQT1JUIOKAlCB0aGUgYXBwIHR1cm5zIGl0IGludG8gXCJWb3VzIMOqdGVzIGJsb3F1w6kuIFRvdXJuZSDDoOKAplwiLlxuICpcbiAqIFRocmVzaG9sZHMgKMKnNS42KTogcG9zaXRpb24gZGVsdGEgPCB+OCB1bml0czsgfjAuNSBzIGNvbmZpcm1hdGlvbi4gQXQgb3VyXG4gKiA1MDAgbXMgdGljaywgYSAxMjAwIG1zIHdpbmRvdyBob2xkcyB+MyBzYW1wbGVzIOKAlCB0aGUgMC41IHMgY29uZmlybSBkZW1hbmRzXG4gKiBhdCBsZWFzdCAyLiBNb3ZlbWVudCBrZXlzIGNvbWUgZnJvbSB0aGUgaW5wdXQgY29sbGVjdG9yIChubyBleHRyYSBQYXB5cnVzXG4gKiBwb2xscyk7IG1hcHBlZC1rZXkgcHJvYmluZyAowqc0KSBpcyBhIGxhdGVyIHJlZmluZW1lbnQuXG4gKi9cbnZhciBfX3NwcmVhZEFycmF5ID0gKHRoaXMgJiYgdGhpcy5fX3NwcmVhZEFycmF5KSB8fCBmdW5jdGlvbiAodG8sIGZyb20sIHBhY2spIHtcbiAgICBpZiAocGFjayB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAyKSBmb3IgKHZhciBpID0gMCwgbCA9IGZyb20ubGVuZ3RoLCBhcjsgaSA8IGw7IGkrKykge1xuICAgICAgICBpZiAoYXIgfHwgIShpIGluIGZyb20pKSB7XG4gICAgICAgICAgICBpZiAoIWFyKSBhciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGZyb20sIDAsIGkpO1xuICAgICAgICAgICAgYXJbaV0gPSBmcm9tW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0by5jb25jYXQoYXIgfHwgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoZnJvbSkpO1xufTtcbmltcG9ydCB7IGRpc3RhbmNlVW5pdHMgfSBmcm9tIFwiLi9zY2FubmVyLWNvcmVcIjtcbmV4cG9ydCB2YXIgU1RVQ0tfREVGQVVMVFMgPSB7XG4gICAgLyoqIFBvc2l0aW9uIHdpbmRvdzogfHBvcyDiiJIgcG9zKHdpbmRvd01zIGFnbyl8IGRlY2lkZXMgXCJub3QgbW92aW5nXCIuICovXG4gICAgd2luZG93TXM6IDEyMDAsXG4gICAgLyoqIEJlbG93IHRoaXMgZGVsdGEgb3ZlciB0aGUgd2luZG93LCB0aGUgcGxheWVyIGlzIG5vdCBtYWtpbmcgcHJvZ3Jlc3MuICovXG4gICAgbWluTW92ZW1lbnRVbml0czogOCxcbiAgICAvKiogTWluaW11bSB3aW5kb3cgb2NjdXBhbmN5IGJlZm9yZSBkZWNsYXJpbmcgc3R1Y2sgKHRoZWlyIH4wLjUgcyBjb25maXJtKS4gKi9cbiAgICBjb25maXJtTXM6IDUwMCxcbiAgICBtYXhTYW1wbGVzOiAxNixcbiAgICAvKiogTmVhcmVzdCBzY2FubmVyIG9iamVjdCB3aXRoaW4gdGhpcyByYW5nZSBjb3VudHMgYXMgdGhlIG9ic3RhY2xlLiAqL1xuICAgIG9ic3RhY2xlUmFuZ2VVbml0czogNTAwLFxufTtcbi8qKiBBcHBlbmQgKyB0aW1lLXBydW5lLiBSZXR1cm5zIGEgbmV3IGFycmF5IChwdXJlKS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwdXNoU3R1Y2tTYW1wbGUoaGlzdG9yeSwgc2FtcGxlLCBub3dNcywgbWF4U2FtcGxlcykge1xuICAgIGlmIChtYXhTYW1wbGVzID09PSB2b2lkIDApIHsgbWF4U2FtcGxlcyA9IFNUVUNLX0RFRkFVTFRTLm1heFNhbXBsZXM7IH1cbiAgICB2YXIgbmV4dCA9IF9fc3ByZWFkQXJyYXkoX19zcHJlYWRBcnJheShbXSwgaGlzdG9yeSwgdHJ1ZSksIFtzYW1wbGVdLCBmYWxzZSk7XG4gICAgdmFyIGN1dG9mZiA9IG5vd01zIC0gU1RVQ0tfREVGQVVMVFMud2luZG93TXMgKiA0O1xuICAgIHJldHVybiBuZXh0LmZpbHRlcihmdW5jdGlvbiAoZW50cnkpIHsgcmV0dXJuIGVudHJ5LnRNcyA+PSBjdXRvZmY7IH0pLnNsaWNlKC1tYXhTYW1wbGVzKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBldmFsdWF0ZVN0dWNrKGhpc3RvcnksIG5vd01zLCBjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB2b2lkIDApIHsgY29uZmlnID0gU1RVQ0tfREVGQVVMVFM7IH1cbiAgICB2YXIgbmV3ZXN0ID0gaGlzdG9yeVtoaXN0b3J5Lmxlbmd0aCAtIDFdO1xuICAgIGlmICghbmV3ZXN0KVxuICAgICAgICByZXR1cm4geyBzdHVjazogZmFsc2UsIGNvbmZpcm1NczogMCB9O1xuICAgIGlmICghbmV3ZXN0LmtleXNIZWxkIHx8IG5ld2VzdC5leGNsdWRlZClcbiAgICAgICAgcmV0dXJuIHsgc3R1Y2s6IGZhbHNlLCBjb25maXJtTXM6IDAgfTtcbiAgICAvLyBSZWZlcmVuY2Ugc2FtcGxlOiB0aGUgb2xkZXN0IHNhbXBsZSBpbnNpZGUgdGhlIHdpbmRvdyAob3IgdGhlIG9sZGVzdCB3ZVxuICAgIC8vIGtlcHQgaWYgdGhlIHdpbmRvdyBpcyBub3QgeWV0IGZ1bGwpLlxuICAgIHZhciByZWZlcmVuY2UgPSBoaXN0b3J5WzBdO1xuICAgIGZvciAodmFyIF9pID0gMCwgaGlzdG9yeV8xID0gaGlzdG9yeTsgX2kgPCBoaXN0b3J5XzEubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgIHZhciBlbnRyeSA9IGhpc3RvcnlfMVtfaV07XG4gICAgICAgIGlmIChub3dNcyAtIGVudHJ5LnRNcyA8PSBjb25maWcud2luZG93TXMpIHtcbiAgICAgICAgICAgIHJlZmVyZW5jZSA9IGVudHJ5O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIHNwYW4gPSBuZXdlc3QudE1zIC0gcmVmZXJlbmNlLnRNcztcbiAgICBpZiAoc3BhbiA8IGNvbmZpZy5jb25maXJtTXMpXG4gICAgICAgIHJldHVybiB7IHN0dWNrOiBmYWxzZSwgY29uZmlybU1zOiBzcGFuIH07XG4gICAgLy8gRXZlcnkgc2FtcGxlIGluIHRoZSB3aW5kb3cgbXVzdCBzaG93IGhlbGQga2V5cyBhbmQgYSBub24tZXhjbHVkZWQgc3RhdGUg4oCUXG4gICAgLy8gb25lIG1lbnUgYmxpcCBvciBzd2ltIHRpY2sgcmVzZXRzIHRoZSBjb25maXJtYXRpb24uXG4gICAgZm9yICh2YXIgX2EgPSAwLCBoaXN0b3J5XzIgPSBoaXN0b3J5OyBfYSA8IGhpc3RvcnlfMi5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gaGlzdG9yeV8yW19hXTtcbiAgICAgICAgaWYgKGVudHJ5LnRNcyA8IHJlZmVyZW5jZS50TXMpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKCFlbnRyeS5rZXlzSGVsZCB8fCBlbnRyeS5leGNsdWRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3R1Y2s6IGZhbHNlLCBjb25maXJtTXM6IHNwYW4gfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgZGVsdGEgPSBkaXN0YW5jZVVuaXRzKG5ld2VzdC5wb3MueCAtIHJlZmVyZW5jZS5wb3MueCwgbmV3ZXN0LnBvcy55IC0gcmVmZXJlbmNlLnBvcy55LCBuZXdlc3QucG9zLnogLSByZWZlcmVuY2UucG9zLnopO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0dWNrOiBkZWx0YSA8IGNvbmZpZy5taW5Nb3ZlbWVudFVuaXRzLFxuICAgICAgICBjb25maXJtTXM6IHNwYW4sXG4gICAgfTtcbn1cbi8qKlxuICogTmVhcmVzdCBzY2FubmVyIG9iamVjdCB3aXRoaW4gcmFuZ2UgYmVjb21lcyBcInRoZSBvYnN0YWNsZVwiIOKAlCBpdHNcbiAqIHBsYXllci1yZWxhdGl2ZSBiZWFyaW5nIGRyaXZlcyB0aGUgcmVmbGV4J3MgdHVybiBkaXJlY3Rpb24uXG4gKiBSZXR1cm5zIHVuZGVmaW5lZCB3aGVuIHRoZSBzY2FubmVyIHNlZXMgbm90aGluZyAoc3RhdGUgZ2FwKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5lYXJlc3RPYnN0YWNsZVJlbEJlYXJpbmcod29ybGRPYmplY3RzLCByYW5nZVVuaXRzKSB7XG4gICAgaWYgKHJhbmdlVW5pdHMgPT09IHZvaWQgMCkgeyByYW5nZVVuaXRzID0gU1RVQ0tfREVGQVVMVFMub2JzdGFjbGVSYW5nZVVuaXRzOyB9XG4gICAgZm9yICh2YXIgX2kgPSAwLCB3b3JsZE9iamVjdHNfMSA9IHdvcmxkT2JqZWN0czsgX2kgPCB3b3JsZE9iamVjdHNfMS5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgdmFyIG9iamVjdCA9IHdvcmxkT2JqZWN0c18xW19pXTtcbiAgICAgICAgLy8gVGhlIHNjYW5uZXIgY2FjaGUgaXMgZGlzdGFuY2Utc29ydGVkIG5lYXJlc3QtZmlyc3QuXG4gICAgICAgIGlmIChvYmplY3QuZGlzdGFuY2UgPD0gcmFuZ2VVbml0cylcbiAgICAgICAgICAgIHJldHVybiBvYmplY3QucmVsYXRpdmVEZWc7XG4gICAgICAgIGJyZWFrOyAvLyBmaXJzdCBlbnRyeSBpcyB0aGUgbmVhcmVzdDsgaWYgaXQncyBvdXQgb2YgcmFuZ2UsIGFsbCBhcmVcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiIsImltcG9ydCB7IGV2YWx1YXRlU3R1Y2ssIG5lYXJlc3RPYnN0YWNsZVJlbEJlYXJpbmcsIHB1c2hTdHVja1NhbXBsZSwgU1RVQ0tfREVGQVVMVFMsIH0gZnJvbSBcIi4uL3dvcmxkL3N0dWNrLWNvcmVcIjtcbi8qKlxuICogR2FtZS1mYWNpbmcgc3R1Y2sgZGV0ZWN0aW9uIChXMykuIFB1cmUgd2luZG93IG1hdGggbGl2ZXMgaW5cbiAqIHN0dWNrLWNvcmUudHM7IHRoaXMgZ2x1ZSBpcyBjYWxsZWQgb25jZSBwZXIgY29sbGVjdGlvbiBwYXNzIHdpdGggZGF0YSB0aGVcbiAqIGNvbGxlY3RvcnMgYWxyZWFkeSBnYXRoZXJlZCAocGxheWVyIHBvc2l0aW9uLCBXQVNEIGZyb20gdGhlIGlucHV0XG4gKiBjb2xsZWN0b3IsIHNjYW5uZXIgY2FjaGUpIOKAlCB6ZXJvIGV4dHJhIFBhcHlydXMgcHJvYmVzLlxuICpcbiAqIGBleGNsdWRlZGAgcmVzZXRzIHRoZSBjb25maXJtYXRpb24gd2luZG93OiBtZW51cy9sb2FkaW5nIChkZW55bGlzdCksXG4gKiBkZWF0aCwgc3dpbW1pbmcsIG1vdW50ZWQsIHNlYXRlZCwgZGlhbG9ndWUsIGF1dG93YWxrLlxuICovXG52YXIgaGlzdG9yeSA9IFtdO1xuZXhwb3J0IGZ1bmN0aW9uIGV2YWx1YXRlU3R1Y2tOb3coaW5wdXQpIHtcbiAgICB2YXIga2V5c0hlbGQgPSBpbnB1dC5rZXlzUHJlc3NlZC5zb21lKGZ1bmN0aW9uIChrZXkpIHsgcmV0dXJuIGtleSA9PT0gXCJXXCIgfHwga2V5ID09PSBcIkFcIiB8fCBrZXkgPT09IFwiU1wiIHx8IGtleSA9PT0gXCJEXCI7IH0pO1xuICAgIGhpc3RvcnkgPSBwdXNoU3R1Y2tTYW1wbGUoaGlzdG9yeSwge1xuICAgICAgICB0TXM6IGlucHV0LmdhbWVNcyxcbiAgICAgICAgcG9zOiBpbnB1dC5wb3MsXG4gICAgICAgIGtleXNIZWxkOiBrZXlzSGVsZCxcbiAgICAgICAgZXhjbHVkZWQ6IGlucHV0LmV4Y2x1ZGVkLFxuICAgIH0sIGlucHV0LmdhbWVNcyk7XG4gICAgdmFyIGV2YWx1YXRpb24gPSBldmFsdWF0ZVN0dWNrKGhpc3RvcnksIGlucHV0LmdhbWVNcyk7XG4gICAgdmFyIGJlYXJpbmcgPSBldmFsdWF0aW9uLnN0dWNrXG4gICAgICAgID8gbmVhcmVzdE9ic3RhY2xlUmVsQmVhcmluZyhpbnB1dC53b3JsZE9iamVjdHMsIFNUVUNLX0RFRkFVTFRTLm9ic3RhY2xlUmFuZ2VVbml0cylcbiAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgcmV0dXJuIHsgc3R1Y2s6IGV2YWx1YXRpb24uc3R1Y2ssIGJlYXJpbmdSZWxEZWc6IGJlYXJpbmcgfTtcbn1cbi8qKiBUZXN0IHNlYW0uICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRTdHVja0RldGVjdGlvbkZvclRlc3QoKSB7XG4gICAgaGlzdG9yeSA9IFtdO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZnNcIik7IiwibW9kdWxlLmV4cG9ydHMgPSBza3lyaW1QbGF0Zm9ybTsiLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdGlmICghKG1vZHVsZUlkIGluIF9fd2VicGFja19tb2R1bGVzX18pKSB7XG5cdFx0ZGVsZXRlIF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdFx0dmFyIGUgPSBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiICsgbW9kdWxlSWQgKyBcIidcIik7XG5cdFx0ZS5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuXHRcdHRocm93IGU7XG5cdH1cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuaW1wb3J0IHsgb25jZSwgb24sIHByaW50Q29uc29sZSwgaG9va3MsIGZpbmRDb25zb2xlQ29tbWFuZCwgVXRpbGl0eSB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG5pbXBvcnQgeyByZWdpc3RlckFsbEV2ZW50cyB9IGZyb20gXCIuL2V2ZW50c1wiO1xuaW1wb3J0IHsgaXRlbUV2ZW50SGFuZGxlcnMsIGhhc1BlbmRpbmdJdGVtRXZlbnQgfSBmcm9tIFwiLi9nYW1lLXN0YXRlL2NvbGxlY3RvcnMvaXRlbS1ldmVudHNcIjtcbmltcG9ydCB7IHN0YXJ0UG9sbGluZyB9IGZyb20gXCIuL2FjdGlvbnMvcG9sbGluZ1wiO1xuaW1wb3J0IHsgZXZhbHVhdGVQcmlvcml0eSwgc2hvdWxkU2VuZCwgcmVjb3JkU2VudFN0YXRlIH0gZnJvbSBcIi4vYXJiaXRyYXRpb24vcHJpb3JpdHlcIjtcbmltcG9ydCB7IHNlcmlhbGl6ZVN0YXRlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9zZXJpYWxpemVyXCI7XG5pbXBvcnQgeyBjb2xsZWN0QnVuZGxlIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9jb2xsZWN0b3JcIjtcbmltcG9ydCB7IGJ1aWxkTW9kQ29udGV4dCB9IGZyb20gXCIuL2dhbWUtc3RhdGUvbW9kLWNvbnRleHRcIjtcbmltcG9ydCB7IGR1bXBNb2RDb250ZXh0IH0gZnJvbSBcIi4vY29tbXVuaWNhdGlvbi9maWxlLWR1bXBcIjtcbmltcG9ydCB7IGluaXRXb3JsZFNjYW5uZXIsIHB1bXBXb3JsZFNjYW5uZXIsIGdldFdvcmxkT2JqZWN0cyB9IGZyb20gXCIuL2dhbWUtc3RhdGUvY29sbGVjdG9ycy93b3JsZC1zY2FubmVyXCI7XG5pbXBvcnQgeyBpbml0TG9vdFRyYWNrZXIgfSBmcm9tIFwiLi93b3JsZC9sb290LXRyYWNrZXJcIjtcbmltcG9ydCB7IGluaXRFZmZlY3RzVHJhY2tlciB9IGZyb20gXCIuL2dhbWUtc3RhdGUvY29sbGVjdG9ycy9lZmZlY3RzLXRyYWNrZXJcIjtcbmltcG9ydCB7IGluaXRBdXRvd2FsayB9IGZyb20gXCIuL3dvcmxkL2F1dG93YWxrXCI7XG5pbXBvcnQgeyBzZW5kR2FtZVN0YXRlLCBpc0Nvbm5lY3RlZCB9IGZyb20gXCIuL2NvbW11bmljYXRpb24vaHR0cC1jbGllbnRcIjtcbmltcG9ydCB7IGluaXRCcmlkZ2UsIGlzQ29tcGFuaW9uUmVhZHksIGhlYXJ0YmVhdEFnZU1zLCBpc092ZXJsYXlWaXNpYmxlLCB9IGZyb20gXCIuL2JyaWRnZVwiO1xuaW1wb3J0IHsgQ09ORklHLCBQTEFZRVJfRk9STV9JRCB9IGZyb20gXCIuL2NvbmZpZ1wiO1xuaW1wb3J0IHsgbG9nRGlhZyB9IGZyb20gXCIuL2RpYWdcIjtcbmltcG9ydCB7IGlzU2t5cmltQWNjZXNzSW5zdGFsbGVkIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9za3lyaW0tYWNjZXNzXCI7XG5pbXBvcnQgeyBiZWdpbk1lbnVGb2N1c1NlbmQsIGNvbW1pdE1lbnVGb2N1c1NlbmQsIGhhc1BlbmRpbmdNZW51Rm9jdXMsIHBlZWtNZW51Rm9jdXMsIHB1bXBNZW51Rm9jdXMsIH0gZnJvbSBcIi4vZ2FtZS1zdGF0ZS9jb2xsZWN0b3JzL21lbnUtZm9jdXNcIjtcbmltcG9ydCB7IGdldFBsYXRmb3JtVmVyc2lvbiB9IGZyb20gXCIuL3NreXJpbVBsYXRmb3JtXCI7XG52YXIgbGFzdFRpY2tUaW1lID0gMDtcbnZhciBwbGF5ZXJBbmltYXRpb24gPSBcIlwiO1xudmFyIGV2ZW50c1JlZ2lzdGVyZWQgPSBmYWxzZTtcbnZhciBwb2xsaW5nU3RhcnRlZCA9IGZhbHNlO1xudmFyIGxhc3RDb21iYXRTdGF0ZSA9IDA7XG52YXIgQ09MTEVDVE9SU19DT1VOVCA9IDg7XG4vKipcbiAqIGZpbmRDb25zb2xlQ29tbWFuZCBvbmx5IHJlc29sdmVzIGJ1aWx0LWluIFNDUklQVF9GVU5DVElPTiBlbnRyaWVzOyBpdCBjYW5ub3QgaW52ZW50IG5ldyBjb21tYW5kcy5cbiAqIFdlIHJlcHVycG9zZSBhbiBleGlzdGluZyBzbG90IGFuZCByZW5hbWUgaXQgdG8gXCJza3lndWlkZVwiIChzZWUgc2t5bXAvZG9jcy9za3lyaW1fcGxhdGZvcm0vZmVhdHVyZXMubWQpLlxuICovXG52YXIgSE9TVF9DT05TT0xFX0NPTU1BTkRfRk9SX1NLWUdVSURFID0gXCJHZXRBVkluZm9cIjtcbmZ1bmN0aW9uIHJlZ2lzdGVyU2t5Z3VpZGVDb25zb2xlQ29tbWFuZCgpIHtcbiAgICB2YXIgaG9zdCA9IGZpbmRDb25zb2xlQ29tbWFuZChIT1NUX0NPTlNPTEVfQ09NTUFORF9GT1JfU0tZR1VJREUpO1xuICAgIGlmICghaG9zdCkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIENvbnNvbGUgaG9vayBmYWlsZWQ6IG5vIFxcXCJcIi5jb25jYXQoSE9TVF9DT05TT0xFX0NPTU1BTkRfRk9SX1NLWUdVSURFLCBcIlxcXCIgY29tbWFuZCAodW5leHBlY3RlZCkuXCIpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBob3N0LmxvbmdOYW1lID0gXCJza3lndWlkZVwiO1xuICAgIGhvc3Quc2hvcnROYW1lID0gXCJcIjtcbiAgICBob3N0Lm51bUFyZ3MgPSAwO1xuICAgIGhvc3QuZXhlY3V0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2t5R3VpZGUgU3RhdHVzOlwiKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBQbGF0Zm9ybSB2ZXJzaW9uOiBcIi5jb25jYXQoZ2V0UGxhdGZvcm1WZXJzaW9uKCkpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb25uZWN0ZWQ6IFwiLmNvbmNhdChpc0Nvbm5lY3RlZCgpKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgUG9sbGluZyBzdGF0dXM6IFwiLmNvbmNhdChwb2xsaW5nU3RhcnRlZCA/IFwiYWN0aXZlXCIgOiBcImluYWN0aXZlXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBFdmVudHMgcmVnaXN0ZXJlZDogXCIuY29uY2F0KGV2ZW50c1JlZ2lzdGVyZWQgPyBcInllc1wiIDogXCJub1wiKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgQ29sbGVjdG9ycyBjb3VudDogXCIuY29uY2F0KENPTExFQ1RPUlNfQ09VTlQpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBTZXJ2ZXI6IFwiLmNvbmNhdChDT05GSUcuc2VydmVyVXJsKSk7XG4gICAgICAgIHByaW50Q29uc29sZShcIiAgU2VuZCBpbnRlcnZhbDogXCIuY29uY2F0KENPTkZJRy50aWNrSW50ZXJ2YWwsIFwibXMgKG9uIHVwZGF0ZSlcIikpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIERlYnVnIG1vZGU6IFwiLmNvbmNhdChDT05GSUcuZGVidWdNb2RlKSk7XG4gICAgICAgIHZhciBoZWFydGJlYXQgPSBoZWFydGJlYXRBZ2VNcygpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIENvbXBhbmlvbiBicmlkZ2U6IFwiLmNvbmNhdChpc0NvbXBhbmlvblJlYWR5KCkgPyBcInJlYWR5IChoZWFydGJlYXQgXCIuY29uY2F0KGhlYXJ0YmVhdCwgXCJtcyBhZ28pXCIpIDogXCJub3QgcmVhZHlcIiwgXCIsIG92ZXJsYXkgXCIpLmNvbmNhdChpc092ZXJsYXlWaXNpYmxlKCkgPyBcInZpc2libGVcIiA6IFwiaGlkZGVuXCIpKTtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiICBDb21wYW5pb24gVVJMOiBcIi5jb25jYXQoQ09ORklHLmNvbXBhbmlvblVybCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIE1vZC1jb250ZXh0IGR1bXA6IFwiLmNvbmNhdChDT05GSUcubW9kQ29udGV4dER1bXBFbmFibGVkID8gQ09ORklHLm1vZENvbnRleHRQYXRoIDogXCJvZmZcIikpO1xuICAgICAgICBwcmludENvbnNvbGUoXCIgIFdvcmxkIHNjYW5uZXI6IFwiLmNvbmNhdChDT05GSUcuc2Nhbm5lckVuYWJsZWQgPyBcIm9uIChcIi5jb25jYXQoZ2V0V29ybGRPYmplY3RzKCkubGVuZ3RoLCBcIiBvYmplY3RzIGNhY2hlZClcIikgOiBcIm9mZlwiKSk7XG4gICAgICAgIC8vIFJldHVybmluZyBmYWxzZSBhdm9pZHMgcnVubmluZyB0aGUgb3JpZ2luYWwgaG9zdCBjb21tYW5kIGltcGxlbWVudGF0aW9uLlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIENvbnNvbGU6IH5cIi5jb25jYXQoSE9TVF9DT05TT0xFX0NPTU1BTkRfRk9SX1NLWUdVSURFLCBcIiBpcyBub3cgfnNreWd1aWRlXCIpKTtcbiAgICB9XG59XG4vKipcbiAqIEVtYmVkIHRoZSBwYXJhbGxlbC1hcnJheSBtb2QgY29udGV4dCBpbnRvIHRoZSBzZXJpYWxpemVkIHByb3RvY29sIHBheWxvYWRcbiAqIGFzIHRoZSBhZGRpdGl2ZSBgY29udGV4dGAgZmllbGQgKEFEUiAwMDAzIGNvbnRleHQgbGFuZSBvdmVyIEhUVFApLiBUaGVcbiAqIHBheWxvYWQgaXMgYSBKU09OIHN0cmluZzsgcGFyc2UvcmUtc3RyaW5naWZ5IG9ubHkgd2hlbiBhIGNvbnRleHQgZXhpc3RzLlxuICovXG5mdW5jdGlvbiBhdHRhY2hDb250ZXh0KHBheWxvYWQsIG1vZENvbnRleHQpIHtcbiAgICBpZiAobW9kQ29udGV4dCA9PT0gbnVsbCB8fCBtb2RDb250ZXh0ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBwYXlsb2FkO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBvYmogPSBKU09OLnBhcnNlKHBheWxvYWQpO1xuICAgICAgICBvYmouY29udGV4dCA9IG1vZENvbnRleHQ7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmopO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIHBheWxvYWQ7XG4gICAgfVxufVxuZnVuY3Rpb24gcHJvY2Vzc0FuZFNlbmQoZXZlbnRUeXBlLCBhbmltYXRpb24pIHtcbiAgICB2YXIgX2E7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICB2YXIgYnVuZGxlID0gY29sbGVjdEJ1bmRsZShhbmltYXRpb24sIGV2ZW50VHlwZSk7XG4gICAgaWYgKCFidW5kbGUpIHtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gY29sbGVjdEJ1bmRsZSByZXR1cm5lZCBudWxsOyBza2lwIHNlbmRcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBNb2QtY29udGV4dCBkdW1wOiBmaWxlIGxhbmUgd2hlbiBOb2RlIGZzIGFsbG93cyBpdCAoZGlzYWJsZWQgaW4gdGhlIFNQXG4gICAgLy8gcnVudGltZSksIEFMV0FZUyBhdHRhY2hlZCB0byB0aGUgUE9TVCBhcyB0aGUgYWRkaXRpdmUgYGNvbnRleHRgIGZpZWxkIOKAlFxuICAgIC8vIHRoZSBhcHAncyBjb25uZWN0b3IgZmFsbHMgYmFjayB0byBpdCB3aGVuIHRoZSBmaWxlIG5ldmVyIGFwcGVhcnMuXG4gICAgdmFyIHN0YXRlID0gYnVuZGxlLnByb3RvY29sO1xuICAgIHZhciBtb2RDb250ZXh0ID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBtb2RDb250ZXh0ID0gYnVpbGRNb2RDb250ZXh0KGJ1bmRsZS5zbmFwc2hvdCwgc3RhdGUsIHsgc2t5cmltQWNjZXNzSW5zdGFsbGVkOiBpc1NreXJpbUFjY2Vzc0luc3RhbGxlZCgpIH0pO1xuICAgICAgICBkdW1wTW9kQ29udGV4dChtb2RDb250ZXh0KTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBtb2QtY29udGV4dCBkdW1wIHRocmV3OiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzQ29ubmVjdGVkKCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcHJpb3JpdHkgPSBldmFsdWF0ZVByaW9yaXR5KHN0YXRlKTtcbiAgICB2YXIgbWVudUV2ZW50ID0gKF9hID0gc3RhdGUubWVudSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmV2ZW50O1xuICAgIC8vIEl0ZW0tYWN0aW9uIGV2ZW50cyBoYXZlIG5vIGNvbW1pdCBzZW1hbnRpY3MgKGZpcmUtYW5kLWZvcmdldCkg4oCUIG9ubHkgYVxuICAgIC8vIHJlYWwgc3RhZ2VkIG1lbnUtZm9jdXMgZXZlbnQgZW50ZXJzIHRoZSBwZW5kaW5nL2luRmxpZ2h0IGhhbmRzaGFrZS5cbiAgICB2YXIgc3RhZ2VkTWVudUZvY3VzID0gcGVla01lbnVGb2N1cygpICE9PSB1bmRlZmluZWQ7XG4gICAgdmFyIG1lbnVQb3N0ZWQgPSBCb29sZWFuKG1lbnVFdmVudCkgJiYgc3RhZ2VkTWVudUZvY3VzO1xuICAgIGlmICghbWVudUV2ZW50ICYmICFzaG91bGRTZW5kKHByaW9yaXR5LCBzdGF0ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcGF5bG9hZCA9IGF0dGFjaENvbnRleHQoc2VyaWFsaXplU3RhdGUoc3RhdGUsIHByaW9yaXR5KSwgbW9kQ29udGV4dCk7XG4gICAgaWYgKG1lbnVQb3N0ZWQpIHtcbiAgICAgICAgYmVnaW5NZW51Rm9jdXNTZW5kKCk7XG4gICAgfVxuICAgIHNlbmRHYW1lU3RhdGUocGF5bG9hZClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHNlbnQpIHtcbiAgICAgICAgaWYgKG1lbnVQb3N0ZWQpIHtcbiAgICAgICAgICAgIGNvbW1pdE1lbnVGb2N1c1NlbmQoc2VudCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbnQpIHtcbiAgICAgICAgICAgIHJlY29yZFNlbnRTdGF0ZShzdGF0ZSk7XG4gICAgICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgICAgIHByaW50Q29uc29sZShcIlNlbnQgc3RhdGU6IFwiLmNvbmNhdChwcmlvcml0eSwgXCIgcHJpb3JpdHkgKFwiKS5jb25jYXQoZXZlbnRUeXBlLCBcIilcIikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSlcbiAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKG1lbnVQb3N0ZWQpIHtcbiAgICAgICAgICAgIGNvbW1pdE1lbnVGb2N1c1NlbmQoZmFsc2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtc2cgPSBlcnIgaW5zdGFuY2VvZiBFcnJvciA/IGVyci5tZXNzYWdlIDogU3RyaW5nKGVycik7XG4gICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIEZhaWxlZCB0byBzZW5kIGdhbWUgc3RhdGU6IFwiLmNvbmNhdChtc2cpKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gc2FmZVByb2Nlc3NBbmRTZW5kKGV2ZW50VHlwZSwgYW5pbWF0aW9uKSB7XG4gICAgaWYgKGFuaW1hdGlvbiA9PT0gdm9pZCAwKSB7IGFuaW1hdGlvbiA9IFwiXCI7IH1cbiAgICB0cnkge1xuICAgICAgICBwcm9jZXNzQW5kU2VuZChldmVudFR5cGUsIGFuaW1hdGlvbik7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgdmFyIG1zZyA9IGVyciBpbnN0YW5jZW9mIEVycm9yID8gZXJyLm1lc3NhZ2UgOiBTdHJpbmcoZXJyKTtcbiAgICAgICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgICAgIHByaW50Q29uc29sZShcIltTa3lHdWlkZV0gcHJvY2Vzc0FuZFNlbmQgZmFpbGVkIChcIi5jb25jYXQoZXZlbnRUeXBlLCBcIik6IFwiKS5jb25jYXQobXNnKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG52YXIgaXNMb2FkZWQgPSBmYWxzZTtcbi8qKlxuICogQWNjZXNzaWJpbGl0eSBRb0wgc3dpdGNoZXMgKHZlcmlmaWVkIEFQSXMsIHBhdHRlcm5zIGZyb20gc2t5bXA1LWNsaWVudCk6XG4gKiAgLSBiQWx3YXlzQWN0aXZlOiB0aGUgZ2FtZSBrZWVwcyBzaW11bGF0aW5nIHdoaWxlIHVuZm9jdXNlZC9hbHQtdGFiYmVkIOKAlFxuICogICAgY3JpdGljYWwgZm9yIGJsaW5kIHBsYXllcnMgd2hvIG11c3QgbGVhdmUgdGhlIHdpbmRvdyBmb3Igb3RoZXIgdG9vbHMuXG4gKiAgLSBmQXV0b1Zhbml0eU1vZGVEZWxheTogc3VwcHJlc3MgdGhlIGF1dG8tcm90YXRpbmcgdmFuaXR5IGNhbWVyYSAoMzYwMHMpLlxuICovXG5mdW5jdGlvbiBhcHBseUdhbWVRb2xTZXR0aW5ncygpIHtcbiAgICB0cnkge1xuICAgICAgICBVdGlsaXR5LnNldElOSUJvb2woXCJiQWx3YXlzQWN0aXZlOkdlbmVyYWxcIiwgdHJ1ZSk7XG4gICAgfVxuICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBiQWx3YXlzQWN0aXZlIElOSSBzZXQgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgVXRpbGl0eS5zZXRJTklGbG9hdChcImZBdXRvVmFuaXR5TW9kZURlbGF5OkNhbWVyYVwiLCAzNjAwKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIHZhbml0eSBtb2RlIElOSSBzZXQgZmFpbGVkOiBcIi5jb25jYXQoU3RyaW5nKGVycikpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBpbml0KCkge1xuICAgIGlmIChpc0xvYWRlZClcbiAgICAgICAgcmV0dXJuO1xuICAgIHByaW50Q29uc29sZShcIlNreUd1aWRlIHBsdWdpbiBsb2FkZWQhXCIpO1xuICAgIGxvZ0RpYWcoXCJbU2t5R3VpZGVdIHBsdWdpbiBpbml0IFxcdTIwMTQgZHVtcD1cIi5jb25jYXQoQ09ORklHLm1vZENvbnRleHREdW1wRW5hYmxlZCA/IENPTkZJRy5tb2RDb250ZXh0UGF0aCA6IFwib2ZmXCIsIFwiIHNlcnZlcj1cIikuY29uY2F0KENPTkZJRy5zZXJ2ZXJVcmwsIFwiIG1lbnVOYXJyYXRpb249XCIpLmNvbmNhdChDT05GSUcubWVudU5hcnJhdGlvbkVuYWJsZWQsIFwiIGF1dG93YWxrPVwiKS5jb25jYXQoQ09ORklHLmF1dG93YWxrRW5hYmxlZCkpO1xuICAgIC8vIEdhbWUgc2V0dGluZ3MgY2FuIG9ubHkgYmUgdG91Y2hlZCBvbmNlIGEgZ2FtZSB3b3JsZCBleGlzdHMg4oCUIGNhbGxpbmcgdGhpc1xuICAgIC8vIGF0IHRoZSBtYWluIG1lbnUgdGhyb3dzLiBTZWUgdGhlIG9uY2UoXCJ1cGRhdGVcIikgaG9vayBiZWxvdy5cbiAgICBvbmNlKFwidXBkYXRlXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgYXBwbHlHYW1lUW9sU2V0dGluZ3MoKTtcbiAgICB9KTtcbiAgICByZWdpc3RlckFsbEV2ZW50cyhfX2Fzc2lnbih7fSwgaXRlbUV2ZW50SGFuZGxlcnMoKSkpO1xuICAgIGV2ZW50c1JlZ2lzdGVyZWQgPSB0cnVlO1xuICAgIGluaXRXb3JsZFNjYW5uZXIoKTtcbiAgICBpbml0TG9vdFRyYWNrZXIoKTtcbiAgICBpbml0RWZmZWN0c1RyYWNrZXIoKTtcbiAgICBpbml0QXV0b3dhbGsoKTtcbiAgICBzdGFydFBvbGxpbmcoKTtcbiAgICBwb2xsaW5nU3RhcnRlZCA9IENPTkZJRy5wb2xsaW5nRW5hYmxlZDtcbiAgICBpbml0QnJpZGdlKCk7XG4gICAgaWYgKENPTkZJRy5kZWJ1Z01vZGUpIHtcbiAgICAgICAgcHJpbnRDb25zb2xlKFwiU2VydmVyOiBcIi5jb25jYXQoQ09ORklHLnNlcnZlclVybCkpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJTZW5kIGludGVydmFsOiBcIi5jb25jYXQoQ09ORklHLnRpY2tJbnRlcnZhbCwgXCJtcyAob24gdXBkYXRlKVwiKSk7XG4gICAgfVxuICAgIC8vIFJlZ2lzdGVyIGJlZm9yZSBob29rcy5zZW5kQW5pbWF0aW9uRXZlbnQ7IGlmIHRoYXQgdGhyb3dzIChlLmcuIG1haW4gbWVudSBzdGF0ZSksIHdlIHN0aWxsIGdldCBhIH4gY29tbWFuZC5cbiAgICB0cnkge1xuICAgICAgICByZWdpc3RlclNreWd1aWRlQ29uc29sZUNvbW1hbmQoKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2YXIgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIENvbnNvbGUgY29tbWFuZCByZWdpc3RyYXRpb24gZmFpbGVkOiBcIi5jb25jYXQobXNnKSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGhvb2tzLnNlbmRBbmltYXRpb25FdmVudC5hZGQoe1xuICAgICAgICAgICAgZW50ZXI6IGZ1bmN0aW9uIChjdHgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsaWRBdHRhY2tzID0gW1xuICAgICAgICAgICAgICAgICAgICBcImF0dGFja2xlZnRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2tyaWdodFwiLFxuICAgICAgICAgICAgICAgICAgICBcImF0dGFja2tpY2tcIixcbiAgICAgICAgICAgICAgICAgICAgXCJhdHRhY2szXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiYXR0YWNrdGhyb3dcIlxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgdmFyIGV2ZW50TG93ZXIgPSBjdHguYW5pbUV2ZW50TmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgIGlmICh2YWxpZEF0dGFja3Muc29tZShmdW5jdGlvbiAoYXR0YWNrKSB7IHJldHVybiBldmVudExvd2VyLmluY2x1ZGVzKGF0dGFjayk7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHBsYXllckFuaW1hdGlvbiA9IGN0eC5hbmltRXZlbnROYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZWF2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBQTEFZRVJfRk9STV9JRCwgUExBWUVSX0ZPUk1fSUQsIFwiQXR0YWNrKlwiKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2YXIgbXNnID0gZXJyIGluc3RhbmNlb2YgRXJyb3IgPyBlcnIubWVzc2FnZSA6IFN0cmluZyhlcnIpO1xuICAgICAgICBwcmludENvbnNvbGUoXCJbU2t5R3VpZGVdIHNlbmRBbmltYXRpb25FdmVudCBob29rIGZhaWxlZCAobm9uLWZhdGFsKTogXCIuY29uY2F0KG1zZykpO1xuICAgIH1cbiAgICBpc0xvYWRlZCA9IHRydWU7XG59XG4vLyBTa3lyaW0gUGxhdGZvcm0gb25seSBlbWl0cyBcInVwZGF0ZVwiIG9uY2UgYSBnYW1lIHdvcmxkIGV4aXN0cyAoSnNUaWNrIHBhc3Nlc1xuLy8gZ2FtZUZ1bmN0aW9uc0F2YWlsYWJsZT1mYWxzZSBhdCB0aGUgbWFpbiBtZW51LCB3aGVyZSBvbmx5IFwidGlja1wiIGZpcmVzKS5cbi8vIEluaXRpYWxpemUgb24gd2hpY2hldmVyIGFycml2ZXMgZmlyc3Qgc28gdGhlIGNvbnNvbGUgY29tbWFuZCBhbmQgdGhlXG4vLyBtb2QtY29udGV4dCBkdW1wIGV4aXN0IGJlZm9yZSB0aGUgcGxheWVyIGxvYWRzIGEgc2F2ZS5cbm9uY2UoXCJ0aWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICBpbml0KCk7XG59KTtcbm9uY2UoXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKCkge1xuICAgIGluaXQoKTtcbn0pO1xub24oXCJ1cGRhdGVcIiwgZnVuY3Rpb24gKCkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIHRyeSB7XG4gICAgICAgIHB1bXBNZW51Rm9jdXMobm93KTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoQ09ORklHLmRlYnVnTW9kZSkge1xuICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSBtZW51IGZvY3VzIHB1bXAgdGhyZXc6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBtZW51RHVlID0gKGhhc1BlbmRpbmdNZW51Rm9jdXMoKSB8fCBoYXNQZW5kaW5nSXRlbUV2ZW50KCkpICYmIGlzQ29ubmVjdGVkKCk7XG4gICAgdmFyIGZ1bGxUaWNrID0gbm93IC0gbGFzdFRpY2tUaW1lID49IENPTkZJRy50aWNrSW50ZXJ2YWw7XG4gICAgaWYgKCFmdWxsVGljayAmJiAhbWVudUR1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChmdWxsVGljaykge1xuICAgICAgICBsYXN0VGlja1RpbWUgPSBub3c7XG4gICAgfVxuICAgIC8vIEJ1ZGdldGVkIHdvcmxkLXNjYW5uZXIgcGFzcyDigJQgc2tpcCBvbiBtZW51LW9ubHkgc2VuZHMgc28gYXJyb3dpbmcgYVxuICAgIC8vIGxpc3QgZG9lcyBub3QgaGl0Y2ggdGhlIGdhbWUgdGhyZWFkIHdpdGggYSBjZWxsIHN3ZWVwLlxuICAgIGlmIChmdWxsVGljaykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHVtcFdvcmxkU2Nhbm5lcigpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgICAgICAgICAgcHJpbnRDb25zb2xlKFwiW1NreUd1aWRlXSB3b3JsZCBzY2FubmVyIHB1bXAgdGhyZXc6IFwiLmNvbmNhdChTdHJpbmcoZXJyKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBhbmltYXRpb24gPSBwbGF5ZXJBbmltYXRpb247XG4gICAgcGxheWVyQW5pbWF0aW9uID0gXCJcIjtcbiAgICBzYWZlUHJvY2Vzc0FuZFNlbmQoXCJ0aWNrXCIsIGFuaW1hdGlvbik7XG59KTtcbm9uKFwiY29tYmF0U3RhdGVcIiwgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgdmFyIGFjdG9yID0gZXZlbnQuYWN0b3IuZ2V0Rm9ybUlEKCk7XG4gICAgaWYgKGFjdG9yICE9PSBQTEFZRVJfRk9STV9JRClcbiAgICAgICAgcmV0dXJuO1xuICAgIHZhciBuZXdTdGF0ZSA9IGV2ZW50LmlzQ29tYmF0ID8gMSA6IGV2ZW50LmlzU2VhcmNoaW5nID8gMiA6IDA7XG4gICAgdmFyIG9sZFN0YXRlID0gbGFzdENvbWJhdFN0YXRlO1xuICAgIGxhc3RDb21iYXRTdGF0ZSA9IG5ld1N0YXRlO1xuICAgIHNhZmVQcm9jZXNzQW5kU2VuZChcImNvbWJhdFN0YXRlX1wiLmNvbmNhdChuZXdTdGF0ZSkpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIkNvbWJhdCBzdGF0ZSBjaGFuZ2VkOiBcIi5jb25jYXQob2xkU3RhdGUsIFwiIC0+IFwiKS5jb25jYXQobmV3U3RhdGUpKTtcbiAgICB9XG59KTtcbm9uKFwiaGl0XCIsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIHZhciBfYSwgX2IsIF9jLCBfZCwgX2UsIF9mLCBfZywgX2g7XG4gICAgdmFyIHRhcmdldCA9IChfYyA9IChfYiA9IChfYSA9IGV2ZW50LnRhcmdldCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmdldEZvcm1JRCkgPT09IG51bGwgfHwgX2IgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9iLmNhbGwoX2EpKSAhPT0gbnVsbCAmJiBfYyAhPT0gdm9pZCAwID8gX2MgOiAwO1xuICAgIHZhciBzb3VyY2UgPSAoX2YgPSAoX2UgPSAoX2QgPSBldmVudC5hZ2dyZXNzb3IpID09PSBudWxsIHx8IF9kID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZC5nZXRGb3JtSUQpID09PSBudWxsIHx8IF9lID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZS5jYWxsKF9kKSkgIT09IG51bGwgJiYgX2YgIT09IHZvaWQgMCA/IF9mIDogMDtcbiAgICB2YXIgc291cmNlQmFzZUZvcm0gPSAoX2ggPSAoX2cgPSBldmVudC5zb3VyY2UpID09PSBudWxsIHx8IF9nID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfZy5nZXRGb3JtSUQpID09PSBudWxsIHx8IF9oID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfaC5jYWxsKF9nKTtcbiAgICBpZiAodGFyZ2V0ICE9PSBQTEFZRVJfRk9STV9JRCAmJiBzb3VyY2UgIT09IFBMQVlFUl9GT1JNX0lEKVxuICAgICAgICByZXR1cm47XG4gICAgc2FmZVByb2Nlc3NBbmRTZW5kKFwiaGl0XCIpO1xuICAgIGlmIChDT05GSUcuZGVidWdNb2RlKSB7XG4gICAgICAgIHByaW50Q29uc29sZShcIkhpdCBldmVudDogdGFyZ2V0PVwiLmNvbmNhdCh0YXJnZXQsIFwiLCBzb3VyY2U9XCIpLmNvbmNhdChzb3VyY2UsIFwiLCBzb3VyY2VGb3JtPVwiKS5jb25jYXQoU3RyaW5nKHNvdXJjZUJhc2VGb3JtKSkpO1xuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9