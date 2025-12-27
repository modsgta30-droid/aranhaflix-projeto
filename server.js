const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Configurações Iniciais
app.use(cors());
app.use(express.json());

// 1. RESOLVE O ERRO "CANNOT GET /" 
// Faz o servidor entregar os arquivos da pasta public (index.html, etc)
app.use(express.static(path.join(__dirname, 'public')));

// Garante que as pastas necessárias existam no Render
const vidsDir = path.join(__dirname, 'public', 'videos');
const logosDir = path.join(__dirname, 'uploads', 'logos');

[vidsDir, logosDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ROTA PRINCIPAL DE GERAÇÃO
app.post('/gerar-aranha', async (req, res) => {
    const { videoUrl, idRevendedor } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: "URL do YouTube é obrigatória" });
    }

    // Define qual logo usar (se não achar a do cliente, usa a default.png)
    const logoCliente = path.join(logosDir, `${idRevendedor}.png`);
    const logoDefault = path.join(logosDir, 'default.png');
    const logoFinal = fs.existsSync(logoCliente) ? logoCliente : logoDefault;

    const outputName = `aranhaflix-${Date.now()}.mp4`;
    const outputPath = path.join(vidsDir, outputName);

    console.log(`🕷️ AranhaFlix: Iniciando edição para ${idRevendedor}...`);

    try {
        // Puxa o vídeo do YouTube
        const videoStream = ytdl(videoUrl, { 
            quality: 'highestvideo',
            filter: format => format.container === 'mp4'
        });

        ffmpeg(videoStream)
            .input(logoFinal)
            .complexFilter([
                // Filtro para evitar tela preta e preencher 9:16 (TikTok/Reels)
                '[0:v]split=2[vid1][vid2];' +
                '[vid1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[bg];' +
                '[vid2]scale=1080:-1[fg];' +
                '[bg][fg]overlay=(W-w)/2:(H-h)/2[base];' +
                // Adiciona a Logo no topo direito
                '[base][1:v]overlay=W-w-50:50[final]'
            ])
            .map('[final]')
            .outputOptions([
                '-t 30',          // Limita a 30 segundos (plano grátis do Render é lento)
                '-c:v libx264',   // Codec padrão
                '-pix_fmt yuv420p',
                '-preset superfast' // Processa mais rápido para não dar timeout
            ])
            .on('start', (cmd) => console.log('Comando FFmpeg iniciado'))
            .on('error', (err) => {
                console.error('Erro FFmpeg:', err.message);
                if (!res.headersSent) res.status(500).json({ error: "Erro na edição" });
            })
            .on('end', () => {
                console.log('✅ Vídeo Gerado com Sucesso!');
                res.json({ url: `/videos/${outputName}` });
            })
            .save(outputPath);

    } catch (error) {
        console.error('Erro ao baixar vídeo:', error);
        res.status(500).json({ error: "Erro ao acessar o YouTube" });
    }
});

// Porta do Render ou 3000 local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 AranhaFlix ON! Porta: ${3000}`);
});

