import glob,json,runpy,sys
original=glob.glob
skipped=[]
def valid_references(pattern):
 result=[]
 for f in original(pattern):
  try:
   with open(f,encoding='utf-8') as h: json.load(h)
   result.append(f)
  except (ValueError,OSError) as e: skipped.append({'path':f,'error':str(e)})
 return result
glob.glob=valid_references
sys.argv=['scripts/build-team-standings.py','--season','2026','--week','7']
runpy.run_path('scripts/build-team-standings.py',run_name='__main__')
with open('reports/engineering/week8-profile-refresh/standings-skipped-references.json','w',encoding='utf-8') as h: json.dump(skipped,h,indent=2)
