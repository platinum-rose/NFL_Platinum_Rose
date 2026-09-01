import fs from 'fs';

// CBS Sports PPR Consensus Top 200 (pasted by Andy, 2026-09-01)
const cbsRaw = `1	J. Gibbs	RB	6
2	B. Robinson	RB	11
3	J. Chase	WR	6
4	P. Nacua	WR	11
5	J. Smith-Njigba	WR	11
6	A. St. Brown	WR	6
7	J. Taylor	RB	13
8	C. McCaffrey	RB	8
9	J. Cook	RB	7
10	C. Brown	RB	6
11	C. Lamb	WR	14
12	D. Achane	RB	6
13	K. Walker III	RB	5
14	O. Hampton	RB	7
15	J. Jefferson	WR	6
16	D. London	WR	11
17	S. Barkley	RB	10
18	D. Henry	RB	13
19	G. Pickens	WR	14
20	A. Brown	WR	11
21	N. Collins	WR	8
22	C. Olave	WR	8
23	R. Rice	WR	5
24	B. Bowers	TE	13
25	T. McBride	TE	14
26	T. Higgins	WR	6
27	M. Nabers	WR	8
28	D. Smith	WR	10
29	A. Jeanty	RB	13
30	Z. Flowers	WR	13
31	C. Loveland	TE	10
32	J. Williams	RB	14
33	J. Allen	QB	7
34	L. McConkey	WR	7
35	T. McMillan	WR	5
36	K. Williams	RB	11
37	T. Etienne	RB	8
38	J. Love	RB	14
39	G. Wilson	WR	13
40	J. Waddle	WR	10
41	D. Swift	RB	10
42	B. Hall	RB	13
43	L. Burden III	WR	10
44	D. Moore	WR	7
45	L. Jackson	QB	13
46	E. Egbuka	WR	10
47	Q. Judkins	RB	11
48	D. Adams	WR	11
49	T. McLaurin	WR	7
50	B. Irving	RB	10
51	D. Maye	QB	11
52	T. Warren	TE	13
53	C. Skattebo	RB	8
54	B. Tuten	RB	7
55	J. Williams	WR	6
56	P. Washington	WR	7
57	J. Price	RB	11
58	D. Montgomery	RB	8
59	R. Odunze	WR	10
60	R. Stevenson	RB	11
61	S. LaPorta	TE	6
62	C. Watson	WR	11
63	J. Burrow	QB	6
64	M. Harrison Jr.	WR	14
65	M. Lloyd	RB	11
66	T. Kraft	TE	11
67	J. Hurts	QB	10
68	B. Thomas Jr.	WR	7
69	J. Daniels	QB	7
70	C. Godwin	WR	10
71	K. Pitts	TE	11
72	M. Evans	WR	8
73	J. Brooks	RB	5
74	R. Dowdle	RB	9
75	T. Henderson	RB	11
76	T. Pollard	RB	9
77	C. Sutton	WR	10
78	J. Warren	RB	9
79	D. Prescott	QB	14
80	Q. Johnston	WR	7
81	C. Tate	WR	9
82	I. Likely	TE	8
83	J. Addison	WR	6
84	J. Croskey-Merritt	RB	7
85	J. Dobbins	RB	10
86	H. Fannin Jr.	TE	11
87	M. Wilson	WR	14
88	D. Metcalf	WR	9
89	A. Pierce	WR	13
90	J. Mason	RB	6
91	J. Downs	WR	13
92	J. Herbert	QB	7
93	S. Diggs	WR	7
94	T. Lawrence	QB	7
95	C. Williams	QB	10
96	B. Corum	RB	11
97	K. Gainwell	RB	10
98	J. Reed	WR	11
99	R. Harvey	RB	10
100	B. Purdy	QB	8
101	K. Concepcion	WR	11
102	G. Kittle	TE	8
103	K. Monangai	RB	10
104	M. Pittman	WR	9
105	M. Washington Jr.	RB	13
106	C. Hubbard	RB	5
107	T. Kelce	TE	5
108	R. White	RB	7
109	J. Coker	WR	5
110	J. Goff	QB	6
111	D. Goedert	TE	10
112	A. Jones	RB	6
113	M. Golden	WR	11
114	W. Robinson	WR	9
115	D. Stribling	WR	8
116	W. Marks	RB	8
117	C. Rodriguez Jr.	RB	7
118	D. Samuel	WR	8
119	Z. Charbonnet	RB	11
120	J. Dart	QB	8
121	M. Lemon	WR	10
122	J. Jacobs	RB	11
123	J. Meyers	WR	7
124	D. Kincaid	TE	7
125	M. Stafford	QB	11
126	T. Spears	RB	9
127	R. Doubs	WR	11
128	T. Allgeier	RB	14
129	J. Tyson	WR	8
130	M. Andrews	TE	13
131	T. Tucker	WR	13
132	J. Coleman	RB	10
133	P. Mahomes	QB	5
134	B. Nix	QB	10
135	X. Worthy	WR	5
136	K. Murray	QB	6
137	K. Shakir	WR	7
138	J. Love	QB	11
139	T. Bigsby	RB	10
140	D. Boston	WR	11
141	D. Sampson	RB	11
142	E. Johnson	RB	5
143	M. Willis	QB	6
144	K. Allen	WR	13
145	B. Robinson Jr.	RB	11
146	K. Mitchell	RB	7
147	D. Schultz	TE	8
148	J. Johnson	TE	8
149	C. Douglas	WR	6
150	T. Shough	QB	8
151	I. Pacheco	RB	6
152	K. Boutte	WR	8
153	B. Allen	RB	13
154	M. Washington	WR	6
155	K. Black	RB	8
156	M. Fields	WR	8
157	G. Dulcich	TE	6
158	R. Davis	RB	7
159	T. Ferguson	TE	11
160	J. Ferguson	TE	14
161	A. Mitchell	WR	13
162	T. Tracy Jr.	RB	8
163	A. Kamara	RB	8
164	J. Lane	WR	13
165	C. Allen	WR	5
166	C. Bell	WR	6
167	N. Harris	RB	8
168	K. Vidal	RB	7
169	J. McMillan	WR	10
170	B. Mayfield	QB	10
171	R. Bateman	WR	13
172	R. Shaheed	WR	11
173	C. Brooks	RB	11
174	B. Strange	TE	7
175	J. Nailor	WR	13
176	G. Holani	RB	11
177	J. Conner	RB	14
178	H. Henry	TE	11
179	M. Davis	RB	14
180	T. Harris	WR	7
181	P. Bryant	WR	10
182	C. Okonkwo	TE	7
183	Z. Branch	WR	11
184	D. Waller	TE	5
185	G. Bernard	WR	9
186	A. Williams	WR	7
187	T. Hurst	WR	10
188	R. Flournoy	WR	14
189	T. Hunter	WR	7
190	D. Claiborne	RB	6
191	T. Hockenson	TE	6
192	O. Cooper Jr.	WR	13
193	N. Singleton	RB	9
194	J. Hill	RB	13
195	D. Wicks	WR	10
196	A. Barner	TE	11
197	J. Blue	RB	14
198	J. James	RB	8
199	K. Allen	RB	7
200	C. Ridley	WR	9`;

function nameKey(s) {
  return (s || '').toLowerCase()
    .replace(/[.'`\-]/g, '')
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const cbsPlayers = cbsRaw.split('\n').filter(Boolean).map(l => {
  const [rk, name, pos, bye] = l.split('\t');
  return { cbsRank: parseInt(rk, 10), rawName: name.trim(), key: nameKey(name), pos: pos.trim(), bye: bye.trim() };
});

const customLines = fs.readFileSync('docs/fantasy/2026_Rose_Bowl_Custom_Rankings.csv', 'utf8').split('\n').filter(Boolean).slice(1);
const customPlayers = customLines.map(l => {
  const parts = l.split(',').map(s => s.replace(/^"|"$/g, '').trim());
  const [rk, name, pos, tm, tag] = parts;
  return { customRank: parseInt(rk, 10), name, key: nameKey(name), pos, team: tm, tag };
});

// Position-aware matching (fixes the earlier compare script's bug where two
// different-position players sharing an initial+lastname could cross-match,
// e.g. the two "J. Williams" in this very CBS list — one RB, one WR).
function findMatch(cbsPlayer) {
  const parts = cbsPlayer.key.split(' ');
  const firstInit = parts[0]?.[0];
  const last = parts[parts.length - 1];
  // exact key match first
  let candidates = customPlayers.filter(cp => cp.key === cbsPlayer.key);
  if (candidates.length === 0) {
    candidates = customPlayers.filter(cp => {
      const cpParts = cp.key.split(' ');
      return cpParts[0]?.[0] === firstInit && cpParts[cpParts.length - 1] === last;
    });
  }
  if (candidates.length > 1) {
    // disambiguate by position
    const posMatch = candidates.filter(cp => cp.pos === cbsPlayer.pos);
    if (posMatch.length >= 1) return { match: posMatch[0], ambiguous: posMatch.length > 1 ? candidates : null };
    return { match: candidates[0], ambiguous: candidates };
  }
  if (candidates.length === 1) {
    if (candidates[0].pos !== cbsPlayer.pos) {
      return { match: candidates[0], positionMismatch: true };
    }
    return { match: candidates[0] };
  }
  return { match: null };
}

// CBS's list is offense-only (no IDP). The custom board interleaves 40 LBs
// starting at rank 85, which shifts every offense player's overall rank down
// by however many LBs precede them — that's not a real ranking disagreement,
// it's just LBs occupying slots. Compare against each player's OFFENSE-ONLY
// rank (position among non-LB players) instead of raw overall rank.
const offenseOnlyRankByKey = new Map();
let offCounter = 0;
customPlayers.forEach(cp => {
  if (cp.pos !== 'LB') {
    offCounter++;
    offenseOnlyRankByKey.set(cp.key + '|' + cp.pos, offCounter);
  }
});

const rows = [];
let unranked = 0;
let posMismatches = [];
let ambiguousMatches = [];

cbsPlayers.forEach(c => {
  const { match, positionMismatch, ambiguous } = findMatch(c);
  if (!match) {
    unranked++;
    rows.push({ cbsRank: c.cbsRank, cbsName: c.rawName, pos: c.pos, customName: 'NOT ON BOARD', customRank: null, diff: null });
    return;
  }
  if (positionMismatch) posMismatches.push({ cbs: c, custom: match });
  if (ambiguous) ambiguousMatches.push({ cbs: c, candidates: ambiguous });
  const offenseOnlyRank = offenseOnlyRankByKey.get(match.key + '|' + match.pos) ?? null;
  const diff = offenseOnlyRank !== null ? offenseOnlyRank - c.cbsRank : null;
  rows.push({ cbsRank: c.cbsRank, cbsName: c.rawName, pos: c.pos, customName: match.name, customPos: match.pos, customTeam: match.team, customTag: match.tag, customRank: match.customRank, customOffenseOnlyRank: offenseOnlyRank, diff });
});

console.log(`CBS players: ${cbsPlayers.length} | Custom board: ${customPlayers.length}`);
console.log(`Matched: ${cbsPlayers.length - unranked} | Not found on custom board: ${unranked}`);
if (posMismatches.length) {
  console.log('\n⚠ Position mismatches (name matched but position differs — verify manually):');
  posMismatches.forEach(m => console.log(`  CBS ${m.cbs.rawName} (${m.cbs.pos}) matched custom "${m.custom.name}" (${m.custom.pos})`));
}
if (ambiguousMatches.length) {
  console.log('\n⚠ Ambiguous matches (multiple same-position candidates):');
  ambiguousMatches.forEach(m => console.log(`  CBS ${m.cbs.rawName} (${m.cbs.pos}) -> candidates: ${m.candidates.map(c => c.name).join(', ')}`));
}

console.log('\n=== PLAYERS ON CBS TOP 200 BUT NOT ON THE CUSTOM BOARD AT ALL ===');
rows.filter(r => r.customRank === null).forEach(r => {
  console.log(`  CBS #${r.cbsRank} ${r.cbsName} (${r.pos})`);
});

console.log('\n=== SIGNIFICANT RANK DIVERGENCES (|diff| >= 10 offense-only ranks, matched players) ===');
const sig = rows.filter(r => r.customRank !== null && Math.abs(r.diff) >= 10);
sig.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
sig.forEach(r => {
  const dir = r.diff > 0 ? `${r.diff} LOWER on custom board` : `${-r.diff} HIGHER on custom board`;
  console.log(`  ${r.customName.padEnd(24)} (${r.customPos}-${r.customTeam}) | CBS #${r.cbsRank} vs Custom(offense-only) #${r.customOffenseOnlyRank} [overall #${r.customRank}] | ${dir}`);
});

console.log(`\nTotal matched: ${rows.length - unranked}, |diff|>=10: ${sig.length}, |diff|>=20: ${rows.filter(r=>r.customRank!==null && Math.abs(r.diff)>=20).length}`);

fs.writeFileSync('scratch/cbs-diff-full-output.json', JSON.stringify(rows, null, 2));
