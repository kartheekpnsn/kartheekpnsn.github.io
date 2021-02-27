import pandas as pd

def generate_tr_text(text):
    if text == "":
        return f"\t<td style='background-color:#ffddd9';text-align: center; vertical-align: middle;>{text}</td>\n"
    else:
        return f"\t<td style='text-align: center; vertical-align: middle;'>{text}</td>\n"

loadouts_data = pd.read_excel("../codm_loadouts.xlsx")
loadouts_data = loadouts_data.fillna("")

with open("../loadouts_template.html") as fb:
    loadouts_template = fb.read()

loadout_text = ""
for idx, row in loadouts_data.iterrows():
    loadout_text = loadout_text + f"<tr>\n"
    loadout_text = loadout_text + f"\t<td style='text-align: center; vertical-align: middle;'><b>{row['Gun']}</b></td>\n"
    loadout_text = loadout_text + generate_tr_text(row['Mode'])
    loadout_text = loadout_text + generate_tr_text(row['From'])
    loadout_text = loadout_text + generate_tr_text(row['Muzzle'])
    loadout_text = loadout_text + generate_tr_text(row['Barrel'])
    loadout_text = loadout_text + generate_tr_text(row['Optic'])
    loadout_text = loadout_text + generate_tr_text(row['Stock'])
    loadout_text = loadout_text + generate_tr_text(row['Perk'])
    loadout_text = loadout_text + generate_tr_text(row['Laser'])
    loadout_text = loadout_text + generate_tr_text(row['Underbarrel'])
    loadout_text = loadout_text + generate_tr_text(row['Ammunition'])
    loadout_text = loadout_text + generate_tr_text(row['RearGrip'])
    loadout_text = loadout_text + f"</tr>\n"

loadouts_template = loadouts_template.replace("<tr_replace>", loadout_text)
with open("../loadouts.html", "w") as fb:
    fb.write(loadouts_template)