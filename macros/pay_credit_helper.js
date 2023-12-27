/* ==========
* MACRO: Pay/Credit Helper
* VERSION: 1.0
* AUTHOR: Robak132
* DESCRIPTION: Allows for easier money transactions
========== */

GOLD_CROWN_LABEL = "zk"
SILVER_SHILING_LABEL = "s"
BRONZE_PENCE_LABEL = "p"
MAIN_STYLE = "flex: 1;text-align: center;font-family: CaslonPro;font-weight: 600;font-variant: small-caps"

new Dialog({
  title: "Pay/Credit Helper",
  content: `<form>
              <div class="form-group">
                <p style="${MAIN_STYLE}">GC</p>
                <p style="${MAIN_STYLE}">SS</p>
                <p style="${MAIN_STYLE}">BP</p>
                <p style="${MAIN_STYLE}">Split?</p>
              </div>
              <div class="form-group">
                <input style="flex: 1;text-align: center" type="number" id="gc" name="gc" value="0" min="0" />
                <input style="flex: 1;text-align: center" type="number" id="ss" name="ss" value="0" min="0" />
                <input style="flex: 1;text-align: center" type="number" id="bp" name="bp" value="0" min="0" />
                <input style="flex: 1;text-align: center" type="checkbox" id="split" name="split" checked/>
              </div>
              <div class="form-group"></div>
          </form>`,
  buttons: {
    pay: {
      label: "Pay",
      callback: (html) => {
        const form = new FormDataExtended(html[0].querySelector("form")).object;
        if (form.gc > 0 || form.ss > 0 || form.bp > 0) {
          new Macro({
            command: `/pay ${form.gc}${GOLD_CROWN_LABEL}${form.ss}${SILVER_SHILING_LABEL}${form.bp}${BRONZE_PENCE_LABEL} ${form.split ? "split" : "each"}`,
            type: `chat`,
            name: "pay each"
          }).execute();
        }
      }
    },
    credit: {
      label: "Credit",
      callback: (html) => {
        const form = new FormDataExtended(html[0].querySelector("form")).object;
        if (form.gc > 0 || form.ss > 0 || form.bp > 0) {
          new Macro({
            command: `/credit ${form.gc}${GOLD_CROWN_LABEL}${form.ss}${SILVER_SHILING_LABEL}${form.bp}${BRONZE_PENCE_LABEL}`,
            type: `chat`,
            name: "credit"
          }).execute();
        }
      }
    },
    cancel: {
      icon: "<i class='fas fa-times'></i>",
      label: "Cancel"
    }
  },
  default: "cancel"
}).render(true);