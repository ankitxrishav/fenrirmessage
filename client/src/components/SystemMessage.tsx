interface SystemMessageProps {
  text: string;
}

export default function SystemMessage({ text }: SystemMessageProps) {
  return (
    <div className="flex justify-center my-4 animate-fade-in">
      <div className="bg-gradient-to-r from-[#E6EBF5] to-[#EDF2F7] text-[hsl(var(--fenrir-gray))] text-xs py-1.5 px-4 rounded-full border border-[#D0E1FA] shadow-sm">
        <span>{text}</span>
      </div>
    </div>
  );
}
