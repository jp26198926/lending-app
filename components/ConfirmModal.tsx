"use client";

import { useState } from "react";
import Modal from "./Modal";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  requireReason?: boolean;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  requireReason = false,
  isLoading = false,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason");
      return;
    }
    onConfirm(reason);
    setReason("");
    setError("");
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm" showClose={false}>
      <div className="text-center">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm text-gray-600 mb-4">{message}</p>

        {/* Reason Input */}
        {requireReason && (
          <div className="mb-4">
            <label className="block text-left text-sm font-medium text-gray-700 mb-2">
              Reason for deletion <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Please provide a reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-zentyal-primary focus:border-transparent resize-none"
              rows={3}
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1 text-left">{error}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
