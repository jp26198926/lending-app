"use client";

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
}

export default function LoadingModal({
  isOpen,
  message = "Loading...",
}: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl p-8 transform transition-all">
          <div className="text-center">
            {/* Spinner */}
            <div className="mx-auto mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zentyal-primary mx-auto"></div>
            </div>

            {/* Message */}
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
