# Memory OS · 类型化 payload 验收脚本 v1（独立于设计文档）

> 设计师 @2026-09-05 ｜ 对应设计：`Memory_OS_类型化payload_设计_v1_2026-09-05.md`（同目录）
> 用法：施工完成后，按本脚本**从头走到尾**，逐条记录实际结果；任何一条不达标=不通过，不许跳步。
> 环境：主仓 `E:\mov归档\0027-mov`；`export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"`；`GRADLE=$(echo ~/.gradle/wrapper/dists/gradle-8.13-bin/*/gradle-8.13/bin/gradle)`；真机=模拟器 `adb -s emulator-5556`。
> 纪律：不信自报信实物——每条都要留下可查证产物（命令输出/XML/截图/logcat）。

---

## 第 0 步 · 基线建立（施工分支上）

```bash
cd <施工 worktree>   # feat/<工单号>，基于最新 origin/main
git log --oneline -1   # 记录基线 hash
"$GRADLE" :memory-os:test :app:testDebugUnitTest --console=plain
```
- 预期：BUILD SUCCESSFUL；记录基线计数（memory-os __/0/0，app __/0/0）——**写在验收记录开头**
- 不达标处理：基线红=停，先查真红（不施工）

---

## 第 1 步 · L1 结构面（字段+模板注册表）

```bash
# 1.1 SemanticEntry 新字段实物
grep -n "payload" memory-os/src/main/kotlin/com/hermes/mov/memory/os/semantic/SemanticEntry.kt
# 1.2 六类模板注册表实物（PREFERENCE/HABIT/FACT/IDENTITY/RELATION/PROGRESS）
grep -rn "场景\|取向\|强度" memory-os/src/main/kotlin/ | head -5
# 1.3 定向测试
"$GRADLE" :memory-os:test --tests "*Payload*" --rerun-tasks --console=plain
```
- 预期：字段在；六类模板在注册表；定向用例全绿且 **tests 计数 >0**（⚠️ 已知坑 #6：0 测试 BUILD SUCCESSFUL=假绿，必须核 XML 计数）
- 证据：grep 输出 + test XML 路径

---

## 第 2 步 · L1 AI 闸门（校验+降级）

```bash
"$GRADLE" :memory-os:test --tests "*Extract*" --rerun-tasks --console=plain
```
逐条核（测试名以实际交付为准，计数申报）：
- [ ] LLM 输出合法 payload → 草案生成，状态=**PROPOSED**（不是 ACTIVE）
- [ ] LLM 输出超枚举/缺字段 → 校验闸拒绝 payload，**条目降级为纯文本照常入库**（payload=null）
- [ ] 校验闸拒绝 ≠ 报错阻塞——入库动作本身成功
- [ ] actor=ai-proposal 写 ACTIVE → 抛/拒（既有权限面不破）

---

## 第 3 步 · L1 变异亲杀（3 锚，逐个做——改代码→跑→必红→还原→复绿）

| # | 变异动作 | 必红判定 |
|---|---|---|
| M1 | 把抽取结果的默认状态从 PROPOSED 改成 ACTIVE | 「AI 草案禁直写 ACTIVE」用例必红 |
| M2 | 把降级路径改成「抽取失败=抛异常」 | 「抽取失败降级纯文本入库」用例必红 |
| M3 | 删掉冲突检出里的字段比对（退回 type 层互斥） | 「同场景异取向必检出」用例必红 |

```bash
# 每个锚的标准动作序列：
git diff --stat          # 记录变异前状态
# …改一行…
"$GRADLE" :memory-os:test --rerun-tasks --console=plain   # 必须 FAILED
git checkout -- .        # 还原
"$GRADLE" :memory-os:test --rerun-tasks --console=plain   # 必须复绿
```
- 证据：三次 FAILED 输出 + 还原后绿（已知坑 #6：注入点选单行删除/纯函数改值）

---

## 第 4 步 · L1 回归（既有体系零退化）

```bash
"$GRADLE" :memory-os:test :app:testDebugUnitTest --rerun-tasks --console=plain
```
- 预期：UPG-52 既有 27 用例 + UPG-05/22 打点链用例全绿；全量计数 ≥ 基线（新增计数申报，0 失败）
- 证据：XML 计数对比基线

---

## 第 5 步 · L2 真机走查（emulator-5556，新 APK 装机）

```bash
adb -s emulator-5556 install -r <施工分支构建的 app-debug.apk>
adb -s emulator-5556 logcat -c   # 清日志后开始
```

- [ ] **5.1 同义去重**：对话中两次表达同义偏好（如「我喜欢清淡」/「少油少盐挺好」）→ 池子里出现**合并候选**（不是两条独立条目）；截图=记忆页/候选区
- [ ] **5.2 冲突检出**：先入「爱吃辣」，再入「最近不吃辣」→ 出现 RE_EVALUATE 冲突提示（不是静默覆盖）；截图
- [ ] **5.3 画像对齐**：IDENTITY 条目的 payload 维度 ↔ 画像页（UPG-51 标签池）同维同值；截图双页对照
- [ ] **5.4 降级可视**：抽取失败的条目在记忆页正常显示（纯文本形态，无报错）；截图
- [ ] **5.5 用户主权**：payload 字段在 UI 可见；条目删除后 Timeline 有记录、检索不再命中；logcat 事件链佐证

⚠️ 瞬态 UI（气泡/提示）走查=**录屏法**（已知坑 #8）：`adb -s emulator-5556 shell screenrecord /sdcard/t.mp4`，截图只证稳态。

---

## 第 6 步 · L3 契约面

- [ ] memory-api 零改动（`git diff origin/main...HEAD -- memory-api/` 为空或仅预期项）
- [ ] Semantic 只读面不破：Retrieval 仍只读；Timeline 仍 append-only（无 update/delete 暴露）
- [ ] 原子写入：Semantic 变 ⇒ 同事务 Timeline append（含 payload 字段变更）

---

## 第 7 步 · 证据与申报收口

- [ ] 交付报告含：基线/终态计数对比、3 变异锚亲杀记录、真机 5 场景截图、Token/KV 两节申报（payload 抽取走 LLM 通道——**必须申报 token 增量**）
- [ ] 证据落 `程序员\<工单号>-evidence\`（XML+截图+logcat 段）
- [ ] manifest 用 `审验员\deliver-gen.mjs` 机制产出；`审验.py --verify-hash` HASH_OK 后登记两表（先表后库）
- [ ] 共享面：动了 SemanticEntry=全局数据结构 → 交付报告必附《共享面影响清单》+coverage_status（红线 24）

---

## 一票否决项（任一命中=验收不通过）

1. 基线红还继续施工
2. 变异锚没亲杀（只跑正向用例）
3. 0 测试假绿（XML 计数=0 未察觉）
4. payload 能绕过 PROPOSED 直写 ACTIVE
5. 抽取失败导致条目丢失/报错阻塞
6. UPG-52 既有用例任何一条退化
