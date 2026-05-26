package iuh.fit.se.backend.model;

public enum MessageRole {
    USER,
    ASSISTANT, // message AI trả lời
    TOOL, // kết quả từ tool
    SYSTEM // instruction cho AI
}
