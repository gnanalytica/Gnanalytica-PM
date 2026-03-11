"use client";

import { motion, AnimatePresence } from "motion/react";
import { TicketDetailPanel } from "@/components/tickets/ticket-detail-panel";

export function TicketSidePanel({
  ticketId,
  onClose,
}: {
  ticketId: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {ticketId ? (
        <>
          {/* Overlay */}
          <motion.div
            key="side-panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="side-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-surface-tertiary border-l border-border-subtle z-50 flex flex-col shadow-overlay"
          >
            <TicketDetailPanel
              ticketId={ticketId}
              onClose={onClose}
            />
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
