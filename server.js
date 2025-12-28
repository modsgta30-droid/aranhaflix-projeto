const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Configuração do Bot de WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox'] } // Necessário para rodar no Render
});

// Quando o WhatsApp gerar o código QR para você ler
client.on('qr', (qr) => {
    console.log('SCANEE O QR CODE ABAIXO NO SEU WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot de WhatsApp conectado com sucesso!');
});

// Lógica de conversa (O que o bot responde)
client.on('message', async msg => {
    if (msg.body === '!teste') {
        msg.reply('🕷️ AranhaBot: Gerando seu teste no Sigma... Aguarde 1 minuto.');
        // Aqui depois vamos colocar a conexão com seu painel Sigma
    }
});

client.initialize();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`💻 Painel Web rodando na porta ${PORT}`));
