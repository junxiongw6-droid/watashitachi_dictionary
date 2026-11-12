# 发布记录

项目所有者于2026-11-12确认 Excel 所有姓名均为化名，明确授权将原始化名及全部54条原始回答公开发布到当前 GitHub 仓库及 GitHub Pages。

- 发布数据：18位回答者，家族／愛／自由各18条，合计54条。
- 显示模式：`full`；姓名性质：`pseudonym`。
- 构建配置：`data/publication.json`，网页中明确说明「仮名」。
- 工作流：`.github/workflows/pages.yml`；main 推送及手动触发；构建并校验后上传 `dist/`。
- 当前 GitHub 连接器没有 Pages 设置接口；命令行 GitHub API 请求返回 Forbidden；共享浏览器未登录 GitHub。启用 Pages 需要所有者在 Settings → Pages → Source 选择 GitHub Actions。
- 部署任务尚在进行。只有实际成功发布并验证后，才能在这里填写公开 URL 与二维码。
