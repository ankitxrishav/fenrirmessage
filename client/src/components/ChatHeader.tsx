import { LogOut, MessageSquare } from "lucide-react";

interface ChatHeaderProps {
  roomId: number;
  activeUsersCount: number;
  onLeave: () => void;
}

export default function ChatHeader({ roomId, activeUsersCount, onLeave }: ChatHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-[#F0F7FF] to-[#EDF2F7] border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--fenrir-blue))] to-[hsl(var(--primary))] rounded-full flex items-center justify-center mr-3 shadow-md">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-lg text-[hsl(var(--fenrir-gray))]">Hall of Fenrir</h1>
          <div className="flex items-center text-xs text-gray-500 space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>
              {activeUsersCount} {activeUsersCount === 1 ? 'warrior' : 'warriors'} gathered
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={onLeave}
        className="text-[hsl(var(--fenrir-blue))] hover:text-[hsl(var(--primary))] p-2 rounded-full hover:bg-blue-50 transition-colors"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </header>
  );
}
