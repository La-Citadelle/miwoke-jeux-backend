
const PartiesRepository = require('./partiesRepository');

class PartiesService {
  constructor() {
    this.repository = new PartiesRepository();
  }

  findById(id) {
    return this.repository.findById(id)
      .then(user => this.mapPartiesToDto(user));
  }

  addPartie(partie) {
    return this.repository.add(partie)
    .then(partie => this.mapPartieToDto(partie));
  }

  list() {
    return this.repository.list()
      .then(listParties => listParties.map(partie => this.mapPartieToDto(partie)));
  }

  edit(id, dto) {
    const partie = this.mapDtoToPartie(dto);
    return this.repository.edit(id, partie);
  }

  mapPartieToDto(item) {
    return item ? {...item.ops} : {};
  }

  mapDtoToPartie(dto) {
    return dto ? {
      ...dto
    } : {};
  }
}

module.exports = PartiesService;
