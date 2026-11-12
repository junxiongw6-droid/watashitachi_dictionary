# 发布记录

项目所有者于2026-11-12确认 Excel 所有姓名均为化名，明确授权将原始化名及全部54条原始回答公开发布到当前 GitHub 仓库及 GitHub Pages。

- 发布数据：18位回答者，家族／愛／自由各18条，合计54条。
- 显示模式：`full`；姓名性质：`pseudonym`。
- 构建配置：`data/publication.json`，网页中明确说明「仮名」。
- 工作流：`.github/workflows/pages.yml`；main 推送及手动触发；构建并校验后上传 `dist/`。
- 当前 GitHub 连接器没有 Pages 设置接口；命令行 GitHub API 请求返回 Forbidden；共享浏览器未登录 GitHub。启用 Pages 需要所有者在 Settings → Pages → Source 选择 GitHub Actions。
- 项目代码及工作流已提交并推送至main；功能、数据与两个引擎的浏览器测试共46项通过。
- 首轮构建成功，部署作业返回404，明确要求先启用GitHub Pages。当前部署等待该仓库设置完成；尚无已验证的公开URL或二维码。
- 最新工作流包含verify-live：部署成功后从page_url取真实地址，校验线上数据，生成PNG/SVG二维码并再次检查线上交互。
