/* ==========
* MACRO: Inventory Manager
* VERSION: 2.0
* AUTHOR: Robak132
* DESCRIPTION: Allows for easy item movement between containers and actors. Requires WFRP4 GM Toolkit.
========== */

const DIALOG_SIZE = {width: 750};

function formatItemEnc(x) {
  const sourceItem = x._source
  let lightweightBonus = sourceItem.system.qualities != null && sourceItem.system.qualities.value.some(q => q.name === "lightweight") ? -1 : 0
  let fullValue = Number(Math.max(sourceItem.system.encumbrance.value + lightweightBonus, 0) * x.system.quantity.value)
  let currentValue = Number(x.system.encumbrance.value)
  if (fullValue.toFixed(2) === currentValue.toFixed(2)) {
    return `${currentValue}`
  } else {
    return `${currentValue} (${fullValue})`
  }
}

function groupBy(list, func) {
  return list.reduce((rv, x) => {(rv[func(x)] = rv[func(x)] || []).push(x);return rv}, {});
}

function getItemType(x) {
  let type = x.type === "trapping" ? x.system.trappingType.value : x.type;
  return type === "" ? "misc" : type
}

function getCategoryOrder(x) {
  switch (x) {
    case "weapon": return 3;
    case "ammunition": return 2;
    case "armour": return 1;
    default: return 0
  }
}

function getContainers(actor) {
  let containers = actor.itemTypes.container.map((c) => {return {id: c.id, type: 'container', name: c.name, value: c}})
  return [{id: 0, type: 'actor', name: actor.name, value: actor}].concat(containers)
}

function getStashableActors() {
  let actors = game.gmtoolkit.utility.getGroup("entourage").filter(a => a.ownership[game.user.id] >= 3 || a.ownership['default'] >= 3)
  if (game.user.character !== null) {
    actors = actors.sort(a => a.id === game.user.character.id ? -1 : 1)
  }
  return actors
}

function createSelectTag(item, sourceActor, sourceContainer) {
  let select = `
    <select style="flex: 3" 
            data-item="${item.id}"
            data-source-actor="${sourceActor.id}"
            data-source-container="${sourceContainer.id}">
    <option data-price="none" selected></option>`
  getStashableActors().forEach(actor => {
    select += `<optgroup style="color: white" label="${actor.name}">`
    getContainers(actor).forEach(container => {
      select += `
        <option data-target-container="${container.id}"
                data-target-actor="${actor.id}" 
                ${(actor.id === sourceActor.id && container.id === sourceContainer.id) ? "disabled" : ''}>
          ${container.name}
        </option>`
    })
  })
  select += `</optgroup></select>`
  return select
}

function getItems(actor) {
  let items = [
    ...actor.itemTypes.weapon,
    ...actor.itemTypes.ammunition,
    ...actor.itemTypes.armour,
    ...actor.itemTypes.money,
    ...actor.itemTypes.trapping
  ].sort((a, b) => a.name.localeCompare(b.name, "pl"))
   .sort((a, b) => a.encumbrance.value > b.encumbrance.value ? -1 : 1)

  let itemsCategorised = groupBy(items, x => x.location.value === "" ? 0 : x.location.value)
  for (let [key, value] of Object.entries(itemsCategorised)) {
    value = groupBy(value, x => getItemType(x))
    itemsCategorised[key] = Object.fromEntries(Object.entries(value).sort((a, b) => {
      if (getCategoryOrder(a[0]) === getCategoryOrder(b[0])) {
        return game.i18n.localize(WFRP4E.trappingCategories[b[0]]).localeCompare(game.i18n.localize(WFRP4E.trappingCategories[a[0]]), "pl")
      }
      return getCategoryOrder(a[0]) < getCategoryOrder(b[0]) ? 1 : -1
    }))
  }
  return itemsCategorised
}

function getHTMLForm() {
  let form = `<form><div style="overflow-y: scroll;height: 500px">`
  for (const actor of getStashableActors()) {
    const items = getItems(actor)

    for (const container of getContainers(actor)) {
      const containerItems = items[container.id] ?? {}

      let containerItemsEnc = Number(Object.values(containerItems).reduce((acc, category) => acc + Number(category.reduce((catAcc, x) => catAcc + Number(x.encumbrance.value), 0)), 0))
      if (containerItemsEnc % 1 !== 0) {
        containerItemsEnc = containerItemsEnc.toFixed(2)
      }

      if (container.type === "actor") {
        form += `<h3 style="font-family: CaslonAntique;font-size: 30px;font-variant: small-caps;font-weight: bold">${container.name.toLocaleUpperCase("pl")} (${container.value.system.status.encumbrance.current}/${container.value.system.status.encumbrance.max})</h3>`
      } else {
        form += `
          <h3>
            <div class="form-group">
              <span style="flex: 1;text-align: center">${formatItemEnc(container.value)}</span>
              <span style="flex: 10">${container.name} (${containerItemsEnc}/${container.value.carries.value ?? '-'})</span>
            </div>
          </h3>`
      }

      for (const [categoryName, categoryList] of Object.entries(containerItems)) {
        if (categoryList.length > 0) {
          let categoryEnc = Number(categoryList.reduce((acc, x) => acc + Number(x.encumbrance.value), 0))
          if (categoryEnc % 1 !== 0) {
            categoryEnc = categoryEnc.toFixed(2)
          }

          form += `<p style="text-align: center;font-variant: small-caps;font-weight: bold;">${game.i18n.localize(WFRP4E.trappingCategories[categoryName])} (${categoryEnc})</p>`
          for (const item of categoryList) {
            form += `<div class="form-group">
              <span style="flex: 1;text-align: center">${formatItemEnc(item)}</span>
              <span style="flex: 5;text-align: center">${item.name}</span>
              <span style="flex: 1;text-align: center">${item.quantity.value}</span>
              <span style="flex: 1;text-align: center">&#8594;</span>
              ${createSelectTag(item, actor, container)}
            </div>`
          }
        }
      }
    }
  }
  form += `</div></form>`
  return form
}

function main() {
  const chooser = new Dialog({
    title: "Inventory Manager",
    content: getHTMLForm(),
    buttons: {
      confirm: {
        icon: '<i class="fas fa-check"></i>',
        label: "Move Items",
        callback: async function (html) {
          let itemUpdates = $(html)
            .find("select")
            .map((_, e) => {
              return {
                item: e.dataset.item,
                targetActor: e.options[e.options.selectedIndex].dataset.targetActor,
                targetContainer: e.options[e.options.selectedIndex].dataset.targetContainer,
                sourceActor: e.dataset.sourceActor,
                sourceContainer: e.dataset.sourceContainer}})
            .get()
            .filter(s => s.targetContainer != null || s.targetActor != null)

          let localUpdates = itemUpdates.filter(update => update.targetActor === update.sourceActor)
          localUpdates = groupBy(localUpdates, update => update.targetActor)

          // Add Items to Actors
          let globalUpdates = itemUpdates.filter(update => update.targetActor !== update.sourceActor)
          for (let update of globalUpdates) {
            let item = game.actors.get(update.sourceActor).items.get(update.item)
            let result = await game.actors.get(update.targetActor).createEmbeddedDocuments("Item", [item.toObject()])

            let value = localUpdates[update.targetActor] ?? []
            value.push({
              item: result[0]._id,
              targetActor: update.targetActor,
              targetContainer: update.targetContainer,
              sourceActor: update.sourceActor,
              sourceContainer: update.sourceContainer
            })
            localUpdates[update.targetActor] = value
          }

          // Remove Items from Actors
          const globalRemovals = groupBy(globalUpdates, update => update.sourceActor)
          for (let [key, updates ] of Object.entries(globalRemovals)) {
            updates = updates.map(update => {
              return update.item
            })
            await game.actors.get(key).deleteEmbeddedDocuments("Item", updates)
          }

          // Change location of items
          for (let [key, updates ] of Object.entries(localUpdates)) {
            updates = updates.map(update => {
              console.log(`Changing location of Item ${update.item} (${update.sourceContainer} to ${update.targetContainer})`)
              return {
                _id: update.item,
                "data.location.value": update.targetContainer === "0" ? 0 : update.targetContainer,
              }
            })
            await game.actors.get(key).updateEmbeddedDocuments("Item", updates)
          }

        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancel",
      },
    },
    default: "confirm",
  }, DIALOG_SIZE);
  chooser.render(true);
}

main()