import { useSignIn } from "@clerk/expo";
import { clsx } from "clsx";
import { Link, useRouter } from "expo-router";
import { styled } from "nativewind";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import AuthBrandBlock from "@/components/AuthBrandBlock";
import { isValidEmail } from "@/lib/utils";

const SafeAreaView = styled(RNSafeAreaView);

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const isMfaStep = signIn?.status === "needs_client_trust";
  const isLoading = fetchStatus === "fetching";

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleSignIn = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setClientErrors(errs); return; }
    setClientErrors({});

    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) return;

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/(tabs)" : (url as never));
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      await signIn.mfa.sendEmailCode();
      startCooldown();
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) { setClientErrors({ code: "Enter the verification code" }); return; }
    setClientErrors({});

    await signIn.mfa.verifyEmailCode({ code: code.trim() });

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url.startsWith("http") ? "/(tabs)" : (url as never));
        },
      });
    }
  };

  const handleResend = async () => {
    await signIn.mfa.sendEmailCode();
    startCooldown();
  };

  if (isMfaStep) {
    return (
      <SafeAreaView className="auth-safe-area">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView className="auth-scroll" keyboardShouldPersistTaps="handled">
            <View className="auth-content">
              <AuthBrandBlock />
              <Text className="auth-title">Check your email</Text>
              <Text className="auth-subtitle">We sent a verification code to {email}</Text>

              <View className="auth-card">
                <View className="auth-form">
                  <View className="auth-field">
                    <Text className="auth-label">Verification code</Text>
                    <TextInput
                      className={clsx("auth-input", (clientErrors.code || errors?.fields?.code) && "auth-input-error")}
                      value={code}
                      onChangeText={setCode}
                      placeholder="6-digit code"
                      placeholderTextColor="rgba(0,0,0,0.35)"
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                    {(clientErrors.code || errors?.fields?.code) && (
                      <Text className="auth-error">
                        {clientErrors.code || errors?.fields?.code?.message}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    className={clsx("auth-button", isLoading && "auth-button-disabled")}
                    onPress={handleVerify}
                    disabled={isLoading}
                  >
                    <Text className="auth-button-text">Verify email</Text>
                  </Pressable>

                  <Pressable
                    className={clsx("auth-secondary-button", (isLoading || resendCooldown > 0) && "opacity-50")}
                    onPress={handleResend}
                    disabled={isLoading || resendCooldown > 0}
                  >
                    <Text className="auth-secondary-button-text">
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="auth-link-row">
                <Pressable onPress={() => signIn.reset()}>
                  <Text className="auth-link">Start over</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView className="auth-scroll" keyboardShouldPersistTaps="handled">
          <View className="auth-content">
            <AuthBrandBlock />
            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">Sign in to manage your subscriptions</Text>

            <View className="auth-card">
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email address</Text>
                  <TextInput
                    className={clsx("auth-input", (clientErrors.email || errors?.fields?.identifier) && "auth-input-error")}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setClientErrors((e) => ({ ...e, email: "" })); }}
                    placeholder="you@example.com"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                  />
                  {(clientErrors.email || errors?.fields?.identifier) && (
                    <Text className="auth-error">
                      {clientErrors.email || errors?.fields?.identifier?.message}
                    </Text>
                  )}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <TextInput
                    className={clsx("auth-input", (clientErrors.password || errors?.fields?.password) && "auth-input-error")}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setClientErrors((e) => ({ ...e, password: "" })); }}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(0,0,0,0.35)"
                    secureTextEntry
                    autoComplete="current-password"
                  />
                  {(clientErrors.password || errors?.fields?.password) && (
                    <Text className="auth-error">
                      {clientErrors.password || errors?.fields?.password?.message}
                    </Text>
                  )}
                </View>

                <Pressable
                  className={clsx("auth-button", (!email || !password || isLoading) && "auth-button-disabled")}
                  onPress={handleSignIn}
                  disabled={!email || !password || isLoading}
                >
                  <Text className="auth-button-text">{isLoading ? "Signing in…" : "Continue"}</Text>
                </Pressable>
              </View>
            </View>

            <View className="auth-link-row">
              <Text className="auth-link-copy">Don't have an account?</Text>
              <Link href="/(auth)/SignUp">
                <Text className="auth-link">Sign up</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
