// redact.test.mjs —— redact.mjs 自测夹具（SYS-187）：正例逐类被掩 + 负例零误伤 + CLI 行为（raw/开关/fail-closed）
// 运行：node --test 处理中心/机器闸/设备工具/     （或直接指定本文件）
// 夹具一律**合成假数据**（禁真用户数据）
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REDACT = fileURLToPath(new URL("./redact.mjs", import.meta.url));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "redact-test-"));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const run = (input, { args = [], env = {} } = {}) =>
  spawnSync(process.execPath, [REDACT, ...args], { input, encoding: "utf8", env: { ...process.env, ...env }, windowsHide: true });

// —— 合成假数据 ——
const ID = "11010119900307721X";
const CREDIT = "91000000ABCDEFGHJK";
const CARD = "6217000000000000";
const MOBILE = "13800000000";
const EMAIL = "zhangsan@example.com";
const ADDRESS = "北京市朝阳区测试路1号";
const PASSWORD = "fake-pass-123";
const TOKEN = "tok_fake_abc123";
const SK = "sk-testkey0001";
const BEARER = "Bearer fake-bearer-token-123";

// —— 负例（白名单·必须零误伤）——
const NEG = {
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  businessCode: "BC20260001",
  mediaId: "media_0a1b2c3d4e5f6071",
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "1728196800123",
};

test("JSON 回吐：键名层掩码 + 负例照原样 + raw 文件在 + stderr 摘要行在", () => {
  const input = JSON.stringify({ idNo: ID, contactMobile: MOBILE, contactEmail: EMAIL, bankAccount: CARD, businessCode: NEG.businessCode, mediaId: NEG.mediaId });
  const rawFile = path.join(TMP, "json.raw.txt");
  const r = run(input, { args: ["--raw-out", rawFile] });
  assert.equal(r.status, 0);
  const parsed = JSON.parse(r.stdout); // 掩码后仍是合法 JSON
  assert.equal(parsed.idNo, "11**************1X");
  assert.equal(parsed.contactMobile, "13*******00");
  assert.equal(parsed.contactEmail, "***@example.com");
  assert.equal(parsed.bankAccount, "62************00");
  assert.equal(parsed.businessCode, NEG.businessCode);
  assert.equal(parsed.mediaId, NEG.mediaId);
  assert.equal(fs.readFileSync(rawFile, "utf8"), input); // 原文只落本地
  assert.match(r.stderr, /\[redact\] raw=.+ masked=\d+/);
});

test("key=value repr：键名层逐类被掩", () => {
  const input = `Data(idNo=${ID}, licenseNo=${CREDIT}, bankAccount=${CARD}, contactMobile=${MOBILE}, contactEmail=${EMAIL}, address=${ADDRESS}, password=${PASSWORD}, token=${TOKEN})`;
  const r = run(input, { args: ["--raw-out", path.join(TMP, "repr.raw.txt")] });
  assert.equal(r.status, 0);
  for (const [masked, plain] of [
    ["idNo=11**************1X", ID],
    ["licenseNo=91**************JK", CREDIT],
    ["bankAccount=62************00", CARD],
    ["contactMobile=13*******00", MOBILE],
    ["contactEmail=***@example.com", EMAIL],
    ["address=北京*******1号", ADDRESS],
    ["password=fa*********23", PASSWORD],
    ["token=to***********23", TOKEN],
  ]) {
    assert.ok(r.stdout.includes(masked), `缺掩码形态：${masked}\n实际：${r.stdout}`);
    assert.ok(!r.stdout.includes(plain), `原文泄漏：${plain}`);
  }
});

test("混合文本：证件/信用代码/卡号/手机/邮箱/sk-/Bearer 兜底被掩", () => {
  const input = `HTTP 200 身份证 ${ID} 卡 ${CARD} 手机 ${MOBILE} 邮箱 ${EMAIL} 统一码 ${CREDIT} Authorization: ${BEARER} 凭据 ${SK}`;
  const r = run(input, { args: ["--raw-out", path.join(TMP, "mixed.raw.txt")] });
  assert.equal(r.status, 0);
  for (const [masked, plain] of [
    ["身份证 11**************1X", ID],
    ["卡 62************00", CARD],
    ["手机 13*******00", MOBILE],
    ["邮箱 ***@example.com", EMAIL],
    ["统一码 91**************JK", CREDIT],
    ["Bearer ***", BEARER],
    ["凭据 sk**********01", SK],
  ]) {
    assert.ok(r.stdout.includes(masked), `缺掩码形态：${masked}\n实际：${r.stdout}`);
    assert.ok(!r.stdout.includes(plain), `原文泄漏：${plain}`);
  }
});

test("负例零误伤：sha256/businessCode/mediaId/uuid/时间戳逐字照原样", () => {
  const input = `sha256=${NEG.sha256} businessCode=${NEG.businessCode} mediaId=${NEG.mediaId} uuid=${NEG.uuid} ts=${NEG.timestamp}`;
  const r = run(input, { args: ["--raw-out", path.join(TMP, "neg.raw.txt")] });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, input);
});

test("掩码幂等：掩码输出再过一遍逐字不变", () => {
  const input = `idNo=${ID} 卡 ${CARD} 邮箱 ${EMAIL}`;
  const first = run(input, { args: ["--raw-out", path.join(TMP, "idem1.raw.txt")] });
  const second = run(first.stdout, { args: ["--raw-out", path.join(TMP, "idem2.raw.txt")] });
  assert.equal(first.status, 0);
  assert.equal(second.status, 0);
  assert.equal(second.stdout, first.stdout);
});

test("MOV_MASK=off：原样透传 + stderr 警示留痕", () => {
  const input = `idNo=${ID} card ${CARD}`;
  const r = run(input, { args: ["--raw-out", path.join(TMP, "off.raw.txt")], env: { MOV_MASK: "off" } });
  assert.equal(r.status, 0);
  assert.equal(r.stdout, input);
  assert.match(r.stderr, /MASK=off/);
});

test("fail-closed：raw 落盘失败 ⇒ 非零退出且不输出未掩码原文", () => {
  const blocker = path.join(TMP, "blocker");
  fs.writeFileSync(blocker, "x");
  const r = run(`idNo=${ID}`, { args: ["--raw-out", path.join(blocker, "raw.txt")] });
  assert.notEqual(r.status, 0);
  assert.equal(r.stdout, "");
  assert.match(r.stderr, /fail-closed/);
});
