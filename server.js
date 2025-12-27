const express = require('express');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');
const fs = require('fs');
const app = express();

app.use(express.json());

// ROTA PARA GERAR O VÍDEO
app.post('/gerar-video', async (req, res) => {
    const { urlYoutube, idCliente, textoTopo } = req.body;
    const pathLogo = `./uploads/logos/${idCliente}.png`;
    const outputPath = `./public/videos/${Date.now()}.mp4`;

    console.log("🕷️ Iniciando processo AranhaFlix...");

    // 1. Baixando o vídeo do YT
    const videoStream = ytdl(urlYoutube, { quality: 'highestvideo' });

    // 2. Editando com FFmpeg
    ffmpeg(videoStream)
        .complexFilter([
            // Formato Vertical 9:16 com desfoque no fundo
            '[0:v]scale=ih*9/16:ih,boxblur=20:10,setsar=1[bg];' +
            '[0:v]scale=1080:-1[fg];' +
            '[bg][fg]overlay=(W-w)/2:(H-h)/2[tmp];' +
            // Adicionando a Logo do Cliente que já está salva
            `[tmp][1:v]overlay=main_w-overlay_w-50:50`
        ])
        .input(pathLogo)
        .outputOptions(['-t 30']) // 30 segundos para Reels
        .on('end', () => {
            res.json({ success: true, link: outputPath });
        })
        .on('error', (err) => {
            res.status(500).send("Erro: " + err.message);
        })
        .save(outputPath);
});

app.listen(3000, () => console.log("AranhaFlix ON no Render!"));