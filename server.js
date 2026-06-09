const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const GIF_DIR = __dirname;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve the GIFs directly from the main directory with strong caching (1 day)
app.use('/gifs', express.static(GIF_DIR, { maxAge: 86400000 }));

// Redirect root to panel
app.get('/', (req, res) => {
    res.redirect('/panel.html');
});

// API to get list of GIFs
app.get('/api/gifs', (req, res) => {
    fs.readdir(GIF_DIR, (err, files) => {
        if (err) {
            console.error("Error reading directory:", err);
            return res.status(500).json({ error: 'Failed to read directory' });
        }
        
        // Filter only .gif files
        const gifs = files.filter(file => file.toLowerCase().endsWith('.gif'));
        res.json(gifs);
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('A client connected');

    // When the panel sends a command to play a GIF
    socket.on('play-gif', (gifName) => {
        console.log(`Playing GIF: ${gifName}`);
        // Broadcast the event to all other clients (specifically obs.html)
        io.emit('show-gif', gifName);
    });

    // When the panel sends a command to stop the GIF
    socket.on('stop-gif', () => {
        console.log('Stopping GIF');
        io.emit('hide-gif');
    });

    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Control Panel: http://localhost:${PORT}/panel.html`);
    console.log(`OBS Source:    http://localhost:${PORT}/obs.html`);
});
