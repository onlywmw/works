# -*- coding: utf-8 -*-
# 方向树组织图生成器：方向/工单 frontmatter + 工单库卡面 → 方向/MOV.md 尾部 mermaid 块
# 用法：python _gen_org_tree.py（在 MOV 根目录跑；幂等，重跑替换旧图）
import os, re
root = '设计师/设计网络'
lib = open('工单库.md', encoding='utf-8').read()
def title_of(tid):
    m = re.search(rf'^# {tid} (.+)$', lib, re.M)
    t = m.group(1).strip() if m else tid
    return re.sub(r'（.*?）', '', t)[:14]
def status_of(tid):
    p = f'{root}/工单/{tid}.md'
    if not os.path.exists(p): return ''
    s = open(p, encoding='utf-8').read()
    m = re.search(r'status: "(.*?)"', s)
    s = m.group(1) if m else ''
    if '已合' in s or '通过' in s or '闭环' in s: return '✅'
    if '已派' in s or '在施' in s: return '🔨'
    if '待派' in s or '待认领' in s or '待领' in s: return '📋'
    return ''
domains = {
 'UI设计': ['登录与合规弹窗','聊天页','设置与页面收口','品牌与图标','设计规范'],
 '结构设计': ['工具体系','记忆与智能','预算与权限','构建与发布'],
 '营销设计': ['官网','市场站','域与合规'],
 '内部基建': ['工作台','账号服务'],
}
areas = {
 '登录与合规弹窗': ['UPG-09','UPG-13','UPG-15','UPG-11'], '聊天页': ['UPG-20','UPG-12'],
 '设置与页面收口': ['UPG-14','UPG-17'], '品牌与图标': ['UPG-19'],
 '设计规范': ['UPG-24','UPG-25'],
 '工具体系': ['UPG-01','UPG-02','UPG-03','UPG-04','UPG-18','UPG-23'], '记忆与智能': ['UPG-05','UPG-06','UPG-22'],
 '预算与权限': ['UPG-07'], '构建与发布': ['UPG-16'],
 '官网': ['S-07','S-08'], '市场站': ['S-05','S-06'], '域与合规': ['S-04'],
 '工作台': ['UPG-08','UPG-10','W-09','W-10','W-12'], '账号服务': ['W-11'],
}
_ids = {}
def nid(s):  # 中文名转唯一安全 id（计数器，防撞）
    if s not in _ids:
        _ids[s] = f'n{len(_ids)}'
    return _ids[s]
lines = ['flowchart TD', '  MOV["🌳 MOV"]']
for d, al in domains.items():
    lines.append(f'  {nid(d)}["{d}"]'); lines.append(f'  MOV --> {nid(d)}')
    for a in al:
        lines.append(f'  {nid(a)}["{a}"]'); lines.append(f'  {nid(d)} --> {nid(a)}')
        for t in areas[a]:
            st = status_of(t)
            label = f'{st}{t} {title_of(t)}' if st else f'{t} {title_of(t)}'
            lines.append(f'  {nid(t)}["{label}"]'); lines.append(f'  {nid(a)} --> {nid(t)}')
lines += ['  classDef domain fill:#1a1a1a,color:#fff,stroke:#000',
 '  classDef area fill:#f3f4f7,color:#1a1a1a,stroke:#c8c8cc',
 '  class ' + ','.join(nid(d) for d in domains) + ' domain',
 '  class ' + ','.join(nid(a) for a in areas) + ' area']
mermaid = '```mermaid\n' + '\n'.join(lines) + '\n```'
p = f'{root}/方向/MOV.md'
s = open(p, encoding='utf-8').read()
s = re.sub(r'```mermaid\n.*?```\n?', '', s, flags=re.S)
s = s.rstrip() + '\n\n## 组织树（自动生成，勿手改——由方向/工单 frontmatter 重建）\n\n' + mermaid + '\n'
open(p, 'w', encoding='utf-8').write(s)
print('OK →', p)
