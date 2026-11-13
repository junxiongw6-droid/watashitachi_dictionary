# 私たちの言葉辞典

一本由日本语课堂回答编成的原创电子辞书：**家族・愛・自由**。

**网站已上线：** https://junxiongw6-droid.github.io/watashitachi_dictionary/

**课堂二维码：** [下载PNG](qr/dictionary-qr.png) · [下载SVG](qr/dictionary-qr.svg)

> 同じ言葉でも、思い浮かべる景色は一人ひとり違う。

项目已实际完成原生静态网页、辞书内容、Excel导入、两种显示模式、自动化测试与GitHub Pages发布。项目所有者已于2026-11-12明确确认所有姓名均为化名，并授权使用 Excel 原始化名及54条原始回答公开发布。当前版本使用完整显示模式（`full`），网页注明姓名为「仮名」。部署结果见仓库的 `DEPLOYMENT.md`。

## 1. 项目目标与当前数据

完整保留同学原文，将共同理解、差异和少数观点整理成可阅读、可追溯的辞书。不是以问卷图表代替词条内容。

仓库中实际文件名为 `responses.xlsx.xlsx`（两个 `.xlsx`），导入脚本兼容这个名称。当前共 18 条回答者记录、54 条有效回答；家族／愛／自由各 18 条。未发现空白回答、重复姓名或完全相同的重复提交。`わからない` 是有效回答，不是缺失值。

原文的空格、换行、文法和姓名均保留。姓名尾随空格也逐字符保留。每条回答保留源工作表、行、列和稳定记录编号，例如 `p01-ai`。

## 2. 技术结构

- 网站：HTML5、CSS3、原生 ES Modules JavaScript、JSON，没有前端框架、后端、数据库或付费 API。
- 开发：Python 3.12+／openpyxl 读取 Excel；Node.js 22+（建议 24）运行测试。
- 测试：Node 内置测试器与 jsdom 测试实际 DOM 交互；Playwright 测试文件供后续浏览器验收使用。
- 字体：自托管 Noto Serif JP / Noto Sans JP（400 字重，SIL Open Font License）。保留系统字体回退；不依赖 Google Fonts 或其他外部 CDN。分片字体按所用字符加载。
- 二维码：仅在获得真实网站地址后使用 Python qrcode；Pillow 用于 PNG。

jsdom 和 Playwright 仅是开发测试依赖，不会进入网站产物。

## 3. 目录

```text
index.html                     页面入口（lang=ja）
css/style.css                  日式简约、响应式样式
css/fonts.css                  日文字体分片声明
assets/fonts/                  本地字体与授权文件
js/app.js                      路由、渲染、搜索和全部交互
js/core.mjs                    可测试的过滤、统计和校验函数
data/editorial.json            编者定义、分类、代表回答编号、分析与证据
data/dictionary.json           自动生成的已授权网页数据
scripts/convert_excel.py       无损读取 Excel → private/raw.json
scripts/validate_data.py       Excel ↔ JSON 逐条校验、分类与证据校验
scripts/build.py               生成允许列表内的静态产物（默认原始化名）
scripts/serve.py               只提供 dist/ 的本地 HTTP 预览
scripts/generate_qr.py          已部署 URL → PNG、SVG
private/raw.json               原始姓名、提交时间和回答（忽略、不发布）
work/                          缓存与开发报告（忽略、不发布）
dist/                          可直接部署的当前授权模式网站（生成、忽略）
tests/                         Python、JavaScript DOM 和浏览器测试
playwright.config.mjs          Chromium / WebKit 浏览器测试配置
.github/workflows/pages.yml    main 推送及手动触发的 Pages 部署
TESTING.md                     已执行结果与未执行检查
responses.xlsx.xlsx            仓库原先已有的 Excel，含实名
```

`data/editorial.json` 保存编辑内容，`dictionary.json` 中的 `responses` 保存原文，`respondents` 保存经授权公开的原始化名。两者在结构上明确分开。所有页面分析明确标注由编者生成，不代表全班一致表决。

## 4. 安装与导入 Excel

在终端进入项目文件夹，首次安装：

```sh
python -m venv .venv
# macOS / Linux
. .venv/bin/activate
# Windows PowerShell 则使用 .venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm ci
```

读取原始数据（自动找到根目录唯一的 `responses.xlsx*`）：

```sh
python scripts/convert_excel.py
```

也可明确指定文件：

```sh
python scripts/convert_excel.py "responses.xlsx.xlsx"
```

必须按顺序包含时间、姓名、家族、愛、自由五列；词语标题允许前缀，例如 `（１）家族`。空白行跳过；缺失姓名或回答发出警告并保留有效内容；重复姓名／同名同回答提交保留并报告，不自动合并。公式单元格拒绝导入，请先导出为值。没有匹配表头时停止；其他未识别工作表会报告，必须人工检查是否包含遗漏内容。

`private/raw.json` 包含完整姓名与时间，请勿上传或放入公开目录。

## 5. 如何修改辞书内容

编辑 `data/editorial.json`，不要直接修改自动生成的 `dictionary.json`。

每个 `word` 包含：

- `definition`：50–100 字的编者综合定义。
- `categories`：主分类的说明、`responseIds`、1–3 个 `representativeIds`。
- `common`、`discoveries`：共同点与差异、新发现及 `evidenceIds`。
- `summary`：100–150 字总结。
- 顶层 `tags`、`notes`：补助标签与需谨慎解释的编者注。

每条有效回答恰好属于一个主分类；辅助标签不计人数。代表回答直接引用原始记录，不手抄或改写原文。分类人数在网页中动态计算。

编者没有把原文中的 `権力` 改成 `権利`；对意思有解释空间的回答有注释。`愛` 中的「執念、執着」和「わからない」各自保留一个分类。

## 6. 运行网站

```sh
python scripts/build.py
python scripts/serve.py
```

终端显示 `http://127.0.0.1:3000`，在浏览器打开。`npm run dev` 也是同样的预览方式。需换端口可用 `python scripts/serve.py --port 8080`。

请不要双击 HTML 以 `file://` 方式打开；浏览器通常禁止该方式的 JSON fetch。GitHub Pages 使用 HTTP(S)，无需特殊 API。

默认首页 `#/` 是独立封面，只展示标题、介绍、装饰和「辞典をひらく」入口。词条目录位于 `#/contents`，搜索位于独立的 `#/search` 页面。顶部导航为「辞典をひらく / 検索 / この辞典について」，目录下方不再重复搜索或编纂介绍。点击页眉品牌可回到封面，词条页的「目次へ」回到目录；浏览器前进、后退保留正常导航。

手机阅读已加大正文、辅助文字与点击区域。「言葉を選ぶ」使用独立按钮组；「読む内容」使用页签。分类先展示名称和人数，一次只展开一个分类，点击后查看说明与代表回答。目录页优先展示三个词条入口，与独立封面分开。

课堂复核材料位于 `review/index.html`，也可从「この辞典について」页面进入；支持浏览器打印或另存PDF，列出18位同学的54条原文、当前分类、综合定义与编者注。确认栏全部留空，状态为「未確認」，需由同学本人和课堂讨论后填写。生成器是 `scripts/generate_review.py`，构建时会按当前显示模式重新生成，原文和姓名逐字保留。

词条详情按三个阅读区组织：**定義・分類 / みんなの回答 / 分析・まとめ**。一次显示一组内容；代表回答、分类方法和分析依据可以按需展开。点击分类会切到已筛选的回答区；带搜索词或回答者的链接也直接显示回答区。阅读区写入URL的 `view` 参数，支持浏览器返回和键盘方向键切换。所有18人的54条原文完整保留。

入口地址使用相对资源路径，支持 GitHub Pages 项目子路径；词条链接是 `#/kazoku`、`#/ai`、`#/jiyuu`，可以直接分享或刷新。搜索与分类写入 hash 查询参数，历史返回恢复筛选和页面滚动。

## 7. 测试

```sh
python -m unittest discover -s tests -p 'test_*.py' -v
npm test
python scripts/build.py
python scripts/validate_data.py --data dist/data/dictionary.json
```

`npm test` 使用 Node 的实验性 VM Module 测试加载器，会出现 ExperimentalWarning；该加载器仅用于测试，不用于网站运行。

浏览器测试（已在 GitHub Actions 实际通过14项，可本机复现）：

```sh
npx playwright install --with-deps chromium webkit
npm run test:browser
```

本机运行时会启动本地预览，对 Chromium / WebKit 分别检查 375、390、430、768、1280px 宽度的交互与溢出，以及加载失败、长回答。WebKit 测试也不等于真实 iPhone Safari。请再用真实 iPhone Safari、Android Chrome 和 Edge 验收。详细状态见 `TESTING.md`，不能将未运行的项目当作通过。

## 8. GitHub Pages 部署

本项目已获得所有者的公开发布授权，`data/publication.json` 记录了模式、化名性质及授权日期。Pages 工作流按此配置构建，只有允许列表中的静态文件会进入发布产物。

1. 检查 `dist/` 中的原始化名和内容。构建仅复制 `index.html`、`css/`、`js/`、`assets/`、当前授权模式的 `data/dictionary.json` 和 `.nojekyll`；不会复制 Excel、`private/`、Git、测试或开发依赖。
2. 获得授权后将项目代码提交到当前仓库。
3. GitHub 仓库 Settings → Pages → Source 选择 **GitHub Actions**。
4. Actions → **Publish dictionary to GitHub Pages** → **Run workflow**。工作流在 main 分支推送及手动触发时执行。
5. 工作流通过数据／交互校验并仅上传 `dist/`。部署作业返回真实 `page_url`，从该结果复制网址；不要仅依据仓库名猜地址。
6. 打开实际网址，测试词条、搜索、Safari、显示模式与触摸操作，再生成二维码。

如环境支持 GitHub Environment 审核，可为 `github-pages` 增加人工审核规则。

原工作簿保留在源仓库中。项目所有者已明确确认其中所有姓名均为化名并授权原文公开；时间戳及开发阶段的 `private/raw.json` 不进入网站产物。

## 9. 生成课堂二维码

等部署成功并取得实际 URL 后：

```sh
python scripts/generate_qr.py "已验证的实际HTTPS网址" --output work/qr
```

脚本检查 HTTPS 地址可访问后输出 `dictionary-qr.png`、`dictionary-qr.svg` 和 `url.txt`。黑白、保留四模块静区，无中央图案。将 SVG 或 PNG 放入 PPT 后，用 iPhone 相机实际扫描验证。本项目已成功发布，生成的真实二维码位于 `qr/`，并通过独立解码器核对网址。

## 10. 更新回答数据

1. 备份原始 Excel；新的同学记录尽量追加在末尾，避免改变已有匿名编号。
2. 运行 `convert_excel.py`，检查所有警告与原文。编号以原工作表的非空记录顺序产生；重新排序会改变编号。
3. 重新审读 `editorial.json` 的分类、代表回答、证据、定义与总结。不要只改人数。
4. 在确认所有编辑内容适用于新数据后，把 `editorial.json` 的 `sourceSHA256` 更新为新 `private/raw.json` 中的 `sourceSHA256`。
5. 执行全部测试与构建。源工作簿变化但尚未完成编辑复核时，构建会失败；避免用旧分析套在新回答上。
6. 测试中对当前 18 / 54 条课堂快照的断言也需按新数据审阅后更新。
7. 再次确认发布范围，重新手动部署。

## 11. 两种展示模式

**当前模式：完整显示原始化名（full）**

```sh
python scripts/build.py
```

`data/publication.json` 设为 `mode: full`、`nameKind: pseudonym`、`publicationApproved: true`，依据项目所有者2026-11-12的明确授权。姓名和回答都从 Excel 原样导入，不替换为编号，网页会说明它们是化名。源数据与 dist 数据保持同一发布模式。

**匿名模式**仍可使用：

```sh
python scripts/build.py --mode anonymous
```

匿名化只替换显示姓名，同一个人保留同一编号，原回答不改。构建扫描公开文本中的原始姓名，避免只在页面隐藏名字。如果今后要长期切换为匿名模式，请把 `data/publication.json` 中的 `mode` 改为 `anonymous`，再测试并提交；CI 会按该配置构建。

如果其他项目将 `publicationApproved` 设为 false，完整模式需要显式的 `--consent-confirmed` 标志；该标志不代替实际许可。

## 12. 常见问题

- **网页显示读取失败**：使用 HTTP 预览，检查 `dist/data/dictionary.json` 存在、路径大小写正确，点击重试；不要只打开本地 HTML。
- **新增回答后构建报错**：先完成编辑复核、更新工作簿哈希和分类编号，再校验；不要关闭校验。
- **搜索姓名没有结果**：当前化名版支持按 Excel 姓名搜索；匿名版则按 `回答者01` 搜索。
- **分类合计超过人数**：每条回答只能有一个主分类，其他观点使用 tags；校验会拒绝遗漏或重复。
- **字体加载慢**：使用系统日文字体回退、`font-display: swap` 和 Unicode 分片；首次加载后浏览器可缓存。
- **Safari 是否已测**：Chromium和WebKit的14项浏览器测试已在GitHub Actions通过，但未进行真实iPhone Safari验收；详见测试报告。
- **部署结果**：已成功发布，线上数据核对及14项线上浏览器测试通过；网址和二维码见本文开头与 `DEPLOYMENT.md`。
