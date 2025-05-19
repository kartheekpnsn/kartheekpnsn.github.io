import yfinance as yf
import pandas as pd
import yaml
import tqdm
import datetime
import os
import sys

pd.set_option("display.float_format", lambda x: "%.3f" % x)

cwd = os.getcwd()
PROJECT_PATH = f'{cwd.split("my_portfolio")[0]}\my_portfolio'
# sys.path.insert(0, f"{PROJECT_PATH}")

portfolio_dir = f"{PROJECT_PATH}\data"
portfolio_file = "MyPortfolio_2024.xlsx"

# Load the file
portfolio_df = pd.read_excel(
    f"{portfolio_dir}\\{portfolio_file}", sheet_name="Stock options"
)
portfolio_df = portfolio_df[portfolio_df["Yes/No"] == "Yes"]

sector = portfolio_df["Sector"].tolist()
stocks = portfolio_df["Stock"].tolist()
stocks_tech_names = portfolio_df["Technical Name"].tolist()

# Load the criteria yaml
criteria_file = f"{PROJECT_PATH}\config\criteria.yaml"
with open(criteria_file, "r") as file:
    criterion = yaml.safe_load(file)
criterion = criterion["imp_keys"]

# Iterate through stocks and get the info
finance_list = []
for stock in tqdm.tqdm(stocks_tech_names):
    _tmp = []
    finance = yf.Ticker(stock)
    finance_dict = finance.info
    for criteria in criterion:
        _tmp.append(finance_dict.get(criteria, 0))
    hist = finance.history(period="5Y")
    perc_increase = 100 * (
        (hist["Close"].tolist()[-1] - hist["Close"].tolist()[0])
        / (hist["Close"].tolist()[0])
    )
    _tmp.append(perc_increase)
    finance_list.append(_tmp)
finance_df = pd.DataFrame(finance_list, columns=criterion + ["5Y Perc Increase"])
finance_df["Technical Name"] = stocks_tech_names
finance_df["Stock"] = stocks
finance_df["Sector"] = sector
finance_df["dividendYield"] = finance_df["dividendYield"]*100
finance_df["marketCap"] = finance_df["marketCap"]/10000000

# Move the last 3 columns to first 3 columns
cols = finance_df.columns.tolist()
cols = cols[-3:] + cols[:-3]
finance_df = finance_df[cols]

writer = pd.ExcelWriter(
    f"{portfolio_dir}\\{portfolio_file}",
    engine="openpyxl",
    mode="a",
    if_sheet_exists="overlay",
)
time_str = datetime.datetime.now().strftime("%d%b%Y")
finance_df.to_excel(writer, sheet_name=time_str, index=False)
writer.close()
