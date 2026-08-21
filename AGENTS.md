# AGENTS.md

> 本文件用于约束 AI（及人类协作者）在 `jileme-app` 仓库内的开发行为。
> 任何代码改动前必须先阅读本文件，并优先遵守本文件中更具体的项目规则。

## 1. 项目定位

- `jileme-app` 是“记了么”生活记录产品的移动客户端，当前阶段先完成登录、工作台和记账入口。
- 后续模块会逐步扩展到日记、目标、笔记、打卡、日程等生活记录场景。
- App 与 Web 属于同一产品：业务语义和 API 契约保持一致，界面与交互遵循移动平台体验。
- 代码演进要服务于长期可维护性：路由页面负责页面组合，业务组件负责交互，请求层负责接口通信，Web API 负责后端业务入口。

## 2. Expo 版本与资料来源

- 当前项目使用 Expo SDK 56。修改 Expo、Expo Router、React Native、原生配置或 Expo SDK 包相关代码前，必须先阅读对应的版本化文档：`https://docs.expo.dev/versions/v56.0.0/`。
- 不使用 `latest` 文档猜测 SDK 56 的 API、默认行为或配置方式；继续阅读时优先访问对应的 `v56.0.0` 页面。
- 不把旧版 Expo、通用 React Native 或未经核实的训练数据经验直接套用到当前项目。
- Expo SDK 升级属于独立任务，必须先核对升级指南、依赖兼容性和原生影响，不在普通功能改动中顺手升级。

## 3. 技术栈与基础约定

- 框架：Expo SDK 56、Expo Router、React Native 0.85。
- 运行时：React 19、TypeScript strict mode。
- 样式：NativeWind 4、Tailwind CSS 3、CSS 变量主题。
- UI：`@rn-primitives/**`、`src/components/ui/**`，并已安装 `@expo/ui` 供适合的原生控件使用。
- 数据查询：SWR 已安装；统一请求层和业务 hooks 尚未落地。
- 路径别名：`@/*` 指向 `src/*`，`@/assets/*` 指向 `assets/*`；新增导入优先使用别名，避免多层 `../../` 回溯。
- 包管理：npm。不要随意新增依赖，确需新增时先说明必要性、包体影响和平台兼容性。
- 不把 React Query、直接 Supabase、SecureStore Token 或其他尚未采用的方案描述为当前架构。

## 4. 目录与职责边界

- `src/app/**`：Expo Router 路由、页面组合和导航配置；保持薄层，不承载通用请求解析、认证细节或可复用的大段 JSX。
- `src/components/ui/**`：现有基础 UI 组件库；优先复用和扩展，不在页面重复实现同类基础组件。
- `src/components/**`：可复用业务组件；按业务域组织，避免无业务含义的过度抽象。
- `src/lib/**`：主题、工具函数以及后续统一请求和 API 契约等非 UI 基础设施。
- `src/global.css` 与 `src/lib/theme.ts`：当前主题的唯一来源，不在旁边建立第二套颜色或主题系统。
- `assets/**`：图片、启动图、应用图标和其他静态资源。
- 不为了套用通用模板而重构现有目录；目录调整必须由真实业务需求驱动。

## 5. Expo Router 与导航规则

- 使用 Expo Router 文件路由，不另外引入一套平行导航系统。
- 页面标题、返回行为和顶部导航优先由 `Stack` 等导航配置负责，不在页面内重复模拟导航栏。
- 尊重 `app.json` 中启用的 `typedRoutes`，不要用无类型字符串或类型断言绕过路由检查。
- 根布局必须维持全局样式、`ThemeProvider`、`StatusBar`、`Stack` 和 `PortalHost` 的正确关系。
- 不重新加入没有配套完成时机的 `SplashScreen.preventAutoHideAsync()`；手动阻止启动页消失时，必须同时设计可靠的 `hideAsync()` 路径和异常兜底。
- 页面只组织页面级状态、交互和业务组件；跨页面逻辑应下沉到共享组件、hooks 或 `src/lib/**`。

## 6. 共享 API 与请求规则

- App 的业务请求统一访问 `jileme` Web 仓库提供的 `/api/**` 后端入口，不另建重复业务后端。
- 页面、组件和 hooks 不直接访问 Supabase、数据库或散落调用第三方业务接口。
- React Native 不能依赖浏览器当前域名；禁止在 App 中直接写 `fetch("/api/...")`。请求层必须用绝对 API 基础地址组合 `/api/**` 路径。
- API 基础地址使用非敏感的 `EXPO_PUBLIC_API_URL` 等客户端配置；环境变量修改后应重启开发服务器。
- `EXPO_PUBLIC_` 变量会进入客户端包，只能存放可公开配置，禁止放置数据库密码、service role key、私有 API key 或其他密钥。
- 引入请求基础设施时统一收口到 `src/lib/request.ts`，封装基础地址、headers、JSON 解析、错误处理、取消请求和鉴权失败处理。
- 查询类数据优先复用已安装的 SWR；mutation 使用 SWR mutation 或基于统一请求层的业务封装，不在组件中重复裸写请求逻辑。
- 业务 hooks 可按模块放在 `src/hooks/**` 或对应业务目录，底层请求必须复用统一请求层。
- 请求参数和返回数据必须有明确的 TypeScript 业务契约，集中在 `src/lib/api/**` 或等价的业务模块，并与 Web API 的实际返回保持一致。
- 错误处理必须区分网络错误、HTTP 错误、业务错误和鉴权失败；客户端只展示可理解的消息，不暴露服务端原始错误、Token、Cookie、密钥或数据库细节。

## 7. 认证与敏感信息边界

- 当前移动端认证传递方式尚未落地；实现前必须先核对 Web API 支持的移动端会话方式，不能假定浏览器 Cookie 会在原生环境自动按相同方式工作。
- 不擅自把 Cookie、Bearer Token、SecureStore、刷新 Token 或某个认证 SDK 写成既定方案。
- 如果确认需要在设备保存 Token 等敏感凭据，应使用经过批准的平台安全存储方案；不得放入普通异步存储、源码、日志或公开环境变量。
- App 内不得包含 Supabase service role key，不复制 Web 仓库的服务端 Supabase helper，也不在客户端绕过 Web API 的权限判断。
- 认证失败、退出和凭据清理必须由统一请求/认证层处理，页面只负责展示状态和触发用户交互。

## 8. UI 组件复用规则

- 通用跨平台 UI 优先复用 `src/components/ui/**` 中已有组件。
- Picker、Switch、Menu、Sheet 等需要系统级原生体验的控件，先查阅 SDK 56 文档并评估 `@expo/ui` 是否有合适实现，再考虑 React Native 内置或新增社区依赖。
- 不为了统一表面形式重复包装已经具备平台设计语言的原生控件。
- 使用基础组件时，默认不得在调用处覆盖颜色、高度、内边距、字号、圆角、阴影、边框及 pressed/disabled 状态等视觉规格。
- 确需视觉差异时，优先扩展基础组件的 `variant`、`size` 或状态契约；调用处主要补充宽度、外层间距、定位等布局样式。
- `Input`、`Select`、`Textarea`、`Button` 等同类控件必须保持统一规格。
- 组件优先通过 `children` 组合内容，避免不断增加只描述内容结构的专用 props。
- 合并或条件拼接 `className` 时使用 `cn()`（来自 `@/lib/utils`），不要手动拼接复杂字符串。
- 可交互组件必须覆盖 pressed、disabled、loading 等必要状态，并提供正确的 `accessibilityRole`、label 和可读反馈。

## 9. 主题、颜色与文字规则

- `src/global.css` 中的 CSS 变量与 `src/lib/theme.ts` 中的导航主题共同组成当前唯一主题系统；新增能力应沿用现有命名和实现方式。
- 新 UI 使用语义化 NativeWind 类，例如 `bg-background`、`text-foreground`、`bg-card`、`text-card-foreground`、`text-muted-foreground`、`border-border`、`bg-primary` 和 `text-primary-foreground`。
- 不在页面散落十六进制颜色、临时色板或逐处手写深浅模式颜色。
- 新增产品色前先扩展主题变量，再通过语义类或共享组件使用。
- `src/app/**` 中的页面文字必须使用 `@/components/ui/text`，不得直接从 `react-native` 导入 `Text`；ESLint 已对该边界进行约束。
- `Button` 等组件内部文字应继续通过 `TextClassContext` 接收变体颜色，不在页面为每个按钮手动指定文字色。
- 调整主题时同时核对导航主题和内容主题，避免 Header、状态栏、页面背景与文字使用不同色彩状态。
- 新建或修改页面至少验证浅色和深色主题；不能只修复截图中出现问题的一种模式。
- 保留“记了么”温暖、克制、生活记录的视觉气质，但实现必须经过主题和组件系统。

## 10. 原生配置、依赖与 EAS

- `app.json` 和 Expo 配置插件是应用名称、图标、启动图、Scheme、权限及其他原生配置的持久来源。
- `ios/`、`android/` 当前被 Git 忽略并属于预生成产物；直接修改其中的文件只能作为明确说明的本地临时验证，不能代替 `app.json` 或配置插件方案。
- 安装 Expo 或 React Native 依赖时使用 `npx expo install <package>`，让 Expo 校验与 SDK 56 的兼容版本；不要直接手工猜测版本。
- 新增原生依赖前确认 Expo Go、development build、iOS、Android 和 EAS Build 的支持情况。
- EAS build、submit、发布、证书、Provisioning Profile 和商店操作必须由用户明确要求，不自动执行。
- 修改应用身份、Bundle Identifier、Scheme、权限、图标或启动图后，说明是否需要重新 prebuild 或重新构建原生应用。

## 11. 文案与移动端体验

- 当前不强制引入 i18n；除非用户明确要求，不为规范本身额外引入国际化依赖。
- 用户可见文案保持简洁、温暖、生活化，符合“记了么”记录类产品定位。
- 大量重复或跨页面复用的文案应抽为常量或配置，避免散落难维护。
- 页面需要考虑安全区域、键盘遮挡、触摸目标、横纵尺寸变化和不同设备屏幕。
- 数据页面应明确处理 loading、刷新、空状态、错误、离线和不可用状态。
- 不把 Web 的 hover 作为移动端主要反馈；触摸反馈、手势和系统行为应符合平台习惯。
- 大数据列表使用适合虚拟化的 React Native 列表，不把 `@expo/ui` 的设置式 `List` 当作大数据虚拟列表。

## 12. 代码风格

- 遵守 `.prettierrc`：不写分号、双引号、2 空格缩进、行宽 100、`trailingComma: "es5"`。
- 文件名优先使用 kebab-case。
- TypeScript 优先使用明确类型，避免无意义的宽泛类型和 `any`。
- 注释只解释为什么、约束和权衡，不逐行复述代码做了什么。
- 不做与当前任务无关的重构、全仓格式化或目录调整。
- 除非文件已有合理例外，导入优先使用 `@/...` 别名，并保持与周围代码一致的排序和风格。

## 13. 验证规则与当前基线

- 修改前检查相关文件、适用的 `AGENTS.md` 和当前 Git 状态；修改后优先验证本次涉及的目标文件。
- TypeScript/TSX 目标文件优先运行 `npx eslint <files>`，并运行 `npx tsc --noEmit` 判断类型影响。
- 运行全量检查时必须区分本次新增错误与历史错误，不得为了让命令变绿而顺手扩大任务范围。
- 当前已知基线：多个 `src/components/ui/**` 文件导入了尚未安装的 `lucide-react-native`，因此全量 `npx tsc --noEmit` 会报告既有的模块缺失错误。该问题修复后应删除本条说明。
- 当前没有测试脚本；不要声称测试已通过。新增测试基础设施必须作为明确任务处理。
- UI 改动按风险在 iOS 模拟器验证；涉及跨平台行为时同时验证 Android。主题相关改动必须检查浅色和深色模式。
- 文档或配置改动至少运行 `git diff --check`，并核对路径、命令、配置来源和最终 diff 范围。
- 未经用户明确要求，不默认启动开发服务器、不默认运行全仓 build、EAS build 或发布流程。

## 14. Git 与协作

- 尊重用户已有改动；不得回退、覆盖或清理与当前任务无关的变更。
- 工作中发现来源不明的新变化时立即停止，并询问用户如何处理。
- 未经用户明确要求，不执行 `git commit`、`git push`、创建或合并 PR。
- 未经明确许可，不执行破坏性 Git、文件删除或不可恢复的数据操作。
- `npm run reset-project` 会移动和重建项目文件，只有在用户明确要求重置项目时才能执行。
- 修改完成后说明已完成内容、未完成内容、验证结果、既有问题和用户下一步可选操作。
