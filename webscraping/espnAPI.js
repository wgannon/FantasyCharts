import { Client } from 'espn-fantasy-football-api/node';
const { Client} = require('espn-fantasy-football-api/node')
const myClient = new Client({leagueId: 807757});
myClient.setCookies({ espnS2:'AEAtE%2FGKv1LvT6oojWxRxdnvhI%2BYZE1oFLpmVDQ4tkSn8Ajwg5XYe4EqnWj9c7VyeuAmHy0cUG9U%2FZVpVg9wCTfhc9H7bDHHFC%2BKV6YAul2xsBVsR2z3c1kvG2qUtnCDf5HsXmpKDoETVSrya%2F8nYubRnZ8pnhlWgocn8MHHDd3yiQkfnc1Ew84LEoHz7hPVTVmXUWQV%2FpCyKHlXn7tBD6iqvwMjIjjdxVH%2Ft6ivhUGJbwgy4%2Bu%2F9O9P94Lw5rAGQgVxfhg7V0B63LMff%2BZfGLXO9EGjbmfZDlnmZiOg9ajt%2Fg%3D%3D', SWID: '8746D8A2-C30F-4521-86D8-A2C30F15215F'});

//https://github.com/mkreiser/ESPN-Fantasy-Football-API