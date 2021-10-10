module.exports = (io, socket) => {
    parties = {};
    const message = msg => {
        io.emit('chat message', msg);
      };
    
    socket.on("chat message", message);
  }