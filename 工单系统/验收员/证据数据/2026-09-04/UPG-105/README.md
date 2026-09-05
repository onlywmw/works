# UPG-105 批一内容层 复验证据（2026-09-04 · 841f591d）

⚠️ 缺口备案同 UPG-46（XML/快照未拷贝）——可复现命令清单：
```bash
git -C "E:/mov归档/0027-mov" worktree add --detach "E:/mov-verify/upg105-rerun" 841f591d
cd "E:/mov-verify/upg105-rerun"
cp "E:/mov归档/0027-mov/local.properties" .
JAVA_HOME="C:\Program Files\Android\Android Studio\jbr" ./gradlew.bat :app:testDebugUnitTest --rerun-tasks   # 预期 app 814/0/1
```

## 已留证部分（worktree 内文件随清理消失，md5/结论在此锚定）
- 同源核对亲测：registry 4 能力（fulfill.dispatch/track/settle.pay/sense.capture）全在 llms.txt+负例双零（mcp_postgres=False/微信支付=False）——**核对脚本逻辑**（python json+in 判断）已在本 README 记录命令
- llms.txt 头 30 行（备案/版本戳/4 能力按域分组）曾 cat 输出——内容实锚

## 关联
ACCEPTANCE_LOG §P55 / 工单表 UPG-105 行 / 工单库 UPG-105 卡
