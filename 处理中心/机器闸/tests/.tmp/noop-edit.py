import os
p=os.environ['LIB_EDIT_TARGET']
s=open(p,encoding='utf-8').read()
open(p,'w',encoding='utf-8',newline='').write(s)
