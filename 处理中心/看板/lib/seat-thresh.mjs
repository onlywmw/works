// SYS-169/SYS-176 席位表现评定阈值单源——看板 engine.mjs 与 巡检台/_tools/seat-score.mjs 两面同引本件（禁再各写一份）。
// 同文（SYS-176 红线）：本件与网页侧 `处理中心/看板/lib/seat-thresh.mjs` 同文·基准 [75,60]（看板现行·用户可见面为准）；口径变更=只改此处一处。
export const SEAT_THRESH = [75, 60]; // 好≥75 稳≥60 差<60
export const seatTag = (s) => (s >= SEAT_THRESH[0] ? "好" : s >= SEAT_THRESH[1] ? "稳" : "差");
