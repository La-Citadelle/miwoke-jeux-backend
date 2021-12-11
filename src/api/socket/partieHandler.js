const PartiesService = require('../common/parties/partiesService');
const partiesService = new PartiesService;

const parties = [];
module.exports = async (io, socket) => {

  if (this.parties?.length) {
    io.emit("parties", this.parties);
  } else {
    this.parties = [];
  }

  let previousId;

  const safeJoin = currentId => {
    socket.leave(previousId);
    socket.join(currentId, () => console.log(`Socket ${socket.id} joined room ${currentId}`));
    previousId = currentId;
  };
  
  const getPartie = (partieId) => {
    safeJoin(partieId);
    socket.room('parties').emit("partie", parties[partieId]);
  }

  const addPartie = async (newPartie) => {
    idNewPartie = await partiesService.addPartie(newPartie);
    this.parties = [{...newPartie}, ...this.parties];
    io.emit("parties", this.parties);
  }

  const activatePartie = (idPartie) => {
    this.parties = this.parties.map((partie) => {
      if (partie._id == idPartie) {
        partie =  { ...partie, status: 1};
      }
      return partie;
    });
    io.emit("parties", this.parties);
  }

  const joinPartie = (data) => {
    let currentPartie;
    this.parties = this.parties.map((partie) => {
      if (partie._id == data.idPartie) {
        currentPartie = partie;
        if (data.currentPlayer.role !== 'admin') {
          if (!partie.players) {
            partie.players = [{vies: 3, ...data.currentPlayer}];
          } else {
            if (!(partie.players.find((player) => player.id == data.currentPlayer.id))) {
              partie.players = [{vies: 3, ...data.currentPlayer}, ...partie.players];
            }
          }

        }
      }
      return partie;
    });
    updatePartie(data.idPartie, currentPartie, this.parties);
  }

  const addQuestion = (idPartie) => {
    let currentPartie;
      this.parties = this.parties.map((partie) => {
        if (partie._id == idPartie) {
          if (!partie.isAwnsering && !partie.waitingAwnser) {
            if (partie.questions) {
              questions = [{status:1 , order: partie.questions.length + 1}, ...partie.questions];
            } else {
              questions = [{status:1, order: 1}];
            }
            partie.questions = questions;
            partie.isAwnsering = false;
            partie.waitingAwnser = true;
          }
          currentPartie = partie;
        }
        return partie;
      });
      updatePartie(idPartie, currentPartie, this.parties);
  }

  const awnserQuestion = (data) => {
    if (data.currentPlayer.role !== 'admin') {
      let currentPartie;
      this.parties = this.parties.map((partie) => {
        if (partie._id == data.idPartie) {
          if (partie.questions[0].righhAwnser == null) {
            // todo etre sur que le joueur qui repond a au moins 1 vie si c'Est le cas il faut le kick
          partie.questions[0] = {...partie.questions[0], player: data.currentPlayer};
          partie.isAwnsering = true;
          partie.waitingAwnser = false;
          }
          currentPartie = partie;
        }
        return partie;
      });
      updatePartie(data.idPartie, currentPartie, this.parties);
    }
  }

  const addPoint = (idPartie) => {
    let currentPartie;
    this.parties = this.parties.map((partie) => {
      if (partie._id == idPartie) {
        if (partie.isAwnsering && !partie.waitingAwnser) {
          idPlayer = partie.questions[0].player.id;
          partie.players = partie.players.map((player) => {
            if (player.id == idPlayer) {
              player.points = player.points ? player.points + 1 : 1;
            }
            return player;
          });
          partie.questions[0] = {...partie.questions[0], righhAwnser: true};
          partie.isAwnsering = false;
          partie.waitingAwnser = false;
        }
        currentPartie = partie;
      }
      return partie;
    });
    
    updatePartie(idPartie, currentPartie, this.parties);
  }

  const removeLife = (idPartie) => {
    let currentPartie;
    this.parties = this.parties.map((partie) => {
      if (partie._id == idPartie) {
        if (partie.isAwnsering && !partie.waitingAwnser) {
          idPlayer = partie.questions[0].player.id;
          partie.players = partie.players.map((player) => {
            if (player.id == idPlayer) {
              if (player.vies) {
                player.vies = player.vies - 1;
              }
            }
            return player;
          });
          partie.questions[0] = {...partie.questions[0], righhAwnser: false};
          partie.isAwnsering = false;
          partie.waitingAwnser = false;
        }
        currentPartie = partie;
      }
      return partie;
    });
    updatePartie(idPartie, currentPartie, this.parties);
  }

  const editPartie = (partie) => {
    parties[partie.id] = partie;
    socket.to(partie.id).emit("partie", partie);
  }

  const updatePartie = async (idPartie, partie, parties) => {
    await partiesService.edit(idPartie, partie);
    io.emit(`getPartie:${idPartie}`, partie);
    io.emit("parties", parties);
  }
  
  socket.on("getPartie", getPartie);
  socket.on("addPartie", addPartie);
  socket.on("editPartie", editPartie);
  socket.on("activatePartie", activatePartie);
  socket.on("joinPartie", joinPartie);
  socket.on("addQuestion", addQuestion);
  socket.on("awnserQuestion", awnserQuestion);
  socket.on("addPoint", addPoint);
  socket.on("removeLife", removeLife);
}