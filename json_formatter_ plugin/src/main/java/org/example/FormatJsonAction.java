package org.example;

import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.ui.DialogWrapper;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;

public class FormatJsonAction extends AnAction {
    @Override
    public void actionPerformed(AnActionEvent e) {
        JsonFormatterDialog dialog = new JsonFormatterDialog();
        dialog.show();
    }

    static class JsonFormatterDialog extends DialogWrapper {
        private final JTextArea inputArea = new JTextArea();
        private final JTextArea outputArea = new JTextArea();
        private final JSplitPane splitPane;

        protected JsonFormatterDialog() {
            super(true);
            setTitle("JSON 格式化工具");
            inputArea.setLineWrap(true);
            outputArea.setLineWrap(true);
            outputArea.setEditable(false);
            splitPane = new JSplitPane(JSplitPane.VERTICAL_SPLIT,
                    new JScrollPane(inputArea), new JScrollPane(outputArea));
            splitPane.setResizeWeight(0.5);
            init();
        }

        @Nullable
        @Override
        protected JComponent createCenterPanel() {
            JPanel panel = new JPanel(new BorderLayout());
            panel.add(splitPane, BorderLayout.CENTER);
            JButton formatBtn = new JButton("格式化");
            formatBtn.addActionListener(this::onFormat);
            JPanel btnPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
            btnPanel.add(formatBtn);
            panel.add(btnPanel, BorderLayout.SOUTH);
            return panel;
        }

        private void onFormat(ActionEvent e) {
            String text = inputArea.getText();
            try {
                String formatted = formatJson(text);
                outputArea.setText(formatted);
            } catch (Exception ex) {
                outputArea.setText("JSON格式错误: " + ex.getMessage());
            }
        }

        private String formatJson(String json) throws Exception {
            // 使用javax.json或org.json等库进行格式化，这里用简单缩进实现
            int indent = 0;
            StringBuilder sb = new StringBuilder();
            boolean inQuotes = false;
            for (int i = 0; i < json.length(); i++) {
                char c = json.charAt(i);
                switch (c) {
                    case '"':
                        sb.append(c);
                        if (i > 0 && json.charAt(i - 1) != '\\') inQuotes = !inQuotes;
                        break;
                    case '{':
                    case '[':
                        sb.append(c);
                        if (!inQuotes) {
                            sb.append('\n');
                            indent++;
                            sb.append(indent(indent));
                        }
                        break;
                    case '}':
                    case ']':
                        if (!inQuotes) {
                            sb.append('\n');
                            indent--;
                            sb.append(indent(indent));
                        }
                        sb.append(c);
                        break;
                    case ',':
                        sb.append(c);
                        if (!inQuotes) {
                            sb.append('\n');
                            sb.append(indent(indent));
                        }
                        break;
                    case ':':
                        sb.append(c);
                        if (!inQuotes) sb.append(' ');
                        break;
                    default:
                        sb.append(c);
                }
            }
            return sb.toString();
        }

        private String indent(int level) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < level; i++) sb.append("    ");
            return sb.toString();
        }
    }
}
