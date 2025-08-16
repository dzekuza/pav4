import React from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/70">
            Enter your new password to complete the reset process
          </p>
        </div>

        <ResetPasswordForm userType="business" />
      </div>
    </div>
  );
}
