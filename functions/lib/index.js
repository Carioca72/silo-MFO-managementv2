"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Import all routes
const study_1 = __importDefault(require("./routes/study"));
const advisor_1 = __importDefault(require("./routes/advisor"));
const automation_1 = __importDefault(require("./routes/automation"));
const boletos_1 = __importDefault(require("./routes/boletos"));
const clients_1 = __importDefault(require("./routes/clients"));
const comdinheiro_1 = __importDefault(require("./routes/comdinheiro"));
const crm_webhook_1 = __importDefault(require("./routes/crm-webhook"));
const email_1 = __importDefault(require("./routes/email"));
const reports_1 = __importDefault(require("./routes/reports"));
const tools_1 = __importDefault(require("./routes/tools"));
const triggers_1 = __importDefault(require("./routes/triggers"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Register all API routes
app.use('/api/studies', study_1.default);
app.use('/api/advisor', advisor_1.default);
app.use('/api/automation', automation_1.default);
app.use('/api/boletos', boletos_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/cmd', comdinheiro_1.default);
app.use('/api/crm', crm_webhook_1.default);
app.use('/api/email', email_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/tools', tools_1.default);
app.use('/api/triggers', triggers_1.default);
// 404 handler for unknown API routes
app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});
// Export as Firebase Cloud Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map