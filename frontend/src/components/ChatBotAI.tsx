import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, User, Bot, X, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  sendAiMessage,
  deleteAiConversation,
  getAiMessages,
} from "../api/aiChatAPI";

import { fetchCategories } from "../api/categoryAPI";

import type {
  ChatMessage,
  AiSender,
  AiVariantDto,
  AiSuggestion,
  CategoryDto,
} from "../types";

const welcomeMessage = (suggestions: AiSuggestion[] = []): ChatMessage => ({
  id: crypto.randomUUID(),
  sender: "AI",
  content:
    "Xin chào! Mình rất vui được hỗ trợ bạn 😊 Bạn muốn tìm loại sản phẩm nào hôm nay?",
  createdAt: new Date(),
  suggestions,
});

const mapRoleToSender = (role: string): AiSender => {
  return role === "USER" ? "USER" : "AI";
};

const getSessionId = () => {
  let sessionId = localStorage.getItem("ai_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("ai_session_id", sessionId);
  }

  return sessionId;
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatPrice = (price?: number) => {
  if (price == null) return "";
  return price.toLocaleString("vi-VN") + " đ";
};

const getDefaultVariant = (variants: AiVariantDto[]) => {
  if (!variants || variants.length === 0) return undefined;
  return variants.find((variant) => variant.stockQuantity > 0) || variants[0];
};

const getCategoryDisplayText = (content: string) => {
  const match = content.match(
    /Tìm sản phẩm thuộc danh mục\s+(.+?)(?:,\s*categoryId\s*=\s*\d+)?$/i,
  );

  if (match?.[1]) {
    return match[1].trim();
  }

  return content;
};

const buildCategorySuggestions = (
  categories: CategoryDto[],
): AiSuggestion[] => {
  return categories.map((category) => ({
    label: category.name,
    message: `Tìm sản phẩm thuộc danh mục ${category.name}, categoryId=${category.categoryId}`,
  }));
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );
}

export default function ChatBotAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<
    AiSuggestion[]
  >([]);

  const [selectedVariantIds, setSelectedVariantIds] = useState<
    Record<string, number>
  >({});

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const initChat = async () => {
      const sessionId = getSessionId();

      let suggestions: AiSuggestion[] = [];

      try {
        const categories = await fetchCategories();
        suggestions = buildCategorySuggestions(categories);
        setCategorySuggestions(suggestions);
      } catch (err) {
        console.error("Load categories error:", err);
        setCategorySuggestions([]);
      }

      // Chưa đăng nhập thì KHÔNG gọi API history vì backend đang bắt authenticated
      if (!user) {
        setMessages([welcomeMessage(suggestions)]);
        return;
      }

      try {
        const history = await getAiMessages(sessionId);

        if (!history || history.length === 0) {
          setMessages([welcomeMessage(suggestions)]);
          return;
        }

        setMessages(
          history.map((msg) => {
            const sender = mapRoleToSender(msg.role);

            return {
              id: crypto.randomUUID(),
              sender,
              content:
                sender === "USER"
                  ? getCategoryDisplayText(msg.content)
                  : msg.content,
              createdAt: new Date(msg.createdAt),
            };
          }),
        );
      } catch (err) {
        console.error("Load AI messages error:", err);
        setMessages([welcomeMessage(suggestions)]);
      }
    };

    initChat();
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = async (text?: string, displayText?: string) => {
    const apiText = (text ?? input).trim();
    const visibleText = (displayText ?? apiText).trim();

    if (!apiText || loading) return;

    setInput("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "USER",
      content: visibleText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await sendAiMessage({
        sessionId: getSessionId(),
        message: apiText,
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        sender: "AI",
        content: res.response || "Mình chưa có câu trả lời phù hợp.",
        createdAt: new Date(),
        products: res.products,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI chat error:", err);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "AI",
          content: "Có lỗi xảy ra khi gọi AI. Bạn thử lại sau nhé.",
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    const sessionId = getSessionId();

    if (user) {
      try {
        await deleteAiConversation(sessionId);
      } catch (err) {
        console.error("Delete AI conversation error:", err);
      }
    }

    localStorage.removeItem("ai_session_id");
    setSelectedVariantIds({});
    setMessages([welcomeMessage(categorySuggestions)]);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage();
  };

  const handleProductCardClick = (productId: number) => {
    setOpen(false);
    navigate(`/products/${productId}`);
  };

  const handleProductCardKeyDown = (
    e: KeyboardEvent<HTMLDivElement>,
    productId: number,
  ) => {
    if (e.target !== e.currentTarget) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleProductCardClick(productId);
    }
  };

  const handleVariantClick = (
    e: MouseEvent<HTMLButtonElement>,
    cardKey: string,
    itemId: number,
  ) => {
    e.stopPropagation();

    setSelectedVariantIds((prev) => ({
      ...prev,
      [cardKey]: itemId,
    }));
  };

  const handleSuggestionClick = (
    e: MouseEvent<HTMLButtonElement>,
    suggestion: AiSuggestion,
  ) => {
    e.stopPropagation();

    sendMessage(
      suggestion.message, // gửi backend, có categoryId
      suggestion.label, // hiển thị trên chat, không lộ categoryId
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl transition hover:bg-blue-700"
        aria-label="Mở chat AI"
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl max-sm:left-3 max-sm:right-3 max-sm:w-auto">
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div>
              <div className="font-bold">Crystal AI</div>
              <div className="text-xs opacity-90">Trợ lý mua sắm</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteChat}
                className="rounded-full p-1 hover:bg-white/20"
                title="Xóa đoạn chat"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-white/20"
                title="Đóng"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-100 p-4">
            {messages.map((msg) => {
              const isUser = msg.sender === "USER";

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? "bg-blue-100 text-blue-600"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {isUser ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  <div
                    className={`max-w-[78%] ${
                      isUser ? "flex flex-col items-end" : ""
                    }`}
                  >
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : "rounded-tl-sm bg-white text-slate-900 shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {!isUser &&
                      msg.suggestions &&
                      msg.suggestions.length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3 shadow-sm">
                          {msg.suggestions.map((suggestion) => (
                            <button
                              key={suggestion.label}
                              type="button"
                              disabled={loading}
                              onClick={(e) =>
                                handleSuggestionClick(e, suggestion)
                              }
                              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {suggestion.label}
                            </button>
                          ))}
                        </div>
                      )}

                    {msg.products && msg.products.length > 0 && (
                      <div className="mt-3 space-y-3">
                        {msg.products.map((product) => {
                          const variants = product.variants || [];
                          const cardKey = `${msg.id}-${product.productId}`;

                          const selectedVariant =
                            variants.find(
                              (variant) =>
                                variant.itemId === selectedVariantIds[cardKey],
                            ) || getDefaultVariant(variants);

                          const displayPrice =
                            selectedVariant?.price ?? product.price;

                          const displayColor = selectedVariant?.color;

                          const stockQuantity =
                            selectedVariant?.stockQuantity ?? 0;

                          const hasStock = stockQuantity > 0;

                          return (
                            <div
                              key={cardKey}
                              role="button"
                              tabIndex={0}
                              onClick={() =>
                                handleProductCardClick(product.productId)
                              }
                              onKeyDown={(e) =>
                                handleProductCardKeyDown(e, product.productId)
                              }
                              className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <img
                                src={product.avatar}
                                alt={product.name}
                                className="h-48 w-full bg-slate-200 object-cover"
                              />

                              <div className="p-3">
                                <div className="line-clamp-2 font-semibold text-slate-900">
                                  {product.name}
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <div className="text-base font-bold text-slate-900">
                                    {formatPrice(displayPrice)}
                                  </div>

                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                                      hasStock
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-600"
                                    }`}
                                  >
                                    {hasStock ? "Còn hàng" : "Hết hàng"}
                                  </span>
                                </div>

                                {displayColor && (
                                  <div className="mt-2 text-xs text-slate-500">
                                    Màu:{" "}
                                    <span className="font-medium text-slate-800">
                                      {displayColor}
                                    </span>
                                  </div>
                                )}

                                {variants.length > 0 && (
                                  <div className="mt-3">
                                    <div className="mb-2 text-xs text-slate-500">
                                      Chọn màu:
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      {variants.map((variant) => {
                                        const isSelected =
                                          selectedVariant?.itemId ===
                                          variant.itemId;

                                        return (
                                          <button
                                            key={variant.itemId}
                                            type="button"
                                            disabled={
                                              variant.stockQuantity <= 0
                                            }
                                            onClick={(e) =>
                                              handleVariantClick(
                                                e,
                                                cardKey,
                                                variant.itemId,
                                              )
                                            }
                                            className={`rounded-full border px-3 py-1 text-xs transition disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400 ${
                                              isSelected
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-slate-300 text-slate-700 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-600"
                                            }`}
                                          >
                                            {variant.color}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-1 text-[11px] text-slate-500">
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot size={18} />
                </div>

                <TypingDots />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2 bg-white p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={loading}
              className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
