# 全站背景

采用用户选定的第 3 款「和纸＋极淡枝叶」背景。桌面使用横版，手机使用同款竖版，均为 WebP。背景位于固定的无交互伪元素上，独立于文档流，不使用移动 Safari 容易抖动的 background-attachment: fixed。打印时移除背景。

- `cover-lifestyle-desktop.webp`, `cover-lifestyle-mobile.webp`: generated landscape and portrait cover scenes for the lifestyle homepage. Upscaled 2× with Real-ESRGAN (x4plus, reduced to 2×) for high-DPI screens: desktop 3200×1800, mobile 1800×2700.

- `window-shadow-desktop.webp`, `window-shadow-mobile.webp`: generated paper and window-light backgrounds for interior pages. Previous botanical files are retained for easy rollback.

- 封面花枝与书页使用原图的局部遮罩图层和 CSS 动画，不需要额外动画图片或 GIF；静止原图保留为基础画面。
