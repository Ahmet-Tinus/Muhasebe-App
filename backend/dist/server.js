"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const islem_routes_1 = __importDefault(require("./routes/islem.routes"));
const kasa_routes_1 = __importDefault(require("./routes/kasa.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/islemler', islem_routes_1.default);
app.use('/api/kasa', kasa_routes_1.default);
// Test route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Muhasebe API çalışıyor',
        timestamp: new Date().toISOString()
    });
});
// Server başlat
app.listen(PORT, async () => {
    console.log(`🚀 Server ${PORT} portunda çalışıyor`);
    console.log(`📍 http://localhost:${PORT}`);
    // Database'i başlat
    await (0, database_1.initDatabase)();
    //await runMigrations();
});
