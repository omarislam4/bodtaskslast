import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useWebhookSettings } from "@/hooks/useWebhook";
import { useShiftReminder } from "@/hooks/useShiftReminder";

interface AppLayoutProps {
  children: React.ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

function ShiftReminderRunner() {
  const { isAdmin } = useAuth();
  const { settings } = useWebhookSettings();
  useShiftReminder(settings, isAdmin);
  return null;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
      <Toaster position="bottom-right" richColors />
      <ShiftReminderRunner />
    </div>
  );
};
