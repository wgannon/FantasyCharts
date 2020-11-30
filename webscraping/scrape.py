import requests
import json 
import pandas as pd
#How to acces the data https://stmorse.github.io/journal/espn-fantasy-v3.html
league_id = 807757
year = 2020 
swid = "8746D8A2-C30F-4521-86D8-A2C30F15215F"
espn_s2 = "AEAtE%2FGKv1LvT6oojWxRxdnvhI%2BYZE1oFLpmVDQ4tkSn8Ajwg5XYe4EqnWj9c7VyeuAmHy0cUG9U%2FZVpVg9wCTfhc9H7bDHHFC%2BKV6YAul2xsBVsR2z3c1kvG2qUtnCDf5HsXmpKDoETVSrya%2F8nYubRnZ8pnhlWgocn8MHHDd3yiQkfnc1Ew84LEoHz7hPVTVmXUWQV%2FpCyKHlXn7tBD6iqvwMjIjjdxVH%2Ft6ivhUGJbwgy4%2Bu%2F9O9P94Lw5rAGQgVxfhg7V0B63LMff%2BZfGLXO9EGjbmfZDlnmZiOg9ajt%2Fg%3D%3D"
url = "https://fantasy.espn.com/apis/v3/games/ffl/seasons/" + str(year) + "/segments/0/leagues/" + \
      str(league_id) + "?seasonId="

r = requests.get(url, params={"view": "mMatchup"},
                 cookies={"swid":"{8746D8A2-C30F-4521-86D8-A2C30F15215F}",
                          "espn_s2": "AEAtE%2FGKv1LvT6oojWxRxdnvhI%2BYZE1oFLpmVDQ4tkSn8Ajwg5XYe4EqnWj9c7VyeuAmHy0cUG9U%2FZVpVg9wCTfhc9H7bDHHFC%2BKV6YAul2xsBVsR2z3c1kvG2qUtnCDf5HsXmpKDoETVSrya%2F8nYubRnZ8pnhlWgocn8MHHDd3yiQkfnc1Ew84LEoHz7hPVTVmXUWQV%2FpCyKHlXn7tBD6iqvwMjIjjdxVH%2Ft6ivhUGJbwgy4%2Bu%2F9O9P94Lw5rAGQgVxfhg7V0B63LMff%2BZfGLXO9EGjbmfZDlnmZiOg9ajt%2Fg%3D%3D"})
d = r.json()

#put into Jsonfile
with open('matchups.json', 'w') as json_file:
    json.dump(d, json_file)

with open('matchups_thisYear.json', 'w') as json_file:
    json.dump(d, json_file)
df = [[
        game['matchupPeriodId'],
        game['home']['teamId'], game['home']['totalPoints'],
        game['away']['teamId'], game['away']['totalPoints']
    ] for game in d['schedule']]
df1 = pd.DataFrame(data=df, columns=['Week', 'Team1', 'Score1', 'Team2', 'Score2'])
df['Type'] = ['Regular' if w<=12 else 'Playoff' for w in df['Week']]
df.head()
df3 = df.assign(Margin1 = df['Score1'] - df['Score2'],
                Margin2 = df['Score2'] - df['Score1'])
df3 = (df3[['Week', 'Team1', 'Margin1', 'Type']]
 .rename(columns={'Team1': 'Team', 'Margin1': 'Margin'})
 .append(df3[['Week', 'Team2', 'Margin2', 'Type']]
 .rename(columns={'Team2': 'Team', 'Margin2': 'Margin'}))
)
df3.head()

#notes can maybe use the python premade API or the pther API that can be put into nodeJS directly which might be better. 
#Try to get the Json into the database so you can run queries on it and put in a graph! 