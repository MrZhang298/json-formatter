# JSON Formatter Plugin

一个用于IntelliJ IDEA的JSON格式化插件，提供便捷的JSON数据格式化功能。

## 项目简介

JSON Formatter是一个轻量级的IntelliJ IDEA插件，旨在帮助开发者快速格式化和美化JSON数据。该插件提供了直观的用户界面和强大的格式化功能。

## 功能特性

- 🎯 **JSON格式化**: 将压缩的JSON数据格式化为易读的缩进格式
- 🔧 **工具窗口**: 提供专用的工具窗口，方便随时使用
- 📝 **菜单集成**: 在Tools菜单中添加快捷入口
- ⚡ **实时格式化**: 输入JSON后一键格式化
- 🎨 **友好界面**: 分割面板设计，输入输出区域清晰分离

## 项目结构

\`\`\`
json_formatter_plugin/
├── src/
│   ├── main/
│   │   ├── java/org/example/
│   │   │   ├── FormatJsonAction.java          # JSON格式化动作类
│   │   │   ├── JsonFormatterPanel.java        # 格式化面板UI
│   │   │   ├── JsonFormatterToolWindowFactory.java  # 工具窗口工厂
│   │   │   └── Main.java                      # 主类
│   │   └── resources/META-INF/
│   │       └── plugin.xml                     # 插件配置文件
│   └── test/                                  # 测试代码
├── build.gradle.kts                           # Gradle构建配置
├── settings.gradle.kts                        # Gradle设置
└── README.md                                  # 项目说明文档
\`\`\`

## 技术栈

- **开发语言**: Java 11
- **构建工具**: Gradle
- **IDE平台**: IntelliJ IDEA Platform
- **插件框架**: IntelliJ Platform Plugin SDK
- **UI框架**: Swing

## 开发环境要求

- JDK 11 或更高版本
- IntelliJ IDEA 2021.3 或更高版本
- Gradle 7.0 或更高版本

## 构建和安装

### 本地构建

\`\`\`bash
# 克隆项目
git clone <repository-url>
cd json_formatter_plugin

# 构建插件
./gradlew buildPlugin

# 构建的插件文件将生成在 build/distributions/ 目录下
\`\`\`

### 安装插件

1. 在IntelliJ IDEA中打开 `File` -> `Settings` -> `Plugins`
2. 点击齿轮图标，选择 `Install Plugin from Disk...`
3. 选择构建生成的插件zip文件
4. 重启IDE完成安装

## 使用方法

### 方法一：通过工具窗口
1. 在IDE右侧找到 "JSON Formatter" 工具窗口
2. 在输入区域粘贴或输入JSON数据
3. 点击"格式化"按钮查看格式化结果

### 方法二：通过菜单
1. 点击菜单栏 `Tools` -> `JSON 格式化工具`
2. 在弹出的对话框中输入JSON数据
3. 点击"格式化"按钮获取格式化结果

## 插件配置

插件支持IntelliJ IDEA版本范围：2021.3 - 2025.*

## 开发说明

### 主要类说明

- `FormatJsonAction`: 实现JSON格式化的核心逻辑和UI对话框
- `JsonFormatterPanel`: 工具窗口的主面板组件
- `JsonFormatterToolWindowFactory`: 负责创建和管理工具窗口

### 格式化算法

插件使用自定义的JSON格式化算法，支持：
- 自动缩进（4个空格）
- 括号和方括号的换行处理
- 字符串内容的正确识别
- 逗号后的换行和缩进

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 作者

- **yysgm** - 初始开发

## 更新日志

### v1.0-SNAPSHOT
- 初始版本发布
- 基础JSON格式化功能
- 工具窗口和菜单集成
- 支持IntelliJ IDEA 2021.3+

---

如有问题或建议，请提交Issue或联系开发者。
