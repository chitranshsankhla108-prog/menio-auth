import { format } from 'date-fns';
import { MessageSquare, Star, User, Loader2 } from 'lucide-react';
import { useFeedbacks } from '@/hooks/useFeedback';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function FeedbackList() {
  const { data: feedbacks = [], isLoading } = useFeedbacks();

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6F4E37]">Loading Reviews...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-fade-in bg-[#FDF8F7] min-h-screen">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-[#F9E0E3] pb-4">
        <div>
          <h2 className="font-serif text-3xl font-black italic tracking-tight text-[#3A2C2C]">Guest Feedback</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6F4E37]/60 mt-1">
            What your customers are saying
          </p>
        </div>
        <div className="bg-[#FFD6C9] px-3 py-1.5 rounded-xl border border-[#F9E0E3] shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3A2C2C]">
            {feedbacks.length} Reviews
          </span>
        </div>
      </div>

      {feedbacks.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-2 border-[#EBE1E3] bg-transparent shadow-none">
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F7F1F2] mb-4 border border-[#EBE1E3]">
              <MessageSquare className="w-8 h-8 text-[#A89699] opacity-70" />
            </div>
            <p className="text-[#3A2C2C] font-black uppercase tracking-widest text-sm mb-1">No feedback yet</p>
            <p className="text-[11px] font-bold text-[#6F4E37]/60">
              Customer reviews will automatically appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id} className="overflow-hidden rounded-2xl border border-[#EBE1E3] bg-white shadow-[0_10px_30px_rgba(58,44,44,0.04)] hover:shadow-[0_10px_30px_rgba(58,44,44,0.08)] transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-[#F7F1F2] flex items-center justify-center shrink-0 border border-[#EBE1E3]">
                    <User className="w-6 h-6 text-[#6F4E37]" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h3 className="font-bold text-[#3A2C2C] text-base truncate">
                        {feedback.name || 'Anonymous Guest'}
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#A89699] shrink-0">
                        {format(new Date(feedback.created_at), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    
                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mt-1.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-4 h-4 transition-colors",
                            i < feedback.rating
                              ? "fill-[#FFB26B] text-[#FFB26B]" // Golden Peach
                              : "fill-[#F7F1F2] text-[#EBE1E3]"
                          )}
                        />
                      ))}
                    </div>
                    
                    {/* Comment Area */}
                    <div className="bg-[#FDF8F7] p-4 rounded-xl border border-[#F9E0E3]">
                      <p className="text-sm font-medium text-[#3A2C2C] leading-relaxed italic">
                        "{feedback.comment}"
                      </p>
                    </div>
                    
                    {/* Email Display (if provided) */}
                    {feedback.email && (
                      <p className="text-[10px] font-bold text-[#6F4E37] mt-3 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8ED1B2]" />
                        {feedback.email}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}