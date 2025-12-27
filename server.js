const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Criar pastas automaticamente no servidor
const paths = [
    path.join(__dirname, 'public', 'videos'),
    path.join(__dirname, 'uploads', 'logos')
];
paths.forEach(p => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); });

app.post('/gerar-corte', async (req, res) => {
    const { videoUrl, startTime, idCliente } = req.body; 

    const logoPath = path.join(__dirname, 'uploads', 'logos', `${idCliente}.png`);
    const logoDefault = path.join(__dirname, 'uploads', 'logos', 'default.png');
    const logoFinal = fs.existsSync(logoPath) ? logoPath : logoDefault;

    const outputName = `corte-${Date.now()}.mp4`;
    const outputPath = path.join(__dirname, 'public', 'videos', outputName);

    try {
        const stream = ytdl(videoUrl, { quality: 'highestvideo' });

        ffmpeg(stream)
            .input(logoFinal)
            .seekInput(startTime) // Pula para o tempo escolhido (em segundos)
            .duration(60)         // Corta exatamente 60 segundos
            .complexFilter([
                // Filtro AranhaFlix: Vertical 9:16 com Fundo Desfocado
                '[0:v]split=2[v1][v2];' +
                '[v1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[bg];' +
                '[v2]scale=1080:-1[fg];' +
                '[bg][fg]overlay=(W-w)/2:(H-h)/2[base];' +
                '[base][1:v]overlay=W-w-50:50[final]'
            ])
            .map('[final]')
            .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-preset superfast'])
            .on('start', () => console.log('🕷️ Iniciando corte automático...'))
            .on('end', () => res.json({ url: `/videos/${outputName}` }))
            .on('error', (err) => res.status(500).json({ error: err.message }))
            .save(outputPath);

    } catch (e) {
        res.status(500).json({ error: "Falha ao processar filme." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 AranhaFlix ON na porta ${3000}`));


