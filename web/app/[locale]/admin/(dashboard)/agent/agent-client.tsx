"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/shared/use-toast";
import { SmartWidget, UISchema } from "@/components/shared/smart-widget";
import {
  Bot,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Terminal,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import {
  executeAgentCommand,
  generateUIAction,
  AgentExecutionResult,
  TaskResult,
} from "./actions";

export function AgentClient() {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AgentExecutionResult | null>(null);
  const [uiSchema, setUISchema] = useState<UISchema | null>(null);
  const [activeTab, setActiveTab] = useState("execute");
  const { toast } = useToast();

  const exampleCommands = [
    "Liệt kê 5 sản phẩm có tồn kho thấp nhất",
    "Giảm giá 10% cho tất cả sản phẩm trong danh mục Áo",
    "Tạo nội dung email marketing cho sản phẩm mới",
  ];

  const exampleUIQueries = [
    "Doanh số tuần này",
    "Top 5 sản phẩm bán chạy",
    "Tổng đơn hàng hôm nay",
    "Cảnh báo hàng tồn thấp",
  ];

  const handleExecute = async () => {
    if (!command.trim()) return;

    setIsLoading(true);
    setResult(null);
    setUISchema(null);

    try {
      if (activeTab === "execute") {
        const res = await executeAgentCommand(command);
        if (res.success && res.data) {
          setResult(res.data);
          toast({
            title: "Agent hoàn thành",
            description: `Đã thực thi ${res.data.results.length} tasks`,
            variant: "success",
          });
        } else {
          toast({
            title: "Lỗi",
            description: res.error || "Không thể thực thi lệnh",
            variant: "destructive",
          });
        }
      } else {
        // Generative UI mode
        const res = await generateUIAction(command);
        if (res.success && res.data) {
          setUISchema(res.data as UISchema);
          toast({
            title: "UI Generated",
            description: `Đã tạo widget: ${res.data.type}`,
            variant: "success",
          });
        } else {
          toast({
            title: "Lỗi",
            description: res.error || "Không thể tạo UI",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Đã xảy ra lỗi khi kết nối với Agent",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "QUERY_PRODUCTS":
        return "🔍";
      case "UPDATE_PRICE":
        return "💰";
      case "GENERATE_CONTENT":
        return "✍️";
      case "SEND_EMAIL":
        return "📧";
      default:
        return "❓";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            AI Agent
            <Badge variant="outline" className="ml-2 text-xs">
              Beta
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Ra lệnh bằng ngôn ngữ tự nhiên, Agent sẽ tự động thực thi
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="execute" className="gap-2">
            <Terminal className="h-4 w-4" />
            Execute Commands
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Generative UI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execute" className="mt-4">
          {/* Command Input */}
          <Card className="border-2 border-dashed border-violet-200 bg-violet-50/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Terminal className="h-4 w-4" />
                  <span>Nhập lệnh thực thi</span>
                </div>
                <Textarea
                  placeholder='VD: "Giảm giá 20% cho tất cả áo phông có tồn kho trên 50"'
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  rows={3}
                  className="resize-none text-base border-violet-200 focus:border-violet-400"
                />
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {exampleCommands.map((cmd, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-violet-600"
                        onClick={() => setCommand(cmd)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {cmd.length > 25 ? cmd.slice(0, 25) + "..." : cmd}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={handleExecute}
                    disabled={isLoading || !command.trim()}
                    className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Thực thi
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui" className="mt-4">
          {/* Generative UI Input */}
          <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Hỏi về dữ liệu, AI sẽ tạo widget phù hợp</span>
                </div>
                <Textarea
                  placeholder='VD: "Cho tôi xem doanh số tuần này" hoặc "Top sản phẩm bán chạy"'
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  rows={2}
                  className="resize-none text-base border-emerald-200 focus:border-emerald-400"
                />
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {exampleUIQueries.map((q, i) => (
                      <Button
                        key={i}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground hover:text-emerald-600"
                        onClick={() => setCommand(q)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {q}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={handleExecute}
                    disabled={isLoading || !command.trim()}
                    className="bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Tạo Widget
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generative UI Result */}
      {uiSchema && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-emerald-100 text-emerald-700">
              Generated: {uiSchema.type}
            </Badge>
          </div>
          <SmartWidget schema={uiSchema} />
        </div>
      )}

      {/* Execute Results */}
      {result && (
        <div className="space-y-4">
          {/* Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Kế hoạch thực thi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Ý định:</strong> {result.plan.intent}
              </p>
              <div className="space-y-2">
                {result.plan.tasks.map((task, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <span className="text-xl">{getTaskIcon(task.type)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {task.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Kết quả thực thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.results.map((taskResult, i) => (
                <TaskResultCard key={i} result={taskResult} index={i} />
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-slate-900 text-white">
            <CardContent className="p-6">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {result.summary}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TaskResultCard({
  result,
  index,
}: {
  result: TaskResult;
  index: number;
}) {
  return (
    <div
      className={`p-4 rounded-lg border ${
        result.success
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {result.success ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <p className="font-medium text-sm">
            Task {index + 1}: {result.task.description}
          </p>
          {result.success && result.data && (
            <div className="mt-2">
              <pre className="text-xs bg-white/80 p-3 rounded overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
          {!result.success && result.error && (
            <p className="text-sm text-red-600 mt-1">{result.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
