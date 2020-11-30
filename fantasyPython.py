#Testing the https://github.com/cwendt94/espn-api version of getting the data I want in something I can understand
from espn_api.football import League
leagueId = 807757
year = 2020
swid = "8746D8A2-C30F-4521-86D8-A2C30F15215F"
espn_s2 = "AEAtE%2FGKv1LvT6oojWxRxdnvhI%2BYZE1oFLpmVDQ4tkSn8Ajwg5XYe4EqnWj9c7VyeuAmHy0cUG9U%2FZVpVg9wCTfhc9H7bDHHFC%2BKV6YAul2xsBVsR2z3c1kvG2qUtnCDf5HsXmpKDoETVSrya%2F8nYubRnZ8pnhlWgocn8MHHDd3yiQkfnc1Ew84LEoHz7hPVTVmXUWQV%2FpCyKHlXn7tBD6iqvwMjIjjdxVH%2Ft6ivhUGJbwgy4%2Bu%2F9O9P94Lw5rAGQgVxfhg7V0B63LMff%2BZfGLXO9EGjbmfZDlnmZiOg9ajt%2Fg%3D%3D"
league = League(leagueId, year, espn_s2, swid)

#Getting Team Information 
##I can show distribution of Team positions!
print (league.teams[0])
teams = league.teams
for team in teams:
    print("Presenting Roster of " + str(team))
    players = team.roster
    for player in players:
        print(str(player.name) + ", Position " + str(player.position))
    print("Next Team! \n")

#Getting Specific weekly information