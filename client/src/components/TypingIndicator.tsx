interface TypingIndicatorProps {
  username: string;
}

export default function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="flex items-end mb-4 animate-fade-in typing-indicator">
      <div className="flex flex-col max-w-[80%] space-y-1">
        <div className="text-xs text-[hsl(var(--fenrir-blue))] font-medium ml-2">{username}</div>
        <div className="bg-gradient-to-r from-[#F5F7FA] to-[#F9FAFB] py-2 px-4 rounded-2xl rounded-tl-none shadow-sm border-t border-l border-[#E2E8F0] flex items-center">
          <div className="flex space-x-1.5">
            <span className="w-2 h-2 bg-[hsl(var(--fenrir-blue))] opacity-70 rounded-full"></span>
            <span className="w-2 h-2 bg-[hsl(var(--fenrir-blue))] opacity-70 rounded-full"></span>
            <span className="w-2 h-2 bg-[hsl(var(--fenrir-blue))] opacity-70 rounded-full"></span>
          </div>
        </div>
      </div>
    </div>
  );
}
