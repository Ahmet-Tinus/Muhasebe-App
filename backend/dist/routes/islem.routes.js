"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const islem_controller_1 = require("../controllers/islem.controller");
const router = (0, express_1.Router)();
router.get('/', islem_controller_1.getIslemler);
router.post('/', islem_controller_1.addIslem);
router.delete('/:id', islem_controller_1.deleteIslem);
exports.default = router;
