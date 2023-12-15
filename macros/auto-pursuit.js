/* ==========
* MACRO: Auto-Pursuit
* VERSION: 2.0
* AUTHOR: Robak132
* DESCRIPTION: Allows for creating pursuits (Core & UiA rules)
========== */

// Settings
const NEXT_TURN_DIALOG_OPTIONS = {width: 650};
const CREATE_PURSUIT_DIALOG_OPTIONS = {width: 500};
const POST_TO_CHAT = true;

// Preset Obstacles
const PRESET_OBSTACLES = {
  large_log: {
    name: `Large Log`,
    perceived: `Automatically`,
    navigate: `Average (+20) Athletics Test`,
    consequences: `Gain Prone Condition`
  },
  haystack: {
    name: `Haystack`,
    perceived: `Automatically`,
    navigate: `Hard (-20) Climb Test`,
    consequences: `Gain Entangled with S of 2d10+20`
  },
  puddle: {
    name: `Filthy Puddle`,
    perceived: `Average (+20) Perception Test`,
    navigate: `Average (+20) Athletics Test if perceived, Hard (-20) Athletics Test if not`,
    consequences: `-2 SL to all Fellowship Tests until they clean themselves`
  },
  crates: {
    name: `Crates of Merchandise`,
    perceived: `Automatically`,
    navigate: `Challenging (+0) Athletics Test`,
    consequences: `Gain Prone Condition, 2d10 pieces of merchandise are broken`
  },
  gate: {
    name: `Closed Gate`,
    perceived: `Automatically`,
    navigate: `Hard (-20) Climb Test`,
    consequences: `Cannot move; fall 2 yds on Impressive Failure (-6 SL)`
  },
  pothole: {
    name: `Pothole`,
    perceived: `Challenging (+0) Perception Test`,
    navigate: `Easy (+40) Athletics Test if perceived, Hard (-20) Athletics Test if not`,
    consequences: `Gain Twisted Ankle Critical Injury`
  },
}

// Main code
main()

class SimplePursuit {
  constructor() {
    this.objectsInPursuit = this.initObjectList();
    this.maxDistance = 10
    this.turn = 0
    this.initialDialogHeader = ``
    this.initialDialogFooter = `
      <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Escaping from combat</b></h2>
      <h4><b>Advantage: </b>1 Distance per spent Advantage.</h4>
      <h4><b>Dodge: </b>1 Distance.</h4>
      <h4><b>Fleeing: </b>3 Distance, if opponent attacks, 1 Distance if not.</h4>`
    this.nextTurnFooter = `
      <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Distance Update Rules</b></h2>
      <h4 style="text-align: center">Distance Moved = SL</h4>`
  }

  initObjectList() {
    let objectsInPursuitSet = new Set()
    if (canvas.tokens.controlled.length) {
      canvas.tokens.controlled.forEach(t => {
        objectsInPursuitSet.add(this.getPursuitObjectFromActor(t.actor))
      })
    } else {
      game.gmtoolkit.utility.getGroup("company").filter(a => a.type === "character").forEach(a => {
        objectsInPursuitSet.add(this.getPursuitObjectFromActor(a))
      })
    }
    return [...objectsInPursuitSet]
  }

  sortObjects(objects) {
    return objects
      .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
      .sort((a, b) => a.move < b.move ? -1 : 1)
      .sort((a, b) => Number(a.quarry) - Number(b.quarry))
      .sort((a, b) => a.distance < b.distance ? -1 : 1)
  }

  //-------------//

  getPursuitObjectFromActor(actor) {
    return {
      active: true,
      name: actor.name,
      move: actor.system.details.move.value,
      run: actor.system.details.move.run,
      type: "character",
      distance: 0,
      quarry: false
    }
  }

  getCharacterMove(character) {
    return `${character.move}`
  }

  //-------------//

  getChatTable() {
    let content = `
      <table>
        <tr>
          <td style="text-align:center"><b>Q</b></td>
          <td style="text-align:center"><b>Name</b></td>
          <td style="text-align:center"><b>Move</b></td>
          <td style="text-align:center"><b>Distance</b></td>
        </tr>`
    this.getCharacters().forEach(object => {
      content += `
        <tr>
          <td style="text-align:center">${object.quarry ? "<i class='fas fa-check' />" : ""}</td>
          <td style="text-align:center">${object.name}</td>
          <td style="text-align:center">${object.move}</td>
          <td style="text-align:center">${Math.floor(object.distance)}</td>
        </tr>`
    })
    content += `</table>`
    return content;
  }

  getChatEscapes() {
    const maxPursuerDistance = this.getPursuers().reduce((a, b) => a.distance > b.distance ? a : b).distance

    let content = ''
    this.getQuarry().forEach(character => {
      const distanceRemaining = this.maxDistance - character.distance + maxPursuerDistance
      if (distanceRemaining > 0) {
        content += `<h4><b>${character.name}</b> needs ${distanceRemaining} Distance to escape.</h4>`
      } else {
        character.active = false
        character.distance = 0
        content += `<h4><b>${character.name}</b> escapes.</h4>`
      }
    })
    return content
  }

  getChatLostCharacters() {
    const characters = this.getCharacters()
    let isLost = false
    let lostSightText = ""

    for (let i = characters.length - 1; i > 0; i--) {
      if (characters[i].distance - characters[i - 1].distance >= this.maxDistance) {
        isLost = true
      }
      if (isLost) {
        characters[i - 1].active = false
        characters[i - 1].distance = 0
        lostSightText += `<h4><b>${characters[i - 1].name}</b> lost sight with rest of Pursuit.</h4>`
      }
    }

    return lostSightText
  }

  getChatCatchEvents() {
    let events = ""
    this.getQuarry().forEach(quarry => {
      this.getPursuers().forEach(pursuer => {
        if (quarry.distance === pursuer.distance) {
          events += `<h4><b>${pursuer.name}</b> can catch <b>${quarry.name}</b>.</h4>`
        }
      })
    })
    return events
  }

  getChatPursuitTests() {
    const characters = this.getCharacters()
    const slowestCharacter = characters.reduce((a, b) => a.move < b.move ? a : b).move
    let pursuitTests = ""
    characters.forEach(character => {
      pursuitTests += `<h4><b>${character.name}</b> rolls with +${character.move - slowestCharacter} SL.</h4>`
    })
    return pursuitTests
  }

  //-------------//

  getActive() {
    return this.objectsInPursuit.filter(o => o.active)
  }

  getInactive() {
    return this.objectsInPursuit.filter(o => !o.active)
  }

  getCharacters() {
    return this.objectsInPursuit.filter(o => o.type === "character" && o.active)
  }

  getQuarry() {
    return this.getCharacters().filter(o => o.quarry)
  }

  getPursuers() {
    return this.getCharacters().filter(o => !o.quarry)
  }

  //-------------//

  renderCreatePursuitDialog() {
    let content = `<form>
      ${this.initialDialogHeader}
      <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
        <b>Choose Quarry and Initial Distance</b>
      </h2>
      <div class="form-group">
        <span style="flex: 2;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">In Pursuit</span>
        <span style="flex: 4;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
        <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Initial Distance</span>
        <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Quarry</span>
      </div>`
    this.getCharacters().forEach(character => {
      content += `
        <div class="form-group">
          <div style="flex: 2;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="active" style="text-align: center" type="checkbox" ${character.active ? 'checked' : ''}>
          </div>
          <span style="flex: 4;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            ${character.name}
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="distance" type="number" value="${character.distance}" min="0" step="1">
          </span>
          <div style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="quarry" style="text-align: center" type="checkbox" ${character.quarry ? 'checked' : ''}>
          </div>
        </div>`
    })
    content += `
      ${this.initialDialogFooter}
    </form>`

    new Dialog({
      title: "Pursuit",
      content: content,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Start",
          callback: (html) => {
            this.processCreatePursuitDialog(html)
            if (this.getQuarry().length) {
              this.nextTurn()
            }
          },
        },
        addActor: {
          icon: "<i class='fas fa-person'></i>",
          label: "Add Actor",
          callback: (html) => {
            this.processCreatePursuitDialog(html)
            this.renderAddActorDialog(this.renderCreatePursuitDialog)
          },
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        }
      },
      default: "yes"
    }, CREATE_PURSUIT_DIALOG_OPTIONS).render(true);
  }

  processCreatePursuitDialog(html) {
    const characters = this.getCharacters()
    const form = new FormDataExtended(html[0].querySelector("form")).object;
    for (let i = 0; i < characters.length; i++) {
      characters[i].active = form.active[i]
      characters[i].distance = form.distance[i]
      characters[i].quarry = form.quarry[i]
    }
    this.objectsInPursuit = this.sortObjects(this.objectsInPursuit.filter(o=>o.active))
  }

  renderNextTurnDialog() {
    let content = `
      <form>
        <div class="form-group">
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">In Pursuit?</span>
          <span style="flex: 3;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Move</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Test SLs</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Distance</span>
        </div>`
    this.getActive().forEach(character => {
      content += this.getNextTurnRow(character);
    })
    const inactiveObjects = this.getInactive()
    if (inactiveObjects.length) {
      content += `<p style="text-align: center;font-variant: small-caps;font-weight: bold;">Inactive</p>`
      inactiveObjects.forEach(character => {
        content += this.getNextTurnRow(character);
      })
    }
    content += `</form>${this.nextTurnFooter}`

    new Dialog({
      title: `Pursuit - Turn ${this.turn}`,
      content: content,
      buttons: {
        nextTurn: {
          icon: "<i class='fas fa-check'></i>",
          label: "Next Turn",
          callback: (html) => {
            this.processNextTurnDialog(html)
            this.nextTurn()
          },
        },
        addActor: {
          icon: "<i class='fas fa-person'></i>",
          label: "Add Actor",
          callback: (html) => {
            this.processNextTurnDialog(html)
            this.renderAddActorDialog(this.renderNextTurnDialog)
          },
        },
        addObstacle: {
          icon: "<i class='fas fa-mountains'></i>",
          label: "Add Obstacle",
          callback: () => this.renderAddObstacle(),
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        }
      },
      default: "nextTurn"
    }, NEXT_TURN_DIALOG_OPTIONS).render(true);
  }

  getNextTurnRow(object) {
    const objectId = this.objectsInPursuit.indexOf(object)
    if (object.type === "character") {
      return `
        <div class="form-group"">
          <div style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input data-character-id="${objectId}" name="active" type="checkbox" ${object.active ? 'checked' : ''}>
          </div>
          <span style="flex: 3;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            ${object.name}${object.quarry ? " (Q)" : ""}
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            ${this.getCharacterMove(object)}
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input data-character-id="${objectId}" name="SL" type="number" value="0" step="1">
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input data-character-id="${objectId}" name="distance" type="number" value="${object.distance}" min="0" step="1">
          </span>
        </div>`
    } else {
      return `
      <div class="form-group"">
        <div style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
          <input data-character-id="${objectId}" name="active" type="checkbox" ${object.active ? 'checked' : ''}>
        </div>
        <p style="flex: 5;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" 
        title="Perceived: ${object.perceived}&#10;Test: ${object.navigate}&#10;Consequences: ${object.consequences}">
          ${object.name}
        </p>
        <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
          <input data-character-id="${objectId}" name="distance" type="number" value="${object.distance}" min="0" step="1">
        </span>
      </div>`
    }
  }

  processNextTurnDialog(html) {
    let form = {}
    $(html).find("input")
      .get()
      .forEach((input) => {
        let playerData = form[input.dataset.characterId] ?? {}
        if (input.type === "checkbox") {
          playerData[input.name] = input.checked
        } else {
          playerData[input.name] = input.value
        }
        form[input.dataset.characterId] = playerData
      })
    for (const [key, value] of Object.entries(form)) {
      let character = this.objectsInPursuit[key]
      character.active = value.active
      character.distance = Number(value.distance)
      character.distance += Number(value.SL)
    }

    // Limit distance if pursuer run past query
    let maxQueryDistance = this.getQuarry().reduce((a, b) => a.distance > b.distance ? a : b).distance
    for (let pursuer of this.getPursuers()) {
      pursuer.distance = pursuer.distance > maxQueryDistance ? maxQueryDistance : pursuer.distance
    }
    this.objectsInPursuit = this.sortObjects(this.objectsInPursuit)
  }

  renderAddActorDialog(backFunc) {
    let content = `
      <form>
        <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
          <b>Insert Values or Select Actor's Token</b>
        </h2>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="name" type="text">
          </span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Move</span>
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Run</span>
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Flee!</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="move" type="number" min="0" step="1">
          </span>
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="run" type="number" min="0" step="1">
          </span>
          <div style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="flee" type="checkbox">
          </div>
        </div>
      </form>`

    new Dialog({
      title: "Add Actor",
      content: content,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Add",
          callback: (html) => {
            const form = new FormDataExtended(html[0].querySelector("form")).object;
            this.processAddActorDialog(form);
            this.objectsInPursuit = this.sortObjects(this.objectsInPursuit)
            backFunc.call(this)
          },
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel",
          callback: () => this.renderCreatePursuitDialog(),
        }
      },
      default: "yes"
    }, CREATE_PURSUIT_DIALOG_OPTIONS).render(true);
  }

  processAddActorDialog(form) {
    if (form.name !== '' && form.move !== null && form.run !== null) {
      this.objectsInPursuit.push({
        active: true,
        name: form.name,
        move: form.move,
        run: form.run,
        type: "character",
        distance: 0,
        quarry: false
      })
    } else {
      canvas.tokens.controlled.forEach(t => this.objectsInPursuit.push(this.getPursuitObjectFromActor(t.actor)))
    }
  }

  renderAddObstacle() {
    let content = `
      <form>
        <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
          <b>Create Obstacle</b>
        </h2>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="name" type="text">
          </span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Perceived Test</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="name" type="text">
          </span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Test to Navigate</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="name" type="text">
          </span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Consequences</span>
        </div>
        <div class="form-group">
          <span style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="name" type="text">
          </span>
        </div>
        <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
          <b>Select Obstacle From Presets</b>
        </h2>
        <div class="form-group">
          <select style="text-align: center" id="preset" name="preset">
            <option value="" selected></option>`
    for (const [key, value] of Object.entries(PRESET_OBSTACLES)) {
      content += `<option value="${key}">${value.name}</option>`
    }
    content += `
        </select>
      </div>
    </form>`
    new Dialog({
      title: "New Obstacle",
      content: content,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Add",
          callback: (html) => {
            this.processAddObstacleDialog(html)
            this.renderNextTurnDialog()
          },
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel",
          callback: () => this.renderNextTurnDialog(),
        }
      },
      default: "yes"
    }, CREATE_PURSUIT_DIALOG_OPTIONS).render(true);
  }

  processAddObstacleDialog(html) {
    const form = new FormDataExtended(html[0].querySelector("form")).object;
    if (form.preset) {
      const obstacle = PRESET_OBSTACLES[form.preset]
      this.objectsInPursuit.push({
        active: true,
        name: obstacle.name,
        perceived: obstacle.perceived,
        navigate: obstacle.navigate,
        consequences: obstacle.consequences,
        move: 0,
        run: 0,
        type: "obstacle",
        distance: 0,
        quarry: false
      })
    }
  }

  //-------------//

  nextTurn() {
    this.turn += 1

    const lostCharactersMsg = this.getChatLostCharacters();
    const escapesMsg = this.getChatEscapes();
    this.normaliseDistance()

    // Create chat message
    let content = `<h1 style="text-align: center">Pursuit - Turn ${this.turn}</h1>`
    content += this.getChatTable()
    content += lostCharactersMsg
    content += escapesMsg

    // Create events
    let events = this.getChatCatchEvents();
    if (events !== "") {
      content += "<h2 style='text-align: center'>Events</h2>"
      content += events
    }

    // Check end
    if (this.getQuarry().length !== 0 && this.getPursuers().length !== 0) {
      content += "<h2 style='text-align: center'>Roll Pursuit Tests</h2>"
      content += this.getChatPursuitTests();
      this.renderNextTurnDialog();
    }
    if (POST_TO_CHAT) ChatMessage.create({content: content}, false);
  }

  normaliseDistance() {
    const characters = this.getCharacters()
    let minDistance = characters.reduce((a, b) => a.distance < b.distance ? a : b).distance
    for (let i = 0; i < characters.length; i++) {
      characters[i].distance -= minDistance
    }
  }

}

class ComplexPursuit extends SimplePursuit {
  constructor() {
    super();
    this.initialDialogHeader = `<h2 style="text-align:center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Environment</b></h2>
      <div class="form-group flexcol">
        <select style="text-align: center" id="maxDistance" name="maxDistance">
          <option value="3">Busy city streets, labyrinthine sewers, hedge maze (3)</option>
          <option value="5">Craggy mountains, dense woodland, foggy fenland (5)</option>
          <option value="7">Sleepy village, light woodland, swamp (7)</option>
          <option value="10" selected>Shrubby meadow, gently rolling hills, rocky beach (10)</option>
          <option value="13">Featureless desert, grassy steppe, limestone pavement (13)</option>
        </select>
      </div>`
    this.initialDialogFooter = `<h2 style="text-align:center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Escaping from combat</b></h2>
      <h4><b>Advantage: </b>1 Distance, 3 Distance if spent 3 or more Advantage.</h4>
      <h4><b>Dodge: </b>1 Distance.</h4>
      <h4><b>Fleeing: </b>Free Pursuit Test, +2 SL if opponent attacks.</h4>`
    this.nextTurnFooter = `
      <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Distance Update Rules</b></h2>
      <h4 style="text-align: center"><b>Roll Pursuit Test:</b></h4>
      <h4><b>4 SL or more: </b>Distance Moved = (Run / 10) + 1</h4>
      <h4><b>0 to 3 SL: </b>Distance Moved = (Run / 10)</h4>
      <h4><b>-2 to -1 SL: </b>Distance Moved = (Run / 10) - 1</h4>
      <h4><b>-3 to -4 SL: </b>Distance Moved = 0</h4>
      <h4><b>-5 SL or less: </b>Gains Prone Condition</h4>`
  }

  //-------------//

  getCharacterMove(character) {
    return `${character.move} (${character.run})`
  }

  //-------------//

  getChatPursuitTests() {
    return this.getCharacters().map(character => {
      let content = `<h4><b>${character.name}</b> rolls with `
      switch (character.move) {
        case 1:
          content += '-30 modifier.</h4>'
          break;
        case 2:
          content += '-20 modifier.</h4>.'
          break;
        case 3:
          content += '+0 modifier.</h4>'
          break;
        default:
          content += '+20 modifier.</h4>'
          break;
      }
      return content
    }).join("");
  }

  //-------------//

  processCreatePursuitDialog(html) {
    super.processCreatePursuitDialog(html)

    const form = new FormDataExtended(html[0].querySelector("form")).object;
    this.maxDistance = form.maxDistance
  }
}

function main() {
  new Dialog({
    title: "Choose Pursuit Mode",
    content: `
      <div class="delete-item-dialog selection">
        <label>Choose in which mode you want to run this tool.</label> 
      </div>`,
    buttons: {
      simple: {
        label: "Simple (Core)",
        callback: () => new SimplePursuit().renderCreatePursuitDialog()
      },
      complex: {
        label: "Complex (UiA)",
        callback: () => new ComplexPursuit().renderCreatePursuitDialog()
      },
    },
    default: "complex"
  }).render(true);
}
