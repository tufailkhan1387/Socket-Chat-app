const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;

if (cluster.isMaster) {
  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("online", (worker) => {
    console.log(`Worker ${worker.process.pid} is online`);
  });
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  const app = express();
  const server = http.createServer(app);
  const io = socketIO(server);
  const connectedUsers = {};

  io.on("connection", (socket) => {
    console.log(socket.id);

    connectedUsers[socket.id] = socket;

    console.log(`User connected: ${socket.id}`);

    socket.on("createMessage", (newMessage) => {
      console.log("newMessage", newMessage);

      socket.broadcast.emit("createMessage", {
        message: newMessage,
      });
    });
    socket.on("disconnect", () => {
      console.log("Disconnected from user");
    });
  });
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
  });

  server.listen(3000, () => {
    console.log(`Worker ${process.pid} starting the server at port 3000 ...`);
  });
}
