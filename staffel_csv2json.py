#!/usr/bin/env python3

import collections
import csv
import datetime
import json
import sys

DATES_IN = """10.09.2016 1. Spieltag A/H B/G C/F D/E
17.09.2016 2. Spieltag G/A F/B E/C D/H
01.10.2016 3. Spieltag A/F B/E C/D H/G
29.10.2016 4. Spieltag E/A D/B F/H C/G
12.11.2016 5. Spieltag A/D B/C H/E G/F
19.11.2016 6. Spieltag C/A B/H D/G E/F
26.11.2016 7. Spieltag A/B H/C F/D G/E
17.12.2016 8. Spieltag H/A G/B F/C E/D
28.01.2017 9. Spieltag B/A C/H D/F E/G
11.02.2017 10. Spieltag A/C H/B G/D F/E
18.02.2017 12. Spieltag A/E B/D H/F G/C
11.03.2017 11. Spieltag D/A C/B E/H F/G
25.03.2017 13. Spieltag F/A E/B D/C G/H
01.04.2017 14. Spieltag A/G B/F C/E H/D"""


def read_groups(csv_fn):
	groups = collections.OrderedDict()

	now = datetime.datetime.utcnow()
	season_name = 'Saison %d/%d' % (now.year, now.year + 1)

	with open(csv_fn) as inf:
		reader = csv.reader(inf)
		lines = list(reader)[1:]

	for line in lines:
		(region, age_group,
			league_code, league_number,
			letter, team_name, club_textid) = line[:7]

		if not region:
			continue

		group_name = '%s %s-%s' % (
			region, league_code, league_number)
		key = '%s %s/%s' % (
			group_name, now.year, now.year + 1)
		abbrev = '%s%s_%d%d' % (
			league_code, league_number,
			(now.year % 100), (now.year + 1) % 100)

		if not team_name:
			team_name = 'frei'
			club_textid = '000'
		team_name = team_name.strip()

		team_str = '%s %s %s' % (
			letter, club_textid, team_name)

		if key not in groups:
			groups[key] = collections.OrderedDict([
				('key', key),
				('dates_in', DATES_IN),
				('teams_in', ''),
				('league_name', group_name),
				('season_name', season_name),
				('abbrev', abbrev),
				('stb', ''),
				('default_time', '18:00'),
				('sunday_time', '11:00'),
				('adjournments', []),
			])

		g = groups[key]
		if g['teams_in']:
			g['teams_in'] += '\n'
		g['teams_in'] += team_str

	return list(groups.values())



def main():
	if len(sys.argv) != 2:
		print('Usage: %s input-file.csv' % sys.argv[1])
		return 1

	groups = read_groups(sys.argv[1])
	print(json.dumps(groups, indent=2))


if __name__ == '__main__':
	sys.exit(main())