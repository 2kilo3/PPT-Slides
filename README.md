# PPT-Slides

GitHub 私有仓库：[2kilo3/PPT-Slides](https://github.com/2kilo3/PPT-Slides)。文件型 skill 的调用名为 `$ppt-studio`，Claude 插件入口为 `/ppt-studio:ppt-studio`。

面向多种场景的 HTML PPT 制作 skill。以 frontend-slides 的视觉探索和模板为基础，加入独立实现的演讲者、讲稿、编辑导出及验收能力，并吸收实际制作中的风格漂移、中文排版和修改同步经验。

## 当前能力

- 从主题、材料或现有 PPTX 开始，组织内容，生成真实风格样页。
- 完整复用 **12 种基础风格 + 34 套设计模板**，同时支持**自由设计**与用户参考。
- 固定 16:9，键盘/触摸翻页，减少动效，离线 HTML。
- 独立演讲者窗口、双向翻页、逐页讲稿编辑、字号和计时。
- 页面文字编辑、浏览器草稿、保存 HTML、导出 Markdown 讲稿。
- 截图和结构检查、PDF 备份、按需混合可编辑 PPTX（文字/标记矩形原生，复杂视觉转图片）。

内容组织沿用 PPT 制作职责，不强制增加联网研究、代码审计或商业策划流程。

## 风格选择与复用

| 来源 | 示例 | 使用方式 |
|---|---|---|
| [12 种基础风格](STYLE_PRESETS.md) | Paper & Ink、Swiss Modern、Neon Cyber | 复用配色、字体层级和视觉元素，适配当前内容 |
| [34 套设计模板](bold-template-pack/selection-index.json) | BlockFrame、Cobalt Grid、Signal | 先看预览，再按选定设计规范生成整套页面 |
| 自由设计 | 根据主题、受众、内容或参考创建 | 先做真实样页，选定后复用同一套设计规则 |

未指定方向时，默认提供三个不同来源的设计方向，每个展示封面和代表性内容页。可以继续要求“再给几种”“列出全部风格”，或直接指定模板。三种来源都接入同一套演讲者、讲稿、编辑和导出能力；示例稿的样式不限制正式生成。

## 使用

将本仓库作为一个完整 skill 文件夹交给支持文件型 skills 的 AI 工具，入口是 `SKILL.md`。保留相邻资源目录。示例请求：

> 使用 $ppt-studio，根据这些材料制作一份中文汇报 PPT，先给我几种实际样页，再生成带讲稿和演讲者模式的 HTML。

已有明确风格或旧稿时直接提供；工具应保留有效内容和已选设计。只复制 SKILL.md 会缺少模板和运行资源。

Claude Code 的插件打包位于 `plugins/ppt-studio`，根 `.claude-plugin/marketplace.json` 指向该包；私有仓库访问需要相应 GitHub 权限。插件入口为 `/ppt-studio:ppt-studio`。已做包内容一致性检查，尚未在 Claude Code 内执行安装验收。

## 本地演示与验证

播放最终 HTML 不需要 Node/Python。制作工具和检查使用 Python 3、Node.js 与开发依赖：

```sh
npm install
npx playwright install chromium
python scripts/bundle.py examples/starter.html work/demo.html
node scripts/check-deck.cjs work/demo.html work/qa --pdf --pptx
npm test
```

浏览器打开 `work/demo.html`。方向键/Space 翻页，N 演讲者模式，F 全屏，E 编辑，Escape 结束编辑，Ctrl/Cmd+S 保存 HTML。按钮也可操作。

浏览器草稿保存在当前设备；保存 HTML 才能携带修改。AI 后续修改应读取用户最新导出的文件。示例使用系统中文字体；正式跨设备交付建议嵌入授权字体。

## 开发和许可

根目录是唯一维护源。修改后运行 `python scripts/package_skill.py` 同步插件包，`python scripts/package_skill.py --check` 校验同步状态。

详见 [来源记录](UPSTREAM.md)、[实现范围](references/integration.md)、[导出边界](references/export.md)。MIT；保留 frontend-slides 与模板源作者版权声明。没有复制 personal-homepage-skill 的受限代码或材料。

当前版本为 0.1.0。自动化 PASS 不代表所有生成稿审美合格；最终稿仍需逐页视觉检查。PPTX 的字体和版式需要在目标 PowerPoint 环境验证，跨浏览器与投影设备表现也需实际验收。
