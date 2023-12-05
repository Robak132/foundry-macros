/* ==========
* MACRO: Auto-Pursuit
* VERSION: 2.0
* AUTHOR: Robak132
* DESCRIPTION: Allows for creating pursuits (Core & UiA rules)
========== */

// Settings
const DIALOG_SIZE = {width: 600};
const POST_TO_CHAT = false;

// Main code
main()

class SimplePursuit {
  constructor() {
    this.objectsInPursuit = []
    game.user.targets.forEach(t => {
      this.objectsInPursuit.push(this.getPursuitObjectFromActor(t.actor))
    })
    this.maxDistance = 10
    this.turn = 0
    this.initialDialogHeader = ``
    this.initialDialogFooter = `<h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Escaping from combat</b></h2>
      <h4><b>Advantage: </b>1 Distance per spent Advantage.</h4>
      <h4><b>Dodge: </b>1 Distance.</h4>
      <h4><b>Fleeing: </b>3 Distance, if opponent attacks, 1 Distance if not.</h4>`
  }

  getPursuitObjectFromActor(actor) {
    return {
      active: true,
      name: actor.name,
      move: actor.details.move.value,
      actor: actor,
      type: "character",
      distance: 0,
      quarry: false
    }
  }

  sortObjects(objects) {
    return objects
      .sort((a, b) => a.actor && b.actor && a.actor.name.localeCompare(b.actor.name, 'pl'))
      .sort((a, b) => a.actor && b.actor && a.actor.details.move.value < b.actor.details.move.value ? -1 : 1)
      .sort((a, b) => Number(a.quarry) - Number(b.quarry))
      .sort((a, b) => a.distance < b.distance ? -1 : 1)
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
        content += `<h4><b>${character.actor.name}</b> needs ${distanceRemaining} Distance to escape.</h4>`
      } else {
        character.active = false
        character.distance = 0
        content += `<h4><b>${character.actor.name}</b> escapes.</h4>`
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
          events += `<h4><b>${pursuer.actor.name}</b> can catch <b>${quarry.actor.name}</b>.</h4>`
        }
      })
    })
    return events
  }

  getChatPursuitTests() {
    const characters = this.getCharacters()
    let slowestCharacter = characters.reduce((a, b) => a.actor.details.move.value < b.actor.details.move.value ? a : b).actor.details.move.value
    return characters.map(character => {
      return `<h4><b>${character.actor.name}</b> rolls with +${character.actor.details.move.value - slowestCharacter} SL.</h4>`
    }).join("")
  }

  //-------------//

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

  processInitialDialog(html) {
    const form = new FormDataExtended(html[0].querySelector("form")).object;
    for (let i = 0; i < this.objectsInPursuit.length; i++) {
      this.objectsInPursuit[i].distance = form.distance[i]
      this.objectsInPursuit[i].quarry = form.quarry[i]
    }
  }

  processDialog(html) {
    const form = new FormDataExtended(html[0].querySelector("form")).object;
    const characters = this.getCharacters()

    let newCharacters = []
    for (let i = 0; i < characters.length; i++) {
      let character = characters[i]
      character.distance += form.SL[i]
      newCharacters.push(character)
    }

    let minDistance = newCharacters.reduce((a, b) => a.distance < b.distance ? a : b).distance
    for (let i = 0; i < newCharacters.length; i++) {
      newCharacters[i].distance -= minDistance
    }

    this.objectsInPursuit = newCharacters
  }

  //-------------//

  renderCreatePursuitDialog() {
    let content = `<form>
      ${this.initialDialogHeader}
      <h2 style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
        <b>Choose Quarry and Initial Distance</b>
      </h2>
      <div class="form-group">
        <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Quarry</span>
        <span style="flex: 4;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
        <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Initial Distance</span>
      </div>`
    this.getCharacters().forEach(character => {
      content += `
        <div class="form-group">
          <div style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="quarry" style="text-align: center" type="checkbox">
          </div>
          <span style="flex: 4;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            ${character.actor.name}
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="distance" type="number" value="0" min="0" step="1">
          </span>
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
            this.processInitialDialog(html)
            this.objectsInPursuit = this.sortObjects(this.objectsInPursuit)
            if (this.getQuarry().length) {
              this.nextTurn()
            }
          },
        },
        addPerson: {
          icon: "<i class='fas fa-person'></i>",
          label: "Add Actors",
          callback: (html) => {
          },
        },
        no: {
          icon: "<i class='fas fa-times'></i>",
          label: "Cancel"
        }
      },
      default: "yes"
    }, DIALOG_SIZE).render(true);
  }

  getNextTurnRow(character) {
    return `
        <div class="form-group">
          <div style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="inPursuit" type="checkbox" ${character.active ? 'checked' : ''}>
          </div>
          <span style="flex: 3;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            ${character.name}
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="move" type="number" value="${character.move}" min="0" step="1">
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input name="distance" type="number" value="${character.distance}" min="0" step="1">
          </span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">
            <input id="SL" name="SL" type="number" value="0" step="1">
          </span>
        </div>`
  }

  renderNextTurnDialog() {
    let content = `
      <form>
        <div class="form-group">
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">In Pursuit?</span>
          <span style="flex: 3;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Move</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Distance</span>
          <span style="flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Test SLs</span>
        </div>
        <p style="text-align: center;font-variant: small-caps;font-weight: bold;">Pursuers</p>`
    this.getPursuers().forEach(character => {
      content += this.getNextTurnRow(character);
    })
    content += `<p style="text-align: center;font-variant: small-caps;font-weight: bold;">Quarry</p>`
    this.getQuarry().forEach(character => {
      content += this.getNextTurnRow(character);
    })
    const inactiveObjects = this.getInactive()
    if (inactiveObjects.length) {
      content += `<p style="text-align: center;font-variant: small-caps;font-weight: bold;">Inactive</p>`
      inactiveObjects.forEach(character => {
        content += this.getNextTurnRow(character);
      })
    }
    content += `</form>`
    // if (this.obstacles.length !== 0) {
    //   content += `<span style="text-align: center"><h2 style="font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Obstacles</b></h2></span>`
    //   content += `<table>
    //   <tr>
    //     <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">In Pursuit</td>
    //     <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Name</td>
    //     <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">Distance</td>
    //   </tr>`
    //   this.obstacles.forEach(object => {
    //     content += `<tr>
    //       <td style="text-align: center;"><input id="inPursuit" name="inPursuit" style="text-align: center" type="checkbox" checked></td>
    //       <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">${object.obstacle.name}</td>
    //       <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;">${Math.floor(object.distance)}</td>
    //     </tr>`
    //   })
    //   content += `</table>`
    // }

    new Dialog({
      title: `Pursuit - Turn ${this.turn}`,
      content: content,
      buttons: {
        obstacle: {
          icon: "<i class='fas fa-mountains'></i>",
          label: "Add Obstacle",
          callback: () => this.addObstacle(),
        },
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Next Turn",
          callback: (html) => {
            this.processDialog(html)
            this.objectsInPursuit = this.sortObjects(this.objectsInPursuit)
            this.nextTurn()
          },
        },
      },
      default: "yes"
    }, DIALOG_SIZE).render(true);
  }

//-------------//

  nextTurn() {
    this.turn += 1

    // Create chat message
    let content = `<h1 style="text-align: center">Pursuit - Turn ${this.turn}</h1>`
    content += this.getChatTable();

    content += this.getChatEscapes();
    content += this.getChatLostCharacters();

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

  // addObstacle() {
  //   new Dialog({
  //     title: "Obstacle",
  //     content: `<div class="">
  //         <span style="text-align: center"><h2 style="font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Create Obstacle</b></h2></span>
  //         <table>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">Name</td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <input style="text-align: center;color: var(--color-text-dark-primary)" type="text">
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <b>Perceived Test</b>
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <input style="text-align: center;color: var(--color-text-dark-primary)" type="text">
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <b>Test to Navigate</b>
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <input style="text-align: center;color: var(--color-text-dark-primary)" type="text">
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <b>Consequences</b>
  //             </td>
  //           </tr>
  //           <tr>
  //             <td style="text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps;" colspan="2">
  //               <input style="text-align: center;color: var(--color-text-dark-primary)" type="text">
  //             </td>
  //           </tr>
  //         </table>
  //         <span style="text-align: center"><h2 style="font-family: CaslonPro;font-weight: 600;font-variant: small-caps;"><b>Select Obstacle from Presets</b></h2></span>
  //         <div class="form-group flexcol">
  //           <select style="text-align: center" id="preset" name="preset">
  //             <option value="none" selected></option>
  //             <option value="large-log">Large Log</option>
  //             <option value="haystack">Haystack</option>
  //           </select>
  //         </div>
  //       </div>`,
  //     buttons: {
  //       yes: {
  //         icon: "<i class='fas fa-check'></i>",
  //         label: "Add",
  //         callback: () => {
  //           this.obstacles.push({
  //             obstacle: {
  //               name: "Large Log",
  //               perceived: "Automatically",
  //               navigated: "<b>Average (+20) Athletics</b> Test",
  //               consequences: "The participant or their mount gains the <i>Prone</i> Condition.",
  //             },
  //             distance: 5
  //           })
  //           this.renderNextTurnDialog()
  //         },
  //       },
  //       no: {
  //         icon: "<i class='fas fa-times'></i>",
  //         label: "Cancel",
  //         callback: () => this.renderNextTurnDialog(),
  //       }
  //     },
  //     default: "yes"
  //   }, DIALOG_SIZE).render(true);
  // }
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
  }

  //-------------//

  getChatPursuitTests() {
    return this.getCharacters().map(character => {
      let content = `<h4><b>${character.actor.name}</b> rolls with `
      switch (character.actor.details.move.value) {
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

  processInitialDialog(html) {
    const characters = this.getCharacters()
    const form = new FormDataExtended(html[0].querySelector("form")).object;

    this.maxDistance = form.maxDistance
    for (let i = 0; i < characters.length; i++) {
      characters[i].distance = form.distance[i]
      characters[i].quarry = form.quarry[i]
    }
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
