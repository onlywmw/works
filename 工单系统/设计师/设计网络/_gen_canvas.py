# -*- coding: utf-8 -*-
# Canvas 组织树生成器（总览+钻取版）：
#   MOV.canvas      = 总览（MOV→域→区，区卡=文件节点可点进区笔记看工单列表）
#   方向/<域>.canvas = 域详情（区→工单全展开）
# 用法：python 设计师/设计网络/_gen_canvas.py（在 MOV 根目录跑；重跑覆盖旧画布）
import os, re, json

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
 '登录与合规弹窗': ['UPG-09','UPG-13','UPG-15','UPG-11'], '聊天页': ['UPG-20','UPG-12','UPG-21'],
 '设置与页面收口': ['UPG-14','UPG-17'], '品牌与图标': ['UPG-19'],
 '设计规范': ['UPG-24','UPG-25'],
 '工具体系': ['UPG-01','UPG-02','UPG-03','UPG-04','UPG-18','UPG-23'], '记忆与智能': ['UPG-05','UPG-06','UPG-22'],
 '预算与权限': ['UPG-07'], '构建与发布': ['UPG-16'],
 '官网': ['S-07','S-08'], '市场站': ['S-05','S-06'], '域与合规': ['S-04'],
 '工作台': ['UPG-08','UPG-10','W-09','W-10','W-12'], '账号服务': ['W-11'],
}

uid = [0]
def nid():
    uid[0] += 1
    return f'n{uid[0]}'

# ---------- 域详情画布（区→工单） ----------
W_T, H_T, GAP_X, GAP_Y = 280, 70, 30, 90
W_A, H_A = 220, 56
for d, al in domains.items():
    nodes, edges = [], []
    def area_w(a):
        return max(sum(W_T + GAP_X for _ in areas[a]) - GAP_X, W_A)
    total_w = sum(area_w(a) + GAP_X for a in al) - GAP_X
    id_d = nid()
    nodes.append({'id': id_d, 'type': 'file', 'file': f'{root}/方向/{d}.md', 'x': total_w/2 - 110, 'y': 0, 'width': 220, 'height': 64})
    x = 0
    for a in al:
        aw = area_w(a)
        id_a = nid()
        nodes.append({'id': id_a, 'type': 'file', 'file': f'{root}/方向/{a}.md', 'x': x + aw/2 - W_A/2, 'y': 64 + GAP_Y, 'width': W_A, 'height': H_A})
        edges.append({'id': nid(), 'fromNode': id_d, 'fromSide': 'bottom', 'toNode': id_a, 'toSide': 'top'})
        tx = x
        for t in areas[a]:
            id_t = nid()
            nodes.append({'id': id_t, 'type': 'file', 'file': f'{root}/工单/{t}.md', 'x': tx, 'y': 64 + GAP_Y + H_A + GAP_Y, 'width': W_T, 'height': H_T})
            edges.append({'id': nid(), 'fromNode': id_a, 'fromSide': 'bottom', 'toNode': id_t, 'toSide': 'top'})
            tx += W_T + GAP_X
        x += aw + GAP_X
    json.dump({'nodes': nodes, 'edges': edges}, open(f'{root}/方向/{d}.canvas', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- 总览画布（MOV→域→区，区卡显示工单计数） ----------
W_A2, H_A2 = 260, 84
def area_w2(a): return W_A2
nodes, edges = [], []
def dom_w(d): return sum(W_A2 + GAP_X for _ in domains[d]) - GAP_X
total_w = sum(dom_w(d) + GAP_X for d in domains) - GAP_X
id_root = nid()
nodes.append({'id': id_root, 'type': 'text', 'text': '# 🌳 MOV', 'x': total_w/2 - 110, 'y': 0, 'width': 220, 'height': 64, 'color': '5'})
x = 0
for d, al in domains.items():
    dw = dom_w(d)
    id_d = nid()
    nodes.append({'id': id_d, 'type': 'file', 'file': f'{root}/方向/{d}.md', 'x': x + dw/2 - 110, 'y': 64 + GAP_Y, 'width': 220, 'height': 64})
    edges.append({'id': nid(), 'fromNode': id_root, 'fromSide': 'bottom', 'toNode': id_d, 'toSide': 'top'})
    ax = x
    for a in al:
        stats = {}
        for t in areas[a]: stats[status_of(t)] = stats.get(status_of(t), 0) + 1
        cnt = ' '.join(f'{k}×{v}' for k, v in stats.items() if k)
        id_a = nid()
        nodes.append({'id': id_a, 'type': 'file', 'file': f'{root}/方向/{a}.md', 'x': ax, 'y': 64 + GAP_Y + 64 + GAP_Y, 'width': W_A2, 'height': H_A2})
        edges.append({'id': nid(), 'fromNode': id_d, 'fromSide': 'bottom', 'toNode': id_a, 'toSide': 'top'})
        ax += W_A2 + GAP_X
    x += dw + GAP_X
json.dump({'nodes': nodes, 'edges': edges}, open(f'{root}/MOV.canvas', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- 区笔记补「展开画布」链接（幂等） ----------
for a in areas:
    d = next(k for k, v in domains.items() if a in v)
    p = f'{root}/方向/{a}.md'
    s = open(p, encoding='utf-8').read()
    link = f'展开工单画布：[[{d}.canvas|{d} · 详情画布]]'
    if '.canvas' not in s:
        s = s.rstrip() + f'\n\n{link}\n'
    stats = {}
    for t in areas[a]:
        k = status_of(t) or '？'
        stats[k] = stats.get(k, 0) + 1
    cnt = '工单：' + ' '.join(f'{k}×{v}' for k, v in stats.items())
    if re.search(r'^- 工单：.*$', s, re.M):
        s = re.sub(r'^- 工单：.*$', f'- {cnt}', s, count=1, flags=re.M)
    else:
        s = s.replace(f'上级：[[方向/{d}]]', f'上级：[[方向/{d}]]\n\n- {cnt}', 1)
    open(p, 'w', encoding='utf-8').write(s)

print('总览 MOV.canvas：节点', len(nodes), '边', len(edges))
print('域详情画布×4 已生成；区笔记已挂钻取链接')
