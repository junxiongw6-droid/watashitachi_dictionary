# 验证记录

执行日期：2026-11-12（日本时间）。公开内容已按所有者授权切换为 Excel 原始化名；姓名性质为「仮名」。

## 已实际执行

| 检查 | 结果 |
| --- | --- |
| Excel 全部有效记录 | 18条；无空白回答、重复姓名或完全相同提交 |
| 三个词语有效回答 | 家族18、愛18、自由18；合计54条 |
| Excel ↔ JSON | 姓名、原文、空格、姓名对应、来源坐标与记录编号逐条一致 |
| 公开模式 | full / pseudonym；18个原始化名，没有替换为回答者编号 |
| 主分类合计 | 家族5+9+3+1=18；愛7+3+4+1+1+1+1=18；自由6+5+3+4=18 |
| 代表回答与分析依据 | 仅引用对应词语的真实回答ID |
| 定义字数 | 74／75／82；均在50–100字内 |
| 总结字数 | 115／119／123；均在100–150字内 |
| Python 自动化测试 | 11项通过 |
| JavaScript 核心与 DOM 交互 | 21项通过 |
| Chromium 浏览器测试 | 7项通过 |
| WebKit 浏览器测试 | 7项通过 |
| 375、390、430、768、1280px | 两个浏览器引擎全部通过；各词条无横向溢出 |
| 入口与字体资源 | 相对路径资源存在；字体自托管；浏览器截图实际显示正常 |
| 部署文件 | 只打包HTML、CSS、JS、字体与授权模式JSON，不打包Excel或原始时间记录 |

合计46项自动化测试通过。浏览器测试是在 GitHub Actions 的 Linux 运行器上实际执行，非仅提供测试文件。结果见：

https://github.com/junxiongw6-droid/watashitachi_dictionary/actions/runs/43158283795

该次 build 作业成功，日志明确为 `14 passed (32.6s)`。`browser-tests` 工件含两个引擎、五种宽度的首页和爱词条截图，以及HTML报告。已实际查看1280px Chromium首页与375px WebKit首页截图。

## 覆盖的行为

- 首页导航、三个词条、直接打开链接、未知路由、快速切换。
- 日语内容／原始化名／读音搜索、多条件交集、无结果、清空、分类筛选。
- 代表回答展开、回答者选择、三词回答对照、缺失回答提示。
- 随机回答来自真实数据并可更换。
- 复制链接API与手动复制备用界面。
- 历史返回保留分类、查询和滚动；返回顶部。
- JSON 404重试、零回答、缺失分类、超长文本、HTML转义。
- 数据异常：重复提交保留并报告、空白行／姓名／回答、公式拒绝、原文或姓名对应篡改、回答遗漏、重复分类、虚构代表和证据。

## GitHub Pages线上验收

已成功发布：https://junxiongw6-droid.github.io/watashitachi_dictionary/

部署及线上验证：[GitHub Actions记录](https://github.com/junxiongw6-droid/watashitachi_dictionary/actions/runs/43158449411)。

- deploy和verify-live均为success。
- 线上HTML、CSS、JS、JSON资源请求成功；线上数据与已授权源数据完全一致，保留18个原始化名和54条回答。
- 真实公开网址再次通过14项Chromium/WebKit测试，日志明确为 `14 passed (33.9s)`。
- PNG/SVG二维码以GitHub返回的实际page_url生成，PNG经独立ZXing解码核对，地址一致。
- 发布前46项检查与发布后14项浏览器检查均通过；后者是在实际网站上重跑同一套浏览器用例。

## 真机验收限制

- 真实iPhone Safari、Android Chrome和Microsoft Edge真机验收。WebKit测试不能等同于真实Safari。


项目中的 `verify-live` 作业已完成线上核对、二维码生成及线上浏览器测试，相关报告和截图保存在该次运行的 `live-browser-tests` 工件中。

## 本机复现

```sh
pip install -r requirements.txt
npm ci
python -m unittest discover -s tests -p 'test_*.py'
npm test
python scripts/build.py
python scripts/validate_data.py --data dist/data/dictionary.json
npx playwright install --with-deps chromium webkit
npm run test:browser
```

本机预览只提供dist目录。此前共享环境的 `sites-preview` 转发服务多次超时，因此改由仓库中的GitHub Actions运行浏览器测试，未绕过云环境网络限制。


## 2026-11-13：按顺序改进可读性与课堂复核

源码版本：fba056f33a329d2e4e84ab6912d209d2427fa7a3。

运行记录：https://github.com/junxiongw6-droid/watashitachi_dictionary/actions/runs/43246873881

- 本地23项JavaScript/DOM与11项Python测试通过。
- 发布前20项Chromium/WebKit测试通过（26.3秒），发布后在真实网站再跑20项全部通过（40.8秒）。
- 375／390／430px时三个词条入口均位于844px高的首屏内；五种宽度无横向溢出。
- 手机阅读页签字体至少14px，点击高度至少48px；主内容、分类说明和辅助文字已放大。
- 「言葉を選ぶ」按钮组与「読む内容」页签分开；分类目录默认全部折叠，一次只打开一个，筛选跳转有效。
- 线上HTML、CSS、JS、JSON及review核对表逐字节匹配本次构建。
- 核对表54条原文与姓名均按记录ID逐条比对，包括空白字符；确认栏未填写，明确标记尚待本人及课堂复核。
- 已查看375px WebKit首页与词条截图、1280px Chromium首页截图。真实iPhone Safari验收仍未执行。

可打印核对表：https://junxiongw6-droid.github.io/watashitachi_dictionary/review/index.html
