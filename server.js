const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Configuração do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Salva a sessão para não deslogar
    puppeteer: { 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    }
});

// Mostra o QR Code no terminal do Render
client.on('qr', (qr) => {
    console.log('--- LEIA ESTE QR CODE NO SEU WHATSAPP ---');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log('✅ Bot Conectado e Pronto!'));

// Lógica de Atendimento Automático
client.on('message', async msg => {
    const texto = msg.body.toLowerCase();

    if (texto === '1' || texto === 'teste') {
        msg.reply('🕷️ *AranhaBot:* Gerando seu teste no painel Sigma... Aguarde 30 segundos.');
        // Lógica de geração automática entrará aqui
    } 
    
    if (texto === 'oi' || texto === 'menu') {
        msg.reply('Olá! Sou o assistente AranhaFlix.\n\nDigite:\n1 - Teste Grátis\n2 - Comprar Plano\n3 - Suporte');
    }
});

client.initialize();

app.listen(process.env.PORT || 3000, () => console.log('🚀 Painel Web Ativo'));
