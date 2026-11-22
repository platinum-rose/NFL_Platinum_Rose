import json, re
r = json.load(open('data/nfl-rosters/espn-full-rosters-latest.json', encoding='utf-8'))['players']
def norm(s): return re.sub(r'\b(jr|ii|iii|iv)\b', '', re.sub(r"[.'’]", '', s.lower())).strip()
ks = {}
for k in r: ks.setdefault(norm(k), k)
names = ['Emmett Johnson', 'Travis Kelce', 'Jaylen Warren', 'Joe Milton', 'Bhayshul Tuten', 'Cam Skattebo', "D'Andre Swift", 'Kyle Monangai',
         'Luther Burden III', 'Rashee Rice', 'Trey McBride', 'Saquon Barkley', 'Derrick Henry', 'Chuba Hubbard', 'Jahmyr Gibbs', 'Bucky Irving',
         'James Cook III', 'Ollie Gordon II', 'Justin Jefferson', 'George Kittle', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Zay Flowers', 'Adonai Mitchell',
         'Malik Nabers', 'Jaylen Waddle', 'Christian McCaffrey', 'Tony Pollard', 'Nate Adkins', 'Javonte Williams', 'Jonah Coleman',
         "Ja'Marr Chase", 'Tee Higgins', 'George Pickens', 'Parker Washington', 'Dak Prescott']
for n in names:
    k = ks.get(norm(n))
    print(n, '->', k, [(x['team'], x['position'], x['status']) for x in r[k]] if k else 'NOT FOUND')
