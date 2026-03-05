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
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
// Import all routes
// import studyRoutes from './routes/study';
const advisor_1 = __importDefault(require("./routes/advisor"));
const automation_1 = __importDefault(require("./routes/automation"));
const boletos_1 = __importDefault(require("./routes/boletos"));
const clients_1 = __importDefault(require("./routes/clients"));
const comdinheiro_1 = __importDefault(require("./routes/comdinheiro"));
const crm_webhook_1 = __importDefault(require("./routes/crm-webhook"));
const email_1 = __importDefault(require("./routes/email"));
// import portfolioRoutes from './routes/portfolio';
// import reportsRoutes from './routes/reports';
// import swiftRoutes from './routes/swift';
const triggers_1 = __importDefault(require("./routes/triggers"));
// import whatsappRoutes from './routes/whatsapp';
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rota de Teste
app.get('/', (_req, res) => {
    res.send('Servidor FinAssist API está no ar!');
});
// Register all routes
// app.use('/api/study', studyRoutes);
app.use('/api/advisor', advisor_1.default);
app.use('/api/automation', automation_1.default);
app.use('/api/boletos', boletos_1.default);
app.use('/api/clients', clients_1.default);
app.use('/api/cmd', comdinheiro_1.default);
app.use('/api/crm', crm_webhook_1.default);
app.use('/api/email', email_1.default);
// app.use('/api/portfolio', portfolioRoutes);
// app.use('/api/reports', reportsRoutes);
// app.use('/api/swift', swiftRoutes);
app.use('/api/triggers', triggers_1.default);
// app.use('/api/wa', whatsappRoutes);
// Expose the Express API as a single Cloud Function
exports.api = functions.https.onRequest(app);
// NOTE: Socket.IO does not work out-of-the-box on Firebase Cloud Functions' HTTP triggers.
// A different approach is needed for real-time communication, like using the Firebase Realtime Database,
// Firestore listeners, or a dedicated WebSocket service. The code below will not work as expected.
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*'
    },
});
global.io = io;
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
//# sourceMappingURL=index.js.map