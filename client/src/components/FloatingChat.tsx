import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { artifactsService, profileService } from "@/lib/services";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildBusinessContext(profile: any, artifacts: any[]): string {
  const lines: string[] = [];

  const businessName = profile?.business_name;
  const description = profile?.business_description;
  if (businessName) lines.push(`Business name: ${businessName}`);
  if (description) lines.push(`Business description: ${description}`);

  if (artifacts.length === 0) {
    lines.push("No tools completed yet.");
    return lines.join("\n");
  }

  // Deduplicate by tool_type — latest only
  const typeMap: Record<string, any> = {};
  for (const a of artifacts) {
    const key = (a as any).tool_type ?? a.toolType;
    const existing = typeMap[key];
    const aDate = new Date((a as any).updated_at ?? a.updatedAt ?? 0);
    const eDate = new Date(existing?.updated_at ?? existing?.updatedAt ?? 0);
    if (!existing || aDate > eDate) typeMap[key] = a;
  }

  for (const [type, artifact] of Object.entries(typeMap)) {
    const content = artifact.content as any;
    if (!content) continue;

    switch (type) {
      case "bmc": {
        lines.push(`\n[Business Model Canvas - ${artifact.status}]`);
        const sections: Record<string, string> = {
          customerSegments: "Customer Segments",
          valuePropositions: "Value Propositions",
          channels: "Channels",
          customerRelationships: "Customer Relationships",
          revenueStreams: "Revenue Streams",
          keyResources: "Key Resources",
          keyActivities: "Key Activities",
          keyPartnerships: "Key Partnerships",
          costStructure: "Cost Structure",
        };
        for (const [key, label] of Object.entries(sections)) {
          if (content[key]?.length) {
            lines.push(`  ${label}: ${content[key].join(", ")}`);
          }
        }
        break;
      }
      case "swot_pestle": {
        lines.push(`\n[SWOT & PESTLE Analysis - ${artifact.status}]`);
        const swot = content.swot;
        if (swot?.strengths?.length) lines.push(`  Strengths: ${swot.strengths.join(", ")}`);
        if (swot?.weaknesses?.length) lines.push(`  Weaknesses: ${swot.weaknesses.join(", ")}`);
        if (swot?.opportunities?.length) lines.push(`  Opportunities: ${swot.opportunities.join(", ")}`);
        if (swot?.threats?.length) lines.push(`  Threats: ${swot.threats.join(", ")}`);
        break;
      }
      case "value_proposition": {
        lines.push(`\n[Value Proposition - ${artifact.status}]`);
        const c = content.customer;
        const v = content.value;
        if (c?.pains?.length) lines.push(`  Customer Pains: ${c.pains.join(", ")}`);
        if (c?.gains?.length) lines.push(`  Customer Gains: ${c.gains.join(", ")}`);
        if (v?.products?.length) lines.push(`  Products/Services: ${v.products.join(", ")}`);
        if (v?.gainCreators?.length) lines.push(`  Gain Creators: ${v.gainCreators.join(", ")}`);
        break;
      }
      case "pitch_builder": {
        lines.push(`\n[Pitch Deck - ${artifact.status}]`);
        if (content.problem) lines.push(`  Problem: ${content.problem.slice(0, 100)}`);
        if (content.solution) lines.push(`  Solution: ${content.solution.slice(0, 100)}`);
        if (content.businessModel) lines.push(`  Business Model: ${content.businessModel.slice(0, 100)}`);
        break;
      }
    }
  }

  return lines.join("\n");
}

export function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [contextReady, setContextReady] = useState(false);
  const contextRef = useRef("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load business context once when chat opens
  useEffect(() => {
    if (!open || contextReady || !user) return;
    (async () => {
      try {
        const [artifacts, profile] = await Promise.all([
          artifactsService.getArtifacts(),
          profileService.getUserProfile(),
        ]);
        contextRef.current = buildBusinessContext(profile, artifacts ?? []);
        setContextReady(true);
        // Greet based on data
        const businessName = (profile as any)?.business_name;
        const greeting = businessName
          ? `Hi! I'm EdMeCa AI. I can see you're working on **${businessName}**. Ask me anything about your business model, strategy, or any tool in your portal.`
          : `Hi! I'm EdMeCa AI, your business advisor. I can see your business data and help you improve your strategy. What would you like to know?`;
        setMessages([{ role: "assistant", content: greeting }]);
      } catch {
        setContextReady(true);
        setMessages([{ role: "assistant", content: "Hi! I'm EdMeCa AI. Ask me anything about your business strategy." }]);
      }
    })();
  }, [open, contextReady, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          businessContext: contextRef.current,
        }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? "Sorry, something went wrong.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
  };

  const handleClose = () => {
    setOpen(false);
    setMinimised(false);
    setMessages([]);
    setContextReady(false);
    contextRef.current = "";
  };

  // Format markdown bold **text**
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );
  };

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105"
          aria-label="Open AI assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[350px] sm:w-[380px] rounded-2xl border bg-background shadow-2xl overflow-hidden transition-all duration-200"
          style={{ height: minimised ? "56px" : "520px" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 bg-primary px-4 py-3 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary-foreground leading-none">EdMeCa AI</p>
              <p className="text-[10px] text-primary-foreground/70 mt-0.5">Business advisor</p>
            </div>
            <button
              onClick={() => setMinimised(m => !m)}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-0.5"
              aria-label="Minimise"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleClose}
              className="text-primary-foreground/70 hover:text-primary-foreground transition-colors p-0.5"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!minimised && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {!contextReady && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading your business data…
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                        <Bot className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-background border rounded-bl-sm text-foreground"
                    }`}>
                      {formatContent(msg.content)}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="bg-background border rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex gap-1 items-center h-4">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggested questions — only when empty */}
              {messages.length <= 1 && contextReady && (
                <div className="px-3 py-2 border-t bg-muted/20 flex flex-wrap gap-1.5">
                  {[
                    "What's missing from my BMC?",
                    "How can I improve my revenue?",
                    "What are my biggest risks?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); setTimeout(() => textareaRef.current?.focus(), 0); }}
                      className="text-[11px] bg-background border rounded-full px-2.5 py-1 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-end gap-2 p-3 border-t bg-background shrink-0">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your business…"
                  className="min-h-[40px] max-h-[100px] resize-none text-sm"
                  rows={1}
                  disabled={!contextReady || loading}
                />
                <Button
                  size="icon"
                  onClick={send}
                  disabled={!input.trim() || loading || !contextReady}
                  className="h-9 w-9 shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
