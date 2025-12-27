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

// Pastas de sistema
const vidsPath = path.join(__dirname, 'public', 'videos');
const logosPath = path.join(__dirname, 'uploads', 'logos');
if (!fs.existsSync(vidsPath)) fs.mkdirSync(vidsPath, { recursive: true });

app.post('/gerar-corte', async (req, res) => {
    const { videoUrl, startTime, idRevendedor } = req.body; 
    // startTime deve vir no formato segundos (ex: 120 para 2 minutos de filme)

    const logoUsar = path.join(logosPath, 'default.png');
    const fileName = `corte-${Date.now()}.mp4`;
    const outputPath = path.join(vidsPath, fileName);

    try {
        // Baixa o vídeo com busca de tempo (seek) para economizar RAM
        const stream = ytdl(videoUrl, { quality: 'highestvideo' });

        ffmpeg(stream)
            .input(logoUsar)
            .seekInput(startTime) // PULA PARA O MINUTO DESEJADO DO FILME
            .duration(60)         // CORTA EXATAMENTE 60 SEGUNDOS
            .complexFilter([
                // Ajuste para Vertical 9:16 sem bordas pretas
                '[0:v]split=2[v1][v2];' +
                '[v1]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:10[bg];' +
                '[v2]scale=1080:-1[fg];' +
                '[bg][fg]overlay=(W-w)/2:(H-h)/2[base];' +
                '[base][1:v]overlay=W-w-50:50[final]'
            ])
            .map('[final]')
            .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-preset superfast'])
            .on('end', () => res.json({ url: `/videos/${fileName}` }))
            .on('error', (err) => res.status(500).json({ error: err.message }))
            .save(outputPath);

    } catch (e) {
        res.status(500).json({ error: "Erro ao acessar o filme" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 AranhaFlix Cortes ON na porta ${3000}`));

