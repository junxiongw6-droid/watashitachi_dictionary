# 发布结果

**网站已于2026-11-12成功发布至 GitHub Pages。**

网站：https://junxiongw6-droid.github.io/watashitachi_dictionary/

二维码：[PNG](qr/dictionary-qr.png) · [SVG](qr/dictionary-qr.svg)。PNG为492×492像素，黑白、四模块静区，独立ZXing解码验证通过，指向上述实际网站地址。

## 发布内容

- 18位回答者；家族18、愛18、自由18，合计54条原始回答。
- 使用Excel原始化名，模式full、姓名性质pseudonym。项目所有者于2026-11-12明确确认全部姓名为化名，并授权原始化名及回答公开发布。
- 定义、分类、分析与总结明确标为编者内容，不冒充原始回答。
- 网站仅部署允许列表内的静态文件，不部署Excel、原始时间记录或开发目录。

## 验证结果

实际部署与线上验证记录：

https://github.com/junxiongw6-droid/watashitachi_dictionary/actions/runs/43158449411

部署源码版本：`23a8063c99f54a91cba5c09f65c661f4ec6169ee`。后续二维码与文档提交不改变网站运行代码。

- deploy：success；GitHub返回实际公开URL。
- verify-live：success。
- 实际首页、CSS、字体声明、JS、JSON请求成功。
- 线上JSON与批准的源数据完全一致；18个原始化名与54条原始回答保留。
- 发布前：11项Python、21项JavaScript/DOM、14项Chromium/WebKit浏览器测试通过。
- 发布后：真实GitHub Pages站点再次通过14项Chromium/WebKit测试（33.9秒）。
- 两个引擎均覆盖375、390、430、768、1280px，测试导航、搜索、分类、回答者视图、随机回答、复制链接、返回顶部、历史返回、加载失败与长文本。
- 二维码由部署成功后返回的page_url生成，并额外使用独立解码器核对。

真实iPhone Safari、Android Chrome和Edge尚未做真机验收。WebKit测试不等于真实iPhone Safari；可以用上方HTTPS地址在iPhone Safari直接打开并试扫二维码。

## 后续更新

Pages Source已由所有者设置为GitHub Actions。main推送或手动运行工作流会构建、测试、发布，再核对线上数据并生成最新二维码。文档和二维码归档提交使用`[skip ci]`，避免重复发布相同应用代码。
