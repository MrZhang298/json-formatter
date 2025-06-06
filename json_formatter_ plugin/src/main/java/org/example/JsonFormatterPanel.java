package org.example;

import javax.swing.*;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import javax.swing.text.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JsonFormatterPanel extends JPanel {
    private final JTextArea inputArea = new JTextArea();
    private final JEditorPane outputArea = new JEditorPane();
    private final JSplitPane splitPane;

    public JsonFormatterPanel() {
        setLayout(new BorderLayout());
        inputArea.setLineWrap(true);
        inputArea.setWrapStyleWord(true);
        // 输入区域恢复默认配色
        inputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        outputArea.setContentType("text/plain");
        outputArea.setEditable(false);
        // 输出区域背景跟随IDEA主题，移除固定白色背景
        outputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));

        // 创建输出区域的滚动面板，禁用水平滚动
        JScrollPane outputScrollPane = new JScrollPane(outputArea);
        outputScrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        outputScrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);

        splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT,
                new JScrollPane(inputArea), outputScrollPane);
        splitPane.setResizeWeight(0.5);
        // 分隔条颜色跟随IDEA主题，不设置自定义颜色

        JButton formatBtn = new JButton("格式化");
        formatBtn.addActionListener(this::onFormat);
        JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        btnPanel.add(formatBtn);

        // 移除字体大小下拉框，直接用outputArea
        splitPane.setBottomComponent(outputScrollPane);

        add(splitPane, BorderLayout.CENTER);
        add(btnPanel, BorderLayout.SOUTH);

        // 自动格式化
        inputArea.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) { autoFormat(); }
            public void removeUpdate(javax.swing.event.DocumentEvent e) { autoFormat(); }
            public void changedUpdate(javax.swing.event.DocumentEvent e) { autoFormat(); }
        });
    }

    private void onFormat(ActionEvent e) {
        autoFormat();
    }

    private void autoFormat() {
        String text = inputArea.getText();
        try {
            String formatted = formatJson(text);
            // 先清空内容，避免HTML解析异常
            outputArea.setText("");
            outputArea.setContentType("text/html");
            // 强制设置JEditorPane字体属性
            outputArea.putClientProperty(JEditorPane.HONOR_DISPLAY_PROPERTIES, Boolean.TRUE);
            outputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
            // 使用SwingUtilities.invokeLater避免EDT异常
            javax.swing.SwingUtilities.invokeLater(() -> {
                try {
                    outputArea.setText("<html><head><style>body{font-family:monospace;font-size:12px !important;margin:0;padding:5px;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;}</style></head><body>" + formatted + "</body></html>");
                } catch (Exception e) {
                    // 如果HTML渲染失败，回退到纯文本
                    outputArea.setContentType("text/plain");
                    outputArea.setText("HTML渲染失败，显示纯文本:\n" + formatted.replaceAll("<[^>]*>", ""));
                }
            });
        } catch (Exception ex) {
            // 先清空内容
            outputArea.setText("");
            outputArea.setContentType("text/html");
            // 强制设置JEditorPane字体属性
            outputArea.putClientProperty(JEditorPane.HONOR_DISPLAY_PROPERTIES, Boolean.TRUE);
            outputArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
            javax.swing.SwingUtilities.invokeLater(() -> {
                try {
                    outputArea.setText("<html><head><style>body{font-family:monospace;font-size:12px !important;margin:0;padding:5px;color:#f48771;word-wrap:break-word;overflow-wrap:break-word;white-space:pre-wrap;}</style></head><body><div style='background:#5a1d1d;padding:10px;border-radius:4px;border-left:4px solid #f48771;'>" + escapeHtml(ex.getMessage()) + "</div></body></html>");
                } catch (Exception e) {
                    // 如果HTML渲染失败，回退到纯文本
                    outputArea.setContentType("text/plain");
                    outputArea.setText("JSON格式错误: " + ex.getMessage());
                }
            });
        }
        // 输入区不高亮
    }

    private String formatJson(String json) throws Exception {
        // 解析JSON并递归生成HTML
        Object parsed;
        try {
            parsed = new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
        } catch (Exception e) {
            // 解析失败，抛出异常
            throw new Exception("JSON格式错误: " + e.getMessage());
        }
        return formatJsonRecursive(parsed, 0);
    }

    private String formatJsonRecursive(Object obj, int depth) {
        String indent = "&nbsp;&nbsp;".repeat(depth);
        String nextIndent = "&nbsp;&nbsp;".repeat(depth + 1);
        if (obj == null) {
            return "<span style='color:#b03670;'>null</span>";
        }
        if (obj instanceof com.fasterxml.jackson.databind.node.TextNode) {
            String val = ((com.fasterxml.jackson.databind.node.TextNode)obj).asText();
            return "<span style='color:#a53328;'>\"" + escapeHtml(val) + "\"</span>";
        }
        if (obj instanceof com.fasterxml.jackson.databind.node.NumericNode) {
            return "<span style='color:#2656c9;'>" + obj.toString() + "</span>";
        }
        if (obj instanceof com.fasterxml.jackson.databind.node.BooleanNode) {
            return "<span style='color:#132d6b;'>" + obj.toString() + "</span>";
        }
        if (obj instanceof com.fasterxml.jackson.databind.node.ArrayNode) {
            com.fasterxml.jackson.databind.node.ArrayNode arr = (com.fasterxml.jackson.databind.node.ArrayNode)obj;
            if (arr.size() == 0) return "<span style='color:#292929;font-weight:bold;'>[]</span>";
            StringBuilder sb = new StringBuilder();
            sb.append("<span style='color:#292929;font-weight:bold;'>[</span><br>");
            for (int i = 0; i < arr.size(); i++) {
                sb.append(nextIndent);
                sb.append(formatJsonRecursive(arr.get(i), depth + 1));
                if (i < arr.size() - 1) sb.append("<span style='color:#292929;'>,</span>");
                sb.append("<br>");
            }
            sb.append(indent).append("<span style='color:#292929;font-weight:bold;'>]</span>");
            return sb.toString();
        }
        if (obj instanceof com.fasterxml.jackson.databind.node.ObjectNode) {
            com.fasterxml.jackson.databind.node.ObjectNode map = (com.fasterxml.jackson.databind.node.ObjectNode)obj;
            java.util.Iterator<java.util.Map.Entry<String,com.fasterxml.jackson.databind.JsonNode>> it = map.fields();
            if (!it.hasNext()) return "<span style='color:#292929;font-weight:bold;'>{}</span>";
            StringBuilder sb = new StringBuilder();
            sb.append("<span style='color:#292929;font-weight:bold;'>{</span><br>");
            int idx = 0;
            int size = map.size();
            while (it.hasNext()) {
                java.util.Map.Entry<String,com.fasterxml.jackson.databind.JsonNode> entry = it.next();
                sb.append(nextIndent);
                // 属性名使用红色
                sb.append("<span style='color:#a53328;'>\"" + escapeHtml(entry.getKey()) + "\"</span><span style='color:#292929;'>: </span>");
                sb.append(formatJsonRecursive(entry.getValue(), depth + 1));
                if (idx < size - 1) sb.append("<span style='color:#292929;'>,</span>");
                sb.append("<br>");
                idx++;
            }
            sb.append(indent).append("<span style='color:#292929;font-weight:bold;'>}</span>");
            return sb.toString();
        }
        return escapeHtml(obj.toString());
    }

    private String escapeHtml(String text) {
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    // 简单高亮：括号、属性名
    private void highlightJson(JEditorPane editor, String text) {
        StyledDocument doc;
        if (!(editor.getDocument() instanceof StyledDocument)) {
            editor.setContentType("text/rtf");
        }
        doc = (StyledDocument) editor.getDocument();
        // 清除样式
        doc.setCharacterAttributes(0, text.length(), SimpleAttributeSet.EMPTY, true);

        // 高亮属性名（假设属性名为"xxx":）
        SimpleAttributeSet keyAttr = new SimpleAttributeSet();
        StyleConstants.setForeground(keyAttr, new Color(0, 128, 0));
        Pattern keyPattern = Pattern.compile("\"(.*?)\"(?=\\s*:\\s*)");
        Matcher matcher = keyPattern.matcher(text);
        while (matcher.find()) {
            doc.setCharacterAttributes(matcher.start(), matcher.end() - matcher.start(), keyAttr, false);
        }
    }
}