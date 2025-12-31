"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kasa_controller_1 = require("../controllers/kasa.controller");
const router = (0, express_1.Router)();
router.get('/', kasa_controller_1.getKasa);
router.get('/varlik', kasa_controller_1.getVarlik);
exports.default = router;
