"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Key, Building2, User, Brain } from "lucide-react";

const STEPS = [
  { id: "license", label: "Licença", icon: Key },
  { id: "organization", label: "Organização", icon: Building2 },
  { id: "admin", label: "Administrador", icon: User },
  { id: "ai", label: "Chaves de IA", icon: Brain },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/app";

  const [currentStep, setCurrentStep] = useState<StepId>("license");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    licenseKey: "",
    organizationName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
    anthropicApiKey: "",
    openaiApiKey: "",
    openrouterApiKey: "",
    googleApiKey: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const validateStep = (step: StepId): boolean => {
    switch (step) {
      case "license":
        if (!formData.licenseKey.trim()) {
          setError("Chave de licença é obrigatória");
          return false;
        }
        break;
      case "organization":
        if (!formData.organizationName.trim()) {
          setError("Nome da organização é obrigatório");
          return false;
        }
        break;
      case "admin":
        if (!formData.adminName.trim()) {
          setError("Nome do administrador é obrigatório");
          return false;
        }
        if (!formData.adminEmail.trim() || !formData.adminEmail.includes("@")) {
          setError("E-mail válido é obrigatório");
          return false;
        }
        if (formData.adminPassword.length < 8) {
          setError("Senha deve ter pelo menos 8 caracteres");
          return false;
        }
        if (formData.adminPassword !== formData.confirmPassword) {
          setError("Senhas não conferem");
          return false;
        }
        break;
      case "ai":
        const hasAiKey = formData.anthropicApiKey || formData.openaiApiKey || formData.openrouterApiKey || formData.googleApiKey;
        if (!hasAiKey) {
          setError("Pelo menos uma chave de API de IA é obrigatória");
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Erro na instalação");
      }

      // Define cookies de autenticação
      document.cookie = `dsk_auth=${data.tokens.accessToken}; path=/; max-age=900; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;
      document.cookie = `dsk_refresh=${data.tokens.refreshToken}; path=/; max-age=2592000; SameSite=Strict${location.protocol === "https:" ? "; Secure" : ""}`;

      setSuccess(true);
      setTimeout(() => {
        router.push(nextUrl);
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = STEPS.find((s) => s.id === currentStep)?.icon || Key;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4">
            <StepIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Instalação do CRM Gráfica</h1>
          <p className="text-gray-600 mt-2">Configure seu sistema em poucos passos</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = STEPS.findIndex((s) => s.id === currentStep) >= index;
              const isCurrent = step.id === currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center flex-1 relative">
                  {index > 0 && (
                    <div
                      className="absolute top-5 left-0 w-full h-1 -z-10"
                      style={{ backgroundColor: isActive ? "#3b82f6" : "#e5e7eb" }}
                    />
                  )}
                  <div
                    className={`relative w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    } ${isCurrent ? "ring-4 ring-blue-100" : ""}`}
                  >
                    {isActive && !isCurrent ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{STEPS.find((s) => s.id === currentStep)?.label}</CardTitle>
            <CardDescription>
              {{
                license: "Digite a chave de licença recebida do fornecedor",
                organization: "Informações da sua gráfica/empresa",
                admin: "Crie o usuário administrador principal",
                ai: "Configure as chaves de API para os agentes de IA",
              }[currentStep]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">Instalação concluída! Redirecionando...</AlertDescription>
              </Alert>
            )}

            {/* Step: License */}
            {currentStep === "license" && (
              <div className="space-y-4">
                <Label htmlFor="licenseKey">Chave de Licença</Label>
                <Input
                  id="licenseKey"
                  type="text"
                  placeholder="CRM-2024-XXXXXXXX"
                  value={formData.licenseKey}
                  onChange={(e) => handleChange("licenseKey", e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
                <p className="text-sm text-gray-500">
                  A chave valida sua instalação junto ao servidor de licenças.
                  Formato esperado: <code className="px-1 bg-gray-100 rounded">CRM-YYYY-XXXXXXXX</code>
                </p>
              </div>
            )}

            {/* Step: Organization */}
            {currentStep === "organization" && (
              <div className="space-y-4">
                <Label htmlFor="organizationName">Nome da Organização</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="Ex: Gráfica São João Ltda"
                  value={formData.organizationName}
                  onChange={(e) => handleChange("organizationName", e.target.value)}
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            )}

            {/* Step: Admin */}
            {currentStep === "admin" && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="adminName">Nome Completo</Label>
                    <Input
                      id="adminName"
                      type="text"
                      placeholder="João Silva"
                      value={formData.adminName}
                      onChange={(e) => handleChange("adminName", e.target.value)}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">E-mail</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="joao@grafica.com"
                      value={formData.adminEmail}
                      onChange={(e) => handleChange("adminEmail", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="adminPassword">Senha</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.adminPassword}
                      onChange={(e) => handleChange("adminPassword", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Este usuário terá acesso total ao sistema (role: <code className="px-1 bg-gray-100 rounded">dono</code>)
                </p>
              </div>
            )}

            {/* Step: AI Keys */}
            {currentStep === "ai" && (
              <div className="space-y-4">
                <Tabs defaultValue="anthropic" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="anthropic"><Brain className="w-4 h-4 mr-2" />Anthropic</TabsTrigger>
                    <TabsTrigger value="openai"><Brain className="w-4 h-4 mr-2" />OpenAI</TabsTrigger>
                    <TabsTrigger value="openrouter"><Brain className="w-4 h-4 mr-2" />OpenRouter</TabsTrigger>
                    <TabsTrigger value="google"><Brain className="w-4 h-4 mr-2" />Google</TabsTrigger>
                  </TabsList>

                  <TabsContent value="anthropic">
                    <Label htmlFor="anthropicApiKey">Anthropic API Key</Label>
                    <Input
                      id="anthropicApiKey"
                      type="password"
                      placeholder="sk-ant-..."
                      value={formData.anthropicApiKey}
                      onChange={(e) => handleChange("anthropicApiKey", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">Para modelos Claude (Sonnet, Opus, Haiku)</p>
                  </TabsContent>

                  <TabsContent value="openai">
                    <Label htmlFor="openaiApiKey">OpenAI API Key</Label>
                    <Input
                      id="openaiApiKey"
                      type="password"
                      placeholder="sk-..."
                      value={formData.openaiApiKey}
                      onChange={(e) => handleChange("openaiApiKey", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">Para modelos GPT (GPT-4, GPT-3.5, o1)</p>
                  </TabsContent>

                  <TabsContent value="openrouter">
                    <Label htmlFor="openrouterApiKey">OpenRouter API Key</Label>
                    <Input
                      id="openrouterApiKey"
                      type="password"
                      placeholder="sk-or-..."
                      value={formData.openrouterApiKey}
                      onChange={(e) => handleChange("openrouterApiKey", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">Acesso a múltiplos modelos via OpenRouter</p>
                  </TabsContent>

                  <TabsContent value="google">
                    <Label htmlFor="googleApiKey">Google API Key</Label>
                    <Input
                      id="googleApiKey"
                      type="password"
                      placeholder="AIza..."
                      value={formData.googleApiKey}
                      onChange={(e) => handleChange("googleApiKey", e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-sm text-gray-500">Para modelos Gemini</p>
                  </TabsContent>
                </Tabs>

                <p className="text-sm text-gray-500">
                  Pelo menos uma chave é obrigatória. As chaves são criptografadas e salvas localmente.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === "license" || isSubmitting}
              >
                Voltar
              </Button>
              <div className="flex gap-2">
                {currentStep !== "ai" ? (
                  <Button onClick={handleNext} disabled={isSubmitting}>
                    Próximo
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" style={{ display: isSubmitting ? "block" : "none" }} />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Instalando...
                      </>
                    ) : (
                      "Concluir Instalação"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          CRM Gráfica 2.0 — Instalação Local Segura
        </p>
      </div>
    </div>
  );
}