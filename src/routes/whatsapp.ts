import express from 'express';
const router = express.Router();

let sessions: any[] = [
 {id:'s1',nome:'Silo Principal',status:'connected',
 numero:'+55 81 3333-0001',createdAt:new Date().toISOString()},
 {id:'s2',nome:'Silo Relatórios',status:'disconnected',
 createdAt:new Date().toISOString()},
];

router.get('/sessions', (_,res) => res.json(sessions));

router.post('/sessions', (req,res) => {
 const {nome} = req.body;
 const s = {id:'s'+Date.now(),nome,status:'disconnected',
 createdAt:new Date().toISOString()};
 sessions.push(s); res.status(201).json(s);
});

router.post('/sessions/:id/connect', (req,res) => {
 const {id} = req.params;
 sessions = sessions.map(s=>s.id===id?{...s,status:'qr'}:s);
 const io = (global as any).io;
 if (io) {
 // Produção: WPPConnect.start(id).onQR(qr => io.emit('wa:qr:'+id, {qr}))
 setTimeout(()=>io.emit(`wa:qr:${id}`,{qr:'MOCK_QR_BASE64'}), 500);
 setTimeout(()=>{
 sessions = sessions.map(s=>s.id===id
 ?{...s,status:'connected',numero:'+55 81 9'+Date.now().toString().slice(-8)}
 :s);
 io.emit(`wa:connected:${id}`,{number:sessions.find(s=>s.id===id)?.numero});
 }, 10000);
 }
 res.json({status:'qr'});
});

router.post('/sessions/:id/send', (req,res) => {
 const {id} = req.params;
 const {to,message} = req.body;
 const sess = sessions.find(s=>s.id===id);
 if (!sess) return res.status(404).json({error:'Sessão não encontrada'});
 if (sess.status!=='connected')
 return res.status(400).json({error:'Sessão não conectada'});
 // Produção: wppService.sendMessage(id, to, message)
 console.log(`WA [${id}] -> ${to}: ${message.substring(0,40)}`);
 res.json({success:true,messageId:'msg'+Date.now(),ts:new Date()});
});

router.delete('/sessions/:id', (req,res) => {
 sessions = sessions.filter(s=>s.id!==req.params.id);
 res.json({success:true});
});

router.get('/log', (_,res) => res.json([
 {to:'+55 81 99999-0001',preview:'Relatório Fev/2026',
 status:'entregue',ts:'28/02/2026 09:12'},
 {to:'+55 81 99999-0002',preview:'Alerta VaR',
 status:'lido',ts:'23/02/2026 14:30'},
]));

export default router;
