# OpenCode Plugin Profiles

Các file trong thư mục này là **snippet config** để bật thêm ecosystem plugins theo nhu cầu.

## Cách dùng

- Giữ `opencode.jsonc` chính ở trạng thái core.
- Chọn một hoặc nhiều profile rồi merge vào config của bạn.
- Local plugins trong `~/.config/opencode/plugins/` và local tools trong `~/.config/opencode/tools/` tự load theo docs, nên profiles ở đây chỉ tập trung vào **npm plugins**.

## Profiles

- `core.jsonc` — baseline profile, không thêm npm plugin mặc định.
- `context-efficiency.jsonc` — profile placeholder cho tối ưu context; hiện để trống vì các ecosystem entries tương ứng chưa có npm package khả dụng lúc kiểm tra.
- `typescript.jsonc` — tối ưu riêng cho TypeScript/Svelte-heavy repos.
- `security.jsonc` — bảo vệ secret/PII tốt hơn.
- `observability.jsonc` — theo dõi session và debug hành vi agent.
- `orchestration.jsonc` — background agents và orchestration nâng cao.
- `memory-productivity.jsonc` — memory và tracking năng suất.
- `sandbox.jsonc` — sandbox/worktree/devcontainer workflows.
- `research-web.jsonc` — tìm kiếm web, crawl, fetch sâu hơn.
- `quality-of-life.jsonc` — notification và tiện ích hiển thị.

## Lưu ý

- Không nên bật tất cả profiles cùng lúc.
- Ưu tiên `core`, sau đó thêm theo use case thật.
- Các plugin orchestration nặng không được bật mặc định vì có thể chồng chéo với kiến trúc `worker`/`worker-impl`/`worker-review`.
- Các auth plugins không được gom thành một profile mặc định vì chúng phụ thuộc nhà cung cấp và thường loại trừ lẫn nhau.
- Một số ecosystem entries là repo/community listing nhưng không có npm package khả dụng tại thời điểm kiểm tra; các profile tương ứng đã được để trống hoặc chỉ giữ package đã xác minh trên npm.
