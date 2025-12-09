"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const handleSetup2FA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/setup");
      if (!response.ok) {
        throw new Error("Failed to initialize 2FA setup");
      }
      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setIsSetupMode(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to setup 2FA"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify code");
      }

      toast.success("Two-factor authentication enabled successfully!");
      setIsSetupMode(false);
      setQrCodeUrl(null);
      setVerificationCode("");
      // Update session to reflect 2FA status
      await update();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enable 2FA"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/2fa/setup", { method: "DELETE" });

      if (!response.ok) {
        throw new Error("Failed to disable 2FA");
      }

      toast.success("Two-factor authentication disabled");
      await update();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disable 2FA"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const is2FAEnabled = session?.user?.twoFactorEnabled;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account using Google
                    Authenticator
                  </CardDescription>
                </div>
              </div>
              <Badge variant={is2FAEnabled ? "default" : "secondary"}>
                {is2FAEnabled ? (
                  <>
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    Enabled
                  </>
                ) : (
                  <>
                    <ShieldOff className="mr-1 h-3 w-3" />
                    Disabled
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {is2FAEnabled && !isSetupMode ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication is currently enabled on your
                  account. You will need to enter a verification code from
                  Google Authenticator when signing in.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isLoading}
                >
                  {isLoading ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>
            ) : isSetupMode && qrCodeUrl ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">
                    Step 1: Scan QR Code with Google Authenticator
                  </h3>
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <Image
                      src={qrCodeUrl}
                      alt="2FA QR Code"
                      width={200}
                      height={200}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Open Google Authenticator and scan this QR code to add your
                    account
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">
                    Step 2: Enter Verification Code
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="code">6-digit code from authenticator</Label>
                    <Input
                      id="code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(e.target.value.replace(/\D/g, ""))
                      }
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSetupMode(false);
                      setQrCodeUrl(null);
                      setVerificationCode("");
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleVerify2FA}
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? "Verifying..." : "Enable 2FA"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Two-factor authentication adds an extra layer of security to
                  your account. When enabled, you&apos;ll need to enter a code from
                  Google Authenticator in addition to your password.
                </p>
                <Button onClick={handleSetup2FA} disabled={isLoading}>
                  {isLoading ? "Setting up..." : "Set up 2FA"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
