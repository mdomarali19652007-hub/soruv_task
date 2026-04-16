import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import morgan from "morgan";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());

  // Mock database
  let users: any = {};
  let rooms: any = {};
  let leaderboard = [
    { name: "Soruv", coins: 50000, level: 45 },
    { name: "LudoKing", coins: 42000, level: 38 },
    { name: "ProPlayer", coins: 35000, level: 32 },
    { name: "BD_Hero", coins: 28000, level: 25 },
    { name: "Gamer99", coins: 15000, level: 18 }
  ];

  // API routes
  app.get("/api/leaderboard", (req, res) => {
    res.json(leaderboard);
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      if (!rooms[roomId]) {
        rooms[roomId] = {
          players: [],
          gameState: "waiting",
          turn: 0,
          board: {} // Simplified board state
        };
      }
      
      if (rooms[roomId].players.length < 4) {
        rooms[roomId].players.push({ id: socket.id, color: rooms[roomId].players.length });
        io.to(roomId).emit("room_update", rooms[roomId]);
      }
    });

    socket.on("roll_dice", ({ roomId, value }) => {
      // In a real app, the server should roll the dice to prevent hacking
      const rollValue = value || Math.floor(Math.random() * 6) + 1;
      io.to(roomId).emit("dice_rolled", { player: socket.id, value: rollValue });
    });

    socket.on("move_pawn", ({ roomId, pawnId, newPos }) => {
      io.to(roomId).emit("pawn_moved", { player: socket.id, pawnId, newPos });
      // Switch turn logic here
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
