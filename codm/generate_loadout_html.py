import pandas as pd

def generate_tr_text(text):
    if text == "":
        return f"\t<td style='background-color:#ffddd9';text-align: center; vertical-align: middle;>{text}</td>\n"
    else:
        return f"\t<td style='text-align: center; vertical-align: middle;'>{text}</td>\n"

loadouts_data = pd.read_excel("codm_loadouts.xlsx")
loadouts_data = loadouts_data.fillna("")

with open("loadouts_template.html") as fb:
    loadouts_template = fb.read()

loadout_text = ""
for idx, row in loadouts_data.iterrows():
    loadout_text = loadout_text + f"<tr>\n"
    loadout_text = loadout_text + f"\t<td style='text-align: center; vertical-align: middle;'><b>{row['Gun']}</b></td>\n"
    _tmp_text = "<ul>\n"
    for col in list(loadouts_data.columns):
        if col not in ['From', 'Mode', 'Gun'] and row[col] != "":
            _tmp_text = _tmp_text + f"<li><b>{col}</b>: {row[col]}</li>"
    loadout_text = loadout_text + f"<td>{_tmp_text}</td>\n"
    loadout_text = loadout_text + generate_tr_text(row['Mode'])
    loadout_text = loadout_text + generate_tr_text(row['From'])
    loadout_text = loadout_text + f"</tr>\n"

loadouts_template = loadouts_template.replace("<tr_replace>", loadout_text)
with open("loadouts.html", "w") as fb:
    fb.write(loadouts_template)