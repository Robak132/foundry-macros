/* ==========
* MACRO: Initial Advantage Calculator
* VERSION: 1.1
* AUTHOR: Robak132
* DESCRIPTION: Calculate initial advantage and apply it to actors (requires WFRP4 GM Toolkit).
========== */

async function update(character, newAdvantage) {
  if (character === undefined  || character?.documentName !== "Token") {
    return ui.notifications.error(game.i18n.localize("GMTOOLKIT.Token.SingleSelect"), {console: true})
  }
  if (!character.inCombat) {
    return ui.notifications.error(`${game.i18n.format("GMTOOLKIT.Advantage.NotInCombat", {actorName: character.name, sceneName: game.scenes.viewed.name})}`, {console: true})
  }
  let updated = await character.actor.update({"data.status.advantage.value": newAdvantage})
  return {
    context: "macro", outcome: updated ? "increased" : "nochange", new: newAdvantage, starting: character.actor.status.advantage.value
  }
}

async function submit(html) {
  let playersAdvantage = 0;
  let enemiesAdvantage = 0;
  const {manoeuvrability, surprise, outnumbering, terrain, threat} = new FormDataExtended(html[0].querySelector("form")).object;
  switch (manoeuvrability) {
    case "enemies":
      enemiesAdvantage += 2;
      break;
    case "players":
      playersAdvantage += 2;
      break;
  }
  switch (surprise) {
    case "enemies":
      enemiesAdvantage += 2;
      break;
    case "players":
      playersAdvantage += 2;
      break;
  }
  switch (outnumbering) {
    case "enemies31":
      enemiesAdvantage += 3;
      break;
    case "enemies21":
      enemiesAdvantage += 2;
      break;
    case "enemies11":
      enemiesAdvantage += 1;
      break;
    case "players11":
      playersAdvantage += 1;
      break;
    case "players21":
      playersAdvantage += 2;
      break;
    case "players31":
      playersAdvantage += 3;
      break;
  }
  switch (terrain) {
    case "players2":
      playersAdvantage += 2;
      break;
    case "players1":
      playersAdvantage += 1;
      break;
    case "enemies2":
      enemiesAdvantage += 2;
      break;
    case "enemies1":
      enemiesAdvantage += 1;
      break;
  }
  switch (threat) {
    case "players3":
      playersAdvantage += 3;
      break;
    case "players2":
      playersAdvantage += 2;
      break;
    case "players1":
      playersAdvantage += 1;
      break;
    case "enemies3":
      enemiesAdvantage += 3;
      break;
    case "enemies2":
      enemiesAdvantage += 2;
      break;
    case "enemies1":
      enemiesAdvantage += 1;
      break;
  }

  let enemy = canvas.scene.tokens.find(token => token.disposition === -1)
  console.log(enemy)
  await update(enemy, enemiesAdvantage)
  let players = canvas.scene.tokens.find(token => token.disposition === 1)
  await update(players, playersAdvantage)

  let advantage = `
		<h1>Initial Advantage</h1>
		<p><b>Players:</b> ${playersAdvantage}</p>
		<p><b>Enemies:</b> ${enemiesAdvantage}</p>`
  ChatMessage.create({content: advantage, whisper: game.users.filter(u => u.isGM).map(u => u.id)}, false);
}

new Dialog({
  title: "Initial Advantage", content: `<form class="gmtoolkit">
  <div class="form-group flexflow">
    <p style="flex: 1" title="One side possessing an advantage in movement such as being mounted or facing giant spiders in trees." class="section-title">Manoeuvrability</p>
    <select style="flex: 2" id="manoeuvrability" name="manoeuvrability">
      <option value="enemies">Mobile Enemies</option>
      <option value="none" selected>Static forces</option>
      <option value="players">Mobile Players</option>
    </select>
  </div>
  <div class="form-group flexflow">
    <p style="flex: 1" class="section-title">Surprise</p>
    <select style="flex: 2" id="surprise" name="surprise">
      <option value="enemies">Surprised Enemies</option>
      <option value="none" selected>No surprise</option>
      <option value="players">Surprised Players</option>
    </select>
  </div>
  <div class="form-group flexflow">
    <p style="flex: 1" class="section-title">Outnumbering</p>
    <select style="flex: 2" id="outnumbering" name="outnumbering">
      <option value="enemies31">Enemies outnumber Players (3:1)</option>
      <option value="enemies21">Enemies outnumber Players (2:1)</option>
      <option value="enemies11">Enemies outnumber Players</option>
      <option value="none" selected>Equal forces</option>
      <option value="players11">Players outnumber Enemies</option>
      <option value="players21">Players outnumber Enemies (2:1)</option>
      <option value="players31">Players outnumber Enemies (3:1)</option>
    </select>
  </div>
  <div class="form-group flexflow">
    <p style="flex: 1" title="Light cover: an advantageous position, such as a hill.\nHeavy cover: key position as a bridge." class="section-title">Terrain</p>
    <select style="flex: 2" id="terrain" name="terrain">
      <option value="players2">Heavy cover (Players)</option>
      <option value="players1">Light cover (Players)</option>
      <option value="none" selected>Equal</option>
      <option value="enemies1">Light cover (Enemies)</option>
      <option value="enemies2">Heavy cover (Enemies)</option>
    </select>
  </div>
  <div class="form-group flexflow">
    <p style="flex: 1" title="Dangerous threat: dangerous threat such as a warpfire thrower, Ogre, or Troll.\nVery dangerous threat: a match for several foes such as an organ gun, Manticore, or Griffon.\nExtremely dangerous threat: a match for a dozen lesser foes such as a Dragon or Greater Daemon." class="section-title">Threat</p>
    <select style="flex: 2" id="threat" name="threat">
      <option value="players3">Extremely Dangerous (Players)</option>
      <option value="players2">Very Dangerous (Players)</option>
      <option value="players1">Dangerous (Players)</option>
      <option value="none" selected>None</option>
      <option value="enemies1">Dangerous (Enemies)</option>
      <option value="enemies2">Very Dangerous (Enemies)</option>
      <option value="enemies3">Extremely Dangerous (Enemies)</option>
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

