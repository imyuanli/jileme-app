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

- `src/app/**`：Expo Router 路由、页面组合和导航配置；页面专属的状态、请求和 JSX 默认直接保留在对应路由文件中，不为了形式上的“薄层”再创建只做透传的一次性组件。
- `src/components/ui/**`：现有基础 UI 组件库；优先复用和扩展，不在页面重复实现同类基础组件。
- `src/components/**`：仅放真实复用、独立复杂交互或边界清晰的业务组件；不得仅因代码位于页面中就提前拆文件。
- `src/lib/**`：主题、工具函数以及后续统一请求和 API 契约等非 UI 基础设施。
- `src/global.css` 与 `src/lib/theme.ts`：当前主题的唯一来源，不在旁边建立第二套颜色或主题系统。
- `assets/**`：图片、启动图、应用图标和其他静态资源。
- 不为了套用通用模板而重构现有目录；目录调整必须由真实业务需求驱动。

## 5. Expo Router 与导航规则

- 使用 Expo Router 文件路由，不另外引入一套平行导航系统。
- 只有多个路由确实共享导航结构、布局或访问语义时才创建 `(group)` 和组级 `_layout.tsx`；不得为单一路由或未来可能出现的页面预建路由组。
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
- 查询类数据必须尽量保持 Web 的直接调用形态：`useSWR<T>(key, fetcher.get)`；mutation 使用 `useSWRMutation(key, fetcher.post)`，不得为普通接口再包一层 repository、service、请求类或重复缓存层。
- `src/lib/request.ts` 只负责绝对 API 地址、headers、body、响应解析和错误归一化，不承载业务状态、页面状态或 SWR 缓存。
- 只有与 Web 一致且确有跨页面组合价值的能力（例如当前用户会话）才允许提取业务 hook；不得用 hook 隐藏普通页面的 SWR key、请求参数或刷新行为。
- 不引入 React Query、另一套全局请求状态或自行实现的缓存机制与 SWR 并存。
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
- 不创建只接收一次 props、只转发到另一个组件或只包一层 JSX 的业务组件；单页面使用的局部渲染优先写成页面文件内的函数。
- Picker、Switch、Menu、Sheet 等需要系统级原生体验的控件，先查阅 SDK 56 文档并评估 `@expo/ui` 是否有合适实现，再考虑 React Native 内置或新增社区依赖。
- 不为了统一表面形式重复包装已经具备平台设计语言的原生控件。
- 页面、`ScrollView`、`FlatList`、`SectionList` 和 Bottom Sheet 的内容统一使用 16pt（`px-4`）水平轨道；不得在不同页面自行改用 `px-5`、`px-6` 或 `px-8` 作为页面边缘间距。
- `ScrollView` 的页面 padding 和页面级 `gap` 必须设置在 `contentContainerClassName` 或 `contentContainerStyle`；`FlatList`、`SectionList` 的统一边距与节奏由列表内容容器承担，`renderItem` 不得使用 `mx-*`、`mb-*` 为同级列表项制造间距。
- 页面一级区块统一由父容器使用 `gap-6`，section 内部普通内容使用 `gap-4`，标题与说明等紧密内容使用 `gap-1` 或 `gap-2`；不得通过相邻 section 自带的 `mt-*`、`mb-*` 叠加页面节奏。
- loading、empty、error 和正常内容必须共享同一条 16pt 页面对齐轴。全宽背景或分隔线可以延伸到屏幕边缘，但其真实内容仍须对齐唯一的 16pt 内容轨道。
- 禁止使用负 margin 抵消页面 padding；确有不可替代的视觉需求时，必须限制在局部并用注释说明原因、约束和影响。
- Card、Button、Input、Item 等组件内部 padding 属于组件规格，不得转移到页面，也不得由调用处重复定义。
- 使用基础组件时，默认不得在调用处覆盖颜色、高度、内边距、字号、圆角、阴影、边框及 pressed/disabled 状态等视觉规格。
- 确需视觉差异时，优先扩展基础组件的 `variant`、`size` 或状态契约；调用处默认只补充宽度、flex、定位和必要的外层布局，能由现有组件契约表达时不得新增视觉类。
- 保存、提交、创建、删除、重试、关闭以及 Header、Toolbar 中的独立操作默认使用 `Button`；不得用裸 `Pressable` 重复实现已有 `Button` 能表达的控件。
- 可点击列表行、整张 Card、日历日期、分类或账本选择项等复合交互区域可以使用 `Pressable`；不得为了表面统一将复杂内容强行塞入 `Button`。
- 相同的 `Pressable` 结构重复出现时，先检查 `Item` 等现有组件是否已经覆盖；只有形成真实复用、独立复杂交互或清晰边界后才提取新组件。
- `Input`、`Select`、`Textarea`、`Button` 等同类控件必须保持统一规格。
- 横向操作控件统一使用 Native 尺寸矩阵：`xs` 为 32pt、`sm` 为 36pt、`default` 为 40pt、`lg` 为 44pt；适用范围包括 `Button`、`Input`、`SelectTrigger`、`TabsList`/`TabsTrigger`、`Toggle`/`ToggleGroupItem` 和 `Menubar`/`MenubarTrigger`。
- `Button` 的文字与图标尺寸必须成对等高：`xs`/`icon-xs`、`sm`/`icon-sm`、`default`/`icon`、`lg`/`icon-lg`；同一工具栏中的控件通过选择相同语义尺寸对齐，不在调用处覆盖高度。
- 基础组件的 `size` 是稳定的语义契约，禁止使用 `sm:`、`md:` 等屏幕断点自动改变组件自身高度、最小宽度或内部 padding；紧凑尺寸所需的触摸区域由基础组件处理，并允许调用者通过原生行为属性显式覆盖。
- `Checkbox`、`Radio`、`Switch`、`Badge` 和 `Textarea` 使用各自的独立规格，不强行套用横向操作控件高度矩阵。
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
- 编写代码前先理解目标文件、真实数据流和所有相关调用方，再选择最小正确实现；不得用未经理解的小改动掩盖共享根因。
- 按顺序判断：需求是否需要新增代码、项目内是否已有可复用实现、标准或平台原生能力是否覆盖、已安装依赖是否覆盖；只有前述路径都不成立时才编写完成需求所需的最少代码。
- 优先复用、删除和修改共享根因；避免在多个调用点重复打补丁，并以最少文件和最小正确 diff 为目标。
- 不创建未被当前需求证明的抽象、透传组件、包装层或样板代码；不为了写代码而写代码，也不做降低可读性的代码高尔夫。
- 不得以减少代码为理由牺牲类型安全、输入校验、错误处理、安全性、可访问性或必要验证。
- 不做与当前任务无关的重构、全仓格式化或目录调整。
- 除非文件已有合理例外，导入优先使用 `@/...` 别名，并保持与周围代码一致的排序和风格。

## 13. 验证规则与当前基线

- 修改前检查相关文件、适用的 `AGENTS.md` 和当前 Git 状态；修改后优先验证本次涉及的目标文件。
- 选择能够捕获本次回归的最小相关验证；不得为了简单改动引入测试框架、fixtures 或额外基础设施。
- TypeScript/TSX 目标文件优先运行 `npx eslint <files>`，并运行 `npx tsc --noEmit` 判断类型影响。
- 运行全量检查时必须区分本次新增错误与历史错误，不得为了让命令变绿而顺手扩大任务范围。
- 当前没有测试脚本；不要声称测试已通过。新增测试基础设施必须作为明确任务处理。
- UI 改动按风险在 iOS 模拟器验证；涉及跨平台行为时同时验证 Android。主题相关改动必须检查浅色和深色模式。
- 纯文档改动只需运行 `git diff --check` 并核对最终 diff 范围；配置改动还必须核对路径、命令和配置来源。不得为文档改动运行无关的 ESLint、TypeScript、构建或测试命令。
- 未经用户明确要求，不默认启动开发服务器、不默认运行全仓 build、EAS build 或发布流程。

## 14. Git 与协作

- 尊重用户已有改动；不得回退、覆盖或清理与当前任务无关的变更。
- 工作中发现来源不明的新变化时立即停止，并询问用户如何处理。
- 未经用户明确要求，不执行 `git commit`、`git push`、创建或合并 PR。
- 未经明确许可，不执行破坏性 Git、文件删除或不可恢复的数据操作。
- `npm run reset-project` 会移动和重建项目文件，只有在用户明确要求重置项目时才能执行。
- 修改完成后说明已完成内容、未完成内容、验证结果、既有问题和用户下一步可选操作。
