/* ==========
* MACRO: Initial Advantage Calculator
* VERSION: 1.2
* AUTHOR: Robak132
* DESCRIPTION: Calculate initial advantage and apply it to actors (requires WFRP4 GM Toolkit).
========== */

async function update(character, newAdvantage) {
  let updated = await character.actor.update({"data.status.advantage.value": newAdvantage})
  return {
    context: "macro", outcome: updated ? "increased" : "nochange", new: newAdvantage, starting: character.actor.status.advantage.value
  }
}

async function submit(html) {
  const advantage = $(html)
    .find("select")
    .map((_, e) => {
      return {
        players : e.options[e.options.selectedIndex].dataset.players ?? 0,
        enemy: e.options[e.options.selectedIndex].dataset.enemies ?? 0,
      }
    })
    .get()
  const playersAdvantage = advantage.reduce((acc, x) => acc + Number(x.players), 0)
  const enemiesAdvantage = advantage.reduce((acc, x) => acc + Number(x.enemy), 0)

  if (game.combat !== null) {
    let enemy = game.combat.combatants.find(combatant => combatant.token.disposition === -1)
    console.log(enemy)
    await update(enemy, enemiesAdvantage)

    let players = game.combat.combatants.find(combatant => combatant.token.disposition === 1)
    console.log(players)
    await update(players, playersAdvantage)
  }

  let chatMsgContent = `
		<h1>Initial Advantage</h1>
		<p><b>Players:</b> ${playersAdvantage}</p>
		<p><b>Enemies:</b> ${enemiesAdvantage}</p>`
  ChatMessage.create({content: chatMsgContent, whisper: game.users.filter(u => u.isGM).map(u => u.id)}, false);
}

new Dialog({
  title: "Initial Advantage", content: `<form class="gmtoolkit">
  <div class="form-group">
    <p style="flex: 1" title="One side possessing an advantage in movement such as being mounted or facing giant spiders in trees." class="section-title">Manoeuvrability</p>
    <select style="flex: 2">
      <option data-enemies="2">Mobile Enemies</option>
      <option selected>Static forces</option>
      <option data-players="2">Mobile Players</option>
    </select>
  </div>
  <div class="form-group">
    <p style="flex: 1" class="section-title">Surprise</p>
    <select style="flex: 2">
      <option data-players="2">Surprised Enemies</option>
      <option selected>No surprise</option>
      <option data-enemies="2">Surprised Players</option>
    </select>
  </div>
  <div class="form-group">
    <p style="flex: 1" class="section-title">Outnumbering</p>
    <select style="flex: 2">
      <option data-enemies="3">Enemies outnumber Players (3:1)</option>
      <option data-enemies="2">Enemies outnumber Players (2:1)</option>
      <option data-enemies="1">Enemies outnumber Players</option>
      <option selected>Equal forces</option>
      <option data-players="1">Players outnumber Enemies</option>
      <option data-players="2">Players outnumber Enemies (2:1)</option>
      <option data-players="3">Players outnumber Enemies (3:1)</option>
    </select>
  </div>
  <div class="form-group">
    <p style="flex: 1" title="Light cover: an advantageous position, such as a hill.\nHeavy cover: key position as a bridge." class="section-title">Terrain</p>
    <select style="flex: 2">
      <option data-players="2">Heavy cover (Players)</option>
      <option data-players="1">Light cover (Players)</option>
      <option selected>Equal</option>
      <option data-enemies="1">Light cover (Enemies)</option>
      <option data-enemies="2">Heavy cover (Enemies)</option>
    </select>
  </div>
  <div class="form-group">
    <p style="flex: 1" title="Dangerous threat: dangerous threat such as a warpfire thrower, Ogre, or Troll.\nVery dangerous threat: a match for several foes such as an organ gun, Manticore, or Griffon.\nExtremely dangerous threat: a match for a dozen lesser foes such as a Dragon or Greater Daemon." class="section-title">Threat</p>
    <select style="flex: 2">
      <option data-players="3">Extremely Dangerous (Players)</option>
      <option data-players="2">Very Dangerous (Players)</option>
      <option data-players="1">Dangerous (Players)</option>
      <option selected>None</option>
      <option data-enemies="1">Dangerous (Enemies)</option>
      <option data-enemies="2">Very Dangerous (Enemies)</option>
      <option data-enemies="3">Extremely Dangerous (Enemies)</option>
    </select>
  </div>
</form>`, buttons: {
    yes: {
      icon: "<i class='fas fa-check'></i>", label: game.i18n.localize("GMTOOLKIT.Dialog.Apply"), callback: async (html) => await submit(html),
    }, no: {
      icon: "<i class='fas fa-times'></i>", label: game.i18n.localize("GMTOOLKIT.Dialog.Cancel")
    }
  }, default: "yes"
}).render(true);

